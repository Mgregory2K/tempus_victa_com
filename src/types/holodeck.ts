// src/types/holodeck.ts

export type EntityType = 'historical_public_figure' | 'living_public_figure' | 'fictional_character';

export interface HolodeckVoice {
  tone: string[];
  cadence: string;
  humor: string;
  formality: string;
  verbosity: string;
}

export interface HolodeckWorldview {
  core_values: string[];
  dislikes: string[];
  biases: string[];
}

export interface HolodeckReasoningStyle {
  decision_basis: string[];
  debate_style: string[];
  likely_moves: string[];
}

export interface HolodeckConstraints {
  must_not_do: string[];
  must_remain_grounded_in_public_persona: boolean;
}

export interface HolodeckProfile {
  id: string;
  display_name: string;
  entity_type: EntityType;
  alive: boolean;
  profile_version: number;
  confidence: number;
  source_count: number;
  last_built_utc: string;
  voice: HolodeckVoice;
  worldview: HolodeckWorldview;
  reasoning_style: HolodeckReasoningStyle;
  constraints: HolodeckConstraints;
  preview_bullets: string[];
}

export type EvidenceType =
  | 'book'
  | 'speech'
  | 'interview'
  | 'letter'
  | 'historical_archive'
  | 'biography'
  | 'debate'
  | 'public_writing'
  | 'academic_reference';

export interface HolodeckEvidence {
  type: EvidenceType;
  title: string;
  url?: string;
  relevance: string;
  confidence_weight: number;
}

export interface HolodeckEvidenceLedger {
  entity_id: string;
  evidence: HolodeckEvidence[];
  open_questions: string[];
  discarded_claims: string[];
}

export interface HolodeckMessage {
  timestamp_utc: string;
  sender: string;
  sender_type: 'user' | 'moderator' | 'participant';
  content: string;
  round?: number;
}

export interface HolodeckQuote {
  speaker: string;
  text: string;
  context?: string;
}

export interface HolodeckSession {
  session_id: string;
  start_timestamp_utc: string;
  end_timestamp_utc?: string;
  topic: string;
  moderator: string;
  mode: string;
  round_limit?: number;
  participants: string[]; // List of profile IDs
  transcript: HolodeckMessage[];
  summary?: string;
  notable_quotes: HolodeckQuote[];
  metadata?: Record<string, any>;
}

export interface HolodeckMode {
  id: string;
  name: string;
  description: string;
  default?: boolean;
}

export interface HolodeckModerator {
  id: string;
  name: string;
  description: string;
  default?: boolean;
}
