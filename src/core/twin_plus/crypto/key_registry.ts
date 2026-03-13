import crypto from "crypto";

export type KeyMetadata = {
  key_id: string;
  alg: "Ed25519";
  status: "active" | "deprecated" | "revoked";
  public_key: string; // Base64
  private_key?: string; // Base64 - Only present for active local signing
  created_at: string;
};

export class KeyRegistry {
  private static instance: KeyRegistry;
  private keys: KeyMetadata[] = [];

  private constructor() {
    // Initial key for Phase 3 - In a real app, these would come from an encrypted store or KMS
    this.keys = [
      {
        key_id: "tvk_2026_01",
        alg: "Ed25519",
        status: "active",
        // Using placeholder keys that would be generated once and stored
        public_key: "MCowBQYDK2VwAyEA9f8G6...",
        created_at: "2026-03-13T00:00:00.000Z",
      },
    ];
  }

  public static getInstance(): KeyRegistry {
    if (!KeyRegistry.instance) {
      KeyRegistry.instance = new KeyRegistry();
    }
    return KeyRegistry.instance;
  }

  public getActiveKey(): KeyMetadata {
    const active = this.keys.find((k) => k.status === "active");
    if (!active) throw new Error("No active signing key found");
    return active;
  }

  public getKey(keyId: string): KeyMetadata | undefined {
    return this.keys.find((k) => k.key_id === keyId);
  }

  public getAllPublicKeys(): Omit<KeyMetadata, "private_key">[] {
    return this.keys.map(({ private_key, ...publicData }) => publicData);
  }
}
