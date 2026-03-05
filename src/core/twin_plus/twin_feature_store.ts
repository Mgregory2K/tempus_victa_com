// src/core/twin_plus/twin_feature_store.ts

import { TwinEvent } from './twin_event';
import { TwinPreferenceLedger } from './twin_preference_ledger';

/**
 * The TwinFeatureStore maintains derived user features.
 */
export class TwinFeatureStore {
  private features: Record<string, any> = {};

  constructor(private prefs: TwinPreferenceLedger) {}

  public static async open(prefs: TwinPreferenceLedger): Promise<TwinFeatureStore> {
    const store = new TwinFeatureStore(prefs);
    store.loadLocal();
    return store;
  }

  private loadLocal() {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('tv_feature_store');
            if (saved) this.features = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load feature store", e);
        }
    }
  }

  public apply(e: TwinEvent): void {
    // 1. Lexicon & Intent Bias
    if (e.type === 'SIGNAL_INPUT' && e.payload.text) {
        this.updateLexicon(e.payload.text);
    }

    // 2. Track Module Affinity
    const surface = e.surface || 'SYSTEM';
    this.features.affinity = this.features.affinity || {};
    this.features.affinity[surface] = (this.features.affinity[surface] || 0) + 1;

    // 3. Trust Reinforcement (Volume IV)
    if (e.type === 'ACTION_CREATED') {
        this.updateTrust(e.payload.source || 'SYSTEM', 0.05);
    }

    // 4. Bullshit Avoided (Volume I, Ch 6)
    if (e.type === 'SIGNAL_DECAYED' || (e.type === 'SIGNAL_INPUT' && e.payload.trustScore < 0.2)) {
        this.features.bullshit_avoided = (this.features.bullshit_avoided || 0) + 1;
    }

    this.saveLocal();
  }

  private updateLexicon(text: string) {
    this.features.lexicon = this.features.lexicon || {};
    this.features.intentBias = this.features.intentBias || { action: 0, info: 0, quote: 0 };

    const words = text.toLowerCase().split(/\s+/);

    // Intent Bias Detection
    if (text.toLowerCase().includes('task:') || text.toLowerCase().includes('todo')) this.features.intentBias.action++;
    if (text.toLowerCase().includes('crystallize:') || text.toLowerCase().includes('quote')) this.features.intentBias.quote++;
    if (text.toLowerCase().includes('who') || text.toLowerCase().includes('what')) this.features.intentBias.info++;

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
