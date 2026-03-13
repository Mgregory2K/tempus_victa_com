// src/core/twin_plus/trust_engine.ts

/**
 * TWIN+ TRUST ENGINE v3.4.0
 * RULE: User > Twin > Platform
 *
 * Trust levels for identity anchoring:
 * User: 1.0 (Canonical)
 * Twin Inference: 0.7
 * External AI: 0.3 (Can suggest, cannot define)
 */

export const TRUST_LEVELS = {
    USER: 1.0,
    TWIN_INFERENCE: 0.7,
    EXTERNAL_AI: 0.3
};

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

    /**
     * Verifies if a source has enough trust to update a canonical identity fact.
     */
    public static canUpdateIdentity(sourceTrust: number, existingTrust: number = 1.0): boolean {
        // Only User (1.0) can override established User-owned facts.
        // External AI (0.3) can never override User or Twin facts.
        return sourceTrust >= existingTrust;
    }
}
