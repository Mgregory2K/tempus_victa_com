import {
  TwinManifest,
  TwinMemoryBundle,
  TwinPassport,
  TwinPassportPayload,
} from "./identity_model";
import { buildTwinProjection } from "./projection_engine";
import { signPayload } from "./signature";
import { ProjectionScope } from "./scopes";

export function buildTwinPassport(
  manifest: TwinManifest,
  memory: TwinMemoryBundle,
  scope: ProjectionScope = "ai_chat_compact"
): TwinPassport {
  const projection = buildTwinProjection(manifest, memory, scope);

  const payload: TwinPassportPayload = {
    spec_version: "twin_passport_v1",
    issuer: process.env.TWIN_ISSUER || "tempus_victa",
    twin_id: manifest.twin_id,
    subject: manifest.owner_email,
    issued_at: projection.issued_at,
    expires_at: projection.expires_at,
    projection,
  };

  const secret = process.env.TWIN_PASSPORT_SECRET;
  if (!secret) {
    throw new Error("Missing TWIN_PASSPORT_SECRET");
  }

  return {
    ...payload,
    signature: signPayload(payload, secret),
  };
}
