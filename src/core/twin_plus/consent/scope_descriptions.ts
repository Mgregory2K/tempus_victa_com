import { ProjectionScope } from "../scopes";

export const SCOPE_DESCRIPTIONS: Record<ProjectionScope, string> = {
  basic_identity:
    "Minimal recall. Includes basic facts like your name and your dog's name, plus response style preferences.",
  ai_chat_compact:
    "Standard chat context. Includes identity facts, humor preferences, and high-confidence behavioral patterns.",
  presentation_mode:
    "Full professional context. Includes identity, detailed patterns, and communication-heavy behavioral traits for deep work.",
};
