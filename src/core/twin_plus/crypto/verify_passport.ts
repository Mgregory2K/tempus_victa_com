import { TwinPassport } from "../identity_model";
import { KeyRegistry } from "./key_registry";
import { RevocationRegistry } from "../revocation/revocation_registry";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const PUBLIC_KEY_PATH = path.join(process.cwd(), "twin_plus", "keys", "public_ed25519.pem");

export type VerificationResult = {
  valid: boolean;
  issuer: string;
  key_id: string;
  audience?: string;
  reason: string | null;
};

export async function verifyPassportAsymmetric(
  passport: TwinPassport,
  expectedAudience?: string
): Promise<VerificationResult> {
  const registry = KeyRegistry.getInstance();
  const revocation = RevocationRegistry.getInstance();
  const keyMetadata = registry.getKey(passport.key_id);

  const result: VerificationResult = {
    valid: false,
    issuer: passport.issuer,
    key_id: passport.key_id,
    audience: passport.audience,
    reason: null,
  };

  // Check 5: Strict Revocation/Verification Order

  // 1. Signature Valid? (Cryptographic integrity check)
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
      result.reason = "public_key_missing";
      return result;
  }
  const publicKeyPem = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

  const { signature, ...payload } = passport;
  const isSignatureValid = crypto.verify(
      null,
      Buffer.from(JSON.stringify(payload)),
      publicKeyPem,
      Buffer.from(signature, 'base64')
  );

  if (!isSignatureValid) {
    result.reason = "signature_mismatch";
    return result;
  }

  // 2. Issuer Valid?
  if (passport.issuer !== (process.env.TWIN_ISSUER || "tempus_victa")) {
    result.reason = "invalid_issuer";
    return result;
  }

  // 3. Key Revoked?
  if (!keyMetadata || keyMetadata.status === "revoked" || revocation.isRevoked("key", passport.key_id)) {
    result.reason = "revoked_key";
    return result;
  }

  // 4. Passport Revoked?
  if (revocation.isRevoked("passport", passport.passport_id || "")) {
    result.reason = "revoked_passport";
    return result;
  }

  // 5. Expiration Valid? (Check 4: Expiration Enforcement)
  const now = new Date();
  const expiresAt = new Date(passport.expires_at);
  if (now > expiresAt) {
    result.reason = "passport_expired";
    return result;
  }

  // 6. Audience Valid? (Check 3: Audience Enforcement)
  if (expectedAudience && passport.audience !== expectedAudience) {
    result.reason = "audience_mismatch";
    return result;
  }

  result.valid = true;
  return result;
}
