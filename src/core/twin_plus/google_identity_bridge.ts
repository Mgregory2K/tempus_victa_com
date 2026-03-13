import crypto from "crypto";
import fs from "fs";
import path from "path";
import { TwinManifest } from "./identity_model";

const TWIN_DIR = path.join(process.cwd(), "twin_plus");
const MANIFEST_PATH = path.join(TWIN_DIR, "twin_manifest.json");

function randomHex(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function deriveTwinId(email: string, salt: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim() + ":" + salt)
    .digest("hex");

  return `tv_${hash.slice(0, 32)}`;
}

export function ensureTwinDir(): void {
  if (!fs.existsSync(TWIN_DIR)) {
    fs.mkdirSync(TWIN_DIR, { recursive: true });
  }
}

export function loadTwinManifest(): TwinManifest | null {
  ensureTwinDir();

  if (!fs.existsSync(MANIFEST_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(raw) as TwinManifest;

  if (!parsed.twin_id || !parsed.owner_email) {
    throw new Error("Invalid twin_manifest.json");
  }

  return parsed;
}

export function createTwinManifestForGoogleUser(email: string): TwinManifest {
  ensureTwinDir();

  const normalizedEmail = email.toLowerCase().trim();
  const salt = randomHex(16);

  const manifest: TwinManifest = {
    twin_id: deriveTwinId(normalizedEmail, salt),
    version: 1,
    created_at: new Date().toISOString(),
    owner_email: normalizedEmail,
    auth_provider: "google",
    identity_anchor: "google_authenticated_user",
    salt,
    issuer: process.env.TWIN_ISSUER || "tempus_victa",
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

export function resolveOrCreateTwinManifest(email: string): TwinManifest {
  const existing = loadTwinManifest();

  if (existing) {
    if (existing.owner_email.toLowerCase() !== email.toLowerCase()) {
      throw new Error(
        `Twin manifest owner mismatch. Existing=${existing.owner_email} Incoming=${email.toLowerCase()}`
      );
    }
    return existing;
  }

  return createTwinManifestForGoogleUser(email);
}
