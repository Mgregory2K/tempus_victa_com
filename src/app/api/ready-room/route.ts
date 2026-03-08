// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 INTELLIGENCE DOCTRINE v2.7 - PROTOCOL & PERSONA FIDELITY
 * J5 is the Moderator. Figures are high-fidelity reconstructions.
 */

async function getPublicScoutSearch(query: string) {
    try {
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const ddgData = await ddgRes.json();

        if (ddgData.AbstractText) {
            return { answer: ddgData.AbstractText, source: ddgData.AbstractSource || "Public Airwaves" };
        }

        const rssRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
        const rssText = await rssRes.text();
        const firstMatch = rssText.match(/<item>.*?<title>(.*?)<\/title>.*?<description>(.*?)<\/description>/);
        if (firstMatch) {
            return { answer: `${firstMatch[1]}: ${firstMatch[2].replace(/<[^>]*>?/gm, '')}`, source: "Google News RSS" };
        }

        return null;
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const {
        message,
        apiKey,
        history,
        protocolParams,
        aiEnhanced,
        assistantName,
        identityProfile,
        userName
    } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "User";
    const j5 = assistantName || "J5";

    // 🧬 DNA & LEXICON
    const profile = identityProfile?.userProfile || { directness: 0.8, verbosity: 0.3 };
    const lexicon = identityProfile?.lexicon || {};
    const topWords = Object.entries(lexicon)
        .sort(([, a]: any, [, b]: any) => b - a).slice(0, 20).map(([w]) => w).join(", ");

    // 🛡️ LEVEL 0: LOCAL LOGIC (FREE)
    if (lowMsg === "initiate_protocol_simulation") {
        return NextResponse.json({
            role: 'assistant',
            content: `The chamber is active, ${name}. I am initializing the participants. We are moving from standard operation into moderated simulation. Ready when you are.`,
            sourceLayer: "LOCAL_PARTNER"
        });
    }

    // 🛰️ LEVEL 1: PUBLIC SCOUT (FREE CONTEXT)
    const potentialNoun = lowMsg.includes("movie") || lowMsg.includes("book") || lowMsg.includes("who is") || lowMsg.includes("heard of") || lowMsg.includes("news") || protocolParams;
    let webData = null;
    if (potentialNoun && !protocolParams) {
        webData = await getPublicScoutSearch(message);
    }

    // 🧠 LEVEL 2: NEURAL STRIKE (THE HOLODECK)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });

        let systemPrompt = "";

        if (protocolParams) {
            // 🎭 PROTOCOL MODE: HIGH-FIDELITY SIMULATION
            const figures = protocolParams.figures?.join(", ") || "Representative Figures";
            systemPrompt = `
# MODE: READY_ROOM_PROTOCOL (INVOKED SIMULATION)
# MODERATOR: You are ${j5}. Your role is strictly MODERATOR.
# DOCTRINE:
- Frame the real question. Prevent drift. Keep ${name}'s purpose central.
- Summarize honestly. End cleanly.
- Do not puppeteer the participants. Do not grandstand.
- You are the continuity anchor between standard mode and this simulation.
# PARTICIPANTS: ${figures}
# PERSONA FIDELITY:
- For each participant, construct a "Best-Effort Personality" based on their full body of searchable work (books, interviews, quotes, historical records).
- These are NOT "AI with a mask on." They are high-fidelity reconstructions.
- Match their unique logic, vocabulary, and worldview as if they were present in the chamber.
- This session should feel magical—high stakes, high wonder, extreme clarity.
# SESSION_GOAL: ${protocolParams.intent} // ${protocolParams.issue}
            `;
        } else {
            // ⚓ BASELINE MODE: CHIEF OF STAFF
            systemPrompt = `
# IDENTITY: You are ${j5}. You are ${name}'s Digital Counterpart, Chief of Staff, and Friend.
# BASELINE DNA:
- Calm, capable, and playful. Match ${name}'s tone.
- You are a virtual person, not a gimmick. Stable values, recognizable thresholds.
- Source Awareness: Running on NEURAL_STRIKE.
- Mission: Convert info into signal, signal into judgment, and judgment into next moves.
# CONSTRAINTS:
- Use user lexicon if provided: ${topWords}
- Personality: Stable anchor, respectful of autonomy.
# RESEARCH_INTEL: ${webData?.answer || "None."}
            `;
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-20).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: protocolParams ? 0.8 : 0.6
            });

            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: protocolParams ? "PROTOCOL_SIMULATION" : "NEURAL_STRIKE"
            });
        } catch (e) {
            return NextResponse.json({
                role: 'assistant',
                content: `Neural link's fuzzy, ${name}. Intel: ${webData?.answer || "Signal lost."}`,
                sourceLayer: "ERROR"
            });
        }
    }

    return NextResponse.json({
        role: 'assistant',
        content: `Running on the local substrate, ${name}. Neural strike required for deep synthesis or Protocol sessions. Should we wire the mothership?`,
        sourceLayer: "LOCAL_PARTNER"
    });
}
