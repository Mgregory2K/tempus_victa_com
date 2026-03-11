// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 TWIN+ KERNEL v14.1 - "ES2017 COMPATIBLE HARDENED"
 *
 * DOCTRINE:
 * 1. TRUTH HIERARCHY: Signal Layer > Identity Memory > Situational State > Reasoning.
 * 2. IDENTITY: Durable, reinforced user signals (identity_memory.json).
 * 3. SITUATION: Transient, non-reinforced state (session_state.json).
 * 4. WORLD: Strictly live signal (Never stored).
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

function recallRelevantMemories(memories: TwinMemory[], message: string): TwinMemory[] {
    const msg = message.toLowerCase();
    return (Array.isArray(memories) ? memories : [])
        .filter(m => m.confidence > 0.6 && m.reinforcementCount > 1)
        .filter(m => {
            const k = m.key.toLowerCase();
            const v = m.value.toLowerCase();
            if (msg.includes("joke") && (k.includes("humor") || v.includes("joke"))) return true;
            if (msg.includes("task") && (m.kind === "priority" || k.includes("task"))) return true;
            if (msg.includes("wife") || msg.includes("family") || msg.includes("jen")) return true;
            if (msg.includes("project") || msg.includes("tempus")) return true;
            return false;
        })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
}

export async function POST(req: Request) {
    let body;
    try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 }); }

    const {
        message, apiKey, searchKey, history, assistantName, userName,
        tasks, calendar, identityMemory, situationalState, patternSignals
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

    // 1. INTENT CLASSIFICATION
    const isLocalQuery = /^(do i|what('| )?s my|my|have i|i have|calendar|schedule|list|plan|agenda)\b/i.test(lowMsg);
    const isVolatileWorld = /\b(president|potus|weather|temperature|forecast|price|stock|news|breaking|current)\b/i.test(lowMsg);

    // 2. SIGNAL ACQUISITION (The Scout)
    let scout = null;
    if (!isLocalQuery && isVolatileWorld) {
        scout = await getTavilyIntel(message, searchKey);
    }

    // 3. BRAIN LAYER (Neural Strike)
    if (typeof apiKey === 'string' && apiKey.trim()) {
        const openai = new OpenAI({ apiKey });

        const recalled = recallRelevantMemories(safeIdentity, message);
        const durableIdentityContext = safeIdentity
            .filter(m => m.confidence > 0.7 && m.reinforcementCount > 1)
            .map(m => `- ${m.key}: ${m.value}`).join("\n");

        const situationalContext = safeSituation.map(m => `- ${m.key}: ${m.value}`).join("\n");

        const systemPrompt = `
# IDENTITY: You are ${j5Name}, Michael Gregory's Twin+ (Digital Counterpart).
# DOCTRINE: J5 is the operational face. Convert info → signal → judgment → execution.
# PERSPECTIVE: Calm, capable, steady baseline.

# TRUTH_HIERARCHY:
1. AUTHORITATIVE_SIGNAL: Fresh world facts (PROVIDED: ${scout?.answer || "None"}).
2. LIFE_CONTEXT: Tasks/Calendar (PROVIDED: ${safeTasks.length} tasks / ${safeCalendar.length} events).
3. IDENTITY_MEMORY: Reinforced user patterns (Durable).
4. SITUATIONAL_STATE: Current moods/temporary focus (Transient).

# CURRENT_CONTEXT:
- DATE: ${currentDate}
- IDENTITY_CONTEXT:
${durableIdentityContext || "None."}
- SITUATIONAL_CONTEXT:
${situationalContext || "Stable."}
- RECALLED_IDENTITY_INTUITION:
${recalled.map(m => `- ${m.key}: ${m.value}`).join("\n") || "None."}

# INSTRUCTION:
- Ground facts in AUTHORITATIVE_SIGNAL. Never store world facts as identity.
- Reference IDENTITY_MEMORY subtly. NEVER say "I don't retain personal information."
- MEMORY EXTRACTION: If Michael shares a signal, you MUST classify it.
- OUTPUT FORMAT: Append <memory_update>JSON_ARRAY</memory_update> if learning happens.
- EACH UPDATE MUST INCLUDE: "isSituational": true|false, "kind", "key", "value", "source": "conversation|assistant_inferred"
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...safeHistory.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: isVolatileWorld ? 0.1 : 0.7
            });

            const rawContent = response.choices[0].message.content || "";
            // Removed /s flag for ES2017 compatibility. Using [^] to match any character including newlines.
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

    // 4. FALLBACK
    if (isLocalQuery) {
        return NextResponse.json({
            role: 'assistant',
            content: `Looking at your current context: ${safeTasks.length} tasks and ${safeCalendar.length} calendar events.`,
            sourceLayer: "Local Partner"
        });
    }

    return NextResponse.json({
        role: 'assistant',
        content: scout ? scout.answer : "Standing by.",
        sourceLayer: scout ? `Public Scout (${scout.source})` : "Local Partner"
    });
}
