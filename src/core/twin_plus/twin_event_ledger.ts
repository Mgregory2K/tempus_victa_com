// src/core/twin_plus/twin_event_ledger.ts

import { TwinEvent } from './twin_event';

/**
 * The TwinEventLedger is the append-only source of truth.
 * v3.3.3 - RESILIENT_MERGE (Heals missing payloads)
 */
export class TwinEventLedger {
  private events: TwinEvent[] = [];

  public static async open(): Promise<TwinEventLedger> {
    const ledger = new TwinEventLedger();
    ledger.loadLocal();
    return ledger;
  }

  private loadLocal() {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('tv_event_history');
            if (saved) {
                this.events = JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load event ledger", e);
        }
    }
  }

  public append(e: TwinEvent): void {
    // Neural Healing: Ensure payload exists
    const event = { ...e, payload: e.payload || {} };
    const existing = this.events.find(x => x.id === event.id);

    if (!existing) {
        this.events.push({ ...event, payload: { ...event.payload, reinforcement: 1 } });
    } else {
        existing.payload = existing.payload || {};
        existing.payload.reinforcement = (existing.payload.reinforcement || 1) + 1;
    }
    this.saveLocal();
  }

  /**
   * Merges external events with Fault-Tolerance.
   * v3.3.3: HEALS GHOST EVENTS (Missing payloads)
   */
  public merge(externalEvents: TwinEvent[]): void {
    if (!Array.isArray(externalEvents)) return;

    const localMap = new Map(this.events.map(e => [e.id, e]));

    externalEvents.forEach(e => {
        if (!e || !e.id) return;

        // Neural Healing: Pre-emptive payload stabilization
        const incoming = { ...e, payload: e.payload || {} };
        const local = localMap.get(incoming.id);

        if (local) {
            // Ensure local also has a payload to prevent undefined errors
            local.payload = local.payload || {};
            local.payload.reinforcement = (local.payload.reinforcement || 1) + (incoming.payload?.reinforcement || 1);
        } else {
            // New event from another surface.
            this.events.push({
                ...incoming,
                payload: { ...incoming.payload, reinforcement: incoming.payload?.reinforcement || 1 }
            });
        }
    });

    // Re-align timeline
    this.events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    // Safety cap
    if (this.events.length > 2000) {
        this.events = this.events.slice(-2000);
    }

    this.saveLocal();
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tv_event_history', JSON.stringify(this.events));
    }
  }

  public query(filters: { limit?: number }): TwinEvent[] {
    if (filters.limit) {
      return this.events.slice(-filters.limit);
    }
    return [...this.events];
  }
}
