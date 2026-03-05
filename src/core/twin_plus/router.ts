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
    const aiOptIn = typeof window !== 'undefined' ? localStorage.getItem('tv_api_key') : null;

    let strategy: RoutePlan['strategy'] = 'LOCAL';
    const reasons: string[] = ['DOCTRINE_INITIAL_CHECK'];

    // 1. Check for Local Action Commands
    if (text.includes("remind") || text.includes("todo") || text.includes("grocery") || text.includes("buy")) {
        strategy = 'LOCAL';
        reasons.push('ACTION_COMMAND_DETECTED');
    }
    // 2. Check for App Help
    else if (text.includes("how do i") || text.includes("what is")) {
        strategy = 'LOCAL';
        reasons.push('INTERNAL_DOC_QUERY');
    }
    // 3. Escalate to Internet for facts
    else if (text.includes("who is") || text.includes("where is") || text.includes("current")) {
        strategy = 'INTERNET';
        reasons.push('EXTERNAL_FACT_REQ');
    }
    // 4. AI Synthesis if needed and opted-in
    else if (aiOptIn) {
        strategy = 'AI';
        reasons.push('NEURAL_SYNTHESIS_OPT_IN');
    }

    return {
      decisionId: `route-${Date.now()}`,
      strategy,
      aiAllowed: !!aiOptIn,
      reasonCodes: reasons,
    };
  }
}
