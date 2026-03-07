// src/app/api/admin/council/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * SHARED SOVEREIGN COUNCIL API v1.0
 * Stores the list of authorized admins on the server filesystem.
 * This list is SHARED across all users of this specific deployment.
 */

const COUNCIL_FILE = path.join(process.cwd(), 'data', 'authorized_council.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(COUNCIL_FILE))) {
    fs.mkdirSync(path.dirname(COUNCIL_FILE), { recursive: true });
}

export async function GET() {
    try {
        if (!fs.existsSync(COUNCIL_FILE)) return NextResponse.json([]);
        const data = fs.readFileSync(COUNCIL_FILE, 'utf8');
        return NextResponse.json(JSON.parse(data));
    } catch (e) {
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { emails } = body;

        if (!Array.isArray(emails)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

        fs.writeFileSync(COUNCIL_FILE, JSON.stringify(emails.map(e => e.toLowerCase().trim()), null, 2));
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update council' }, { status: 500 });
    }
}
