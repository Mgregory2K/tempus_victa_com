// src/core/twin_plus/twin_event.ts

export type TwinEventType =
  | 'SIGNAL_INPUT'
  | 'ACTION_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_SNOOZED'
  | 'TASK_SNOOZE_CLICK'
  | 'QUOTE_CAPTURED'
  | 'CORKBOARD_PIN'
  | 'NOTE_ARCHIVED'
  | 'PROTOCOL_INVOKED'
  | 'PROTOCOL_TERMINATED'
  | 'INTENT_ROUTED'
  | 'ENTROPY_REDUCED'
  | 'SIGNAL_ROUTED'
  | 'SIGNAL_DECAYED'
  | 'UNIVERSAL_INGEST'
  | 'MODULE_SWITCH'
  | 'BRIDGE_NAVIGATION'
  | 'TRIUMPH_LOGGED'
  | 'WISH_SUBMITTED'
  | 'DAILY_BRIEF_VIEWED'
  | 'DAILY_BRIEF_DISMISSED'
  | 'TIMELINE_DISMISSED'
  | 'EXERCISE_STARTED'
  | 'EXERCISE_COMPLETED'
  | 'MOTOR_CALIBRATION'
  | 'COGNITIVE_SCORE'
  | 'READY_ROOM_PAGE_BREAK'
  | 'EXTERNAL_SIGNALS_POLLED';

/**
 * Defines the schema for a TwinEvent.
 * All events must include these core fields.
 */
export interface TwinEvent {
  id: string; // uuid
  ts: string; // UTC ISO 8601 timestamp
  surface: string; // BRIDGE | READY_ROOM | MISSIONS | etc
  type: TwinEventType;
  actor: 'user' | 'system';
  intent?: string;
  payload: Record<string, any>;
  confidence: number; // 0.0–1.0
  privacy: 'normal' | 'sensitive' | 'redacted';
}

export function createEvent(type: TwinEventType, payload: any, surface: string = 'SYSTEM'): TwinEvent {
  return {
    id: Math.random().toString(36).substring(7),
    ts: new Date().toISOString(),
    surface,
    type,
    actor: 'user', // Defaulting for simple capture
    payload,
    confidence: 1.0,
    privacy: 'normal'
  };
}
