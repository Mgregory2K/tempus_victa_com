// src/core/twin_plus/sovereign/types.ts

export type MemoryClass = "committed" | "durable" | "working" | "inferred" | "ephemeral";
export type MemorySource = "explicit_user" | "imported_user_data" | "confirmed_external" | "inferred";
export type Visibility = "local_only" | "twin_core" | "exportable" | "restricted";

/**
 * TWIN MANIFEST
 * The canonical identity file that anchors the digital brain.
 */
export interface TwinPlusManifest {
  twin_id: string;          // tv_... (SHA256 based)
  version: number;
  created_at: string;
  owner_email: string;
  identity_anchor: string;  // e.g. "thecreator"
  salt: string;
  schema_version?: string;
  filesystem_version?: string;
}

export interface DurableFact {
  id: string;
  twin_id: string;          // Every object must reference the canonical twin_id
  key: string;
  value: unknown;
  value_type: "string" | "number" | "boolean" | "object" | "array";
  memory_class: "committed" | "durable";
  source: Exclude<MemorySource, "inferred">;
  confidence: number;
  locked: boolean;
  visibility: Visibility;
  export_tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BehavioralPattern {
  id: string;
  twin_id: string;
  pattern_name: string;
  description: string;
  observed_frequency: number;
  confidence: number;
  last_observed: string;
}

export interface RelationshipEntity {
  id: string;
  twin_id: string;
  entity_type: "person" | "pet" | "organization" | "place" | "team";
  display_name: string;
  relation_to_user: string;
  attributes?: Record<string, unknown>;
  memory_class: "committed" | "durable" | "working";
  source: MemorySource;
  confidence: number;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface CommittedMemoryItem {
  id: string;
  twin_id: string;
  memory_key: string;
  summary: string;
  canonical_value: unknown;
  memory_class: "committed";
  source: "explicit_user" | "confirmed_external";
  confidence: number;
  locked: boolean;
  platform_export_policy: {
    default_action: "allow" | "deny" | "conditional";
    allowed_platforms?: string[];
    denied_platforms?: string[];
    export_reason?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProjectionFact {
  memory_key: string;
  label: string;
  value: unknown;
  source: string;
  confidence: number;
}

export interface GenericProjection {
  projection_id: string;
  projection_version: string;
  twin_id: string;
  user_display_name: string;
  generated_at: string;
  source: "Twin+" | "Johnny5" | "J5";
  identity_payload: {
    durable_facts: ProjectionFact[];
  };
  behavioral_payload: {
    communication_preferences: string[];
    workflow_preferences: string[];
  };
  context_payload: {
    current_focus: string[];
  };
  instruction_payload: {
    identity_statement: string;
    attribution_rule: string;
    fabrication_rule: string;
    disclosure_rule: string;
  };
  audit_payload: {
    projection_reason: string;
    memory_keys_used: string[];
  };
}

export interface MemoryLedgerEvent {
  event_id: string;
  twin_id: string;
  ts: string;
  action: "create" | "update" | "delete" | "project";
  target: string;
  memory_key: string;
  old_value: unknown;
  new_value: unknown;
  source: string;
  confidence: number;
  actor: string;
  reason: string;
}
