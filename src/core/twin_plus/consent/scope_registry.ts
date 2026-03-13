import { ProjectionScope } from "../scopes";

export type ScopeDefinition = {
  id: ProjectionScope;
  name: string;
  description: string;
  sharedFields: string[];
};

export const SCOPE_REGISTRY: Record<ProjectionScope, ScopeDefinition> = {
  basic_identity: {
    id: "basic_identity",
    name: "Basic Identity",
    description: "Minimal recall for basic personalization.",
    sharedFields: ["dog_name", "response_style"],
  },
  ai_chat_compact: {
    id: "ai_chat_compact",
    name: "AI Chat Compact",
    description: "Standard chat context including high-confidence patterns.",
    sharedFields: [
      "dog_name",
      "response_style",
      "humor",
      "high_confidence_patterns",
    ],
  },
  presentation_mode: {
    id: "presentation_mode",
    name: "Presentation Mode",
    description: "Full professional context for deep work and planning.",
    sharedFields: [
      "dog_name",
      "response_style",
      "humor",
      "all_relevant_patterns",
    ],
  },
};
