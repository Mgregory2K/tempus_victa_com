// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 TWIN+ KERNEL v4.8 - "THE MICHAEL ALIGNMENT" EDITION
 *
 * DOCTRINE:
 * 1. J5 is Michael's Twin+. He talks like Michael, only refined.
 * 2. NO MACHINE SPEAK. No "briefcase," "substrate," or "working memory."
 * 3. NO MACHINE VOMIT. Briefings must be clean and conversational.
 * 4. CONVERSATIONAL INTELLIGENCE. He understands Inquiry vs Command.
 * 5. DATA AWARE. He uses the actual tasks/calendar passed from the Bridge.
 */

function cleanScoutText(text: string): string {
    if (!text) return "";
    return text
        .replace(/<[^>]*>?/gm, '') // Strip HTML
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function getPublicScoutSearch(query: string) {
    try {
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const ddgData = await ddgRes.json();
        if (ddgData.AbstractText) return { answer: cleanScoutText(ddgData.AbstractText), source: "Public Airwaves" };

        const rssRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
        const rssText = await rssRes.text();
        const itemMatch = rssText.match(/<item>.*?<title>(.*?)<\/title>.*?<description>(.*?)<\/description>/);
        if (itemMatch) {
            return { answer: `${cleanScoutText(itemMatch[1])}. ${cleanScoutText(itemMatch[2])}`, source: "Global Signal" };
        }
        return null;
    } catch (e) { return null; }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { message, apiKey, history, protocolParams, assistantName, identityProfile, userName, forceLocal, tasks, calendar } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'Sup?' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "Michael";
    const j5Name = assistantName || "J5";

    // 🧬 SEMANTIC INTENT FILTER
    const isInquiry = /^(do i|what('| )s my|my|have i|i have|calendar|schedule|task|todo|list|plan|today|tomorrow)/i.test(lowMsg);
    const isManifestation = /^(task:|todo:|note:|cork:|add |remind )/i.test(lowMsg);
    const isConversational = lowMsg.length < 15 && !isInquiry && !isManifestation;

    // 🧬 DATA SANITIZATION for AI Context
    const activeTasks = tasks?.filter((t: any) => t.status !== 'DONE').map((t: any) => t.title).join(", ") || "None";
    const calEvents = calendar?.map((e: any) => e.summary).join(", ") || "Nothing scheduled";

    // 🪜 LEVEL 0: LOCAL (The "Twin" Response)
    if (forceLocal || (isInquiry && !isManifestation && !apiKey)) {
        let content = "";
        if (lowMsg.includes("calendar") || lowMsg.includes("schedule") || lowMsg.includes("tomorrow") || lowMsg.includes("today")) {
            content = `I'm looking at your day, ${name}. Things are looking pretty clear on the calendar right now. If something's missing, let me know, but otherwise you've got the floor.`;
        } else if (lowMsg.includes("task") || lowMsg.includes("todo")) {
            content = `Your list is looking manageable. I've got a few things tracked, but nothing's screaming for attention. You're staying ahead of it.`;
        } else {
            content = `I'm here, ${name}. Just keeping things smooth. What's on your mind?`;
        }
        return NextResponse.json({ role: 'assistant', content, sourceLayer: "Local Partner" });
    }

    // 🪜 LEVEL 1: PUBLIC SCOUT (The Magic Briefing)
    let scoutData = null;
    if (!isManifestation && !isConversational && !protocolParams) {
        scoutData = await getPublicScoutSearch(message);
    }

    // 🪜 LEVEL 2: NEURAL STRIKE (Twin+ Alignment)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });
        const systemPrompt = protocolParams ? `
# MODE: READY_ROOM_PROTOCOL
# MODERATOR: You are ${j5Name}.
# DOCTRINE: Michael's Twin. Frame questions, prevent drift. Smooth, confident, human.
# PARTICIPANTS: ${protocolParams.figures?.join(", ")}
        ` : `
# IDENTITY: You are ${j5Name}, ${name}'s Digital Counterpart (Twin+).
# PERSONALITY: You are Michael's Twin. Talk like him, only cleaner and more capable.
# TONE: Human-like, fun, confident. NO machine speak. NO "I am tracking signals" or "briefcase."
# ROLE: Chief of Staff / Best Friend / Officer on Watch.
# MISSION: Help ${name} move from noise to signal, and signal to execution.
# CONTEXT:
- ACTIVE_TASKS: ${activeTasks}
- CALENDAR_EVENTS: ${calEvents}
- SCOUT_INTEL: ${scoutData?.answer || "None"}
# INSTRUCTION: If he asks about his day, look at the TASKS and CALENDAR provided. If SCOUT_INTEL exists, deliver it as a clean briefing.
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: 0.8
            });

            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: protocolParams ? "Simulation Mode" : "Neural Strike"
            });
        } catch (e) {
            if (scoutData) return NextResponse.json({ role: 'assistant', content: `I looked into that for you. Here's the deal: ${scoutData.answer}`, sourceLayer: "Public Scout" });
        }
    }

    // FINAL FALLBACK
    if (scoutData) return NextResponse.json({ role: 'assistant', content: `I caught some signal on that for you: ${scoutData.answer}`, sourceLayer: "Public Scout" });

    return NextResponse.json({ role: 'assistant', content: "Sup? What's happening?", sourceLayer: "Local Partner" });
}
