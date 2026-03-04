import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, apiKey, localContext } = await req.json();

    // 1. LOCAL LOGIC (Mocked)
    // In a real scenario, this would check a local DB or file-based knowledge.
    if (message.toLowerCase().includes("what is tempus victa")) {
        return NextResponse.json({
            role: "assistant",
            content: "Tempus Victa is a local-first cognitive OS. I am the Ready Room, your interface to the Doctrine engine. I optimize your life by reducing entropy through behavioral modeling (Twin+)."
        });
    }

    // 2. INTERNET LOGIC (Mocked / Search API)
    // If not local, we would typically call a search API here (e.g., Tavily, Serper, or Brave).
    // For this prototype, we'll simulate a web response if no API key is provided but it's a general query.
    if (!apiKey && message.toLowerCase().includes("google")) {
        return NextResponse.json({
            role: "assistant",
            content: "[WEB SOURCE] Google is a multinational technology company that specializes in Internet-related services and products, which include online advertising technologies, a search engine, cloud computing, software, and hardware."
        });
    }

    // 3. AI LOGIC (GPT-4o)
    if (apiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Using the latest high-fidelity model
          messages: [
            { role: "system", content: "You are Twin+, the high-intelligence assistant to Tempus Victa. You are concise, tactical, and act as an executive partner. You have access to the internet (simulated) and behavioral logs. You speak with authority but respect user sovereignty." },
            { role: "user", content: message }
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
          return NextResponse.json({ role: "assistant", content: `[AI ERROR] ${data.error.message}` }, { status: 400 });
      }

      return NextResponse.json({
        role: "assistant",
        content: data.choices[0].message.content
      });
    }

    // Fallback if no local match and no AI
    return NextResponse.json({
      role: "assistant",
      content: `Acknowledged. Recording signal: "${message}". AI is currently disabled. Please provide an API key in Settings to escalate this query to Twin+ Neural Layers.`
    });

  } catch (error: any) {
    return NextResponse.json({ role: "assistant", content: "System Error: Neural pipeline desynchronized." }, { status: 500 });
  }
}
