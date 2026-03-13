// src/core/twin_plus/twin_feature_store.ts
import { TwinEvent } from './twin_event';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinIdentity, INITIAL_IDENTITY_PROFILE, CognitiveProfile, TwinManifest } from './identity_model';
import { BehavioralPattern } from './sovereign/types';

/**
 * TWIN+ FEATURE STORE v3.4.0 - COGNITIVE OS
 */

export interface UsageMetrics {
    local: number;
    scout: number;
    neural: number;
    estimatedCost: number;
}

export class TwinFeatureStore {
  private prefs: TwinPreferenceLedger;

  public manifest: TwinManifest | null = null;
  public userProfile: CognitiveProfile = INITIAL_IDENTITY_PROFILE;
  public behavioralPatterns: BehavioralPattern[] = [];
  public lexicon: Record<string, number> = {};
  public doctrines: string[] = [
    "Local > Internet > AI",
    "Efficiency > Accuracy",
    "Magician, not Programmer"
  ];

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

  public setManifest(manifest: TwinManifest) {
    this.manifest = manifest;
    this.saveSovereignLedger();
  }

  private async loadSovereignLedger() {
    if (typeof window === 'undefined') return;
    const savedManifest = localStorage.getItem("tv_twin_manifest");
    const savedProfile = localStorage.getItem("tv_user_profile");
    const savedPatterns = localStorage.getItem("tv_behavioral_patterns");
    const savedLexicon = localStorage.getItem("tv_lexicon");
    const savedUsage = localStorage.getItem("tv_usage_metrics");

    if (savedManifest) {
        try { this.manifest = JSON.parse(savedManifest); } catch (e) {}
    }
    if (savedProfile) {
        try { this.userProfile = JSON.parse(savedProfile); } catch (e) {}
    }
    if (savedPatterns) {
        try { this.behavioralPatterns = JSON.parse(savedPatterns); } catch (e) {}
    }
    if (savedLexicon) {
        try { this.lexicon = JSON.parse(savedLexicon); } catch (e) {}
    }
    if (savedUsage) {
        try { this.usage = JSON.parse(savedUsage); } catch (e) {}
    }
  }

  private saveSovereignLedger() {
    if (typeof window !== 'undefined') {
        if (this.manifest) localStorage.setItem("tv_twin_manifest", JSON.stringify(this.manifest));
        localStorage.setItem("tv_user_profile", JSON.stringify(this.userProfile));
        localStorage.setItem("tv_behavioral_patterns", JSON.stringify(this.behavioralPatterns));
        localStorage.setItem("tv_lexicon", JSON.stringify(this.lexicon));
        localStorage.setItem("tv_usage_metrics", JSON.stringify(this.usage));
    }
  }

  public apply(e: TwinEvent): void {
    // Identity Anchor Verification
    if (this.manifest && e.twin_id !== 'PENDING' && e.twin_id !== this.manifest.twin_id) {
        return; // Ignore events not belonging to this identity
    }

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
            this.usage.estimatedCost += 0.01; // Rough heuristic
        }
    }

    // 4. Lexicon Extraction
    if (e.payload?.content && typeof e.payload.content === 'string') {
        const words = e.payload.content.toLowerCase().split(/\s+/);
        words.forEach((w: string) => {
            if (w.length > 3) {
                this.lexicon[w] = (this.lexicon[w] || 0) + 1;
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
    const p = this.userProfile;
    const step = 0.02;
    switch (feedbackType) {
        case 'UP':
            p.directness = Math.min(1, p.directness + step);
            break;
        case 'DOWN':
            p.directness = Math.max(0, p.directness - step);
            p.verbosity = Math.min(1, p.verbosity + step);
            break;
    }
  }

  public snapshot() {
    return {
      manifest: this.manifest,
      profile: this.userProfile,
      patterns: this.behavioralPatterns,
      usage: this.usage,
      rhythm: this.activityRhythm,
      memoryDepth: this.episodicMemory.length
    };
  }
}
