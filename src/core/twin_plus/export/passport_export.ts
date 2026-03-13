import { TwinPassport } from "../identity_model";
import { resolveOrCreateTwinManifest } from "../google_identity_bridge";
import { loadTwinMemory } from "../twin_memory";
import { buildTwinPassport } from "../twin_passport";
import { ProjectionScope } from "../scopes";

export function exportTwinPassport(
  email: string,
  scope: ProjectionScope = "ai_chat_compact",
  audience?: string
): TwinPassport {
  const manifest = resolveOrCreateTwinManifest(email);
  const memory = loadTwinMemory();
  return buildTwinPassport(manifest, memory, scope, audience);
}
