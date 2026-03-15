// src/core/twin_plus/twin_plus_kernel.ts

import { TwinEventLedger } from './twin_event_ledger';
import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';
import { TwinRouter, RoutePlan, QueryIntent } from './router';
import { TwinShaper, ShapedOutput, OutputIntent } from './shaper';
import { TwinEvent, createEvent } from './twin_event';
import { TwinManifest } from './identity_model';

// We use an opaque bridge to avoid build-time Capacitor dependencies
import TwinNative from '../native/TwinNativeBridge';

// Dynamic module holder for Capacitor to satisfy Next.js/Turbopack build checks
let Capacitor: any = null;

async function loadCapacitor() {
  if (typeof window !== 'undefined') {
    try {
      const moduleName = '@capacitor/core';
      const cap: any = await import(moduleName);
      Capacitor = cap.Capacitor;
    } catch (e) {
      // Non-native
    }
  }
}

export interface TwinSnapshot {
  prefs: any;
  features: any;
  recentEvents: TwinEvent[];
  syncStatus?: any;
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
  private deviceId: string = 'web_client';
  private isNative = false;

  private constructor() {}

  public static get instance(): TwinPlusKernel {
    if (!TwinPlusKernel._instance) {
      TwinPlusKernel._instance = new TwinPlusKernel();
    }
    return TwinPlusKernel._instance;
  }

  public async init(existingManifest?: TwinManifest): Promise<void> {
    if (this.isInitialized) return;

    await loadCapacitor();

    this.manifest = existingManifest || null;
    const twinId = this.manifest?.twin_id;

    // NATIVE AUTHORITY HYDRATION
    try {
        const state = await TwinNative.getInitialState();
        this.isNative = state.deviceId !== 'web';

        if (this.isNative) {
            console.log("J5: Initializing Native Authority Bridge...");
            this.deviceId = state.deviceId;

            if (state.memoryPack && state.memoryPack !== '{}') {
                const bundle = JSON.parse(state.memoryPack);
                // Pre-seed ledger with native memory pack
                this.ledger = await TwinEventLedger.open(twinId);
                if (bundle.events) this.ledger.merge(bundle.events);
            }
        }
    } catch (e) {
        this.isNative = false;
    }

    if (!this.ledger) this.ledger = await TwinEventLedger.open(twinId);
    this.prefs = await TwinPreferenceLedger.open();
    this.features = await TwinFeatureStore.open(this.prefs);

    if (this.manifest) {
        this.features.setManifest(this.manifest);
    }

    this.router = new TwinRouter(this.prefs, this.features);
    this.shaper = new TwinShaper(this.prefs, this.features);

    this.isInitialized = true;
    console.log(`Twin+ Kernel Ready. Device: ${this.deviceId} Identity: ${twinId || 'UNANCHORED'}`);

    if (this.eventQueue.length > 0) {
        this.eventQueue.forEach(e => this.observe(e));
        this.eventQueue = [];
    }

    this.observe(this.createKernelEvent('ENTROPY_REDUCED', { action: 'KERNEL_INIT', device: this.deviceId }));

    if (this.isNative) {
        TwinNative.triggerSync({ expedited: false });
    } else {
        this.scanExternalNodes();
    }
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
          }
      } catch (e) {
          // Silent fail
      }
  }

  public observe(e: TwinEvent): void {
    if (!this.isInitialized) {
        this.eventQueue.push(e);
        return;
    }

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
