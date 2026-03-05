// src/core/twin_plus/twin_feature_store.ts

import { TwinEvent } from './twin_event';
import { TwinPreferenceLedger } from './twin_preference_ledger';

/**
 * The TwinFeatureStore maintains the high-level "features" or "models"
 * of the user derived from the event ledger.
 */
export class TwinFeatureStore {
  private features: Record<string, any> = {};

  constructor(private prefs: TwinPreferenceLedger) {}

  public static async open(prefs: TwinPreferenceLedger): Promise<TwinFeatureStore> {
    console.log("TwinFeatureStore opened.");
    const store = new TwinFeatureStore(prefs);
    store.loadLocal();
    return store;
  }

  private loadLocal() {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('tv_feature_store');
        if (saved) this.features = JSON.parse(saved);
    }
  }

  public apply(e: TwinEvent): void {
    // 1. Update Lexicon frequency
    if (e.type === 'SIGNAL_INPUT' && e.payload.text) {
        const words = e.payload.text.toLowerCase().split(/\s+/);
        this.updateLexicon(words);
    }

    // 2. Track Module Affinity
    const surface = e.surface || 'SYSTEM';
    this.features.affinity = this.features.affinity || {};
    this.features.affinity[surface] = (this.features.affinity[surface] || 0) + 1;

    // 3. Trust Reinforcement
    if (e.type === 'ACTION_CREATED' && e.payload.source) {
        this.updateTrust(e.payload.source, 0.05);
    }

    this.saveLocal();
  }

  private updateLexicon(words: string[]) {
    this.features.lexicon = this.features.lexicon || {};
    words.forEach(word => {
        if (word.length > 3) {
            this.features.lexicon[word] = (this.features.lexicon[word] || 0) + 1;
        }
    });
  }

  private updateTrust(source: string, delta: number) {
    this.features.trustScores = this.features.trustScores || {};
    const current = this.features.trustScores[source] || 0.5;
    this.features.trustScores[source] = Math.min(1.0, Math.max(0.0, current + delta));
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tv_feature_store', JSON.stringify(this.features));
    }
  }

  public snapshot(): any {
    return { ...this.features };
  }
}
