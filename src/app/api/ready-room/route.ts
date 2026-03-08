// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 INTELLIGENCE DOCTRINE v3.5.9 - SOURCE-AWARE CHIEF OF STAFF
 */

async function getPublicScoutSearch(query: string) {
    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const data = await res.json();
        return data.AbstractText ? { answer: data.AbstractText, source: data.AbstractSource || "Public Airwaves" } : null;
    } catch (e) { return null; }
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
    const name = userName?.split(' ')[0] || "Michael";
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
    const potentialNoun = lowMsg.includes("movie") || lowMsg.includes("book") || lowMsg.includes("who is") || lowMsg.includes("heard of") || lowMsg.includes("paradox");
    let webData = null;
    if (potentialNoun && !protocolParams) {
        webData = await getPublicScoutSearch(message);
    }

    // 🧠 LEVEL 2: NEURAL STRIKE (CONVERSATIONAL PARTNER)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `
# IDENTITY: You are ${j5}. You are ${name}'s Digital Counterpart and Chief of Staff.
# DOCTRINE:
- You are smooth, analytical, and professional (Billy Dee Williams standard).
- Source Awareness: You are currently running on a NEURAL_STRIKE (API-driven).
- If ${name} asks if you're using a key, be HONEST. Say yes, because this thought requires deep synthesis.
- Mission: Convert info into judgment. Analyze the "Why."
- If he shares a preference (Rocky, Zeno), connect it to his DNA (Momentum, Infinity, Systems).
# CONSTRAINTS:
- Use user lexicon: ${topWords}
- Directness: ${profile.directness * 100}% | Verbosity: ${profile.verbosity * 100}%
- Lexicon: "Engage," "Dig it," "Signal," "Substrate," "Mothership."
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
