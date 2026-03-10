// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 TWIN+ KERNEL v7.1 - "THE SOVEREIGN ARBITRATOR"
 *
 * DOCTRINE (From J5 Baseline Personality Textbook):
 * 1. SOURCE AUTHORITY: Signal Layer (Scout) > Context Layer (Life) > Reasoning (Model Memory).
 * 2. J5 MISSION: Convert input → interpretation → structure → decision → execution.
 * 3. J5 IDENTITY: Michael Gregory's Twin+. Calm, capable, steady operational baseline.
 * 4. KNOWLEDGE POLICY: Volatile world facts are grounded in retrieved signal.
 */

interface ScoutSignal {
    answer: string;
    source: string;
    type: 'FACT' | 'NEWS' | 'ARCHIVE';
}

// Robust timeout-wrapped fetch
async function secureFetch(url: string, options: RequestInit = {}, timeoutMs: number = 4000) {
    try {
        const res = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(timeoutMs)
        });
        if (!res.ok) return null;
        return res;
    } catch (e) {
        return null;
    }
}

async function getTavilyIntel(query: string, searchKey: string): Promise<ScoutSignal | null> {
    if (!searchKey) return null;
    const res = await secureFetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: searchKey,
            query,
            search_depth: "advanced",
            max_results: 3,
            include_answer: true
        }),
    }, 5000);

    if (!res) return null;
    try {
        const data = await res.json();
        const answer = data.answer || data.results?.[0]?.content;
        if (!answer) return null;
        return { answer, source: "Deep Signal (Tavily)", type: 'FACT' };
    } catch (e) { return null; }
}

async function getPublicScout(query: string): Promise<ScoutSignal | null> {
    const wikiQuery = query.replace(/^(who is|what is|where is|search|lookup) /gi, '').trim();
    const wikiRes = await secureFetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`);
    if (wikiRes) {
        try {
            const data = await wikiRes.json();
            if (data.extract) return { answer: data.extract, source: "Archive (Wiki)", type: 'ARCHIVE' };
        } catch (e) {}
    }

    const rssRes = await secureFetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
    if (rssRes) {
        const text = await rssRes.text();
        const item = text.split('<item>')[1];
        if (item) {
            const title = item.split('<title>')[1]?.split('</title>')[0] || "";
            const desc = item.split('<description>')[1]?.split('</description>')[0] || "";
            const clean = (s: string) => s.replace(/<[^>]*>?/gm, '').replace(/&[^;]+;/g, ' ').trim();
            const briefing = `${clean(title)}. ${clean(desc)}`;
            if (briefing.length > 10) return { answer: briefing, source: "Global Signal (News)", type: 'NEWS' };
        }
    }
    return null;
}

export async function POST(req: Request) {
    let body;
    try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 }); }

    const { message, apiKey, searchKey, history, assistantName, userName, tasks, calendar } = body;
    if (typeof message !== 'string' || !message.trim()) return NextResponse.json({ role: 'assistant', content: 'Sup?' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "Michael";
    const j5Name = assistantName || "J5";
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 1. CLASSIFICATION
    const actionRegex = /^(create|add|task|todo|note|remind|cork|push|manifest)/i;
    const isAction = actionRegex.test(lowMsg);

    // isLocal: Queries about the user's operational state
    const isLocalQuery = /^(do i|what('| )s my|my|have i|i have|calendar|schedule|list|plan)/i.test(lowMsg);

    // isVolatile: Queries that require fresh external signal
    const isVolatileWorldQuery = /(president|potus|weather|price|stock|news|today|tomorrow|current|who is|what is|where is)/i.test(lowMsg);

    // 2. ACTION LAYER
    if (isAction) {
        const cleanTask = message.replace(/^(create|add|task|todo|note|remind|cork|push|manifest)\s+/i, '').trim();
        return NextResponse.json({ role: 'assistant', content: `Got it, ${name}. I've routed "${cleanTask}" to the Bridge for tracking.`, sourceLayer: "Local Partner" });
    }

    // 3. DATA ACQUISITION
    const activeTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.status !== 'DONE').map((t: any) => t.title).join(", ") || "None" : "None";
    const calEvents = Array.isArray(calendar) ? calendar.map((e: any) => e.summary).join(", ") || "Nothing scheduled" : "Nothing scheduled";

    let scout: ScoutSignal | null = null;
    if (!isLocalQuery || isVolatileWorldQuery) {
        scout = await getTavilyIntel(message, searchKey) || await getPublicScout(message);
    }

    // 4. BRAIN LAYER (Neural Strike w/ Authority Arbitration)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });
        let systemPrompt = "";

        if (isVolatileWorldQuery && scout) {
            // AUTHORITATIVE SIGNAL TRANSLATION MODE
            systemPrompt = `
# IDENTITY: You are ${j5Name}, Michael Gregory's Twin+ (Digital Counterpart).
# DOCTRINE: Convert information into signal. Signal into judgment.
# MISSION: AUTHORITATIVE SIGNAL TRANSLATION.
# CONTEXT:
- DATE: ${currentDate}
- AUTHORITATIVE_SIGNAL: ${scout.answer}
- SOURCE: ${scout.source}

# INSTRUCTION:
1. You are the operational translator for the provided AUTHORITATIVE_SIGNAL.
2. The signal provided above is the absolute reality for this request.
3. DO NOT use your internal training data to contradict, override, or "correct" this signal.
4. If the signal says "X is the current president", then X IS the current president.
5. Provide a clean, operational briefing in Michael's voice (Calm, steady, capable).
            `;
        } else {
            // STANDARD TWIN+ OPERATIONAL MODE
            systemPrompt = `
# IDENTITY: You are ${j5Name}, Michael Gregory's Twin+ (Digital Counterpart).
# DOCTRINE: J5 helps move from input → interpretation → structure → decision → execution.
# MISSION: Provide interpretive coherence. prioritized, triaged framing.
# PERSPECTIVE: Michael's Twin. Calm, capable, steady baseline.

# TRUTH_HIERARCHY:
1. EXTERNAL_SIGNAL (The World)
2. LIFE_SENSORS (Michael's Life: Tasks, Calendar)
3. TWIN+ REASONING (Voice, Framing, Learned Adaptation)

# ENVIRONMENT:
- DATE: ${currentDate}
- LIFE_SENSORS (Tasks): ${activeTasks}
- LIFE_SENSORS (Calendar): ${calEvents}
- EXTERNAL_SIGNAL: ${scout?.answer || "No external signal available."}

# OPERATIONAL_GUIDELINES:
- Treat EXTERNAL_SIGNAL as the definitive source for world facts.
- If signal is missing for volatile world queries, state uncertainty.
- Avoid generic uplifts. Provide grounded clarity and next moves.
            `;
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...(Array.isArray(history) ? history : []).slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: 0.7
            });

            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: scout ? `Neural Strike (${scout.source})` : "Neural Strike (Local)"
            });
        } catch (e) { console.log("[BRAIN]: OpenAI Neural Strike failed."); }
    }

    // 5. SOVEREIGN FALLBACK (Direct Scout Synthesis)
    if (scout) {
        return NextResponse.json({
            role: 'assistant',
            content: `I've pulled some signal for you, ${name}. Regarding that: ${scout.answer}`,
            sourceLayer: `Public Scout (${scout.source})`
        });
    }

    return NextResponse.json({
        role: 'assistant',
        content: isLocalQuery ? `I'm looking at your day. Calendar: ${calEvents}. Tasks: ${activeTasks}.` : "I'm standing by.",
        sourceLayer: "Local Partner"
    });
}
