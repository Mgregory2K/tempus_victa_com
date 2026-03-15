// src/core/twin_plus/twin_event_ledger.ts

import { TwinEvent } from './twin_event';

// Dynamic module holders to satisfy Next.js/Turbopack build-time checks
let Capacitor: any = null;
let TwinNative: any = null;

async function loadNativeModules() {
  if (typeof window !== 'undefined') {
    try {
      // Use string-based dynamic import to hide from static analysis
      const capModuleName = '@capacitor/core';
      const capModule: any = await import(capModuleName);
      Capacitor = capModule.Capacitor;

      if (Capacitor?.isNativePlatform()) {
        const bridgeModuleName = '../native/TwinNativeBridge';
        const nativeModule: any = await import(bridgeModuleName);
        TwinNative = nativeModule.default;
      }
    } catch (e) {
      // Non-native environment
    }
  }
}

/**
 * The TwinEventLedger is the append-only source of truth.
 * v4.0.3 - Opaque build-safe dynamic resolution
 */
export class TwinEventLedger {
  private events: TwinEvent[] = [];
  private currentTwinId: string | null = null;
  private isNative = false;

  public static async open(twinId?: string): Promise<TwinEventLedger> {
    await loadNativeModules();
    const ledger = new TwinEventLedger();
    ledger.isNative = Capacitor?.isNativePlatform() || false;
    if (twinId) ledger.currentTwinId = twinId;
    await ledger.loadLocal();
    return ledger;
  }

  public setTwinId(id: string) {
    this.currentTwinId = id;
  }

  private async loadLocal() {
    if (this.isNative && TwinNative) {
        try {
            const pack = await TwinNative.loadMemoryPack();
            const bundle = JSON.parse(pack.bundleJson);
            if (bundle.events) {
                this.events = bundle.events;
                console.log("Twin+ Hydrated from Native Memory Pack.");
                return;
            }
        } catch (e) {
            console.warn("Native memory pack load failed, falling back to localStorage", e);
        }
    }

    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('tv_event_history');
            if (saved) {
                const allEvents: TwinEvent[] = JSON.parse(saved);
                this.events = this.currentTwinId
                    ? allEvents.filter(e => e.twin_id === this.currentTwinId)
                    : allEvents;
            }
        } catch (e) {
            console.error("Failed to load event ledger", e);
        }
    }
  }

  public append(e: TwinEvent): void {
    if (this.currentTwinId && e.twin_id !== 'PENDING' && e.twin_id !== this.currentTwinId) {
        return;
    }

    if (e.twin_id === 'PENDING' && this.currentTwinId) {
        e.twin_id = this.currentTwinId;
    }

    const event = { ...e, payload: e.payload || {} };
    const existing = this.events.find(x => x.id === event.id);

    if (!existing) {
        this.events.push({ ...event, payload: { ...event.payload, reinforcement: 1 } });
    } else {
        existing.payload = existing.payload || {};
        existing.payload.reinforcement = (existing.payload.reinforcement || 1) + 1;
    }

    this.saveLocal();

    // If native, also enqueue a sync journal entry
    if (this.isNative && TwinNative) {
        TwinNative.enqueueCapture({
            type: 'text',
            content: JSON.stringify(event),
            metadata: JSON.stringify({ action: 'APPEND_EVENT', objectId: event.id })
        });
    }
  }

  public merge(externalEvents: TwinEvent[]): void {
    if (!Array.isArray(externalEvents)) return;

    const localMap = new Map(this.events.map(e => [e.id, e]));

    externalEvents.forEach(e => {
        if (!e || !e.id) return;
        if (this.currentTwinId && e.twin_id !== this.currentTwinId) return;

        const incoming = { ...e, payload: e.payload || {} };
        const local = localMap.get(incoming.id);

        if (local) {
            local.payload = local.payload || {};
            local.payload.reinforcement = (local.payload.reinforcement || 1) + (incoming.payload?.reinforcement || 1);
        } else {
            this.events.push({
                ...incoming,
                payload: { ...incoming.payload, reinforcement: incoming.payload?.reinforcement || 1 }
            });
        }
    });

    this.events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    if (this.events.length > 2000) this.events = this.events.slice(-2000);

    this.saveLocal();
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tv_event_history', JSON.stringify(this.events));
    }

    // Periodically update the native memory pack for instant cold-starts
    if (this.isNative && TwinNative) {
        TwinNative.saveMemoryPack({
            bundleJson: JSON.stringify({
                events: this.events.slice(-100), // Recent context
                updatedAt: new Date().toISOString()
            })
        });
    }
  }

  public query(filters: { limit?: number }): TwinEvent[] {
    if (filters.limit) {
      return this.events.slice(-filters.limit);
    }
    return [...this.events];
  }
}
