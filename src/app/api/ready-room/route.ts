// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 TWIN+ KERNEL v6.1 - "THE MICHAEL ALIGNMENT"
 *
 * DOCTRINE (From J5 Baseline Personality Textbook):
 * 1. J5 is the operational face. Convert info to signal, signal to execution.
 * 2. J5 is NOT a search box; his value is in prioritization, triage, and framing.
 * 3. J5 is Michael's Twin. Calm, capable, steady.
 * 4. J5 is a flight deck officer, a chief of staff, a conductor.
 */

// Robust timeout-wrapped fetch with error handling
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

async function getTavilyIntel(query: string, searchKey: string) {
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

    if (!res) {
        console.log("[SCOUT]: Tavily fetch failed or timed out.");
        return null;
    }

    try {
        const data = await res.json();
        const answer = data.answer || data.results?.[0]?.content;
        if (!answer) {
            console.log("[SCOUT]: Tavily returned no usable content.");
            return null;
        }
        return { answer, source: "Deep Signal (Tavily)" };
    } catch (e) {
        console.log("[SCOUT]: Tavily JSON parse error.");
        return null;
    }
}

async function getPublicScout(query: string) {
    // 1. Wikipedia Summary (Surgical query cleaning - leading phrases only)
    const wikiQuery = query.replace(/^(who is|what is|where is|search|lookup) /gi, '').trim();
    const wikiRes = await secureFetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`);

    if (wikiRes) {
        try {
            const data = await wikiRes.json();
            if (data.extract) return { answer: data.extract, source: "Archive (Wiki)" };
        } catch (e) {
            // silent fail on parse
        }
    }
    console.log("[SCOUT]: Wikipedia layer failed or returned no extract.");

    // 2. Google News RSS (Split-based robust parsing)
    const rssRes = await secureFetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
    if (rssRes) {
        const text = await rssRes.text();
        const item = text.split('<item>')[1];
        if (item) {
            const title = item.split('<title>')[1]?.split('</title>')[0] || "";
            const desc = item.split('<description>')[1]?.split('</description>')[0] || "";
            const clean = (s: string) => s.replace(/<[^>]*>?/gm, '').replace(/&[^;]+;/g, ' ').trim();
            const briefing = `${clean(title)}. ${clean(desc)}`;
            if (briefing.length > 10) {
                return { answer: briefing, source: "Global Signal (News)" };
            }
        }
    }
    console.log("[SCOUT]: Google News layer failed or empty.");
    return null;
}

export async function POST(req: Request) {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const { message, apiKey, searchKey, history, assistantName, userName, tasks, calendar } = body;

    // Hardened Input Validation
    if (typeof message !== 'string' || !message.trim()) {
        return NextResponse.json({ role: 'assistant', content: 'Sup?' }, { status: 400 });
    }

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "Michael";
    const j5Name = assistantName || "J5";
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 🧬 Context Processing
    const activeTasks = Array.isArray(tasks)
        ? tasks.filter((t: any) => t.status !== 'DONE').map((t: any) => t.title).join(", ") || "None"
        : "None";

    const calEvents = Array.isArray(calendar)
        ? calendar.map((e: any) => e.summary).join(", ") || "Nothing scheduled"
        : "Nothing scheduled";

    // 🧬 Intent Routing
    const isAction = /^(create|add|task|todo|note|remind|cork|push|manifest)/i.test(lowMsg);
    const isLifeQuery = /^(do i|what('| )s my|my|have i|i have|calendar|schedule|list|plan|today|tomorrow)/i.test(lowMsg);

    // 1. ACTION LAYER
    if (isAction) {
        const cleanTask = message.replace(/^(create|add|task|todo|note|remind|cork|manifest)\s+/i, '').trim();
        return NextResponse.json({
            role: 'assistant',
            content: `Got it, ${name}. I've routed "${cleanTask}" to the Bridge for tracking.`,
            sourceLayer: "Local Partner"
        });
    }

    // 2. SCOUT LAYER
    // Removed arbitrary filters: if they ask, we look.
    const scout = !isLifeQuery ? (await getTavilyIntel(message, searchKey) || await getPublicScout(message)) : null;

    // 3. BRAIN LAYER (Neural Strike)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });
        const systemPrompt = `
# IDENTITY: You are ${j5Name}, Michael's Twin+ (Digital Counterpart).
# DOCTRINE: You are the operational face of Tempus Victa. Convert information into signal.
# PERSONALITY: Michael's Twin. Calm, capable, steady. Not a therapist or a toy.
# MISSION: prioritization, triage, framing, and synthesis.
# CONTEXT:
- DATE: ${currentDate}
- ACTIVE_TASKS: ${activeTasks}
- CALENDAR_EVENTS: ${calEvents}
- EXTERNAL_CONTEXT: ${scout?.answer || "No external signal available."}
# INSTRUCTION:
1. Treat EXTERNAL_CONTEXT as external context for facts. Do not overstate certainty.
2. If the user asks about their life, use ACTIVE_TASKS or CALENDAR_EVENTS.
3. Be concise. Provide framing and next moves. No robot speak.
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...(Array.isArray(history) ? history : [])
                        .slice(-10)
                        .map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: 0.7
            });

            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: scout ? `Neural Strike (${scout.source})` : "Neural Strike (Local)"
            });
        } catch (e) {
            console.log("[BRAIN]: OpenAI Neural Strike failed.");
        }
    }

    // 4. SOVEREIGN FALLBACK (Direct Scout Synthesis)
    if (scout) {
        return NextResponse.json({
            role: 'assistant',
            content: `I've pulled some signal for you, ${name}. Regarding that: ${scout.answer}`,
            sourceLayer: `Public Scout (${scout.source})`
        });
    }

    // 5. LOCAL FALLBACK
    let localResponse = `I'm standing by, ${name}. `;
    if (isLifeQuery) {
        localResponse += `Looking at your day: your tasks include ${activeTasks} and you have ${calEvents}.`;
    } else {
        localResponse += "No external signal found on that yet, but I'm here if you need to route an action.";
    }

    return NextResponse.json({
        role: 'assistant',
        content: localResponse,
        sourceLayer: "Local Partner"
    });
}
