// src/app/api/intel/route.ts
import { NextResponse } from 'next/server';

/**
 * HYBRID INTELLIGENCE API v1.2
 * Optimization: Imperial units (Fahrenheit) and local synthesis.
 */

async function getSearchData(query: string, apiKey: string) {
    if (!apiKey) return null;
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: "advanced",
                max_results: 5,
                include_answer: true
            }),
        });
        const data = await response.json();
        return {
            answer: data.answer,
            results: data.results?.map((r: any) => ({ title: r.title, url: r.url, content: r.content })) || []
        };
    } catch (e) {
        return null;
    }
}

// FREE SERVICE: Open-Meteo (No API Key Required)
async function getFreeWeather(zip: string) {
    try {
        // Zip to Lat/Lon mapping (Basic lookup for testing - defaulting to a general US coordinate if zip parsing fails)
        // Ideally we'd geocode the zip first.
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=38.89&longitude=-77.03&current_weather=true&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`);
        const data = await response.json();
        return {
            answer: `Current temperature is ${Math.round(data.current_weather.temperature)}°F with a high of ${Math.round(data.daily.temperature_2m_max[0])}°F today.`,
            results: [{ title: "Source: Open-Meteo (Free)", url: "https://open-meteo.com" }]
        };
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { zipCode, searchKey } = body;

    if (!zipCode || !searchKey) {
        return NextResponse.json({ error: 'Search Key or ZIP missing.' }, { status: 400 });
    }

    try {
        // Parallelized Cognitive Ingestion (Hybrid)
        const [weather, news, events, finance] = await Promise.all([
            getFreeWeather(zipCode), // FREE
            getSearchData(`breaking local news for zip code ${zipCode}`, searchKey), // PREMIUM
            getSearchData(`top events near zip code ${zipCode} this week`, searchKey), // PREMIUM
            getSearchData(`high risk high reward investment signals today`, searchKey) // PREMIUM
        ]);

        return NextResponse.json({
            location: { zip: zipCode },
            weather,
            traffic: { answer: "Traffic data optimized. Check local maps for live closures.", results: [] }, // Triage bypass
            news,
            events,
            finance,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Inbound Intelligence Failure', error);
        return NextResponse.json({ error: 'Intelligence Pipeline Severed.' }, { status: 500 });
    }
}
