// src/core/twin_plus/shaper.ts

import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';

/**
 * Represents the intent for a system output.
 */
export interface OutputIntent {
  surface: string;
  purpose: 'inform' | 'plan' | 'decide' | 'summarize' | 'rewrite' | 'protocol';
  draftText: string;
}

/**
 * Represents the final, modified output.
 */
export interface ShapedOutput {
  text: string;
  shapingApplied: string[];
  intentDetected?: string;
  suggestedActions?: { type: string; payload: any; label: string }[];
}

/**
 * The TwinShaper modifies output before it is shown to the user,
 * aligning it with their learned communication style and detecting actionable intent.
 */
export class TwinShaper {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public shape(intent: OutputIntent): ShapedOutput {
    let shapedText = intent.draftText;
    const shapingApplied: string[] = [];
    const suggestedActions: ShapedOutput['suggestedActions'] = [];

    // 1. STYLE MODEL: Apply Length and Tone Constraints
    // Values from TwinPreferenceLedger (inspectable identity)
    const lengthPref = this.prefs.getPreference<any>('response_length')?.value || 'balanced';
    const resultsMode = this.prefs.getPreference<any>('results_mode')?.value || false;

    if (resultsMode || lengthPref === 'short') {
        // In "Results Mode", we aggressively prune conversational filler
        if (shapedText.length > 150 && intent.purpose !== 'protocol') {
            shapedText = shapedText.split('\n').slice(0, 3).join('\n') + "...";
            shapingApplied.push('RESULTS_MODE_COMPRESSION');
        }
    }

    // 2. INTENT DETECTION: "Manifest Action" logic
    // We look for patterns that suggest tasks, quotes, or signals
    const lowerText = intent.draftText.toLowerCase();

    // TASK DETECTION
    if (lowerText.includes('task:') || lowerText.includes('todo:') || lowerText.includes('need to')) {
        const lines = intent.draftText.split('\n');
        const taskLine = lines.find(l => l.toLowerCase().includes('task:') || l.toLowerCase().includes('todo:')) || lines[0];
        suggestedActions.push({
            type: 'MANIFEST_TASK',
            label: 'Manifest Task',
            payload: { title: taskLine.replace(/task:|todo:/gi, '').trim(), priority: 'MED' }
        });
    }

    // QUOTE DETECTION
    if (lowerText.includes('crystallize:') || lowerText.includes('quote:')) {
         suggestedActions.push({
            type: 'CRYSTALLIZE_QUOTE',
            label: 'Crystallize Quote',
            payload: { text: intent.draftText.replace(/crystallize:|quote:/gi, '').trim() }
        });
    }

    return {
      text: shapedText,
      shapingApplied,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined
    };
  }
}
