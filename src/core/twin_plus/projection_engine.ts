import { TwinManifest, TwinMemoryBundle, TwinProjection } from "./identity_model";
import { ProjectionScope, scopeTwinMemory } from "./scopes";

export function buildTwinProjection(
  manifest: TwinManifest,
  memory: TwinMemoryBundle,
  scope: ProjectionScope = "ai_chat_compact"
): TwinProjection {
  const scoped = scopeTwinMemory(memory, scope);
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();

  return {
    twin_id: manifest.twin_id,
    subject: manifest.owner_email,
    facts: scoped.facts,
    preferences: scoped.preferences,
    patterns: scoped.patterns,
    issued_at: issuedAt,
    expires_at: expiresAt,
    scope: scoped.scopeKeys,
  };
}
