// src/core/twin_plus/router.ts

import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';

export type TaskType =
  | 'LOCAL_KNOWLEDGE'
  | 'ACTION_CMD'
  | 'WEB_SEARCH'
  | 'NEURAL_SYNTHESIS'
  | 'PROTOCOL_SIM';

export interface QueryIntent {
  surface: string;
  queryText: string;
  taskType: TaskType;
}

export interface RoutePlan {
  decisionId: string;
  strategy: 'LOCAL' | 'INTERNET' | 'AI' | 'HYBRID';
  aiAllowed: boolean;
  reasonCodes: string[];
}

export class TwinRouter {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public route(intent: QueryIntent): RoutePlan {
    const text = intent.queryText.toLowerCase();
    const aiOptIn = typeof window !== 'undefined' ? !!localStorage.getItem('tv_api_key') : false;
    const hasInternet = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let strategy: RoutePlan['strategy'] = 'LOCAL';
    const reasons: string[] = ['DOCTRINE_INITIAL_CHECK'];

    // 1. HARDCORE LOCAL-FIRST DOCTRINE
    // If we're offline or the user didn't opt-in, we MUST stay local.
    if (!hasInternet) {
        strategy = 'LOCAL';
        reasons.push('OFFLINE_MODE_ENFORCED');
        return this.finalize(strategy, aiOptIn, reasons);
    }

    // 2. Check for Local Action Commands (No Internet/AI needed)
    if (text.includes("remind") || text.includes("todo") || text.includes("grocery") || text.includes("buy") || text.includes("cork it")) {
        strategy = 'LOCAL';
        reasons.push('ACTION_COMMAND_DETECTED');
    }
    // 3. Check for Internal App Knowledge (Blunt Local)
    else if (text.includes("how do i") || text.includes("what is") || text.includes("status")) {
        strategy = 'LOCAL';
        reasons.push('INTERNAL_DOC_QUERY');
    }
    // 4. Escalate to Internet only if local fails or facts are required
    else if (text.includes("who is") || text.includes("where is") || text.includes("current") || text.includes("news")) {
        strategy = 'INTERNET';
        reasons.push('EXTERNAL_FACT_REQ');
    }
    // 5. AI Synthesis if complex and opted-in
    else if (aiOptIn && (text.length > 50 || text.includes("think") || text.includes("plan"))) {
        strategy = 'AI';
        reasons.push('COMPLEX_SYNTHESIS_REQ');
    }

    return this.finalize(strategy, aiOptIn, reasons);
  }

  private finalize(strategy: RoutePlan['strategy'], aiAllowed: boolean, reasons: string[]): RoutePlan {
      return {
          decisionId: `route-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          strategy,
          aiAllowed,
          reasonCodes: reasons
      };
  }
}
