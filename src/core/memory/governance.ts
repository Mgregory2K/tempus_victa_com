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
 * Rule: stabilityScore >= 3 required for active prompt injection.
 */
export function calculateStability(memory: TwinMemory): number {
    let score = memory.reinforcementCount;
    if (memory.source === 'user_confirmed') score += 3;

    const daysSinceCreation = (Date.now() - new Date(memory.createdAt).getTime()) / 86400000;
    if (daysSinceCreation > 7) score += 1;

    return score;
}

/**
 * IDENTITY GOVERNANCE ENGINE
 * Handles reinforcement, deduplication, and pruning.
 */
export function governIdentity(existing: TwinMemory[], incoming: Partial<TwinMemory>[]): TwinMemory[] {
    const updated = [...existing];

    for (const signal of incoming) {
        if (!signal.key || !signal.value) continue;

        const existingIndex = updated.findIndex(m => m.key.toLowerCase() === signal.key!.toLowerCase());

        if (existingIndex === -1) {
            // New Candidate
            updated.push({
                id: signal.id || Math.random().toString(36).substring(2, 11),
                kind: signal.kind || 'preference',
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
            m.reinforcementCount += 1;
            m.confidence = Math.min(1, m.confidence + 0.1);
            m.value = signal.value; // Update with latest phrasing
            m.updatedAt = new Date().toISOString();
            if (signal.source === 'user_confirmed') m.source = 'user_confirmed';
        }
    }

    return updated;
}

/**
 * COMPRESSION ENGINE (Periodic Run)
 * Prunes weak signals and prepares archiving candidates.
 */
export function runMemoryCompression(memories: TwinMemory[]) {
    // 1. Prune weak assistant inferences that never reinforced
    const active = memories.filter(m => {
        if (m.source === 'user_confirmed') return true;
        if (m.kind === 'relationship') return true;
        if (calculateStability(m) >= 3) return true;
        if (m.confidence > 0.6) return true;
        return false;
    });

    // 2. Identify stale items for archive (Not referenced in 120 days)
    const archived = memories.filter(m => {
        if (!m.lastReferencedAt) return false;
        const ageDays = (Date.now() - new Date(m.lastReferencedAt).getTime()) / 86400000;
        return ageDays > 120 && !active.find(a => a.id === m.id);
    });

    return { active, archived };
}

/**
 * PATTERN ENGINE
 * Behavioral observation reinforcement and decay.
 */
export function governPatterns(existing: PatternSignal[], incomingIds: string[]): PatternSignal[] {
    const updated = [...existing];
    const now = new Date().toISOString();

    for (const id of incomingIds) {
        let pattern = updated.find(p => p.id === id);
        if (!pattern) continue; // Only reinforce known detectors

        pattern.evidenceCount += 1;
        pattern.confidence = Math.min(1, pattern.confidence + 0.05);
        pattern.lastObserved = now;
    }

    return updated;
}
