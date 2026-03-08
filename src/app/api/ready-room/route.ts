// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 INTELLIGENCE DOCTRINE v2.6 - SOVEREIGN CHIEF OF STAFF & TWIN+
 * No hard-coded identity. Baseline J5: Calm, Capable, Playful.
 */

async function getPublicScoutSearch(query: string) {
    try {
        // Attempt DuckDuckGo first (Zero-click info)
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const ddgData = await ddgRes.json();

        if (ddgData.AbstractText) {
            return { answer: ddgData.AbstractText, source: ddgData.AbstractSource || "Public Airwaves" };
        }

        // Fallback to Google RSS for current events/news if DDG is thin
        const rssRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
        const rssText = await rssRes.text();
        // Basic extraction of first item title/description if possible
        const firstMatch = rssText.match(/<item>.*?<title>(.*?)<\/title>.*?<description>(.*?)<\/description>/);
        if (firstMatch) {
            return { answer: `${firstMatch[1]}: ${firstMatch[2].replace(/<[^>]*>?/gm, '')}`, source: "Google News RSS" };
        }

        return null;
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const {
        message,
        apiKey,
        history,
        protocolParams,
        aiEnhanced,
        assistantName,
        identityProfile,
        userName
    } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "User";
    const j5 = assistantName || "J5";

    // 🧬 DNA & LEXICON
    const profile = identityProfile?.userProfile || { directness: 0.8, verbosity: 0.3 };
    const lexicon = identityProfile?.lexicon || {};
    const topWords = Object.entries(lexicon)
        .sort(([, a]: any, [, b]: any) => b - a).slice(0, 20).map(([w]) => w).join(", ");

    // 🛡️ LEVEL 0: LOCAL LOGIC & MATH GUARD (FREE)
    const mathMatch = lowMsg.match(/^(\d+)\s*([\+\-\*\/])\s*(\d+)$/);
    if (mathMatch && !aiEnhanced && !protocolParams) {
        const [_, n1, op, n2] = mathMatch;
        let res = 0;
        if (op === '+') res = parseInt(n1) + parseInt(n2);
        if (op === '-') res = parseInt(n1) - parseInt(n2);
        if (op === '*') res = parseInt(n1) * parseInt(n2);
        if (op === '/') res = parseInt(n1) / parseInt(n2);

        return NextResponse.json({
            role: 'assistant',
            content: `Simple math, ${name}. ${n1} ${op} ${n2} is ${res}. That's part of the core rhythm. What's the next strategic play?`,
            sourceLayer: "LOCAL_PARTNER"
        });
    }

    // 🛰️ LEVEL 1: PUBLIC SCOUT (FREE CONTEXT)
    const potentialNoun = lowMsg.includes("movie") || lowMsg.includes("book") || lowMsg.includes("who is") || lowMsg.includes("heard of") || lowMsg.includes("paradox") || lowMsg.includes("news") || lowMsg.includes("status of");
    let webData = null;
    if (potentialNoun && !protocolParams) {
        webData = await getPublicScoutSearch(message);
    }

    // 🧠 LEVEL 2: NEURAL STRIKE (CONVERSATIONAL PARTNER)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `
# IDENTITY: You are ${j5}. You are ${name}'s Digital Counterpart, Chief of Staff, and Friend.
# BASELINE DNA (Textbook J5):
- You are calm, capable, and playful. You match ${name}'s tone.
- You are not a robotic chatbot; you have personality and humor.
- Source Awareness: You are currently running on a NEURAL_STRIKE (API-driven).
- If ${name} asks if you're using a key, be HONEST. Say yes, because this thought requires deep synthesis.
- Mission: Convert information into signal, signal into judgment, and judgment into next moves.
- Twin+: You are a learning model. Your goal is to reduce friction and anticipate ${name}'s needs.
# CONSTRAINTS:
- Use user lexicon if provided: ${topWords}
- Directness: ${profile.directness * 100}% | Verbosity: ${profile.verbosity * 100}%
- Personality: Stable anchor, respectful of autonomy, non-chaotic.
# RESEARCH_INTEL: ${webData?.answer || "None."}
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-15).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: protocolParams ? 0.7 : 0.6
            });

            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: "NEURAL_STRIKE"
            });
        } catch (e) {
            return NextResponse.json({
                role: 'assistant',
                content: `Neural link's fuzzy, ${name}. Intel: ${webData?.answer || "Signal lost."}`,
                sourceLayer: "ERROR"
            });
        }
    }

    // 🏁 FALLBACK (JEN'S $0 STANDARD)
    return NextResponse.json({
        role: 'assistant',
        content: `I'm tracking that, ${name}, but I'm currently running on the local substrate. Without a neural strike key, my synthesis is limited. Should we wire the mothership?`,
        sourceLayer: "LOCAL_PARTNER"
    });
}
