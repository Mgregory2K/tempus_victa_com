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

    // Ordered instantiation to prevent race conditions
    this.ledger = await TwinEventLedger.open();
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);
    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    this.isInitialized = true;
    console.log("Twin+ Kernel Initialized.");

    // Drain queued events into the ledger
    if (this.eventQueue.length > 0) {
        this.eventQueue.forEach(e => this.observe(e));
        this.eventQueue = [];
    }

    this.observe(createEvent('ENTROPY_REDUCED', { action: 'KERNEL_INIT' }, 'SYSTEM'));
  }

  public observe(e: TwinEvent): void {
    if (!this.isInitialized) {
        this.eventQueue.push(e);
        return;
    }

    // Single source of truth for persistence: The Ledger handles the save
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
