export type RevocationRecord = {
  type: "key" | "passport" | "grant";
  id: string;
  revoked_at: string;
  reason: string;
};

export class RevocationRegistry {
  private static instance: RevocationRegistry;
  private records: RevocationRecord[] = [];

  private constructor() {}

  public static getInstance(): RevocationRegistry {
    if (!RevocationRegistry.instance) {
      RevocationRegistry.instance = new RevocationRegistry();
    }
    return RevocationRegistry.instance;
  }

  public revoke(type: "key" | "passport" | "grant", id: string, reason: string): void {
    this.records.push({
      type,
      id,
      revoked_at: new Date().toISOString(),
      reason,
    });
  }

  public isRevoked(type: "key" | "passport" | "grant", id: string): boolean {
    return this.records.some((r) => r.type === type && r.id === id);
  }

  public getRevocationReason(type: "key" | "passport" | "grant", id: string): string | null {
    const record = this.records.find((r) => r.type === type && r.id === id);
    return record ? record.reason : null;
  }
}
