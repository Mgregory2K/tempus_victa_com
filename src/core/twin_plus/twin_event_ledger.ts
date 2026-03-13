// src/core/twin_plus/twin_event_ledger.ts

import { TwinEvent } from './twin_event';

/**
 * The TwinEventLedger is the append-only source of truth.
 * v3.4.0 - IDENTITY_ANCHORED (Enforces twin_id matching)
 */
export class TwinEventLedger {
  private events: TwinEvent[] = [];
  private currentTwinId: string | null = null;

  public static async open(twinId?: string): Promise<TwinEventLedger> {
    const ledger = new TwinEventLedger();
    if (twinId) ledger.currentTwinId = twinId;
    ledger.loadLocal();
    return ledger;
  }

  public setTwinId(id: string) {
    this.currentTwinId = id;
  }

  private loadLocal() {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('tv_event_history');
            if (saved) {
                const allEvents: TwinEvent[] = JSON.parse(saved);
                // Filter by twin_id if anchored
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
    // RULE: If twin_id does not match -> memory is rejected.
    if (this.currentTwinId && e.twin_id !== 'PENDING' && e.twin_id !== this.currentTwinId) {
        console.warn(`REJECTED: Identity mismatch. Event ${e.id} belongs to ${e.twin_id}, but current anchor is ${this.currentTwinId}`);
        return;
    }

    // Auto-stamp if pending
    if (e.twin_id === 'PENDING' && this.currentTwinId) {
        e.twin_id = this.currentTwinId;
    }

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
   * v3.4.0: IDENTITY DRIFT PREVENTION
   */
  public merge(externalEvents: TwinEvent[]): void {
    if (!Array.isArray(externalEvents)) return;

    const localMap = new Map(this.events.map(e => [e.id, e]));

    externalEvents.forEach(e => {
        if (!e || !e.id) return;

        // Identity Drift Protection
        if (this.currentTwinId && e.twin_id !== this.currentTwinId) {
            return; // Skip foreign identity data
        }

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
        // We save everything to localStorage, but filtering happens on load
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
