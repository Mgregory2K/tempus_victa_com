import { NextRequest, NextResponse } from "next/server";
import { saveSession } from "@/lib/holodeck/sessionStore";
import { HolodeckSession, HolodeckQuote } from "@/types/holodeck";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, apiKey } = body;

    if (!session || !session.session_id) {
      return NextResponse.json({ ok: false, error: "Session data required" }, { status: 400 });
    }

    // Phase 5: Quote Extraction using AI
    if (apiKey && session.transcript && session.transcript.length > 0) {
      try {
        const openai = new OpenAI({ apiKey });
        const transcriptText = session.transcript
          .map((m: any) => `${m.sender}: ${m.content}`)
          .join("\n");

        const prompt = `
Extract 3-5 notable, characteristic quotes from the following Holodeck simulation transcript.
Quotes should capture the essence of the participant's persona and the intellectual weight of the discussion.

Transcript:
${transcriptText}

Return a JSON array of objects with "speaker", "text", and "context" keys.
`;

        const quoteRes = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Use a smaller model for extraction
          messages: [{ role: "system", content: prompt }],
          response_format: { type: "json_object" }
        });

        const extracted = JSON.parse(quoteRes.choices[0].message.content || '{"quotes": []}');
        session.notable_quotes = extracted.quotes as HolodeckQuote[];
      } catch (e) {
        console.error("Failed to extract quotes:", e);
      }
    }

    // Final Save
    saveSession(session as HolodeckSession);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("[HOLODECK SAVE ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
