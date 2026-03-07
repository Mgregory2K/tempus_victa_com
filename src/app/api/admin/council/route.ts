// src/app/api/admin/council/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * SHARED SOVEREIGN COUNCIL API v1.1
 * Diagnostics: Added console logging for server-side debugging.
 * Resilience: Moved file to root to bypass directory permission issues.
 */

const COUNCIL_FILE = path.join(process.cwd(), 'authorized_council.json');

export async function GET() {
    try {
        if (!fs.existsSync(COUNCIL_FILE)) {
            console.log("[COUNCIL]: File missing. Initializing empty.");
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(COUNCIL_FILE, 'utf8');
        return NextResponse.json(JSON.parse(data));
    } catch (e: any) {
        console.error("[COUNCIL ERROR]:", e.message);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { emails } = body;

        if (!Array.isArray(emails)) return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

        fs.writeFileSync(COUNCIL_FILE, JSON.stringify(emails.map(e => e.toLowerCase().trim()), null, 2));
        console.log("[COUNCIL]: Update Successful.");
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[COUNCIL ERROR]:", e.message);
        return NextResponse.json({ error: 'Sovereign Write Failure' }, { status: 500 });
    }
}
