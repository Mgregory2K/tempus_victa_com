export type TwinManifest = {
  twin_id: string;
  version: number;
  created_at: string;
  owner_email: string;
  auth_provider: "google";
  identity_anchor?: string;
  salt: string;
  issuer: string;
};

export type DurableFacts = Record<string, string | number | boolean | null>;

export type Preferences = Record<string, string | number | boolean | null>;

export type BehavioralPatterns = {
  pattern: string;
  confidence: number;
  updated_at: string;
}[];

export type TwinMemoryBundle = {
  durable_facts: DurableFacts;
  preferences: Preferences;
  behavioral_patterns: BehavioralPatterns;
};

export type TwinProjection = {
  twin_id: string;
  subject: string;
  facts: Record<string, string | number | boolean | null>;
  preferences: Record<string, string | number | boolean | null>;
  patterns: string[];
  issued_at: string;
  expires_at: string;
  scope: string[];
};

export type TwinPassportPayload = {
  spec_version: "twin_passport_v1" | "twin_passport_v2";
  passport_id?: string;
  issuer: string;
  key_id: string;
  alg: "Ed25519" | "HS256";
  twin_id: string;
  subject: string;
  audience?: string;
  issued_at: string;
  expires_at: string;
  projection: TwinProjection;
  grant_id?: string;
};

export type TwinPassport = TwinPassportPayload & {
  signature: string;
};

/**
 * Legacy/Compatibility types for TwinFeatureStore
 */

export interface CognitiveProfile {
    directness: number;
    efficiencyBias: number;
    sarcasmTolerance: number;
    challengeLevel: number;
    verbosity: number;
    prefersSystems: number;
    riskTolerance: number;
}

export interface TwinIdentity {
    manifest: TwinManifest;
    userProfile: CognitiveProfile;
    lexicon: Record<string, number>;
    doctrines: string[];
    version: number;
    lastUpdated: string;
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
