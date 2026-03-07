// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * TEMPUS VICTA - J5 INTELLIGENCE DOCTRINE v1.3
 * Persona: Baseline Professional (Personality Doc Pending)
 * Ladder: Local (Substrate) > Internet (Public Scout - NO KEYS) > Structured (Tavily) > AI (Deep Synthesis)
 * DOCTRINE: "We never come back empty handed."
 */

const j5Knowledge: Record<string, string> = {
    "hello": "Standing by. What's the move?",
    "hey": "System active. Ready when you are.",
    "doctrine": "Intelligence Ladder: 1. Local Sovereignty, 2. Public Scout (Keyless Internet), 3. AI Deep Synthesis (Enhance).",
    "escalation": "I use the public airwaves first. I only burn neural tokens or specialized keys if you ask me to 'Enhance' or if the signal is deep.",
    "who are you": "I'm J5. Your cognitive counterpart.",
    "who am i": "You're the Root. The one in control."
};

// 🛰️ KEYLESS SEARCH WRAPPER (The "Public Scout")
async function getPublicScoutSearch(query: string) {
    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const data = await res.json();

        if (data.AbstractText) {
            return {
                answer: data.AbstractText,
                source: data.AbstractSource || "Public Airwaves"
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function getStructuredTavily(query: string, tavilyKey: string) {
    if (!tavilyKey || tavilyKey === "undefined" || tavilyKey.length < 5) return null;
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: tavilyKey, query, search_depth: "basic", include_answer: true }),
        });
        const data = await response.json();
        return { answer: data.answer, source: "Tavily Structured" };
    } catch (e) { return null; }
}

export async function POST(req: Request) {
    const body = await req.json();
    const {
        message,
        searchKey,
        apiKey,
        history,
        protocolParams,
        aiEnhanced,
        assistantName
    } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();

    // 1. LOCAL CHECK (Absolute sovereignty - $0)
    const localMatch = j5Knowledge[lowMsg.replace(/[?.,!]/g, "")];
    if (localMatch && !aiEnhanced && !protocolParams) {
        return NextResponse.json({ role: 'assistant', content: localMatch.replace("J5", assistantName || "J5"), sourceLayer: "LOCAL" });
    }

    // 2. INTERNET SCOUT (Level 2: Factual Retrieval)
    let webData = null;
    let sourceLayer = "LOCAL";
    const isQuery = message.length > 15 || message.includes("?");

    if (isQuery && !protocolParams) {
        // Try the "Public Scout" first (Keyless - Rocking in the free world)
        webData = await getPublicScoutSearch(message);
        if (webData) sourceLayer = "INTERNET (PUBLIC_SCOUT)";

        // ONLY use Tavily if Public Scout came up empty and we're NOT just looking for a quick chat
        if (!webData && searchKey && searchKey.length > 5) {
            webData = await getStructuredTavily(message, searchKey);
            if (webData) sourceLayer = "INTERNET (STRUCTURED)";
        }
    }

    // 3. AI AUGMENTATION (Level 3: Deep Synthesis - OPT-IN)
    if ((aiEnhanced || protocolParams) && apiKey) {
        const openai = new OpenAI({ apiKey });
        const systemPrompt = `
            # IDENTITY: You are ${assistantName || 'J5'}.
            # MANDATE: Synthesize the [RESEARCH_DATA] for Michael.
            # CONSTRAINTS: Keep it fast. Under 40 words. No robot cliches.
            [RESEARCH_DATA]: ${webData?.answer || "None. Use your internal knowledge."}
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: 0.4
            });
            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: `AI_ENHANCED (${sourceLayer})`
            });
        } catch (e) {
            return NextResponse.json({ role: 'assistant', content: "Neural link fuzzy. Intel: " + (webData?.answer || "No signal."), sourceLayer: "ERROR" });
        }
    }

    // 4. NEVER EMPTY HANDED: Fallback to direct search link if all else fails
    if (!webData && isQuery) {
        const searchLink = `https://www.google.com/search?q=${encodeURIComponent(message)}`;
        return NextResponse.json({
            role: 'assistant',
            content: `I've monitored the airwaves, Michael, but couldn't pull a direct answer blind. You can check the raw signal here: [Google Search](${searchLink}).\n\nWant me to 'Enhance' and perform a deep neural audit?`,
            sourceLayer: "INTERNET (FALLBACK_LINK)"
        });
    }

    return NextResponse.json({
        role: 'assistant',
        content: webData?.answer || localMatch || "Standing by. What's the next mission?",
        sourceLayer: sourceLayer
    });
}
