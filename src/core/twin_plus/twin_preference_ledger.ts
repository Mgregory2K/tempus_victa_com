// src/core/twin_plus/twin_preference_ledger.ts

/**
 * The TwinPreferenceLedger stores high-level learned preferences and constraints.
 * This is the inspectable "identity graph" of the user.
 */
export class TwinPreferenceLedger {
  private preferences: Record<string, any> = {};

  public static async open(): Promise<TwinPreferenceLedger> {
    const ledger = new TwinPreferenceLedger();
    ledger.load();
    return ledger;
  }

  private load() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tv_preferences');
      if (saved) {
        this.preferences = JSON.parse(saved);
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tv_preferences', JSON.stringify(this.preferences));
    }
  }

  public getPreference<T>(key: string): T | undefined {
    return this.preferences[key]?.value;
  }

  public setPreference(key: string, value: any, metadata?: { source: string; confidence: number }): void {
    this.preferences[key] = {
      value,
      source: metadata?.source || 'SYSTEM',
      confidence: metadata?.confidence || 1.0,
      lastUpdated: new Date().toISOString(),
    };
    this.save();
  }

  public snapshot(): any {
    return { ...this.preferences };
  }

  // Reinforcement methods for the Learning Engine
  public reinforceVerboseComplaint() {
    const current = this.getPreference<number>('verbosity') || 0.5;
    this.setPreference('verbosity', Math.max(0.1, current - 0.1), { source: 'USER_FEEDBACK', confidence: 0.8 });
  }

  public reinforceStaleComplaint() {
    const current = this.getPreference<number>('trust_threshold') || 0.7;
    this.setPreference('trust_threshold', Math.min(0.95, current + 0.05), { source: 'USER_FEEDBACK', confidence: 0.9 });
  }
}
