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

  private constructor() {}

  public static get instance(): TwinPlusKernel {
    if (!TwinPlusKernel._instance) {
      TwinPlusKernel._instance = new TwinPlusKernel();
    }
    return TwinPlusKernel._instance;
  }

  public async init(): Promise<void> {
    this.ledger = await TwinEventLedger.open();
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);
    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    this.observe(createEvent('ENTROPY_REDUCED', { action: 'KERNEL_INIT' }, 'SYSTEM'));
    console.log("Twin+ Kernel Initialized.");
  }

  public observe(e: TwinEvent): void {
    this.ledger.append(e);
    this.features.apply(e);

    // In a real build, this would persist to IndexedDB here
    if (typeof window !== 'undefined') {
        const history = JSON.parse(localStorage.getItem('tv_event_history') || '[]');
        history.push(e);
        localStorage.setItem('tv_event_history', JSON.stringify(history.slice(-1000)));
    }
  }

  public route(intent: QueryIntent): RoutePlan {
    const plan = this.router.route(intent);
    this.observe(createEvent('INTENT_ROUTED', { intent, plan }, intent.surface));
    return plan;
  }

  public shape(intent: OutputIntent): ShapedOutput {
    const out = this.shaper.shape(intent);
    return out;
  }

  public snapshot(): TwinSnapshot {
    return {
      prefs: this.prefs.snapshot(),
      features: this.features.snapshot(),
      recentEvents: this.ledger.query({ limit: 50 }),
    };
  }
}

export const twinPlusKernel = TwinPlusKernel.instance;
