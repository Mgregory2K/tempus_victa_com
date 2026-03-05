// src/app/api/notion/push/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { type, content, author, notionKey } = await req.json();

        if (!notionKey) {
            return NextResponse.json({ error: "Notion key missing" }, { status: 400 });
        }

        // Search for a "Tempus Victa" workspace/database or create a page
        // For Phase 1.0, we will push to a "Sovereign Intelligence" page

        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { type: "workspace", workspace: true }, // Simple push to root if allowed
                properties: {
                    title: [
                        {
                            text: {
                                content: `[TV_SIGNAL] ${type}: ${new Date().toLocaleDateString()}`
                            }
                        }
                    ]
                },
                children: [
                    {
                        object: "block",
                        type: "heading_2",
                        heading_2: {
                            rich_text: [{ text: { content: "Crystallized Intelligence" } }]
                        }
                    },
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [{
                                text: { content: content },
                                annotations: { italic: true, bold: true }
                            }]
                        }
                    },
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [{ text: { content: `— Source: ${author || 'Twin+ OS'}` } }]
                        }
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.message || "Notion push failed" }, { status: response.status });
        }

        return NextResponse.json({ success: true, url: data.url });
    } catch (error) {
        console.error("Notion Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
