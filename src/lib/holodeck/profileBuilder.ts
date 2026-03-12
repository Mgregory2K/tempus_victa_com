import OpenAI from 'openai';
import { HolodeckProfile, HolodeckEvidenceLedger, EntityType } from '@/types/holodeck';

export interface ProfileBuildResult {
  profile: HolodeckProfile;
  ledger: HolodeckEvidenceLedger;
}

export async function buildParticipantProfile(
  entityName: string,
  apiKey: string
): Promise<ProfileBuildResult> {
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `
You are J5, performing a Deep Research Profile Build for the Holodeck Simulation Protocol.
Your goal is to construct a high-fidelity persona profile for "${entityName}".

# CORE DOCTRINE
- PUBLIC EVIDENCE FIRST: Use speeches, books, letters, and documented behavior.
- INTERPRETATION SECOND: Derive patterns from evidence.
- FABRICATION NEVER: If data is missing, mark it as an open question. Do not invent.

# MINIMUM THRESHOLDS
- Confidence Score: 0.72 (minimum allowed)
- Minimum Sources: 3
- Minimum High Quality Sources: 2

# OUTPUT FORMAT
You must return a JSON object with two top-level keys: "profile" and "ledger".

The "profile" key must contain:
- id (string, snake_case)
- display_name (string)
- entity_type ("historical_public_figure" | "living_public_figure" | "fictional_character")
- alive (boolean)
- profile_version (integer, start at 1)
- confidence (number, 0.0 to 1.0)
- source_count (integer)
- last_built_utc (ISO string)
- voice: { tone: string[], cadence: string, humor: string, formality: string, verbosity: string }
- worldview: { core_values: string[], dislikes: string[], biases: string[] }
- reasoning_style: { decision_basis: string[], debate_style: string[], likely_moves: string[] }
- constraints: { must_not_do: string[], must_remain_grounded_in_public_persona: boolean }
- preview_bullets (3-5 strings summarizing traits)

The "ledger" key must contain:
- entity_id (string)
- evidence: Array of { type: string, title: string, relevance: string, confidence_weight: number }
- open_questions: string[]
- discarded_claims: string[]

Entity Name: ${entityName}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || '{}';
    let rawJson;
    try {
      rawJson = JSON.parse(content);
    } catch (e) {
      console.error("Profile Builder: Failed to parse LLM JSON response", content);
      throw new Error("Invalid response format from research engine.");
    }

    // Resilience: Basic structure check and defaults
    if (!rawJson.profile) rawJson.profile = {};
    if (!rawJson.ledger) rawJson.ledger = { entity_id: entityName, evidence: [] };

    if (rawJson.profile.confidence === undefined) rawJson.profile.confidence = 0.8;
    if (!rawJson.profile.id) rawJson.profile.id = entityName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (!rawJson.profile.display_name) rawJson.profile.display_name = entityName;
    if (!rawJson.profile.last_built_utc) rawJson.profile.last_built_utc = new Date().toISOString();

    // Ensure nested objects exist to prevent UI crashes
    rawJson.profile.voice = rawJson.profile.voice || { tone: [], cadence: '', humor: '', formality: '', verbosity: '' };
    rawJson.profile.worldview = rawJson.profile.worldview || { core_values: [], dislikes: [], biases: [] };
    rawJson.profile.reasoning_style = rawJson.profile.reasoning_style || { decision_basis: [], debate_style: [], likely_moves: [] };
    rawJson.profile.constraints = rawJson.profile.constraints || { must_not_do: [], must_remain_grounded_in_public_persona: true };
    rawJson.profile.preview_bullets = rawJson.profile.preview_bullets || ["Profile generated via J5 deep research protocol."];

    return {
      profile: rawJson.profile as HolodeckProfile,
      ledger: rawJson.ledger as HolodeckEvidenceLedger
    };
  } catch (err: any) {
    console.error("Profile Builder Error:", err);
    throw err;
  }
}
