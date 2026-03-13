// src/core/twin_plus/twin_plus_kernel.ts

import { TwinEventLedger } from './twin_event_ledger';
import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinRouter, RoutePlan, QueryIntent } from './router';
import { TwinShaper, ShapedOutput, OutputIntent } from './shaper';
import { TwinEvent, createEvent } from './twin_event';
import { TwinManifest } from './identity_model';

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
  private manifest: TwinManifest | null = null;

  private constructor() {}

  public static get instance(): TwinPlusKernel {
    if (!TwinPlusKernel._instance) {
      TwinPlusKernel._instance = new TwinPlusKernel();
    }
    return TwinPlusKernel._instance;
  }

  public async init(existingManifest?: TwinManifest): Promise<void> {
    if (this.isInitialized) return;

    this.manifest = existingManifest || null;
    const twinId = this.manifest?.twin_id;

    this.ledger = await TwinEventLedger.open(twinId);
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);

    if (this.manifest) {
        this.features.setManifest(this.manifest);
    }

    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    this.isInitialized = true;
    console.log(`Twin+ Kernel Initialized. Identity: ${twinId || 'UNANCHORED'}`);

    if (this.eventQueue.length > 0) {
        this.eventQueue.forEach(e => this.observe(e));
        this.eventQueue = [];
    }

    this.observe(this.createKernelEvent('ENTROPY_REDUCED', { action: 'KERNEL_INIT' }));

    // Initial Signal Scan
    this.scanExternalNodes();
  }

  private createKernelEvent(type: any, payload: any): TwinEvent {
      return createEvent(type, payload, 'SYSTEM', this.manifest?.twin_id || 'PENDING');
  }

  public async scanExternalNodes() {
      if (typeof window === 'undefined') return;
      try {
          const res = await fetch('/api/signals');
          if (res.ok) {
              const data = await res.json();
              this.observe(this.createKernelEvent('EXTERNAL_SIGNALS_POLLED', data));

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

    // Enforce twin_id consistency
    if (this.manifest && e.twin_id === 'PENDING') {
        e.twin_id = this.manifest.twin_id;
    }

    this.ledger.append(e);
    this.features.apply(e);
  }

  public route(intent: QueryIntent): RoutePlan {
    if (!this.isInitialized) throw new Error("Kernel not ready.");
    const plan = this.router.route(intent);
    this.observe(this.createKernelEvent('INTENT_ROUTED', { intent, plan }));
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
