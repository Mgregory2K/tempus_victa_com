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

export interface SituationalState {
  id: string;
  key: string;
  value: string;
  timestamp: string;
  expiresAt?: string;
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
  if (memory.reinforcementCount > 1) {
    const daysSinceCreation = (Date.now() - new Date(memory.createdAt).getTime()) / 86400000;
    if (daysSinceCreation > 7) score += 1;
  }

  return score;
}

/**
 * IDENTITY GOVERNANCE ENGINE
 * Handles reinforcement, deduplication, and pruning.
 */
export function governIdentity(existing: TwinMemory[], incoming: Partial<TwinMemory>[]): TwinMemory[] {
    const updated = [...(Array.isArray(existing) ? existing : [])];

    for (const signal of incoming) {
        if (!signal.key || !signal.value) continue;

        const existingIndex = updated.findIndex(m => m.key.toLowerCase() === signal.key!.toLowerCase());

        if (existingIndex === -1) {
            // New Candidate
            updated.push({
                id: signal.id || Math.random().toString(36).substring(2, 11),
                kind: (signal.kind as any) || 'preference',
                key: signal.key,
                value: signal.value,
                confidence: signal.source === 'user_confirmed' ? 0.9 : 0.4,
                reinforcementCount: 1,
                source: signal.source || 'assistant_inferred',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } else {
            // Reinforce Existing
            const m = updated[existingIndex];

            if (signal.source === 'user_confirmed') {
                m.value = signal.value;
                m.source = 'user_confirmed';
            } else if (m.kind === 'relationship' && !m.value) {
                m.value = signal.value;
            }

            m.reinforcementCount += 1;
            m.confidence = Math.min(1, m.confidence + 0.1);
            m.updatedAt = new Date().toISOString();
        }
    }

    return updated;
}

/**
 * COMPRESSION ENGINE (Periodic Run)
 */
export function runMemoryCompression(memories: TwinMemory[]) {
    const safeMemories = Array.isArray(memories) ? memories : [];

    // 1. Prune weak assistant inferences that never reinforced
    const active = safeMemories.filter(m => {
        if (m.source === 'user_confirmed') return true;
        if (m.kind === 'relationship') return true;
        if (calculateStability(m) >= 3) return true;
        if (m.confidence > 0.6) return true;
        return false;
    });

    // 2. Identify stale items for archive (Not referenced in 120 days)
    const archived = safeMemories.filter(m => {
        if (!m.lastReferencedAt) return false;
        const ageDays = (Date.now() - new Date(m.lastReferencedAt).getTime()) / 86400000;
        return ageDays > 120 && !active.find(a => a.id === m.id);
    });

    return { active, archived };
}

/**
 * PATTERN ENGINE
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
