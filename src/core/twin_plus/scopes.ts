import { TwinMemoryBundle } from "./identity_model";

export type ProjectionScope =
  | "basic_identity"
  | "presentation_mode"
  | "ai_chat_compact";

export function scopeTwinMemory(
  memory: TwinMemoryBundle,
  scope: ProjectionScope
): {
  facts: Record<string, string | number | boolean | null>;
  preferences: Record<string, string | number | boolean | null>;
  patterns: string[];
  scopeKeys: string[];
} {
  switch (scope) {
    case "basic_identity":
      return {
        facts: {
          dog_name: memory.durable_facts.dog_name ?? null,
        },
        preferences: {
          response_style: memory.preferences.response_style ?? "concise",
        },
        patterns: [],
        scopeKeys: ["facts.dog_name", "preferences.response_style"],
      };

    case "presentation_mode":
      return {
        facts: {
          dog_name: memory.durable_facts.dog_name ?? null,
        },
        preferences: {
          response_style: memory.preferences.response_style ?? "concise",
          humor: memory.preferences.humor ?? true,
        },
        patterns: memory.behavioral_patterns
          .filter((p) => p.confidence >= 0.8)
          .map((p) => p.pattern),
        scopeKeys: [
          "facts.dog_name",
          "preferences.response_style",
          "preferences.humor",
          "patterns.high_confidence",
        ],
      };

    case "ai_chat_compact":
    default:
      return {
        facts: {
          dog_name: memory.durable_facts.dog_name ?? null,
        },
        preferences: {
          response_style: memory.preferences.response_style ?? "concise",
          humor: memory.preferences.humor ?? true,
        },
        patterns: memory.behavioral_patterns
          .filter((p) => p.confidence >= 0.85)
          .map((p) => p.pattern),
        scopeKeys: [
          "facts.dog_name",
          "preferences.response_style",
          "preferences.humor",
          "patterns.high_confidence",
        ],
      };
  }
}
