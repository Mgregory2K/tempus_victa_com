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
  spec_version: "twin_passport_v1";
  issuer: string;
  twin_id: string;
  subject: string;
  issued_at: string;
  expires_at: string;
  projection: TwinProjection;
};

export type TwinPassport = TwinPassportPayload & {
  signature: string;
};
