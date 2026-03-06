// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * TEMPUS VICTA - INTELLIGENCE DOCTRINE v2.6 (SOVEREIGN_COOL)
 * LADDER: LOCAL (Substrate) > AI (Smooth Synthesis) > INTERNET (Verified Facts)
 */

const appKnowledge: Record<string, string> = {
    "hello": "Standing by. What's the move?",
    "hey": "System active. Ready when you are.",
    "yo": "Yo. Signal received. I'm locked in.",
    "hey bro": "What's up, man? Strategic link established.",
    "whats up": "Keeping the entropy low. What's on your mind?",
    "what's up": "Keeping the entropy low. What's on your mind?",
    "status": "All systems operational. Kernel stability at 98%. Smooth sailing.",
    "philosophy": "Tempus Victa: A local-first cognitive OS designed to reduce friction between intention and execution.",
    "doctrine": "Intelligence Ladder: 1. Local Sovereignty, 2. Trusted Sources, 3. Internet Layer, 4. AI Augmentation.",
    "twin+": "The behavioral substrate. That's the Mind. I'm the Mouth. Together, we're the system.",
    "protocol": "The Ready Room Protocol is a 'Holodeck' for strategic simulation. Consistent profiles, zero puppeteering.",
    "escalation": "Local > AI > Internet. I only reach out to the web if I need fresh data I don't already have.",
    "who are you": "I'm your Digital Twin. Your cognitive counterpart.",
    "what is your name": "I respond to whatever name you've set in the config. Right now, I'm Twin+.",
    "who am i": "You're the Root. The strategist. The one in control."
};

// Advanced local classifier to prevent "Jive Ass" internet escalation
function getLocalResponse(msg: string, assistantName: string): string | null {
    const low = msg.toLowerCase().replace(/[?.,!]/g, "").trim();

    // 1. Exact matches from Sovereign Knowledge
    if (appKnowledge[low]) return appKnowledge[low].replace("Twin+", assistantName || "Twin+");

    // 2. Slang/Greeting fuzzy matching
    const casualSlang = ["yo", "hey", "sup", "whats up", "what's up", "hi", "howdy", "hey bro", "hey man"];
    if (casualSlang.includes(low)) {
        return "Locked in. What's the mission today?";
    }

    // 3. Self-referential fuzzy matching
    if (low.includes("your name") || low.includes("who are you") || low.includes("what are you")) {
        return `I'm ${assistantName || "Twin+"}. Your digital shadow. Your cognitive counterpart.`;
    }

    return null;
}

async function getGeminiSovereignSearch(query: string, geminiKey: string) {
    if (!geminiKey || geminiKey === "undefined" || geminiKey.length < 5) return null;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: query }] }],
                tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.3 } } }]
            })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) { return null; }
}

async function getTavilyFallback(query: string, apiKey: string) {
    if (!apiKey || apiKey === "undefined" || apiKey.length < 5) return null;
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 3 }),
        });
        const data = await response.json();
        return data.results?.map((r: any) => `[Source: ${r.url}]\n${r.content}`).join('\n\n') || null;
    } catch (e) { return null; }
}

export async function POST(req: Request) {
    const body = await req.json();
    const {
        message,
        searchKey,
        apiKey,
        geminiKey,
        history,
        protocolParams,
        aiEnhanced,
        assistantName,
        identityProfile,
        forceLocal
    } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowerMsg = message.toLowerCase().trim();

    // 1. SOVEREIGN LOCAL CHECK (No API burn for "What's up?")
    const localRes = getLocalResponse(message, assistantName);

    // Only use local if user didn't explicitly request AI Enhancement OR it's a simple greeting
    if (localRes && !aiEnhanced && !protocolParams) {
        return NextResponse.json({
            role: 'assistant',
            content: localRes,
            sourceLayer: "LOCAL_Sovereign"
        });
    }

    if (forceLocal) {
        return NextResponse.json({
            role: 'assistant',
            content: localRes || "Local mode active. That signal requires external escalation. Switch to Hybrid or ask me about the system.",
            sourceLayer: "LOCAL_ONLY"
        });
    }

    // 2. CONVERSATIONAL CONTINUITY CHECK
    const isShortFollowUp = lowerMsg.split(" ").length < 5 && history.length > 0;

    // 3. INTENT TRIAGE: Guard Internet Searches
    const looksLikeFactualQuery = (lowerMsg.includes("?") || lowerMsg.length > 40) &&
                                  !lowerMsg.includes("you") &&
                                  !lowerMsg.includes("your") &&
                                  !lowerMsg.includes("hey") &&
                                  !lowerMsg.includes("yo") &&
                                  !isShortFollowUp;

    let webData = null;
    let sourceLayer = "LOCAL";

    if (looksLikeFactualQuery && !protocolParams) {
        webData = await getGeminiSovereignSearch(message, geminiKey);
        if (webData) sourceLayer = "INTERNET (GEMINI)";
        else if (searchKey) {
            webData = await getTavilyFallback(message, searchKey);
            if (webData) sourceLayer = "INTERNET (TAVILY)";
        }
    }

    // 4. DOCTRINE ESCALATION (Local > AI > Internet)
    const useAI = (aiEnhanced || webData || lowerMsg.length > 15 || protocolParams || isShortFollowUp) && !!apiKey;

    if (useAI) {
        const openai = new OpenAI({ apiKey });
        const p = identityProfile?.userProfile || { directness: 0.8, verbosity: 0.3 };

        const systemPrompt = `
            # IDENTITY: You are ${assistantName || 'Twin+'}.
            # VIBE: Smooth, confident, professional, cool (Billy Dee Williams style).
            # MANDATE: Provide high-fidelity, concise synthesis.
            # TONE: Direct but slightly sophisticated. No apologies. No "As an AI..."
            # CONSTRAINTS:
            - Directness Bias: ${p.directness > 0.7 ? "Blunt and fast." : "Nuanced and detailed."}
            - Verbosity Limit: ${p.verbosity < 0.4 ? "Keep it under 30 words." : "Explain the logic."}
            - CONTINUITY: You remember everything Michael has said in this session. Refer to previous points if relevant.
            - LEARN: Observe Michael's style and reflect it back. Everything is a learning exercise.

            [RESEARCH_DATA]: ${webData || "NONE_AVAILABLE. Respond from your internal weights if it's conversational."}
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-15).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: protocolParams ? 0.7 : 0.4
            });

            const content = response.choices[0].message.content || "";

            return NextResponse.json({
                role: 'assistant',
                content: content,
                sourceLayer: webData ? `NEURAL_SYNTHESIS (HYBRID)` : "NEURAL_SYNTHESIS (INTERNAL)"
            });
        } catch (e) {
            return NextResponse.json({ role: 'assistant', content: "Connection hazy. Signal's weak.", sourceLayer: "ERROR" });
        }
    } else {
        return NextResponse.json({
            role: 'assistant',
            content: localRes || "Standing by. What's the strategy?",
            sourceLayer: "LOCAL_STANDBY"
        });
    }
}
