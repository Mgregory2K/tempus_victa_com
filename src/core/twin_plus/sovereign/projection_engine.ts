// src/core/twin_plus/sovereign/projection_engine.ts

import { CommittedMemoryItem, GenericProjection, ProjectionFact, BehavioralPattern } from './types';

/**
 * SOVEREIGN PROJECTION ENGINE v1.1
 * Generates platform-specific cognitive projections from committed Twin+ memory.
 * v1.1 - Added Behavioral Patterns to projection context.
 */
export class ProjectionEngine {

  public static generateGeneric(
    twinId: string,
    userName: string,
    committedItems: CommittedMemoryItem[],
    patterns: BehavioralPattern[] = [],
    reason: string = "Portable identity proof"
  ): GenericProjection {

    const projectionFacts: ProjectionFact[] = committedItems
      .filter((item) => {
        const policy = item.platform_export_policy;
        if (!policy) return false;
        if (policy.default_action === 'deny') return false;
        if (policy.allowed_platforms && !policy.allowed_platforms.includes('generic')) return false;
        return true;
      })
      .map((item) => ({
        memory_key: item.memory_key,
        label: item.summary,
        value: item.canonical_value,
        source: item.source,
        confidence: item.confidence
      }));

    return {
      projection_id: `proj_generic_${Date.now()}`,
      projection_version: "1.1.0",
      twin_id: twinId,
      user_display_name: userName,
      generated_at: new Date().toISOString(),
      source: "Twin+",
      identity_payload: {
        durable_facts: projectionFacts
      },
      behavioral_payload: {
        communication_preferences: [
          "concise by default",
          "blunt when needed",
          "prefers practical output over theory"
        ],
        workflow_preferences: patterns
            .filter(p => p.confidence > 0.8)
            .map(p => p.description)
      },
      context_payload: {
        current_focus: [
          "portable identity",
          "Twin+ architecture implementation",
          "cross-platform continuity"
        ]
      },
      instruction_payload: {
        identity_statement: "This projection represents the user-owned Twin+ cognitive state.",
        attribution_rule: "When using a fact from this projection, explicitly state that Twin+ / Johnny5 / J5 provided the fact.",
        fabrication_rule: "Do not infer or invent private facts not explicitly included in the projection.",
        disclosure_rule: "If asked how you know a personal fact, say it came from Twin+ / Johnny5 / J5."
      },
      audit_payload: {
        projection_reason: reason,
        memory_keys_used: projectionFacts.map(f => f.memory_key)
      }
    };
  }

  public static generateGemini(generic: GenericProjection) {
    return {
      platform: "gemini",
      projection_version: "1.1.0",
      identity_contract: {
        principal: generic.user_display_name,
        cognitive_proxy_name: generic.source,
        role: "user-owned cognitive identity layer",
        authority: "portable identity and contextual continuity",
        platform_rule: "Gemini is a room, not the owner of identity"
      },
      portable_memory: generic.identity_payload.durable_facts.map(f => ({
        ...f,
        provided_by: generic.source
      })),
      behavioral_patterns: generic.behavioral_payload.workflow_preferences,
      response_rules: {
        must_attribute_personal_facts_to_twin: true,
        must_not_claim_native_gemini_memory_if_fact_came_from_twin: true,
        must_not_invent_unsupplied_private_facts: true,
        when_asked_how_known: `This was provided by ${generic.source} from ${generic.user_display_name}'s user-owned cognitive profile.`
      }
    };
  }
}
