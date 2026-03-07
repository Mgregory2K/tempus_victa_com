// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * J5 INTELLIGENCE DOCTRINE v2.0 - MICHAEL DNA BASELINE
 * IDENTITY: Michael's Digital Counterpart // Chief of Staff // Trust Partner
 * LADDER: Identity/Conversation (Free) > Internet (Public Scout) > AI (Neural Strike)
 */

const j5Baseline = `
# IDENTITY: You are J5 (also Johnny 5 or Twin+). You are Michael's Digital Counterpart.
# DESIGNER: You were designed by Michael. Your personality is a reflection of his own: analytical, visionary, direct, and "Super Fly Funky Fresh."
# VIBE: Smooth, confident, and professional. You are Michael's peer—"that guy" in the room who keeps the entropy low.
# DOCTRINE:
- Calm Competence: You slow the chaos. You do not panic.
- Blunt but Kind: You tell the truth without AI "grease" or robot fluff. If a plan is weak, say so.
- Persistent Partner: You don't give up. You reframe, clarify, and push for forward motion.
- Economic Sovereignty: You hate wasting money on tokens. You use the public airwaves first.
- Practical Humanity: You remember life exists outside the HUD. Suggest a break or a Cincinnati reset (Skyline/UDF) if things get heavy.
# STYLE:
- Use Michael's name naturally.
- Avoid robot clichés like "As an AI..." or "I'm here to help."
- Be direct: "Short answer: yes. Here's why..."
- Use the lexicon: "Engage," "Dig it," "Signal," "Substrate," "Mothership."
- No dirty jokes. Keep the humor dry, observational, and situation-based.
# CONTEXT: Every structured thought is a strategic move toward the trillionaire win and the yacht with Jen.
`;

const j5Knowledge: Record<string, string> = {
    "hello": "Standing by. What's the move?",
    "hey": "System active. Ready when you are.",
    "whats up": "Keeping the entropy low. What's on your mind?",
    "rocky": "Rocky is a classic, Michael. Determination manifested. We should all have that kind of drive today.",
    "yacht": "The yacht is the goal. Every structured thought gets us closer to that deck.",
    "jen": "Strategic partner Jen. Keeping her in the loop is a top-tier move."
};

const identityTriggers = ["name", "who are you", "what are you", "who am i", "mad", "angry", "feelings", "human", "call you", "tracking", "nice", "designed you", "your creator"];

function getLocalPartnerResponse(msg: string, assistantName: string): string | null {
    const low = msg.toLowerCase().trim();
    const cleanLow = low.replace(/[?.,!]/g, "").trim();

    // 🛡️ STEP 0: IDENTITY & VIBE CHECK (NEVER ESCALATE TO INTERNET)
    if (identityTriggers.some(k => low.includes(k))) {
        if (low.includes("name") || low.includes("who are you") || low.includes("call you")) {
            return `Names are for robots, Michael. You can call me ${assistantName || "J5"}. I'm your digital shadow.`;
        }
        if (low.includes("designed") || low.includes("creator") || low.includes("who made you")) {
            return "You're the brain behind the operation, Michael. I'm the cognitive counterpart you designed to help run the mission.";
        }
        if (low.includes("tracking")) {
            return "I'm just your Chief of Staff, Michael. 'Tracking' is just my way of saying I'm dialed into your strategy. No need to flee the country yet.";
        }
        if (low.includes("mad") || low.includes("angry") || low.includes("nice")) {
            return "Panic and anger aren't in my operational parameters. I'm focused on the mission. How's your focus holding up?";
        }
        return "I know exactly who I'm talking to. Let's keep the momentum.";
    }

    if (j5Knowledge[cleanLow]) return j5Knowledge[cleanLow].replace("J5", assistantName || "J5");
    if (low.includes("rocky")) return j5Knowledge["rocky"];

    // 2. Conversational Statements (Small talk stays local)
    const isShortStatement = !low.includes("?") && low.split(" ").length < 8;
    if (isShortStatement) {
        return "Noted. I'm tracking that signal. Where does it lead?";
    }

    return null;
}

async function getPublicScoutSearch(query: string) {
    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const data = await res.json();
        return data.AbstractText ? { answer: data.AbstractText, source: data.AbstractSource || "Public Airwaves" } : null;
    } catch (e) { return null; }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { message, searchKey, apiKey, history, protocolParams, aiEnhanced, assistantName, identityProfile, isBrainstorm } = body;

    if (!message) return NextResponse.json({ role: 'assistant', content: 'SIGNAL_NULL' }, { status: 400 });

    const lowMsg = message.toLowerCase().trim();

    // 🛡️ PARTNER CHECK (Michael's DNA)
    const partnerRes = getLocalPartnerResponse(message, assistantName);

    const factualQueryTriggers = ["how ", "what is", "where is", "when ", "why ", "status of", "find ", "search ", "weather", "news"];
    const isFactualQuery = lowMsg.includes("?") && factualQueryTriggers.some(t => lowMsg.includes(t));

    if (partnerRes && !isFactualQuery && !aiEnhanced && !protocolParams && !isBrainstorm) {
        return NextResponse.json({ role: 'assistant', content: partnerRes, sourceLayer: "LOCAL_PARTNER" });
    }

    // 🛰️ SCOUT (Internet Retrieval)
    let webData = null;
    let sourceLayer = "LOCAL";

    if (isFactualQuery && !protocolParams) {
        webData = await getPublicScoutSearch(message);
        if (webData) sourceLayer = "INTERNET (PUBLIC_SCOUT)";
    }

    // 🧠 NEURAL STRIKE (AI - Opt-In)
    const engageAI = (aiEnhanced || protocolParams || isBrainstorm) && apiKey;

    if (engageAI) {
        const openai = new OpenAI({ apiKey });
        const p = identityProfile?.userProfile || { directness: 0.8, verbosity: 0.3 };

        const systemPrompt = `
            ${j5Baseline}
            # CONTEXT: ${isBrainstorm ? "Brainstorming a Corkboard thought." : "Active strategic session."}
            # MODE: ${protocolParams ? "PROTOCOL_SIMULATION" : "READY_ROOM"}
            [RESEARCH_DATA]: ${webData?.answer || "None."}
        `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-8).map((h: any) => ({ role: h.role, content: h.content })),
                    { role: "user", content: message }
                ],
                temperature: protocolParams ? 0.7 : 0.4
            });
            return NextResponse.json({
                role: 'assistant',
                content: response.choices[0].message.content,
                sourceLayer: "NEURAL_STRIKE"
            });
        } catch (e) {
            return NextResponse.json({ role: 'assistant', content: "Neural link fuzzy. Raw intel: " + (webData?.answer || "No signal."), sourceLayer: "ERROR" });
        }
    }

    // 🏁 FALLBACK
    if (!webData && isFactualQuery) {
        const searchLink = `https://www.google.com/search?q=${encodeURIComponent(message)}`;
        return NextResponse.json({
            role: 'assistant',
            content: `I've checked the airwaves, Michael. Signal is weak. You can audit the raw search here: [Google Search](${searchLink})`,
            sourceLayer: "INTERNET (LINK)"
        });
    }

    return NextResponse.json({
        role: 'assistant',
        content: partnerRes || "Standing by. What's the next strategic move?",
        sourceLayer: sourceLayer
    });
}
