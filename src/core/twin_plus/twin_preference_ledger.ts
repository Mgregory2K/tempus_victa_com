// src/core/twin_plus/twin_preference_ledger.ts

/**
 * The TwinPreferenceLedger stores high-level learned preferences and constraints.
 * This is the inspectable "identity graph" of the user.
 */
export class TwinPreferenceLedger {
  private preferences: Record<string, any> = {};

  public static async open(): Promise<TwinPreferenceLedger> {
    console.log("TwinPreferenceLedger opened.");
    return new TwinPreferenceLedger();
  }

  public getPreference<T>(key: string): T | undefined {
    return this.preferences[key];
  }

  public setPreference(key: string, value: any, metadata: { source: string; confidence: number }): void {
    this.preferences[key] = {
      value,
      ...metadata,
      lastUpdated: new Date().toISOString(),
    };
  }

  public snapshot(): any {
    return { ...this.preferences };
  }
}
