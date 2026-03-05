// src/core/twin_plus/trust_engine.ts

/**
 * Volume IV — Learning Engine and Trust Mathematics
 * TrustScore = BaseTrust + Reinforcement + Recency + AccuracyHistory
 */

export interface TrustNode {
    source: string;
    score: number; // 0.0 to 1.0
    lastInteraction: string; // ISO timestamp
    interactionCount: number;
}

const DECAY_CONSTANT = 0.005; // Amount trust decays per day of inactivity
const REINFORCEMENT_BOOST = 0.05; // Boost for successful task completion

export class TrustEngine {
    public static calculateDecay(node: TrustNode): number {
        const last = new Date(node.lastInteraction).getTime();
        const now = new Date().getTime();
        const daysPassed = (now - last) / (1000 * 60 * 60 * 24);

        const decayedScore = node.score - (daysPassed * DECAY_CONSTANT);
        return Math.max(0.0, Math.min(1.0, decayedScore));
    }

    public static reinforce(currentScore: number, success: boolean): number {
        const delta = success ? REINFORCEMENT_BOOST : -REINFORCEMENT_BOOST;
        return Math.max(0.0, Math.min(1.0, currentScore + delta));
    }
}
