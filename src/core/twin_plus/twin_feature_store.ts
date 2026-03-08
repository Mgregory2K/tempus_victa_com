// src/core/twin_plus/twin_feature_store.ts
import { TwinEvent } from './twin_event';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinIdentity, INITIAL_IDENTITY, CognitiveProfile } from './identity_model';

/**
 * TWIN+ FEATURE STORE v3.5.9 - USAGE & LEARNING
 */

export interface UsageMetrics {
    local: number;
    scout: number;
    neural: number;
    estimatedCost: number;
}

export class TwinFeatureStore {
  private prefs: TwinPreferenceLedger;

  public identity: TwinIdentity = INITIAL_IDENTITY;
  public usage: UsageMetrics = { local: 0, scout: 0, neural: 0, estimatedCost: 0 };

  // Memory Layers
  public episodicMemory: any[] = [];
  public semanticMemory: Record<string, any> = {};
  public activityRhythm: number[] = new Array(24).fill(0);
  public trustScores: Record<string, number> = {};

  private constructor(prefs: TwinPreferenceLedger) {
    this.prefs = prefs;
  }

  public static async open(prefs: TwinPreferenceLedger): Promise<TwinFeatureStore> {
    const store = new TwinFeatureStore(prefs);
    await store.loadSovereignLedger();
    return store;
  }

  private async loadSovereignLedger() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem("tv_identity_graph");
    const savedUsage = localStorage.getItem("tv_usage_metrics");

    if (saved) {
        try { this.identity = JSON.parse(saved); } catch (e) {}
    }
    if (savedUsage) {
        try { this.usage = JSON.parse(savedUsage); } catch (e) {}
    }
  }

  private saveSovereignLedger() {
    if (typeof window !== 'undefined') {
        this.identity.lastUpdated = new Date().toISOString();
        localStorage.setItem("tv_identity_graph", JSON.stringify(this.identity));
        localStorage.setItem("tv_usage_metrics", JSON.stringify(this.usage));
    }
  }

  public apply(e: TwinEvent): void {
    // 1. Telemetry
    this.episodicMemory.push({ ts: e.ts, type: e.type, surface: e.surface });
    if (this.episodicMemory.length > 100) this.episodicMemory.shift();

    // 2. Rhythm
    const hour = new Date(e.ts).getHours();
    this.activityRhythm[hour]++;

    // 3. Usage Tracking
    if (e.type === 'INTENT_ROUTED' && e.payload.plan) {
        const strategy = e.payload.plan.strategy;
        if (strategy === 'LOCAL') this.usage.local++;
        if (strategy === 'INTERNET') this.usage.scout++;
        if (strategy === 'AI') {
            this.usage.neural++;
            this.usage.estimatedCost += 0.01; // Rough heuristic for GPT-4o
        }
    }

    // 4. Lexicon Extraction
    if (e.payload?.content && typeof e.payload.content === 'string') {
        const words = e.payload.content.toLowerCase().split(/\s+/);
        words.forEach((w: string) => {
            if (w.length > 3) {
                this.identity.lexicon[w] = (this.identity.lexicon[w] || 0) + 1;
            }
        });
    }

    // 5. Reinforcement
    if (e.type === 'INTENT_ROUTED' && e.payload.feedback) {
        this.reinforceIdentity(e.payload.feedback);
    }

    this.saveSovereignLedger();
  }

  private reinforceIdentity(feedbackType: string) {
    const p = this.identity.userProfile;
    const step = 0.05;
    switch (feedbackType) {
        case 'UP':
            p.directness = Math.min(1, p.directness + 0.02);
            break;
        case 'DOWN':
            p.directness = Math.max(0, p.directness - step);
            p.verbosity = Math.min(1, p.verbosity + step);
            break;
    }
  }

  public snapshot() {
    return {
      identity: this.identity,
      usage: this.usage,
      rhythm: this.activityRhythm,
      memoryDepth: this.episodicMemory.length
    };
  }
}
