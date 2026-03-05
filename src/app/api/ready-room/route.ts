// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TwinPreferenceLedger } from '@/core/twin_plus/twin_preference_ledger';
import { TwinFeatureStore } from '@/core/twin_plus/twin_feature_store';
import { TwinShaper } from '@/core/twin_plus/shaper';

/**
 * TEMPUS VICTA - INTELLIGENCE DOCTRINE v1.8
 * LADDER: LOCAL (Blunt) > INTERNET (Triage) > AI (Synthesis)
 */

const appKnowledge: Record<string, string> = {
    "hello": "Standing by. Signal received.",
    "hi": "System active.",
    "philosophy": "Tempus Victa: A local-first cognitive OS designed to reduce friction between intention and execution.",
    "doctrine": "Intelligence Ladder: 1. Local Sovereignty, 2. Trusted Sources, 3. Internet Layer, 4. AI Augmentation.",
    "twin+": "The behavioral substrate. A learning model that observes patterns to refine recommendations.",
    "protocol": "The Ready Room Protocol is a preview module. It builds profiles based on searchable work and acts as a 'Holodeck' for simulation.",
    "escalation": "Local > Internet > AI. AI is called only when internet search is insufficient or specifically requested."
};

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
    } catch (e) {
        return null;
    }
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
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { message, searchKey, apiKey, geminiKey, history, protocolParams, aiEnhanced, assistantName } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowerMsg = message.toLowerCase().trim();

    // 1. LOCAL RESOLUTION (Immediate & Blunt)
    if (appKnowledge[lowerMsg]) {
        return NextResponse.json({ role: 'assistant', content: appKnowledge[lowerMsg], sourceLayer: "LOCAL" });
    }

    let webData = null;
    let sourceLayer = "LOCAL";

    // Detect if the user is actually asking a question that requires searching
    const isQuestion = lowerMsg.includes("?") ||
                       lowerMsg.startsWith("what") ||
                       lowerMsg.startsWith("who") ||
                       lowerMsg.startsWith("search") ||
                       lowerMsg.length > 20;

    // 2. INTERNET RESOLUTION (Only if it looks like a query)
    if (isQuestion && !protocolParams) {
        webData = await getGeminiSovereignSearch(message, geminiKey);
        if (webData) sourceLayer = "INTERNET (GEMINI)";

        if (!webData && searchKey) {
            webData = await getTavilyFallback(message, searchKey);
            if (webData) sourceLayer = "INTERNET (TAVILY)";
        }
    }

    // 3. DOCTRINE ESCALATION
    const useAI = (aiEnhanced || (!webData && isQuestion) || protocolParams) && !!apiKey;

    let finalContent = "";

    if (useAI) {
        const openai = new OpenAI({ apiKey });
        let systemPrompt = "";
        if (protocolParams) {
            systemPrompt = `READY ROOM PROTOCOL ACTIVE. Topic: ${protocolParams.topic}. Members: ${protocolParams.members}. TONE: Direct deliberation. ANTI-PUPPETEERING: Build consistent profiles.`;
            sourceLayer = "PROTOCOL_SIM";
        } else {
            systemPrompt = `
                # KERNEL: ${assistantName || 'Twin+'}
                # MANDATE: BLUNT_SYNTHESIS
                # INSTRUCTIONS:
                - Max 2-3 sentences unless complex.
                - NO conversational filler.
                - Use [RESEARCH_DATA] if provided.
                - TRIGGERS: Prefix tasks with "TASK:". Quotes with "CRYSTALLIZE:".

                [RESEARCH_DATA]: ${webData || "NULL"}
            `;
            sourceLayer = webData ? `NEURAL_SYNTHESIS (${sourceLayer})` : "NEURAL_SYNTHESIS (INTERNAL)";
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-5).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: protocolParams ? 0.7 : 0.1
            });
            finalContent = response.choices[0].message.content || "";
        } catch (e) {
            finalContent = webData || "Neural pipeline failure.";
        }
    } else {
        finalContent = webData || "Signal recognized. Standing by for specific query.";
    }

    // --- TWIN+ SHAPING ---
    const prefs = await TwinPreferenceLedger.open();
    const features = await TwinFeatureStore.open(prefs);
    const shaper = new TwinShaper(prefs, features);

    const shaped = shaper.shape({
        surface: 'READY_ROOM',
        purpose: 'inform',
        draftText: finalContent
    });

    return NextResponse.json({
        role: 'assistant',
        content: shaped.text,
        sourceLayer: sourceLayer,
        suggestedActions: shaped.suggestedActions
    });
}
