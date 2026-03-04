// src/core/twin_plus/twin_plus_kernel.ts

import { TwinEventLedger } from './twin_event_ledger';
import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinRouter, RoutePlan, QueryIntent } from './router';
import { TwinShaper, ShapedOutput, OutputIntent } from './shaper';
import { TwinEvent } from './twin_event';

// Placeholder for the snapshot type
export interface TwinSnapshot {
  prefs: any;
  features: any;
  recentEvents: TwinEvent[];
}

/**
 * The TwinPlusKernel is the central spine of the Twin+ system.
 * It owns the state, consumes events, and produces shaping and routing decisions.
 */
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
    // In a web environment, these would likely initialize from local storage (e.g., IndexedDB)
    this.ledger = await TwinEventLedger.open();
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);
    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    // this.observe(TwinEvent.appStarted());
    console.log("Twin+ Kernel Initialized.");
  }

  public observe(e: TwinEvent): void {
    this.ledger.append(e);
    this.features.apply(e);
  }

  public route(intent: QueryIntent): RoutePlan {
    const plan = this.router.route(intent);
    // this.observe(TwinEvent.routeChosen(plan, intent));
    return plan;
  }

  public shape(intent: OutputIntent): ShapedOutput {
    const out = this.shaper.shape(intent);
    // this.observe(TwinEvent.outputShaped(out, intent));
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
