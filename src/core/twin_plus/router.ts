// src/core/twin_plus/router.ts

import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';

/**
 * Represents the intent of a user's query.
 */
export interface QueryIntent {
  surface: string;
  queryText: string;
  taskType: 'personal_state' | 'app_howto' | 'local_search' | 'web_fact' | 'planning' | 'shopping' | 'travel' | 'events' | 'routing';
  // ... other fields from the constitution
}

/**
 * The decision object that determines how to handle a query.
 */
export interface RoutePlan {
  decisionId: string;
  strategy: 'local_only' | 'local_then_web' | 'web_then_llm' | 'local_then_llm';
  aiAllowed: boolean;
  reasonCodes: string[];
  // ... other fields from the constitution
}

/**
 * The TwinRouter decides how to handle a query based on user preferences,
 * context, and learned triggers.
 */
export class TwinRouter {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public route(intent: QueryIntent): RoutePlan {
    // This is the core routing logic based on the "Local -> Internet -> Opt-in AI" ladder.
    // The actual implementation will be a complex function of the intent,
    // user preferences (e.g., hates stale info), and feature store data.

    // For now, a simple placeholder:
    let strategy: RoutePlan['strategy'] = 'local_only';
    if (intent.taskType === 'web_fact') {
      strategy = 'local_then_web';
    }

    return {
      decisionId: `route-${Date.now()}`,
      strategy: strategy,
      aiAllowed: this.prefs.getPreference('aiOptIn') === true,
      reasonCodes: ['placeholder_logic'],
    };
  }
}
