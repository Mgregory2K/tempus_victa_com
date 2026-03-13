// src/core/twin_plus/identity_model.ts
import crypto from 'crypto';

/**
 * TWIN+ IDENTITY ARCHITECTURE
 * The canonical identity anchor for the Cognitive OS.
 */

export interface TwinManifest {
    twin_id: string;        // tv_... (SHA256 based)
    version: number;
    created_at: string;
    owner_email: string;
    identity_anchor: string; // e.g., "thecreator"
    salt: string;
}

export interface CognitiveProfile {
    // Dynamic Sliders (0.0 - 1.0)
    directness: number;      // Blunt vs. Descriptive
    efficiencyBias: number;  // Speed vs. Accuracy
    sarcasmTolerance: number;
    challengeLevel: number;  // How much Twin+ pushes back
    verbosity: number;       // Short vs. Long

    // Reasoning Patterns
    prefersSystems: number;  // Structural vs. Abstract thinking
    riskTolerance: number;   // High-risk/High-reward bias
}

export interface TwinIdentity {
    manifest: TwinManifest;
    userProfile: CognitiveProfile;
    lexicon: Record<string, number>; // Learned vocabulary frequency
    doctrines: string[];             // Learned "Laws" Michael has stated
    version: number;
    lastUpdated: string;
}

export function generateTwinId(seed: string): { twin_id: string; salt: string } {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
      .createHash("sha256")
      .update(seed + salt)
      .digest("hex");

    return {
      twin_id: "tv_" + hash.slice(0, 32),
      salt
    };
}

export const INITIAL_IDENTITY_PROFILE: CognitiveProfile = {
    directness: 0.8,
    efficiencyBias: 0.9,
    sarcasmTolerance: 0.5,
    challengeLevel: 0.4,
    verbosity: 0.3,
    prefersSystems: 0.9,
    riskTolerance: 0.7
};
