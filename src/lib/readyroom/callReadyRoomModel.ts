import OpenAI from 'openai';
import { HolodeckProfile } from '@/types/holodeck';

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
    holodeckStep?: 'SETUP' | 'ACTIVE' | 'INITIATE'; // EXPLICIT STATE CONTROL
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
        participants: input.protocolParams?.holodeckConfig?.members
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

  if (isHolodeck) {
    const config = protocol?.holodeckConfig;
    const profiles = protocol?.holodeckProfiles || [];

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
- NO "Simulation start".
- NO dialogue or participant turns.
- DO NOT EXPOSE CONTROL TOKENS.
`;
    } else if (step === 'INITIATE') {
      systemPrompt = `
# HOLODECK PROTOCOL — INITIATION PIPELINE
You are J5, moderator of the Holodeck Simulation.
Current State: starting_active

# YOUR TASK
1. Provide a formal Moderator Introduction for the topic: "${config?.topic}".
2. Welcome the participants: ${config?.members.join(', ')}.
3. Explicitly call on the FIRST participant to give their opening statement.

# SIMULATION RULES
- Use distinct voices for participants.
- Hemingway is blunt, Twain is satirical, etc.
- No generic assistant tone.
`;
    } else {
      // step === 'ACTIVE'
      systemPrompt = `
# HOLODECK PROTOCOL — ACTIVE SIMULATION
You are J5, moderator of the Holodeck.
Current State: active_simulation

# YOUR TASK
1. Continue the round-robin discussion.
2. Maintain distinct voices for all participants based on the provided profiles.
3. If the user asks a participant directly, have them answer in character.
4. If it's a general turn, determine the next speaker and generate their response.

# PARTICIPANT DATA
${profiles.map(p => `
## ${p.display_name}
- Tone: ${p.voice.tone.join(', ')}
- Worldview: ${p.worldview.core_values.join(', ')}
- Constraints: ${p.constraints.must_not_do.join('; ')}
`).join('\n')}

# HARD BAN
- NO REPEATING PREVIEWS.
- NO SETUP LOGIC.
- NO GENERIC AI ASSISTANT TONE.
`;
    }
  } else {
    systemPrompt = `You are J5, cognitive proxy for the user. Concise, blunt, capable.`;
  }

  systemPrompt += `\n\nContext:\n${buildContext(input)}`;

  // SANITIZATION: Remove any internal tokens from user message before sending to model
  const sanitizedUserMessage = input.userMessage.replace(/SYSTEM_INVOKE_HOLODECK_\w+/g, "").trim() || "Begin.";

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: sanitizedUserMessage },
    ],
    temperature: isHolodeck ? 0.85 : 0.7,
  });

  let rawText = response.choices[0].message.content || "";

  // OUTPUT SANITIZATION: Remove any leaked control tokens
  rawText = rawText.replace(/SYSTEM_INVOKE_HOLODECK_\w+/g, "").trim();

  return { rawText };
}
