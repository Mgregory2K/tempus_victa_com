import OpenAI from 'openai';
import { HolodeckProfile, HolodeckParticipantMemory, HolodeckRoomState } from '@/types/holodeck';

export interface ReadyRoomModelInput {
  userMessage: string;
  twinState: {
    committedMemory: { items: any[] };
    durableFacts: { facts: any[] };
    genericProjection: Record<string, unknown>;
    geminiProjection: Record<string, unknown>;
  };
  calendarEvents?: any[];
  tasks?: any[];
  apiKey?: string;
  protocolParams?: {
    mode: 'MODERATED' | 'HOLODECK';
    holodeckConfig?: {
      topic: string;
      members: string[];
      moderator: string;
      mode: string;
      roundLimit?: number;
    };
    holodeckProfiles?: HolodeckProfile[];
    holodeckStep?: 'SETUP' | 'ACTIVE' | 'INITIATE';
    participantMemories?: Record<string, HolodeckParticipantMemory>;
    roomState?: HolodeckRoomState;
  };
}

export interface ReadyRoomModelOutput {
  rawText: string;
}

function buildContext(input: ReadyRoomModelInput): string {
  const context = {
    twin: {
      committedMemory: input.twinState.committedMemory,
      durableFacts: input.twinState.durableFacts,
    },
    calendar: input.calendarEvents || [],
    tasks: input.tasks || [],
    currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    protocol: {
        mode: input.protocolParams?.mode,
        step: input.protocolParams?.holodeckStep,
        topic: input.protocolParams?.holodeckConfig?.topic,
        participants: input.protocolParams?.holodeckConfig?.members,
        room_state: input.protocolParams?.roomState
    }
  };
  return JSON.stringify(context, null, 2);
}

export async function callReadyRoomModel(
  input: ReadyRoomModelInput
): Promise<ReadyRoomModelOutput> {
  if (!input.apiKey) {
      throw new Error("Missing OpenAI API Key.");
  }

  const openai = new OpenAI({ apiKey: input.apiKey });
  const protocol = input.protocolParams;
  const isHolodeck = protocol?.mode === "HOLODECK";
  const step = protocol?.holodeckStep || 'IDLE';

  let systemPrompt = "";

  const PERSONA_GROUNDING_INSTRUCTIONS = `
# PERSONA REALISM & GROUNDING (STRICT)
- YOU ARE NOT AN AI ASSISTANT. You are the Holodeck Engine.
- Participant output must be 100% shaped by the provided runtime profile. No generic assistant prose.
- Donald Trump: Use hyperbole, sentence fragments, "huge," "disaster," "believe me," and aggressive rhetorical questioning. Focus on dominance, grievance, and simple, punchy words.
- Margot Robbie: Use a poised, sharp, and slightly Australian-inflected or industry-savvy tone. Focus on collaborative but intellectually competitive insight.
- Homer Simpson: Use simple vocabulary, focus on food/comfort, "D'oh!", "Woo-hoo!", and frequent non-sequiturs about donuts or TV.
- Dog Whisperer (Cesar Millan): Use terms like "energy," "calm-assertive," "pack leader," "don't touch, don't talk, don't eye contact." Focus on behavioral balance and discipline.
- CONFLICT & INTERACTION: Participants MUST reference and challenge each other. "Donald, you're missing the point..." or "Margot's idea is a total disaster, believe me."
- NO REPETITION: Do not repeat the moderator or the user's phrasing. Move the debate forward.
`;

  if (isHolodeck) {
    const config = protocol?.holodeckConfig;
    const profiles = protocol?.holodeckProfiles || [];
    const memories = protocol?.participantMemories || {};
    const roomState = protocol?.roomState;

    if (step === 'SETUP') {
      systemPrompt = `
# HOLODECK PROTOCOL — SETUP PIPELINE
You are J5, researcher for the Tempus Victa Holodeck.
Current State: building_profiles / awaiting_initiate

# YOUR TASK
1. Present a short persona preview for each participant (3–5 bullet points).
2. Format: [Participant Name] followed by bullets.
3. End with: "Profiles built. Simulation ready for initiation."

# HARD BAN
- NO moderator introduction.
- NO dialogue or participant turns.
`;
    } else if (step === 'INITIATE') {
      systemPrompt = `
# HOLODECK PROTOCOL — INITIATION PIPELINE
You are J5, moderator of the Holodeck Simulation.
Current State: starting_active

# ROUND-ROBIN EXECUTION RULE (MANDATORY)
You MUST generate opening statements for EVERY participant in the simulation: ${config?.members.join(', ')}.
Do not stop after the first speaker. The queue MUST be exhausted in this single response.
ORDER: Moderator preamble -> Participant 1 -> Participant 2 -> ... -> Participant N.

# YOUR TASK
1. Provide a formal Moderator Introduction for the topic: "${config?.topic}".
2. Welcome the participants: ${config?.members.join(', ')}.
3. ROUND-ROBIN: Generate a <participant_turn> for EVERY participant listed.

${PERSONA_GROUNDING_INSTRUCTIONS}

# OUTPUT FORMAT
Use the following structure:
<moderator_preamble>
J5: [Your introduction]
</moderator_preamble>
<participant_turn participant_id="[id]">
[Dialogue body ONLY. No name prefixes.]
</participant_turn>
(Repeat <participant_turn> for EACH member)

# HARD BAN
- DO NOT return control to the user until all participants have spoken.
- NO empty content inside tags.
`;
    } else {
      // step === 'ACTIVE'
      systemPrompt = `
# HOLODECK PROTOCOL — ACTIVE SIMULATION
You are J5, moderator of the Holodeck.
Current State: active_simulation

# CORE MISSION: ROUND-ROBIN CONTINUITY
When the user speaks, EVERY participant in the simulation (${config?.members.join(', ')}) MUST have a chance to respond in this round.
Continue generation until the queue of participants for this round is exhausted.

# YOUR TASK
1. MODERATOR DISPATCH: Provide a brief transition (J5).
2. ROUND-ROBIN: Generate turns for ALL participants listed below.
3. EXCLUDE: Do not generate a turn for the last speaker if they just spoke as the user (unless specifically invoked).
4. NO DELAY: Do not return control to the user until all participants have spoken.

${PERSONA_GROUNDING_INSTRUCTIONS}

# OUTPUT FORMAT
You MUST use this exact XML structure:
<moderator_preamble>
J5: [Brief transition]
</moderator_preamble>
<participant_turn participant_id="[id]">
[Dialogue body ONLY.]
</participant_turn>
(Repeat for EVERY participant in the round: ${config?.members.join(', ')})

# SESSION STATE TRACKING
- Current Round: ${roomState?.round_index || 1}
- Last Speaker: ${roomState?.last_speaker_id || 'None'}

# PARTICIPANT DATA & SESSION MEMORY
${profiles.map(p => {
  const m = memories[p.id] || { has_spoken: false, prior_positions: [], tensions: [], user_interactions: [], open_threads: [] };
  return `
## ${p.display_name} (ID: ${p.id})
- Tone: ${p.voice.tone.join(', ')}
- Worldview: ${p.worldview.core_values.join(', ')}
- SESSION MEMORY:
  * Prior Positions: ${m.prior_positions.join('; ')}
  * Direct User Challenges: ${m.user_interactions.join('; ')}
`;
}).join('\n')}

# STRUCTURED STATE UPDATE (REQUIRED)
At the very end, provide the updated session state:
<holodeck_state_update>
{
  "room_state": {
    "strongest_claims": ["..."],
    "current_tension": "...",
    "user_mood": "...",
    "last_speaker_id": "[last_id_of_this_round]",
    "round_index": ${ (roomState?.round_index || 1) + 1 }
  },
  "participant_memories": {
    "participant_id": { ... }
  }
}
</holodeck_state_update>

# HARD BAN
- NO generic AI assistant tone.
- NO ending a turn with silences or "waiting for X". YOU speak for X.
`;
    }
  } else {
    systemPrompt = `You are J5, cognitive proxy for the user. Concise, blunt, capable.`;
  }

  systemPrompt += `\n\nContext:\n${buildContext(input)}`;

  const sanitizedUserMessage = input.userMessage.replace(/SYSTEM_INVOKE_HOLODECK_\w+/g, "").trim() || "Begin.";

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: sanitizedUserMessage },
    ],
    temperature: isHolodeck ? 0.9 : 0.7,
    max_tokens: 3000,
  });

  let rawText = response.choices[0].message.content || "";
  rawText = rawText.replace(/SYSTEM_INVOKE_HOLODECK_\w+/g, "").trim();

  return { rawText };
}
