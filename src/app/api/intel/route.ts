// src/app/api/intel/route.ts
import { NextResponse } from 'next/server';

/**
 * INTELLIGENCE API v1.0
 * Fetches localized context and financial signals using Tavily Grounding.
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

export async function POST(req: Request) {
    const body = await req.json();
    const { zipCode, searchKey } = body;

    if (!zipCode || !searchKey) {
        return NextResponse.json({ error: 'Initialization Failed: Search Key or ZIP missing.' }, { status: 400 });
    }

    try {
        // Parallelized Cognitive Ingestion
        const [weather, traffic, news, events, finance] = await Promise.all([
            getSearchData(`current weather and 7 day forecast for zip code ${zipCode}`, searchKey),
            getSearchData(`live traffic accidents and closures near zip code ${zipCode}`, searchKey),
            getSearchData(`breaking local news for zip code ${zipCode}`, searchKey),
            getSearchData(`events and things to do near zip code ${zipCode} for the next 7 days`, searchKey),
            getSearchData(`breaking financial news, high risk high reward stocks and etfs today with delta and risk levels`, searchKey)
        ]);

        return NextResponse.json({
            location: { zip: zipCode },
            weather,
            traffic,
            news,
            events,
            finance,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Cognitive Ingestion Failure', error);
        return NextResponse.json({ error: 'Intelligence Pipeline Severed.' }, { status: 500 });
    }
}
