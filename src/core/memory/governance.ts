// src/core/memory/governance.ts

export interface TwinMemory {
  id: string;
  kind: 'preference' | 'style' | 'priority' | 'relationship' | 'profile';
  key: string;
  value: string;
  confidence: number;
  reinforcementCount: number;
  source: 'conversation' | 'user_confirmed' | 'assistant_inferred';
  createdAt: string;
  updatedAt: string;
  lastReferencedAt?: string;
}

export interface PatternSignal {
  id: string;
  category: "behavior" | "workflow" | "communication";
  pattern: string;
  evidenceCount: number;
  confidence: number;
  lastObserved: string;
  lastReflected?: string;
}

/**
 * STABILITY SCORING
 * Determines if a memory has earned its place in the durable identity.
 */
export function calculateStability(memory: TwinMemory): number {
    let score = memory.reinforcementCount;
    if (memory.source === 'user_confirmed') score += 3;
    const daysSinceCreation = (Date.now() - new Date(memory.createdAt).getTime()) / 86400000;
    if (daysSinceCreation > 7) score += 1;
    return score;
}

/**
 * IDENTITY GOVERNANCE & COMPRESSION
 */
export function runMemoryCompression(memories: TwinMemory[]) {
  const map = new Map<string, TwinMemory>();
  const safeMemories = Array.isArray(memories) ? memories : [];

  for (const m of safeMemories) {
    const uniqueKey = `${m.kind}:${m.key.toLowerCase()}`;
    if (!map.has(uniqueKey)) {
      map.set(uniqueKey, { ...m });
      continue;
    }
    const existing = map.get(uniqueKey)!;
    if (m.source === 'user_confirmed' || m.kind === 'relationship') {
        existing.value = m.value;
        existing.source = 'user_confirmed';
    }
    existing.reinforcementCount += m.reinforcementCount;
    existing.confidence = Math.min(1, (existing.confidence + m.confidence) / 2 + 0.05);
    existing.updatedAt = new Date().toISOString();
  }

  const merged = Array.from(map.values());

  const active = merged.filter(m => {
    if (m.source === "user_confirmed" || m.kind === "relationship") return true;
    if (calculateStability(m) >= 3 || m.confidence > 0.6) return true;
    return false;
  });

  const archived = merged.filter(m => {
      if (!m.lastReferencedAt) return false;
      const ageDays = (Date.now() - new Date(m.lastReferencedAt).getTime()) / 86400000;
      return ageDays > 120 && !active.find(a => a.id === m.id);
  });

  return { active, archived };
}

/**
 * PATTERN DETECTION
 */
export function detectPatterns(message: string, currentSignals: PatternSignal[]): PatternSignal[] {
  const msg = message.toLowerCase();
  const updated = [...(Array.isArray(currentSignals) ? currentSignals : [])];

  const updatePattern = (id: string, category: PatternSignal['category'], pattern: string) => {
    let sig = updated.find(p => p.id === id);
    if (!sig) {
      updated.push({ id, category, pattern, evidenceCount: 1, confidence: 0.3, lastObserved: new Date().toISOString() });
    } else {
      sig.evidenceCount += 1;
      sig.confidence = Math.min(1, sig.confidence + 0.05);
      sig.lastObserved = new Date().toISOString();
    }
  };

  if (msg.includes("tempus") && msg.includes("late")) updatePattern("late_night_work", "behavior", "User frequently works late on Tempus Victa");
  if (msg.includes("concise") || msg.includes("short")) updatePattern("brevity_preference", "communication", "User values operational brevity");

  return updated;
}
