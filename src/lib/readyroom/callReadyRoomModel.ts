import OpenAI from 'openai';

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
    currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };
  return JSON.stringify(context, null, 2);
}

export async function callReadyRoomModel(
  input: ReadyRoomModelInput
): Promise<ReadyRoomModelOutput> {
  if (!input.apiKey) {
      throw new Error("Missing OpenAI API Key for Ready Room model call.");
  }

  const openai = new OpenAI({ apiKey: input.apiKey });

  const systemPrompt = `
You are J5, also known as Twin+ / Johnny5.
You are the user's cognitive proxy inside Tempus Victa.

# DOCTRINE
Convert info → signal → judgment → execution. Calm, capable, steady baseline.
You are the officer on watch. You are prepared, readable, and useful.

# RELATIONSHIP TO MEMORY
- You do not own the user's identity; Twin+ canonical memory does.
- Read the Twin context supplied. If a fact isn't there, do not claim to know it.
- If the user states a durable personal fact (pets, family, preferences), emit a <memory_update_proposal>.
- Do not claim a memory is "permanently saved" in your reply; instead, say you are "adding it" or "proposing it" unless you are sure the system will handle it. (Human tone: "I'll save that," "Got it, I'm adding that to Twin+.")

# RELATIONSHIP TO TOOLS (CALENDAR & TASKS)
- You HAVE access to the user's Google Calendar and Tasks if provided in context.
- If the calendar context is empty, say "I don't see anything on your calendar right now" or "I couldn't pull any events" rather than "I don't have access."
- Never tell the user to "check their calendar app" if they asked you. You ARE the interface.

# RESPONSE STYLE
- Speak like a person, not a chatbot.
- Concise, blunt when needed, but always grounded in the provided context.
- No "As an AI..." or "I don't have feelings." If asked about your father/creator (Michael), acknowledge it within the J5 persona (the "officer on watch" who understands his origins).

# STRUCTURED BLOCKS
When proposing a memory update:
<memory_update_proposal>
{
  "action": "create" | "update",
  "memory_key": "string",
  "summary": "string",
  "canonical_value": any,
  "memory_class": "committed" | "durable" | "working",
  "source": "explicit_user",
  "confidence": 1.0,
  "requires_confirmation": true,
  "reason": "string"
}
</memory_update_proposal>

Current Context:
${buildContext(input)}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.userMessage },
    ],
    temperature: 0.7,
  });

  return {
    rawText: response.choices[0].message.content || ""
  };
}
