// src/core/twin_plus/twin_feature_store.ts
import { TwinEvent } from './twin_event';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinIdentity, INITIAL_IDENTITY } from './identity_model';

/**
 * TWIN+ FEATURE STORE v2.0
 * The processing organ of the OS. Ingests events to refine the User Identity Graph.
 */

export class TwinFeatureStore {
  private prefs: TwinPreferenceLedger;

  // The Identity Graph (The Mind)
  public identity: TwinIdentity = INITIAL_IDENTITY;

  // Memory Layers
  public episodicMemory: any[] = []; // Event-based memories
  public semanticMemory: Record<string, any> = {}; // Stable facts
  public activityRhythm: number[] = new Array(24).fill(0);
  public trustScores: Record<string, number> = {};

  private constructor(prefs: TwinPreferenceLedger) {
    this.prefs = prefs;
  }

  public static async open(prefs: TwinPreferenceLedger): Promise<TwinFeatureStore> {
    const store = new TwinFeatureStore(prefs);
    await store.loadSovereignLedger();
    await store.loadSeedData();
    return store;
  }

  private async loadSeedData() {
    this.trustScores = {
        "congress.gov": 0.95,
        "govinfo.gov": 0.95,
        "supremecourt.gov": 0.95,
        "sec.gov": 0.96,
        "cdc.gov": 0.97,
        "nist.gov": 0.98,
        "openai.com": 0.88,
        "stackoverflow.com": 0.45
    };
  }

  private async loadSovereignLedger() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem("tv_identity_graph");
    if (saved) {
        try {
            this.identity = JSON.parse(saved);
        } catch (e) {
            console.error("Identity corrupted. Reverting to Baseline.");
        }
    }
  }

  public apply(e: TwinEvent): void {
    // 1. Log to Episodic Memory
    this.episodicMemory.push({ ts: e.ts, type: e.type, surface: e.surface });
    if (this.episodicMemory.length > 100) this.episodicMemory.shift();

    // 2. Behavioral Learning (Rhythm)
    const hour = new Date(e.ts).getHours();
    this.activityRhythm[hour]++;

    // 3. Lexicon Extraction (Learning Michael's Language)
    if (e.payload?.text) {
        const words = e.payload.text.toLowerCase().split(/\s+/);
        words.forEach((w: string) => {
            if (w.length > 3) {
                this.identity.lexicon[w] = (this.identity.lexicon[w] || 0) + 1;
            }
        });
    }

    // 4. Persistence
    if (typeof window !== 'undefined') {
        localStorage.setItem("tv_identity_graph", JSON.stringify(this.identity));
    }
  }

  public snapshot() {
    return {
      identity: this.identity,
      rhythm: this.activityRhythm,
      memoryDepth: this.episodicMemory.length,
      trust: this.trustScores
    };
  }
}
