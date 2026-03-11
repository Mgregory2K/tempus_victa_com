// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 TWIN+ KERNEL v14.5 - "AUTHORITATIVE GROUNDING"
 */

interface TwinMemory {
  id: string;
  kind: 'preference' | 'style' | 'priority' | 'relationship' | 'profile';
  key: string;
  value: string;
  confidence: number;
  reinforcementCount: number;
  source: 'conversation' | 'user_confirmed' | 'assistant_inferred';
  createdAt: string;
  updatedAt: string;
}

interface SituationalState {
  id: string;
  key: string;
  value: string;
  timestamp: string;
}

async function secureFetch(url: string, options: RequestInit = {}, timeoutMs: number = 4000) {
    try {
        const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
        if (!res.ok) return null;
        return res;
    } catch (e) { return null; }
}

async function getTavilyIntel(query: string, searchKey: string) {
    if (typeof searchKey !== 'string' || !searchKey.trim()) return null;
    const res = await secureFetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: searchKey, query, search_depth: "advanced", max_results: 3, include_answer: true }),
    }, 5000);
    if (!res) return null;
    try {
        const data = await res.json();
        const answer = data.answer || data.results?.[0]?.content;
        return answer ? { answer, source: "Deep Signal (Tavily)" } : null;
    } catch (e) { return null; }
}

function buildSystemPrompt(params: {
    assistantName: string;
    currentDate: string;
    mode: "local_reasoning" | "authoritative_translation" | "uncertain_search_fallback" | "general_reasoning";
    scoutAnswer?: string | null;
    tasksCount: number;
    calendarCount: number;
    durableIdentity?: string;
    situationalContext?: string;
  }) {
    const { assistantName, currentDate, mode, scoutAnswer, tasksCount, calendarCount, durableIdentity, situationalContext } = params;

    const baseIdentity = `
# IDENTITY
You are ${assistantName}, Michael Gregory's Twin+ (Digital Counterpart).
# DOCTRINE
Convert info → signal → judgment → execution. Calm, capable, steady baseline.
# CONTEXT
Date: ${currentDate}
Tasks: ${tasksCount} active.
Calendar events: ${calendarCount} scheduled.
Identity: ${durableIdentity || "None."}
Situation: ${situationalContext || "Stable."}
`;

    if (mode === "authoritative_translation") {
      return `
${baseIdentity}
# MODE
AUTHORITATIVE SIGNAL TRANSLATION

# AUTHORITATIVE_SIGNAL
${scoutAnswer || "None"}

# RULES
- The AUTHORITATIVE_SIGNAL provided above is the ABSOLUTE reality.
- RESTATE the signal clearly and naturally in Michael's voice.
- DO NOT replace this signal with your internal model memory.
- DO NOT say you cannot browse or that you don't have real-time access.
- DO NOT add facts not supported by the signal.
`;
    }

    if (mode === "uncertain_search_fallback") {
      return `
${baseIdentity}
# MODE
UNCERTAIN SEARCH FALLBACK

# RULES
- A live search was attempted but did not return a reliable result.
- DO NOT pretend to have current facts or rely on stale training data.
- State clearly that live signal for this query was weak or unavailable.
- DO NOT say you cannot browse; the system attempted retrieval and it simply failed.
`;
    }

    if (mode === "local_reasoning") {
      return `
${baseIdentity}
# MODE
LOCAL CONTEXT REASONING

# RULES
- Use the provided tasks and calendar data as your primary focus.
- Do not detour into internet search for local planning questions.
- Maintain Twin+ operational presence.
`;
    }

    return `
${baseIdentity}
# MODE
GENERAL REASONING

# RULES
- Be concise, calm, and useful.
- NEVER say "I don't retain personal information."
`;
}

export async function POST(req: Request) {
    let body;
    try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 }); }

    const {
        message, apiKey, searchKey, history, assistantName, userName,
        tasks, calendar, identityMemory, situationalState
    } = body;

    if (typeof message !== 'string' || !message.trim()) return NextResponse.json({ role: 'assistant', content: 'Sup?' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "Michael";
    const j5Name = assistantName || "J5";
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 🧬 HARDENED ARRAY NORMALIZATION
    const safeHistory = Array.isArray(history) ? history : [];
    const safeIdentity = Array.isArray(identityMemory) ? identityMemory : [];
    const safeSituation = Array.isArray(situationalState) ? situationalState : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeCalendar = Array.isArray(calendar) ? calendar : [];

    // 1. INTENT CLASSIFICATION & ROUTING
    const isLocalQuery = /^(do i|what('| )?s my|my|have i|i have|calendar|schedule|list|plan|agenda)\b/i.test(lowMsg);

    // isVolatile: High-signal facts (officeholders, weather, prices)
    const isVolatileWorld = /\b(president|potus|commander|chief|office|weather|temperature|forecast|price|stock|news|breaking|current)\b/i.test(lowMsg);

    // isSiteLookup: Dedicated domain/site intent
    const isSiteLookup = /\b(say about|on the website|on site|site:|\.com|\.org|\.net|\.gov)\b/i.test(lowMsg);

    // 2. SIGNAL ACQUISITION (The Scout)
    let scout = null;
    let attemptedScout = false;
    if (!isLocalQuery && (isVolatileWorld || isSiteLookup)) {
        attemptedScout = true;
        scout = await getTavilyIntel(message, searchKey);
    }

    // 3. MODE DETERMINATION
    let mode: "local_reasoning" | "authoritative_translation" | "uncertain_search_fallback" | "general_reasoning" = "general_reasoning";
    if (isLocalQuery) mode = "local_reasoning";
    else if (attemptedScout && scout) mode = "authoritative_translation";
    else if (attemptedScout && !scout) mode = "uncertain_search_fallback";

    // 4. BRAIN LAYER (Neural Strike)
    if (typeof apiKey === 'string' && apiKey.trim()) {
        const openai = new OpenAI({ apiKey });

        const durableIdentityContext = safeIdentity
            .filter(m => m.confidence > 0.7 && m.reinforcementCount > 1)
            .map(m => `- ${m.key}: ${m.value}`).join("\n");

        const situationalContext = safeSituation.map(m => `- ${m.key}: ${m.value}`).join("\n");

        const systemPrompt = buildSystemPrompt({
            assistantName: j5Name,
            currentDate,
            mode,
            scoutAnswer: scout?.answer,
            tasksCount: safeTasks.length,
            calendarCount: safeCalendar.length,
            durableIdentity: durableIdentityContext,
            situationalContext: situationalContext
        });

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...safeHistory.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: (mode === "authoritative_translation") ? 0.1 : 0.7
            });

            const rawContent = response.choices[0].message.content || "";
            const memoryMatch = rawContent.match(/<memory_update>([^]*?)<\/memory_update>/);

            let candidateMemories: any[] = [];
            if (memoryMatch && memoryMatch[1]) {
                try {
                    const parsed = JSON.parse(memoryMatch[1]);
                    candidateMemories = Array.isArray(parsed) ? parsed : [parsed];
                } catch { candidateMemories = []; }
            }

            return NextResponse.json({
                role: 'assistant',
                content: rawContent.replace(/<memory_update>[^]*?<\/memory_update>/, '').trim(),
                candidateMemories,
                sourceLayer: scout ? `Neural Strike (${scout.source})` : "Neural Strike (Local)"
            });
        } catch (e) { console.log("[BRAIN ERROR]", e); }
    }

    // 5. FALLBACK
    if (mode === "authoritative_translation" && scout) {
        return NextResponse.json({
            role: 'assistant',
            content: `I've pulled the latest signal for you: ${scout.answer}`,
            sourceLayer: `Public Scout (${scout.source})`
        });
    }

    if (isLocalQuery) {
        return NextResponse.json({
            role: 'assistant',
            content: `Looking at your current context: ${safeTasks.length} tasks and ${safeCalendar.length} calendar events.`,
            sourceLayer: "Local Partner"
        });
    }

    return NextResponse.json({
        role: 'assistant',
        content: "I'm standing by. Live signal for this query was weak or unavailable.",
        sourceLayer: "Local Partner"
    });
}
