// src/core/twin_plus/twin_event_ledger.ts

import { TwinEvent } from './twin_event';

/**
 * The TwinEventLedger is the append-only source of truth.
 * v3.2.3 - REINFORCEMENT_CAPABLE
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
    const existing = this.events.find(x => x.id === e.id);
    if (!existing) {
        // Initialize reinforcement at 1 for new events
        this.events.push({ ...e, payload: { ...e.payload, reinforcement: 1 } });
    } else {
        // Local reinforcement: increment if the same event ID is somehow re-processed locally
        existing.payload.reinforcement = (existing.payload.reinforcement || 1) + 1;
    }
    this.saveLocal();
  }

  /**
   * Merges external events.
   * v3.2.3: DUPLICATES = REINFORCEMENT.
   * This is the "J5 Protocol": more input of the same kind strengthens the pattern.
   */
  public merge(externalEvents: TwinEvent[]): void {
    const localMap = new Map(this.events.map(e => [e.id, e]));

    externalEvents.forEach(e => {
        const local = localMap.get(e.id);
        if (local) {
            // REINFORCEMENT DOCTRINE: Duplicates = confirmation.
            // Accumulate reinforcement counts from both sources.
            local.payload.reinforcement = (local.payload.reinforcement || 1) + (e.payload?.reinforcement || 1);
        } else {
            // New event from another surface.
            this.events.push({ ...e, payload: { ...e.payload, reinforcement: e.payload?.reinforcement || 1 } });
        }
    });

    // Re-align timeline
    this.events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    // Safety cap for local substrate memory
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
