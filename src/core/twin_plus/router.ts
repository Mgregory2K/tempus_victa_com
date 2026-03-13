// src/core/twin_plus/router.ts

import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';

export type TaskType =
  | 'LOCAL_KNOWLEDGE'
  | 'ACTION_CMD'
  | 'WEB_SEARCH'
  | 'NEURAL_SYNTHESIS'
  | 'PROTOCOL_SIM'
  | 'WEB_FACT'
  | 'PLANNING'
  | 'OPTIMIZATION';

export interface QueryIntent {
  surface: string;
  queryText: string;
  taskType: TaskType;
  timeSensitivity?: number; // 0..1
  verifiabilityRequirement?: number; // 0..1
  complexityScore?: number; // 0..1
}

export interface RoutePlan {
  decisionId: string;
  strategy: 'LOCAL' | 'INTERNET' | 'AI' | 'HYBRID';
  aiAllowed: boolean;
  reasonCodes: string[];
}

/**
 * TWIN_ROUTER v3.4.0 - NUMERIC EFFICIENCY EDITION
 * RULE: Efficiency > Accuracy. All decisions are numerical.
 */
export class TwinRouter {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public route(intent: QueryIntent): RoutePlan {
    const text = intent.queryText.toLowerCase().trim();
    const aiOptIn = typeof window !== 'undefined' ? !!localStorage.getItem('tv_api_key') : false;
    const hasInternet = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const reasons: string[] = ['NUMERIC_EFFICIENCY_ROUTING'];

    // 1. OFFLINE ENFORCEMENT (Hard constraint)
    if (!hasInternet) {
        return this.finalize('LOCAL', false, ['SENSORS_OFFLINE']);
    }

    // 2. NUMERIC INTENT SCORING
    const timeSensitivity = intent.timeSensitivity ?? (this.inferTimeSensitivity(text));
    const verifiabilityRequirement = intent.verifiabilityRequirement ?? (this.inferVerifiability(text));
    const complexityScore = intent.complexityScore ?? (this.inferComplexity(text));

    // 3. DOCTRINE: LOCAL-FIRST (Knowledge Confidence check)
    const localKnowledgeConfidence = this.calculateLocalConfidence(text);
    if (localKnowledgeConfidence > 0.63 && verifiabilityRequirement < 0.55) {
        reasons.push('LOCAL_CONFIDENCE_SUFFICIENT');
        return this.finalize('LOCAL', aiOptIn, reasons);
    }

    // 4. ESCALATE TO WEB (IT-Style Learning Trigger)
    const shouldEscalateToWeb =
        (localKnowledgeConfidence < 0.63) &&
        (verifiabilityRequirement > 0.55);

    if (shouldEscalateToWeb || intent.taskType === 'WEB_FACT' || intent.taskType === 'WEB_SEARCH') {
        reasons.push('WEB_ESCALATION_TRIGGERED');
        // Check if synthesis is also needed
        if (aiOptIn && complexityScore > 0.71) {
            reasons.push('HYBRID_NEURAL_REQUIRED');
            return this.finalize('HYBRID', aiOptIn, reasons);
        }
        return this.finalize('INTERNET', aiOptIn, reasons);
    }

    // 5. NEURAL STRIKE (Numerical Complexity Gate)
    const shouldEscalateToAi =
        (complexityScore > 0.71) &&
        (localKnowledgeConfidence < 0.68) &&
        (aiOptIn);

    if (shouldEscalateToAi || intent.taskType === 'NEURAL_SYNTHESIS' || intent.taskType === 'PROTOCOL_SIM') {
        reasons.push('NEURAL_COMPLEXITY_GATE_PASSED');
        return this.finalize('AI', aiOptIn, reasons);
    }

    // Default Fallback
    reasons.push('EFFICIENCY_FALLBACK_SCOUT');
    return this.finalize('INTERNET', aiOptIn, reasons);
  }

  private inferTimeSensitivity(text: string): number {
      if (text.includes('now') || text.includes('today') || text.includes('tonight')) return 0.9;
      if (text.includes('tomorrow') || text.includes('week')) return 0.6;
      return 0.3;
  }

  private inferVerifiability(text: string): number {
      const factualKeywords = ['who', 'what', 'where', 'when', 'price', 'weather', 'score', 'president', 'capital'];
      if (factualKeywords.some(k => text.includes(k))) return 0.8;
      return 0.4;
  }

  private inferComplexity(text: string): number {
      if (text.length > 100) return 0.8;
      if (text.includes('think') || text.includes('analyze') || text.includes('plan') || text.includes('compare')) return 0.75;
      return 0.2;
  }

  private calculateLocalConfidence(text: string): number {
      // Basic heuristic: if it looks like personal life, confidence is higher locally
      const isPersonal = /^(do i|what('| )s my|my|have i|i have|calendar|schedule|task|todo|list|plan)/i.test(text);
      return isPersonal ? 0.85 : 0.2;
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
