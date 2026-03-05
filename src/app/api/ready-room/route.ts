// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TwinPreferenceLedger } from '@/core/twin_plus/twin_preference_ledger';
import { TwinFeatureStore } from '@/core/twin_plus/twin_feature_store';
import { TwinShaper } from '@/core/twin_plus/shaper';

/**
 * TEMPUS VICTA - INTELLIGENCE DOCTRINE v1.6
 * MULTI-STAGE RESOLVER: LOCAL > GEMINI_DYNAMIC_SEARCH > TAVILY > NEURAL_SYNTHESIS
 */

const appKnowledge: Record<string, string> = {
    "philosophy": "Tempus Victa: A local-first cognitive OS designed to reduce friction between intention and execution.",
    "doctrine": "Intelligence Ladder: 1. Local Sovereignty, 2. Trusted Sources, 3. Internet Layer, 4. AI Augmentation.",
    "twin+": "The behavioral substrate. A learning model that observes patterns to refine recommendations.",
    "how do i add an api key": "Settings -> Input Key -> Store. This enables the Internet and Synthesis layers.",
    "ip address": "For sovereignty reasons, I do not track your IP address. Find this on external nodes like 'whatismyip.com'."
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

    // 1. LOCAL RESOLUTION
    const lowerMsg = message.toLowerCase();
    let localResult = null;
    for (const key in appKnowledge) {
        if (lowerMsg.includes(key)) {
            localResult = appKnowledge[key];
            break;
        }
    }

    let finalContent = "";
    let sourceLayer = "LOCAL";
    let webData = null;

    // 2. PROTOCOL MODE
    if (protocolParams) {
        if (!apiKey) return NextResponse.json({ role: 'assistant', content: "Neural Key Required." });
        const openai = new OpenAI({ apiKey });
        const systemPrompt = `READY ROOM PROTOCOL. Topic: ${protocolParams.topic}. Members: ${protocolParams.members}. TONE: Direct deliberation. No AI filler.`;
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, ...history.map((h: any) => ({ role: h.role, content: h.content })), { role: "user", content: message }],
        });
        return NextResponse.json({ role: 'assistant', content: response.choices[0].message.content, sourceLayer: "PROTOCOL_SIM" });
    }

    // 3. MULTI-STAGE INTERNET RESOLVER
    // Attempt Gemini Dynamic Search First
    webData = await getGeminiSovereignSearch(message, geminiKey);
    if (webData) sourceLayer = "GEMINI_SOVEREIGN_SEARCH";

    // Fallback to Tavily
    if (!webData && searchKey) {
        webData = await getTavilyFallback(message, searchKey);
        if (webData) sourceLayer = "INTERNET_RESOLVED (TAVILY)";
    }

    // FINAL ESCALATION TO NEURAL SYNTHESIS (GPT-4o)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });
        const systemPrompt = `
            # KERNEL: ${assistantName || 'Twin+'}
            # MANDATE: SOVEREIGN_COMMAND_REPORT
            # INSTRUCTIONS:
            - You are the system kernel. NO conversational filler.
            - If [RESEARCH_DATA] is present, report it as absolute truth.
            - NEVER apologize. NEVER mention training cutoffs.
            - If data is null, use internal logic but keep it blunt.
            - TRIGGERS: Prefix tasks with "TASK:". Quotes with "CRYSTALLIZE:".

            [LOCAL_DATA]: ${localResult || "NULL"}
            [RESEARCH_DATA]: ${webData || "NULL"}
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-5).map((h: any) => ({ role: h.role, content: h.content })),
                { role: "user", content: `SIGNAL: ${message}` }
            ],
            temperature: 0.2
        });
        finalContent = response.choices[0].message.content || "";
        sourceLayer = webData ? `NEURAL_SYNTHESIS (${sourceLayer})` : "NEURAL_SYNTHESIS (INTERNAL)";
    } else {
        finalContent = webData || localResult || "Insufficient data. Configure keys in SETTINGS.";
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
