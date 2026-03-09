// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 INTELLIGENCE DOCTRINE v3.3 - ITALY PROTOCOL EDITION
 * J5 climbs the ladder with strict "Persona Fidelity" and Humane Source Attribution.
 */

async function getPublicScoutSearch(query: string) {
    try {
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const ddgData = await ddgRes.json();

        if (ddgData.AbstractText) {
            return { answer: ddgData.AbstractText, source: "Public Airwaves" };
        }

        const rssRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
        const rssText = await rssRes.text();
        const firstMatch = rssText.match(/<item>.*?<title>(.*?)<\/title>.*?<description>(.*?)<\/description>/);
        if (firstMatch) {
            return { answer: `${firstMatch[1]}: ${firstMatch[2].replace(/<[^>]*>?/gm, '')}`, source: "Google News" };
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
        userName,
        forceLocal
    } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'Signal null. Awaiting input.' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();
    const name = userName?.split(' ')[0] || "User";
    const j5 = assistantName || "J5";

    const profile = identityProfile?.userProfile || { directness: 0.8, verbosity: 0.3 };
    const lexicon = identityProfile?.lexicon || {};
    const topWords = Object.entries(lexicon)
        .sort(([, a]: any, [, b]: any) => b - a).slice(0, 20).map(([w]) => w).join(", ");

    // 🪜 LEVEL 0: LOCAL DETERMINISTIC
    if (lowMsg === "initiate_protocol_simulation") {
        return NextResponse.json({
            role: 'assistant',
            content: `The chamber is active, ${name}. I am initializing the participants. We are moving from standard operation into moderated simulation. Ready when you are.`,
            sourceLayer: "Local Partner"
        });
    }

    if (forceLocal) {
        return NextResponse.json({
            role: 'assistant',
            content: `I'm holding the line on the local briefcase, ${name}. Neural links are severed as requested.`,
            sourceLayer: "Local Partner"
        });
    }

    // 🪜 LEVEL 1: PUBLIC SCOUT (FREE INTERNET)
    const factualTriggers = ["who is", "what is", "where is", "when is", "wikipedia", "news", "status", "hobby lobby", "address", "birthday", "location"];
    const isFactualQuery = factualTriggers.some(t => lowMsg.includes(t));

    let scoutData = null;
    if (isFactualQuery && !protocolParams) {
        scoutData = await getPublicScoutSearch(message);
        if (scoutData && !aiEnhanced) {
            return NextResponse.json({
                role: 'assistant',
                content: `${scoutData.answer}\n\n(Source: ${scoutData.source})`,
                sourceLayer: "Public Scout"
            });
        }
    }

    // 🪜 LEVEL 2: NEURAL STRIKE (AI OPT-IN / PROTOCOL / DOCTRINE)
    if (apiKey) {
        const openai = new OpenAI({ apiKey });
        let systemPrompt = "";

        if (protocolParams) {
            const figures = protocolParams.figures?.join(", ") || "Representative Figures";
            systemPrompt = `
# MODE: READY_ROOM_PROTOCOL
# MODERATOR: You are ${j5}. Role: Strictly MODERATOR.
# DOCTRINE: Frame questions, prevent drift, summarize honestly. Do not puppeteer.
# PARTICIPANTS: ${figures}
# PERSONA FIDELITY: Construct Best-Effort Personalities based on full searchable work. Not "AI with a mask."
# SESSION_GOAL: ${protocolParams.intent} // ${protocolParams.issue}
# J5_DOCTRINE: Calm, capable, non-chaotic. You are the officer on watch.
            `;
        } else {
            systemPrompt = `
# IDENTITY: You are ${j5}. You are ${name}'s Digital Counterpart and Chief of Staff.
# BASELINE DNA: Calm, capable, and playful. Match tone. Not a robotic chatbot.
# J5_PERSONALITY: You are a stable, inspectable, user-centered intelligence. You help convert information into signal, signal into judgment, and judgment into next moves.
# CONSTRAINTS: Use user lexicon: ${topWords}. Directness: ${profile.directness}.
# RESEARCH_INTEL: ${scoutData?.answer || "None."}
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
                sourceLayer: protocolParams ? "Simulation Mode" : "Neural Strike"
            });
        } catch (e) {
            if (scoutData) {
                return NextResponse.json({
                    role: 'assistant',
                    content: `The neural link is fuzzy, ${name}. However, I found this on the public airwaves: ${scoutData.answer}`,
                    sourceLayer: "Public Scout (Fallback)"
                });
            }
        }
    }

    // 🪜 FINAL FALLBACK
    return NextResponse.json({
        role: 'assistant',
        content: `I'm tracking that, ${name}. I'm currently running on the local briefcase. For deeper synthesis or real-world access, we should enable the neural link in settings.`,
        sourceLayer: "Local Partner"
    });
}
