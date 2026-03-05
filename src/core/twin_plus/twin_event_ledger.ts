// src/core/twin_plus/twin_event_ledger.ts

import { TwinEvent } from './twin_event';

/**
 * The TwinEventLedger is the append-only source of truth.
 * It stores what happened, not opinions. It must be rebuildable and local-only.
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
                console.log(`TwinEventLedger: Loaded ${this.events.length} events from local storage.`);
            }
        } catch (e) {
            console.error("Failed to load event ledger", e);
        }
    }
  }

  public append(e: TwinEvent): void {
    this.events.push(e);
    this.saveLocal();
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tv_event_history', JSON.stringify(this.events.slice(-1000)));
    }
  }

  public query(filters: { limit?: number }): TwinEvent[] {
    if (filters.limit) {
      return this.events.slice(-filters.limit);
    }
    return [...this.events];
  }
}
