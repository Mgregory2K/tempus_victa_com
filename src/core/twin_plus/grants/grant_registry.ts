export type SessionGrant = {
  grant_id: string;
  twin_id: string;
  platform: string;
  scope: string;
  issued_at: string;
  expires_at: string;
  status: "active" | "revoked" | "expired";
};

export class GrantRegistry {
  private static instance: GrantRegistry;
  private grants: SessionGrant[] = [];

  private constructor() {}

  public static getInstance(): GrantRegistry {
    if (!GrantRegistry.instance) {
      GrantRegistry.instance = new GrantRegistry();
    }
    return GrantRegistry.instance;
  }

  public createGrant(
    twin_id: string,
    platform: string,
    scope: string,
    durationMs: number = 1000 * 60 * 60 * 12
  ): SessionGrant {
    const issued_at = new Date();
    const expires_at = new Date(issued_at.getTime() + durationMs);

    const grant: SessionGrant = {
      grant_id: `tgrant_${Math.random().toString(36).slice(2, 11)}`,
      twin_id,
      platform,
      scope,
      issued_at: issued_at.toISOString(),
      expires_at: expires_at.toISOString(),
      status: "active",
    };

    this.grants.push(grant);
    return grant;
  }

  public getGrantsForTwin(twin_id: string): SessionGrant[] {
    return this.grants.filter((g) => g.twin_id === twin_id);
  }

  public getGrant(grant_id: string): SessionGrant | undefined {
    return this.grants.find((g) => g.grant_id === grant_id);
  }

  public revokeGrant(grant_id: string): void {
    const grant = this.getGrant(grant_id);
    if (grant) {
      grant.status = "revoked";
    }
  }
}
