import { NextResponse } from "next/server";
import { resolveOrCreateTwinManifest } from "@/core/twin_plus/google_identity_bridge";
import { loadTwinMemory } from "@/core/twin_plus/twin_memory";
import { buildTwinPassport } from "@/core/twin_plus/twin_passport";
import { buildGeminiPrompt } from "@/core/twin_plus/adapters/adapter_gemini";

function getAuthenticatedGoogleEmail(): string {
  return "michael.gregory1@gmail.com";
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const json = await response.json();

  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
    "";

  return text || "No response returned from Gemini.";
}

export async function POST(request: Request) {
  try {
    const email = getAuthenticatedGoogleEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      prompt?: string;
    };

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const manifest = resolveOrCreateTwinManifest(email);
    const memory = loadTwinMemory();
    const passport = buildTwinPassport(manifest, memory, "ai_chat_compact");

    const geminiPrompt = buildGeminiPrompt(body.prompt, passport);
    const answer = await callGemini(geminiPrompt);

    return NextResponse.json({
      ok: true,
      twin_id: manifest.twin_id,
      prompt_sent_to_model: geminiPrompt,
      answer,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
