import {
  TwinManifest,
  TwinMemoryBundle,
  TwinPassport,
  TwinPassportPayload,
} from "./identity_model";
import { buildTwinProjection } from "./projection_engine";
import { signPassportAsymmetric } from "./crypto/sign_passport";
import { ProjectionScope } from "./scopes";
import { GrantRegistry } from "./grants/grant_registry";

export function buildTwinPassport(
  manifest: TwinManifest,
  memory: TwinMemoryBundle,
  scope: ProjectionScope = "ai_chat_compact",
  audience?: string
): TwinPassport {
  const projection = buildTwinProjection(manifest, memory, scope);

  // Phase 3: Create auditable grant record
  const grantRegistry = GrantRegistry.getInstance();
  const grant = grantRegistry.createGrant(manifest.twin_id, audience || "unknown", scope);

  const payload: TwinPassportPayload = {
    spec_version: "twin_passport_v2",
    issuer: process.env.TWIN_ISSUER || "tempus_victa",
    twin_id: manifest.twin_id,
    subject: manifest.owner_email,
    audience: audience,
    issued_at: projection.issued_at,
    expires_at: projection.expires_at,
    projection,
    grant_id: grant.grant_id,
    key_id: "PENDING", // Filled by signer
    alg: "Ed25519",    // Filled by signer
  };

  return signPassportAsymmetric(payload);
}
