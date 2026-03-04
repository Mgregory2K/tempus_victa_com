// src/core/twin_plus/twin_event.ts

/**
 * Defines the schema for a TwinEvent.
 * All events must include these core fields.
 */
export interface TwinEvent {
  id: string; // uuid
  ts: string; // UTC ISO 8601 timestamp
  surface: string; // room/screen/widget identifier
  type: string; // enum of event types
  actor: 'user' | 'system';
  intent?: string; // optional enum; can be inferred later
  payload: Record<string, any>; // small structured map
  confidence: number; // 0.0–1.0, for inferred fields
  privacy: 'normal' | 'sensitive_redacted' | 'hash_only';
}
