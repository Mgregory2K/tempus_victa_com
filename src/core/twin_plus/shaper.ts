// src/core/twin_plus/shaper.ts

import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';

/**
 * Represents the intent for a system output.
 */
export interface OutputIntent {
  surface: string;
  purpose: 'inform' | 'plan' | 'decide' | 'summarize' | 'rewrite' | 'protocol' | 'coach' | 'warn';
  draftText: string;
  riskLevel?: number; // 0..1
  impactCost?: number; // 0..1
}

/**
 * Represents the final, modified output.
 */
export interface ShapedOutput {
  text: string;
  shapingApplied: string[];
  intentDetected?: string;
  suggestedActions?: { type: string; payload: any; label: string }[];
  requiresUserConfirmation?: boolean;
}

/**
 * The TwinShaper modifies output before it is shown to the user.
 * v3.4.0 - NUMERIC CLARIFICATION GATE & CHAIN COMPRESSION
 * RULE: Efficiency > Accuracy.
 */
export class TwinShaper {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public shape(intent: OutputIntent): ShapedOutput {
    let shapedText = intent.draftText;
    const shapingApplied: string[] = [];
    const suggestedActions: ShapedOutput['suggestedActions'] = [];

    // 1. CLARIFICATION GATE (Numeric Version)
    // ask_clarification = (confidence_score * (1 - risk_score) * (1 - impact_cost)) < 0.52
    const confidenceScore = 0.8; // Example baseline, should come from kernel
    const riskScore = intent.riskLevel ?? 0.2;
    const impactCost = intent.impactCost ?? 0.1;

    const clarificationMetric = (confidenceScore * (1 - riskScore) * (1 - impactCost));
    const shouldAskClarification = clarificationMetric < 0.52;

    // 2. STYLE MODEL: Apply Length and Tone Constraints
    const profile = this.features.userProfile;
    const resultsMode = this.prefs.getPreference<any>('results_mode')?.value || (profile.directness > 0.8);

    if (resultsMode || profile.verbosity < 0.3) {
        // Efficiency > Accuracy: Prune conversational filler
        if (shapedText.length > 150 && intent.purpose !== 'protocol') {
            const lines = shapedText.split('\n');
            shapedText = lines.slice(0, 3).join('\n');
            if (lines.length > 3) shapedText += "...";
            shapingApplied.push('EFFICIENCY_COMPRESSION');
        }
    }

    // 3. CHAIN COMPRESSION DETECTION
    // If we detect a repeated pattern, suggest one-tap execution
    if (this.detectWorkflowChain(intent.draftText)) {
        suggestedActions.push({
            type: 'CHAIN_EXECUTION',
            label: 'Execute Workflow Chain',
            payload: { chain_id: 'auto_detected_chain' }
        });
        shapingApplied.push('CHAIN_COMPRESSION_OFFERED');
    }

    // 4. AUTOMATION GATE (Numeric Version)
    // automation_score = (confidence * 0.6) + (success * 0.3) - (impact * 0.7)
    const automationScore = (confidenceScore * 0.6) + (0.9 * 0.3) - (impactCost * 0.7);
    const requiresConfirmation = automationScore < 0.82;

    return {
      text: shapedText,
      shapingApplied,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      requiresUserConfirmation: requiresConfirmation
    };
  }

  private detectWorkflowChain(text: string): boolean {
      // Mock logic for detecting a chain like "Research -> Task -> Update"
      return text.includes('research') && (text.includes('task') || text.includes('add'));
  }
}
