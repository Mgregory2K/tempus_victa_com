// src/core/twin_plus/twin_plus_kernel.ts

import { TwinEventLedger } from './twin_event_ledger';
import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinRouter, RoutePlan, QueryIntent } from './router';
import { TwinShaper, ShapedOutput, OutputIntent } from './shaper';
import { TwinEvent, createEvent } from './twin_event';

export interface TwinSnapshot {
  prefs: any;
  features: any;
  recentEvents: TwinEvent[];
}

class TwinPlusKernel {
  private static _instance: TwinPlusKernel;

  public ledger!: TwinEventLedger;
  public features!: TwinFeatureStore;
  public prefs!: TwinPreferenceLedger;
  public router!: TwinRouter;
  public shaper!: TwinShaper;

  private isInitialized = false;
  private eventQueue: TwinEvent[] = [];

  private constructor() {}

  public static get instance(): TwinPlusKernel {
    if (!TwinPlusKernel._instance) {
      TwinPlusKernel._instance = new TwinPlusKernel();
    }
    return TwinPlusKernel._instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // Ordered instantiation
    this.ledger = await TwinEventLedger.open();
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);
    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    this.isInitialized = true;
    console.log("Twin+ Kernel Initialized.");

    if (this.eventQueue.length > 0) {
        this.eventQueue.forEach(e => this.observe(e));
        this.eventQueue = [];
    }

    this.observe(createEvent('ENTROPY_REDUCED', { action: 'KERNEL_INIT' }, 'SYSTEM'));
  }

  /**
   * High-Fidelity Merge: Combines remote mind state with local substrate.
   * v3.2.2 - TEMPORAL_INTEGRITY
   */
  public async hydrate(remoteLedger: any): Promise<void> {
    if (!this.isInitialized) await this.init();

    // 1. Merge the Ledger (Event History)
    if (remoteLedger.eventHistory) {
        this.ledger.merge(remoteLedger.eventHistory);
    }

    // 2. Re-process the Mind (Rebuild Features/Identity from the combined ledger)
    const allEvents = this.ledger.query({});
    // Reset identity to baseline before re-applying to ensure consistency
    // Note: In a full implementation, we might want to smart-merge the graph instead of full re-processing
    allEvents.forEach(e => this.features.apply(e));

    // 3. Merge Preferences
    if (remoteLedger.preferences) {
        Object.entries(remoteLedger.preferences).forEach(([k, v]: [string, any]) => {
            const local = this.prefs.getPreference(k);
            // Bias towards the most recent update
            if (!local || new Date(v.lastUpdated) > new Date((local as any).lastUpdated)) {
                this.prefs.setPreference(k, v.value, v);
            }
        });
    }

    console.log("Twin+ Mind Hydrated and Merged.");
  }

  public observe(e: TwinEvent): void {
    if (!this.isInitialized) {
        this.eventQueue.push(e);
        return;
    }

    this.ledger.append(e);
    this.features.apply(e);
  }

  public route(intent: QueryIntent): RoutePlan {
    if (!this.isInitialized) throw new Error("Kernel not ready.");
    const plan = this.router.route(intent);
    this.observe(createEvent('INTENT_ROUTED', { intent, plan }, intent.surface));
    return plan;
  }

  public shape(intent: OutputIntent): ShapedOutput {
    if (!this.isInitialized) {
        return { text: intent.draftText, shapingApplied: ['KERNEL_STANDBY'] };
    }
    return this.shaper.shape(intent);
  }

  public snapshot(): TwinSnapshot {
    return {
      prefs: this.prefs ? this.prefs.snapshot() : {},
      features: this.features ? this.features.snapshot() : {},
      recentEvents: this.ledger ? this.ledger.query({ limit: 50 }) : [],
    };
  }

  public ready(): boolean {
    return this.isInitialized;
  }
}

export const twinPlusKernel = TwinPlusKernel.instance;
