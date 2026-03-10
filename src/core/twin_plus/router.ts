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

/**
 * TWIN_ROUTER v4.2 - SEMANTIC INTENT EDITION
 * No more 90s keyword matching. We analyze the "Shape" and "Domain" of the request.
 */
export class TwinRouter {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public route(intent: QueryIntent): RoutePlan {
    const text = intent.queryText.toLowerCase().trim();
    const aiOptIn = typeof window !== 'undefined' ? !!localStorage.getItem('tv_api_key') : false;
    const hasInternet = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let strategy: RoutePlan['strategy'] = 'LOCAL';
    const reasons: string[] = ['SEMANTIC_INTENT_ANALYSIS'];

    // 1. OFFLINE ENFORCEMENT
    if (!hasInternet) {
        return this.finalize('LOCAL', aiOptIn, ['SENSORS_OFFLINE']);
    }

    // 2. DOMAIN DETECTION (Personal vs External)
    // Personal: "My", "I have", "Calendar", "Tasks", "Schedule"
    // External: "Who is", "Capital of", "News", "Weather"
    const isPersonalDomain = /^(do i|what('| )s my|my|have i|i have|calendar|schedule|task|todo|list|plan)/i.test(text);
    const isExplicitCommand = /^(task:|todo:|note:|cork:|add |remind )/i.test(text);

    // 3. DOCTRINE: LOCAL-SENSORS FIRST
    // If the user is asking about their own life, J5 checks the "Local Briefcase" first.
    if (isPersonalDomain && !isExplicitCommand) {
        strategy = 'LOCAL';
        reasons.push('LOCAL_SENSOR_PRIORITY');
        return this.finalize(strategy, aiOptIn, reasons);
    }

    // 4. ACTION COMMANDS (Manifestation)
    if (isExplicitCommand) {
        strategy = 'LOCAL';
        reasons.push('MANIFESTATION_INTENT');
        return this.finalize(strategy, aiOptIn, reasons);
    }

    // 5. EXTERNAL SCOUT (The Magic Layer)
    // Simple inquiries that don't need "Neural Strike" complexity.
    const isSimpleInquiry = text.split(' ').length < 10 && !isPersonalDomain;
    if (isSimpleInquiry || intent.taskType === 'WEB_SEARCH') {
        strategy = 'INTERNET';
        reasons.push('SCOUT_SUFFICIENT');
        return this.finalize(strategy, aiOptIn, reasons);
    }

    // 6. NEURAL STRIKE (Escalation)
    if (aiOptIn && (text.length > 50 || text.includes("think") || text.includes("analyze") || intent.taskType === 'PROTOCOL_SIM')) {
        strategy = 'AI';
        reasons.push('NEURAL_STRIKE_REQUIRED');
    } else {
        // Default to Scout if internet is available and it's not a heavy lift.
        strategy = 'INTERNET';
        reasons.push('SCOUT_PREFERENCE');
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
