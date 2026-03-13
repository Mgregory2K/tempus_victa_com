import crypto from "crypto";
import fs from "fs";
import path from "path";
import { TwinPassport, TwinPassportPayload } from "../identity_model";
import { KeyRegistry } from "./key_registry";

const KEYS_DIR = path.join(process.cwd(), "twin_plus", "keys");
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, "private_ed25519.pem");
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, "public_ed25519.pem");

function ensureKeysExist() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
    console.log("Generating persistent Twin+ Ed25519 keys...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey.export({ type: 'spki', format: 'pem' }));
  }
}

/**
 * Phase 3 Signing - Uses Persistent Asymmetric Ed25519
 */
export function signPassportAsymmetric(payload: TwinPassportPayload): TwinPassport {
  ensureKeysExist();

  const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const registry = KeyRegistry.getInstance();
  const activeKey = registry.getActiveKey();

  // Check 2: Passport ID uniqueness (UUID)
  const passportId = `twp_${crypto.randomUUID().replace(/-/g, '')}`;

  const enrichedPayload: TwinPassportPayload = {
    ...payload,
    passport_id: passportId,
    key_id: activeKey.key_id,
    alg: "Ed25519"
  };

  // Sign using real Ed25519
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(enrichedPayload)), privateKeyPem).toString('base64');

  return {
    ...enrichedPayload,
    signature,
  };
}
