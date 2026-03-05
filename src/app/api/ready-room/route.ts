// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const appKnowledge: Record<string, string> = {
    "ready room": "The Ready Room is your tactical command chamber. It operates the intelligence router (Local > Internet > AI) and hosts the Ready Room Protocol simulations.",
    "ready room protocol": "A specialized simulation mode for high-fidelity perspective stress-testing. It builds profiles from searchable bodies of work to ensure authentic, non-puppeteered simulations.",
    "twin+": "The behavioral substrate of Tempus Victa. It continuously mirrors, predicts, and optimizes based on your interactions.",
    "doctrine": "The immutable hierarchy of intelligence: 1. Local Sovereignty, 2. Trusted Sources, 3. Web Research, 4. AI Augmentation.",
};

async function getLocalAnswer(query: string): Promise<string | null> {
    const q = query.toLowerCase();
    for (const key in appKnowledge) {
        if (q.includes(key)) return appKnowledge[key];
    }
    return null;
}

async function getInternetData(query: string, apiKey: string) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 5 }),
        });
        const data = await response.json();
        return data.results ? data.results.map((r: any) => r.content).join('\n\n') : null;
    } catch (e) {
        console.error("Tavily Error:", e);
        return null;
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { message, searchKey, apiKey, history, protocolParams } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_EMPTY' }, { status: 400 });

    // 1. LOCAL RESOLUTION
    const local = await getLocalAnswer(message);
    if (local && !protocolParams) {
        return NextResponse.json({ role: 'assistant', content: local, sourceLayer: 'LOCAL' });
    }

    // 2. PROTOCOL ENGINE (STRICT PROFILE BUILD)
    if (protocolParams) {
        if (!apiKey) return NextResponse.json({ role: 'assistant', content: "Neural Key (OpenAI) required for Protocol simulations.", sourceLayer: 'SYSTEM' });

        const openai = new OpenAI({ apiKey });
        const internetContext = searchKey ? await getInternetData(`Body of work, worldview, and rhetorical style of: ${protocolParams.members}`, searchKey) : "";

        const systemPrompt = `
            # READY ROOM PROTOCOL ACTIVE

            ## CONSTRAINTS:
            - ANTI-PUPPETEERING: Do not think first and then speak. Reasoning must originate from the figure's knowable reality.
            - DISTINCT VOICES: Each member must have a unique worldview.
            - SOURCE MATERIAL: Use this context to build profiles: ${internetContext}

            ## CURRENT SESSION:
            - Moderator: ${protocolParams.moderator}
            - Topic: ${protocolParams.topic}
            - Tone: ${protocolParams.tone}
            - Format: ${protocolParams.format}

            You are simulating the deliberative chamber. Respond as the moderator or the next speaker in the sequence.
            Keep formatting clean (Bold names, no markdown symbols like "Speaker:").
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, ...history.map((h: any) => ({ role: h.role, content: h.content })), { role: "user", content: message }],
            temperature: 0.7,
        });

        return NextResponse.json({
            role: 'assistant',
            content: response.choices[0].message.content,
            sourceLayer: 'NEURAL_SIM'
        });
    }

    // 3. INTERNET + AI ESCALATION (ASSISTANT'S ASSISTANT)
    if (apiKey && searchKey) {
        const webContext = await getInternetData(message, searchKey);
        const openai = new OpenAI({ apiKey });

        const prompt = `You are the AI assistant to Twin+, Michael's executive OS.
        Twin+ has routed this query to you because local data was insufficient.
        Michael prefers "Just the Facts" mode unless synthesis is requested.

        WEB_CONTEXT: ${webContext || "No factual data found."}
        QUERY: ${message}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [...history.slice(-5).map((h: any) => ({ role: h.role, content: h.content })), { role: "user", content: prompt }],
            max_tokens: 500
        });

        return NextResponse.json({ role: 'assistant', content: response.choices[0].message.content, sourceLayer: 'HYBRID' });
    }

    if (searchKey) {
        const data = await getInternetData(message, searchKey);
        return NextResponse.json({ role: 'assistant', content: data || "FACTUAL_NULL", sourceLayer: 'INTERNET' });
    }

    return NextResponse.json({ role: 'assistant', content: "Insufficient intelligence layer available. Configure keys.", sourceLayer: 'SYSTEM' });
}
