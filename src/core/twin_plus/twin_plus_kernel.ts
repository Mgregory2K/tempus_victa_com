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

    if (this.eventQueue.length > 0) {
        this.eventQueue.forEach(e => this.observe(e));
        this.eventQueue = [];
    }

    this.observe(createEvent('ENTROPY_REDUCED', { action: 'KERNEL_INIT' }, 'SYSTEM'));

    // Initial Signal Scan
    this.scanExternalNodes();
  }

  /**
   * SCAN_EXTERNAL_NODES v3.4 - GMAIL/SHEETS INGESTION
   * J5 polls the newly enabled APIs to surface life signals.
   */
  public async scanExternalNodes() {
      if (typeof window === 'undefined') return;
      try {
          const res = await fetch('/api/signals');
          if (res.ok) {
              const data = await res.json();
              this.observe(createEvent('EXTERNAL_SIGNALS_POLLED', data, 'EXTERNAL_NODE'));

              // If high-value signals exist, notify the Identity Mirror for potential Bridge summary
              if (data.gmail?.unreadCount > 0) {
                  console.log(`J5: Tracking ${data.gmail.unreadCount} unread signals in primary inbox.`);
              }
          }
      } catch (e) {
          console.error("Signal bay handshake failed.");
      }
  }

  public async hydrate(remoteLedger: any): Promise<void> {
    if (!this.isInitialized) await this.init();

    if (remoteLedger.eventHistory) {
        this.ledger.merge(remoteLedger.eventHistory);
    }

    const allEvents = this.ledger.query({});
    allEvents.forEach(e => this.features.apply(e));

    if (remoteLedger.preferences) {
        Object.entries(remoteLedger.preferences).forEach(([k, v]: [string, any]) => {
            const local = this.prefs.getPreference(k);
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
