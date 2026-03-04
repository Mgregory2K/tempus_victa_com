// src/core/twin_plus/twin_event_ledger.ts

import { TwinEvent } from './twin_event';

/**
 * The TwinEventLedger is the append-only source of truth.
 * It stores what happened, not opinions. It must be rebuildable and local-only.
 */
export class TwinEventLedger {
  private events: TwinEvent[] = [];

  /**
   * In a real web implementation, this would connect to IndexedDB or local storage.
   */
  public static async open(): Promise<TwinEventLedger> {
    console.log("TwinEventLedger opened.");
    return new TwinEventLedger();
  }

  public append(e: TwinEvent): void {
    this.events.push(e);
  }

  public query(filters: { limit?: number }): TwinEvent[] {
    if (filters.limit) {
      return this.events.slice(-filters.limit);
    }
    return [...this.events];
  }
}
