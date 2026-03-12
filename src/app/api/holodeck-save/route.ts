import { NextRequest, NextResponse } from "next/server";
import { saveSession } from "@/lib/holodeck/sessionStore";
import { HolodeckSession, HolodeckQuote } from "@/types/holodeck";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.session) return NextResponse.json({ ok: false, error: "Session data required" }, { status: 400 });

    const { session, apiKey } = body;

    // Phase 5: Quote Extraction using AI (Mini model for speed)
    if (apiKey && session.transcript?.length > 0) {
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
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: prompt }],
          response_format: { type: "json_object" }
        });

        const extracted = JSON.parse(quoteRes.choices[0].message.content || '{"quotes": []}');
        session.notable_quotes = extracted.quotes || [];
      } catch (e) {
        console.error("[HOLODECK SAVE] Quote extraction failed", e);
      }
    }

    saveSession(session as HolodeckSession);
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("[HOLODECK SAVE ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
