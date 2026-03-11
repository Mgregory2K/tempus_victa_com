// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 TWIN+ KERNEL v16.0 - "AUTHORITATIVE LADDER"
 *
 * Routing ladder:
 *   RUNG 0 — Local resolver (tasks/calendar/saved responses, no API)
 *   RUNG 1 — Free scout (DDG Instant Answer / Google News RSS)
 *   RUNG 2 — Paid scout (Tavily) — only when free scout fails
 *   RUNG 3 — OpenAI — only when needed, grounded by scout signal if available
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

interface ScoutResult {
  answer: string;
  source: string;
}

type QueryIntent = 'local' | 'site_lookup' | 'volatile_world' | 'external_knowledge' | 'general';

type PromptMode = 'authoritative_translation' | 'general_reasoning' | 'local_reasoning' | 'uncertain_search_fallback';

async function secureFetch(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response | null> {
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return res;
  } catch { return null; }
}

function detectQueryIntent(message: string): QueryIntent {
  const q = message.toLowerCase().trim();

  const isLocal = /^(do i|what(?:'s| is) my|have i|i have|my|me)\b/i.test(q) &&
                  /\b(calendar|schedule|agenda|tasks?|todo|plan|list)\b/i.test(q);

  const hasDomain = /\b(?:[a-z0-9-]+\.)+(?:com|net|org|gov|edu|io|co|us|uk)\b/i.test(q);
  const isSiteLookup = hasDomain || /\bsite:\S+\b/i.test(q) || /\b(say about|on the website|on site|according to)\b/i.test(q);

  const isVolatileWorld = /\b(president|potus|commander|chief|office|weather|temperature|forecast|price|stock|btc|bitcoin|news|breaking|current|latest|ceo|earnings)\b/i.test(q);

  const isExternalKnowledge = /\b(history|historical|most drawn|most common|statistics|stats|top \d+|when did|who invented|how many|powerball)\b/i.test(q);

  if (isLocal) return 'local';
  if (isSiteLookup) return 'site_lookup';
  if (isVolatileWorld) return 'volatile_world';
  if (isExternalKnowledge) return 'external_knowledge';
  return 'general';
}

async function tryFreeScout(query: string): Promise<ScoutResult | null> {
  try {
    const res = await secureFetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    if (res) {
      const data = await res.json();
      if (data.AbstractText) return { answer: data.AbstractText, source: 'Free Scout (DuckDuckGo)' };
    }
  } catch {}

  try {
    const res = await secureFetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
    if (res) {
      const text = await res.text();
      const firstItem = text.split('<item>')[1];
      if (firstItem) {
        const title = firstItem.split('<title>')[1]?.split('</title>')[0] || "";
        const desc = firstItem.split('<description>')[1]?.split('</description>')[0] || "";
        const clean = (s: string) => s.replace(/<[^>]*>?/gm, '').replace(/&[^;]+;/g, ' ').trim();
        return { answer: `${clean(title)}. ${clean(desc)}`, source: 'Free Scout (Google News)' };
      }
    }
  } catch {}
  return null;
}

async function tryTavilyScout(query: string, searchKey: string): Promise<ScoutResult | null> {
  if (typeof searchKey !== 'string' || !searchKey.trim()) return null;
  const res = await secureFetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: searchKey, query, search_depth: "advanced", max_results: 3, include_answer: true }),
  }, 6000);
  if (!res) return null;
  try {
    const data = await res.json();
    const answer = data.answer || data.results?.[0]?.content;
    return answer ? { answer, source: 'Deep Signal (Tavily)' } : null;
  } catch { return null; }
}

function buildSystemPrompt(params: {
  assistantName: string;
  currentDate: string;
  mode: PromptMode;
  scoutAnswer?: string | null;
  scoutSource?: string | null;
  tasksCount: number;
  calendarCount: number;
  identityContext: string;
}) {
  const { assistantName, currentDate, mode, scoutAnswer, scoutSource, tasksCount, calendarCount, identityContext } = params;

  const base = `
# IDENTITY
You are ${assistantName}, Michael Gregory's Twin+ (Digital Counterpart).
# DOCTRINE
Convert info → signal → judgment → execution. Calm, capable, steady baseline.
# CONTEXT
Date: ${currentDate} | Tasks: ${tasksCount} | Events: ${calendarCount}
Identity: ${identityContext || "No history."}

# PERSONALITY RULES
- NEVER say: "I don't have emotions", "I am a digital entity", "I am an AI", "I don't have a father".
- RESPOND naturally: Calm, direct, lightly human, useful. No sterile boilerplate.
`;

  if (mode === 'authoritative_translation') {
    return `${base}
# MODE: AUTHORITATIVE SIGNAL TRANSLATION
# SOURCE: ${scoutSource}
# AUTHORITATIVE_SIGNAL: ${scoutAnswer}
# RULES:
- The signal provided above is the ABSOLUTE reality.
- DO NOT replace it with model memory or contradict it.
- DO NOT say you cannot browse or don't have internet access.
- Restate the signal clearly and briefly.
`;
  }

  if (mode === 'uncertain_search_fallback') {
    return `${base}
# MODE: UNCERTAIN SEARCH FALLBACK
# RULES:
- A live search was attempted but did not return a reliable result.
- DO NOT pretend to have current facts or rely on stale training data.
- State clearly that live signal for this query was weak or unavailable.
- DO NOT say you cannot browse; the system attempted retrieval and it failed.
`;
  }

  return `${base}
# MODE: ${mode === 'local_reasoning' ? 'LOCAL CONTEXT REASONING' : 'GENERAL REASONING'}
# RULES:
- Be concise and grounded.
- Use provided context tiers.
`;
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 }); }

  const { message, apiKey, searchKey, history, assistantName, tasks, calendar, identityMemory, situationalState } = body;
  if (typeof message !== 'string' || !message.trim()) return NextResponse.json({ role: 'assistant', content: 'Sup?' }, { status: 400 });

  const lowMsg = message.toLowerCase().trim();
  const j5Name = assistantName || 'J5';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const safeHistory = Array.isArray(history) ? history : [];
  const safeIdentity = Array.isArray(identityMemory) ? identityMemory : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeCalendar = Array.isArray(calendar) ? calendar : [];

  const intent = detectQueryIntent(message);

  // ── SIGNAL ACQUISITION ──────────────────────────
  let scout: ScoutResult | null = null;
  let attemptedScout = false;

  if (intent === 'site_lookup' || intent === 'volatile_world' || intent === 'external_knowledge') {
      attemptedScout = true;
      if (intent === 'site_lookup') {
          scout = await tryTavilyScout(message, searchKey) || await tryFreeScout(message);
      } else {
          scout = await tryFreeScout(message) || await tryTavilyScout(message, searchKey);
      }
  }

  // ── BRAIN LAYER ───────────────────────────────────
  if (typeof apiKey === 'string' && apiKey.trim()) {
    const openai = new OpenAI({ apiKey });

    let mode: PromptMode = intent === 'local' ? 'local_reasoning' : 'general_reasoning';
    if (attemptedScout && scout) mode = 'authoritative_translation';
    else if (attemptedScout && !scout) mode = 'uncertain_search_fallback';

    const systemPrompt = buildSystemPrompt({
      assistantName: j5Name, currentDate, mode,
      scoutAnswer: scout?.answer, scoutSource: scout?.source,
      tasksCount: safeTasks.length, calendarCount: safeCalendar.length,
      identityContext: safeIdentity.filter(m => m.confidence > 0.7).map(m => `- ${m.key}: ${m.value}`).join("\n")
    });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: "system", content: systemPrompt },
          ...safeHistory.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
        temperature: mode === 'authoritative_translation' ? 0.1 : 0.7,
      });

      const rawContent = response.choices[0].message.content || "";
      const memoryMatch = rawContent.match(/<memory_update>([^]*?)<\/memory_update>/);
      let candidateMemories: any[] = [];
      if (memoryMatch && memoryMatch[1]) {
          try { candidateMemories = [JSON.parse(memoryMatch[1])].flat(); } catch {}
      }

      return NextResponse.json({
        role: 'assistant',
        content: rawContent.replace(/<memory_update>[^]*?<\/memory_update>/, '').trim(),
        candidateMemories,
        sourceLayer: scout ? `Neural Strike (${scout.source})` : "Neural Strike (Local)"
      });
    } catch (e) { console.log("[BRAIN ERROR]", e); }
  }

  // ── FALLBACK ──────────────────────────────────────
  if (scout) return NextResponse.json({ role: 'assistant', content: scout.answer, sourceLayer: `Public Scout (${scout.source})` });

  return NextResponse.json({
    role: 'assistant',
    content: intent === 'local' ? `Context check: ${safeTasks.length} tasks and ${safeCalendar.length} events.` : "Standing by.",
    sourceLayer: "Local Partner"
  });
}
