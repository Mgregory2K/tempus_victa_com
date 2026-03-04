// src/core/twin_plus/shaper.ts

import { TwinFeatureStore } from './twin_feature_store';
import { TwinPreferenceLedger } from './twin_preference_ledger';

/**
 * Represents the intent for a system output.
 */
export interface OutputIntent {
  surface: string;
  purpose: 'inform' | 'plan' | 'decide' | 'summarize' | 'rewrite';
  draftText: string;
  // ... other fields from the constitution
}

/**
 * Represents the final, modified output.
 */
export interface ShapedOutput {
  text: string;
  shapingApplied: string[];
}

/**
 * The TwinShaper modifies output before it is shown to the user,
 * aligning it with their learned communication style.
 */
export class TwinShaper {
  constructor(private prefs: TwinPreferenceLedger, private features: TwinFeatureStore) {}

  public shape(intent: OutputIntent): ShapedOutput {
    // This is where the output is modified based on learned preferences
    // like default response length, "Just the facts" mode, tone, etc.

    let shapedText = intent.draftText;
    const shapingApplied: string[] = [];

    const defaultLength = this.prefs.getPreference<string>('defaultLength');
    if (defaultLength === 'short' && shapedText.length > 100) {
      shapedText = shapedText.substring(0, 100) + '...';
      shapingApplied.push('shortened');
    }

    return {
      text: shapedText,
      shapingApplied: shapingApplied,
    };
  }
}
