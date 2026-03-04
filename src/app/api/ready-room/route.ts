// src/app/api/ready-room/route.ts
import { NextResponse } from 'next/server';

const appKnowledge = {
    "what is the ready room": "The Ready Room is your central command interface for Tempus Victa. You can issue commands, ask questions, and invoke the Ready Room Protocol for advanced simulations.",
    "what is tempus victa": "Tempus Victa is a local-first cognitive operating system designed to turn your life's inputs into structured, actionable intelligence.",
    "what is twin+": "Twin+ is the learning layer of Tempus Victa. It's a local, evolving model of your patterns and preferences that helps the system anticipate and automate tasks.",
    "where do i enter my api key": "You can enter your API keys in the 'Settings' module. This allows you to connect to external services like OpenAI for enhanced AI capabilities.",
};

async function getLocalAnswer(query: string): Promise<string | null> {
    const q = query.toLowerCase().trim();
    return appKnowledge[q as keyof typeof appKnowledge] || null;
}

// --- FIX: Now accepts conversation history for context ---
async function getInternetAnswer(query: string, apiKey: string, history: any[]): Promise<string> {
    try {
        // Construct a conversational query for the search API
        const conversationalQuery = history.map(h => `${h.role}: ${h.content}`).join('\n') + `\nuser: ${query}`;

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: conversationalQuery, // Use the full conversation
                search_depth: "basic",
                max_results: 3,
            }),
        });
        const data = await response.json();

        if (data.answer) {
            return data.answer; // Tavily can provide a direct answer from context
        }

        if (data.results && data.results.length > 0) {
            return data.results.map((r: any) => r.content).join('\n\n');
        }

        return "No relevant information found on the internet.";
    } catch (error) {
        console.error("Tavily search failed:", error);
        return "Failed to access the internet for search.";
    }
}


export async function POST(req: Request) {
    const body = await req.json();
    // --- FIX: Now correctly uses history ---
    const { message, searchKey, history } = body;

    if (!message) {
        return NextResponse.json({ role: 'assistant', content: 'Invalid request.' }, { status: 400 });
    }

    const localAnswer = await getLocalAnswer(message);
    if (localAnswer) {
        return NextResponse.json({ role: 'assistant', content: localAnswer, sourceLayer: 'LOCAL' });
    }

    if (searchKey) {
        const internetAnswer = await getInternetAnswer(message, searchKey, history || []);
        return NextResponse.json({ role: 'assistant', content: internetAnswer, sourceLayer: 'INTERNET' });
    }

    return NextResponse.json({ role: 'assistant', content: "I can't answer that without an internet connection. Please provide a Search API key in Settings.", sourceLayer: 'LOCAL' });
}
