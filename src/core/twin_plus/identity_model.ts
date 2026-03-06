// src/core/twin_plus/identity_model.ts

/**
 * TWIN+ IDENTITY GRAPH
 * The data structure representing the "Mind" of the Digital Twin.
 */

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
    userProfile: CognitiveProfile;
    lexicon: Record<string, number>; // Learned vocabulary frequency
    doctrines: string[];             // Learned "Laws" Michael has stated
    version: number;
    lastUpdated: string;
}

export const INITIAL_IDENTITY: TwinIdentity = {
    userProfile: {
        directness: 0.8,
        efficiencyBias: 0.9,
        sarcasmTolerance: 0.5,
        challengeLevel: 0.4,
        verbosity: 0.3,
        prefersSystems: 0.9,
        riskTolerance: 0.7
    },
    lexicon: {},
    doctrines: [
        "Local > Internet > AI",
        "Efficiency > Accuracy",
        "Magician, not Programmer"
    ],
    version: 1,
    lastUpdated: new Date().toISOString()
};
