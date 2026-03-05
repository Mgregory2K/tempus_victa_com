// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * TEMPUS VICTA - INTELLIGENCE DOCTRINE
 * Hierarchy: LOCAL > INTERNET > OPT-IN AI
 *
 * Escalation Policy: If a lower layer is insufficient, escalate to the next
 * available layer to return the best possible data.
 */

const appKnowledge: Record<string, string> = {
    "philosophy": "Tempus Victa is a local-first cognitive OS designed to reduce friction between intention and execution by turning life's inputs into structured intelligence.",
    "doctrine": "The Intelligence Ladder: 1. Local Sovereignty (App/User Data), 2. Trusted Sources (WiFi/Cellular), 3. AI Augmentation (Opt-in Learning & Synthesis).",
    "twin+": "The behavioral substrate of Tempus Victa. It is a learning model that observes routing decisions and behavioral patterns to refine future recommendations. It is the model, not the product.",
    "ready room": "The central command module for intelligence routing and system interaction. It hosts the Ready Room Protocol.",
    "ready room protocol": "A high-fidelity simulation mode (Holodeck) invoked within the Ready Room for stress-testing perspectives. It builds profiles from searchable bodies of work to ensure authentic, non-puppeteered dialogue.",
    "local-first": "Sovereignty is leverage. Tempus Victa prioritizes local data to ensure privacy, survivability, and user-controlled learning.",
    "mission": "An Assistant that Optimizes Life Through Automation. Not just answering questions, but reducing entropy and increasing execution."
};

async function getInternetData(query: string, apiKey: string) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 5 }),
        });
        const data = await response.json();
        return data.results ? data.results.map((r: any) => `[Source: ${r.url}]\n${r.content}`).join('\n\n') : null;
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { message, searchKey, apiKey, history, protocolParams, aiEnhanced } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    // --- LAYER 1: LOCAL RESOLUTION ---
    const lowerMsg = message.toLowerCase();
    let localResult = null;
    for (const key in appKnowledge) {
        if (lowerMsg.includes(key)) {
            localResult = appKnowledge[key];
            break;
        }
    }

    // --- LAYER 2: READY ROOM PROTOCOL (HOLODECK) ---
    if (protocolParams) {
        if (!apiKey) return NextResponse.json({ role: 'assistant', content: "Neural Key (OpenAI) required for Protocol simulations.", sourceLayer: 'SYSTEM' });

        const openai = new OpenAI({ apiKey });

        // Protocol MUST build profiles from searchable work
        let researchContext = "";
        if (searchKey) {
            researchContext = await getInternetData(`In-depth analysis of rhetorical style, worldview, and searchable body of work for: ${protocolParams.members}`, searchKey) || "";
        }

        const systemPrompt = `
            # READY ROOM PROTOCOL ACTIVE (THE HOLODECK)

            ## MANDATE:
            - ANTI-PUPPETEERING: Do not "act" or "summarize". Reasoning must originate from the figure's established body of work.
            - SOURCE MATERIAL: Use this context to build a consistent profile: ${researchContext}
            - PERSISTENCE: Maintain the simulation's integrity. No AI assistant interjections.

            ## PARAMETERS:
            - Moderator: ${protocolParams.moderator}
            - Members: ${protocolParams.members}
            - Topic: ${protocolParams.topic}
            - Rules: ${protocolParams.rules}
            - Tone: ${protocolParams.tone}

            Deliberate as the figures or the moderator.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, ...history.map((h: any) => ({ role: h.role, content: h.content })), { role: "user", content: message }],
            temperature: 0.85,
        });

        return NextResponse.json({
            role: 'assistant',
            content: response.choices[0].message.content,
            sourceLayer: 'PROTOCOL_SIM'
        });
    }

    // --- LAYER 3: INTERNET & OPT-IN AI ESCALATION ---
    let webData = null;
    if (searchKey) {
        webData = await getInternetData(message, searchKey);
    }

    // DOCTRINE: Escalate to AI if Local+Internet is insufficient OR if explicitly enhanced (Opt-in)
    const internetInsufficient = searchKey && !webData;
    const shouldEscalateToAI = apiKey && (aiEnhanced || internetInsufficient);

    if (shouldEscalateToAI) {
        const openai = new OpenAI({ apiKey });
        const prompt = `Assistant to Twin+ OS. Use the available context to resolve Michael's signal.
        Doctrine: Local > Internet > AI.
        Note: If local data exists, synthesize it with the new findings.

        LOCAL_DATA: ${localResult || "None"}
        INTERNET_DATA: ${webData || "No external data found."}
        SIGNAL: ${message}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [...history.slice(-5).map((h: any) => ({ role: h.role, content: h.content })), { role: "user", content: prompt }],
            max_tokens: 800
        });

        return NextResponse.json({
            role: 'assistant',
            content: response.choices[0].message.content,
            sourceLayer: 'NEURAL_SYNTHESIS'
        });
    }

    // Return the best available lower-layer data if AI wasn't used/available
    if (webData) {
        return NextResponse.json({
            role: 'assistant',
            content: localResult ? `${localResult}\n\n[SUPPLEMENTAL RESEARCH]:\n${webData}` : webData,
            sourceLayer: 'INTERNET_RESOLVED'
        });
    }

    if (localResult) {
        return NextResponse.json({ role: 'assistant', content: localResult, sourceLayer: 'LOCAL_SOVEREIGN' });
    }

    return NextResponse.json({
        role: 'assistant',
        content: "Insufficient data at all Doctrine levels. Configure keys or refine signal.",
        sourceLayer: 'SYSTEM'
    });
}
