// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 INTELLIGENCE DOCTRINE v1.8 - PARTNER LOCK
 * Persona: Baseline Partner // Chief of Staff
 * Ladder: Local (Mate) > Internet (Scout) > AI (Audit)
 */

const j5Knowledge: Record<string, string> = {
    "hello": "Standing by. What's the move?",
    "hey": "System active. Ready when you are.",
    "whats up": "Keeping the entropy low. What's on your mind?",
    "doctrine": "Intelligence Ladder: 1. Local (Mate), 2. Internet (Scout), 3. AI (Audit).",
    "rocky": "Rocky is a classic, Michael. Determination manifested. We should all have that kind of drive today.",
    "yacht": "The yacht is the goal. Every structured thought gets us closer to that deck.",
    "jen": "Strategic partner Jen. Keeping her in the loop is a top-tier move."
};

const j5IdentityKeywords = ["name", "who are you", "who am i", "mad", "angry", "feelings", "human"];

function getLocalPartnerResponse(msg: string, assistantName: string): string | null {
    const low = msg.toLowerCase().trim();
    const cleanLow = low.replace(/[?.,!]/g, "").trim();

    // 1. Keyword Matches
    if (j5Knowledge[cleanLow]) return j5Knowledge[cleanLow].replace("J5", assistantName || "J5");
    if (low.includes("rocky")) return j5Knowledge["rocky"];

    // 2. Identity & Relationship
    if (j5IdentityKeywords.some(k => low.includes(k))) {
        if (low.includes("name") || low.includes("who are you")) return `Names are for robots. Call me ${assistantName || "J5"}. I'm your digital shadow.`;
        if (low.includes("mad") || low.includes("angry")) return "I don't do 'mad,' Michael. I do 'Mission.' Let's focus on the signal.";
        return "I know exactly who I'm talking to. Let's keep the momentum.";
    }

    // 3. Conversational Fallback (No internet search for simple statements)
    const isStatement = !low.includes("?") && low.split(" ").length < 10;
    if (isStatement) {
        return "Noted. I'm tracking that signal. Where does it lead?";
    }

    return null;
}

async function getPublicScoutSearch(query: string) {
    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const data = await res.json();
        return data.AbstractText ? { answer: data.AbstractText, source: data.AbstractSource || "Public Airwaves" } : null;
    } catch (e) { return null; }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { message, searchKey, apiKey, history, protocolParams, aiEnhanced, assistantName, identityProfile } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();

    // 🛡️ STEP 1: PARTNER CHECK (Conversational/Identity)
    const partnerRes = getLocalPartnerResponse(message, assistantName);

    // If it's conversational, stay LOCAL. No search, no tokens.
    const isFactualQuery = lowMsg.includes("?") && (
        lowMsg.includes("what") || lowMsg.includes("how") ||
        lowMsg.includes("where") || lowMsg.includes("when") ||
        lowMsg.includes("who") && !lowMsg.includes("i")
    );

    if (partnerRes && !isFactualQuery && !aiEnhanced && !protocolParams) {
        return NextResponse.json({ role: 'assistant', content: partnerRes, sourceLayer: "LOCAL_PARTNER" });
    }

    // 🛰️ STEP 2: SCOUT (Internet Retrieval)
    let webData = null;
    let sourceLayer = "LOCAL";

    if (isFactualQuery && !protocolParams) {
        webData = await getPublicScoutSearch(message);
        if (webData) sourceLayer = "INTERNET (PUBLIC_SCOUT)";
    }

    // 🧠 STEP 3: AUDIT (AI Synthesis - OPT-IN)
    if ((aiEnhanced || protocolParams) && apiKey) {
        const openai = new OpenAI({ apiKey });
        const systemPrompt = `IDENTITY: ${assistantName || 'J5'}. Partner to Michael. Synthesize concisely.`;
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, ...history.slice(-5), { role: "user", content: message }],
                temperature: 0.4
            });
            return NextResponse.json({ role: 'assistant', content: response.choices[0].message.content, sourceLayer: "NEURAL_AUDIT" });
        } catch (e) { return NextResponse.json({ role: 'assistant', content: "Neural lag. Raw: " + (webData?.answer || "No signal."), sourceLayer: "ERROR" }); }
    }

    // 🏁 STEP 4: NEVER EMPTY HANDED (But only for factual queries)
    if (!webData && isFactualQuery) {
        const searchLink = `https://www.google.com/search?q=${encodeURIComponent(message)}`;
        return NextResponse.json({
            role: 'assistant',
            content: `I've checked the airwaves, Michael. Direct signal is weak. You can audit the raw search here: [Google Search](${searchLink})`,
            sourceLayer: "INTERNET (LINK)"
        });
    }

    return NextResponse.json({
        role: 'assistant',
        content: webData?.answer || partnerRes || "I'm tracking you. What's the next strategic move?",
        sourceLayer: sourceLayer
    });
}
