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

    this.ledger = await TwinEventLedger.open();
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);
    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    this.isInitialized = true;
    console.log("Twin+ Kernel Initialized.");

    // Drain any events that occurred during the init window
    if (this.eventQueue.length > 0) {
        console.log(`Draining ${this.eventQueue.length} queued events.`);
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

    this.ledger.append(e);
    this.features.apply(e);

    if (typeof window !== 'undefined') {
        const history = JSON.parse(localStorage.getItem('tv_event_history') || '[]');
        history.push(e);
        localStorage.setItem('tv_event_history', JSON.stringify(history.slice(-1000)));
    }
  }

  public route(intent: QueryIntent): RoutePlan {
    if (!this.isInitialized) throw new Error("Kernel not ready for routing.");
    const plan = this.router.route(intent);
    this.observe(createEvent('INTENT_ROUTED', { intent, plan }, intent.surface));
    return plan;
  }

  public shape(intent: OutputIntent): ShapedOutput {
    if (!this.isInitialized) {
        return { text: intent.draftText, shapingApplied: ['KERNEL_NOT_READY'] };
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
