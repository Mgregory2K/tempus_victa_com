// src/app/api/admin/council/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

/**
 * SOVEREIGN COUNCIL API v3.5
 * Objective: Manage the high council (admins) and mind-link collaborators.
 * Storage: tv_shared_registry.json in appDataFolder.
 *
 * FIX v3.5: Hardened JSON parsing and Drive response handling to prevent 500 errors.
 */

async function getRegistry(drive: any) {
    try {
        const list = await drive.files.list({
            spaces: 'appDataFolder',
            q: "name = 'tv_shared_registry.json'",
            fields: 'files(id, name)',
        });

        const file = list.data.files?.[0];
        if (!file) return { admins: [], collaborators: [] };

        const content = await drive.files.get({
            fileId: file.id!,
            alt: 'media',
        });

        let data = content.data;

        // googleapis can return data as an object, string, or stream depending on environment
        if (typeof data === 'string' && data.trim()) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Council Registry: Failed to parse string data", e);
                return { admins: [], collaborators: [] };
            }
        } else if (typeof data !== 'object' || data === null) {
            // Handle unexpected data types (e.g. empty or streams)
            console.warn("Council Registry: Unexpected data type from Drive", typeof data);
            return { admins: [], collaborators: [] };
        }

        return {
            admins: Array.isArray(data.admins) ? data.admins : [],
            collaborators: Array.isArray(data.collaborators) ? data.collaborators : []
        };
    } catch (error) {
        console.error("Council Registry: Error in getRegistry", error);
        return { admins: [], collaborators: [] };
    }
}

async function saveRegistry(drive: any, data: any) {
    const list = await drive.files.list({
        spaces: 'appDataFolder',
        q: "name = 'tv_shared_registry.json'",
        fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];
    const media = {
        mimeType: 'application/json',
        body: JSON.stringify(data),
    };

    if (file) {
        await drive.files.update({ fileId: file.id!, media: media });
    } else {
        await drive.files.create({
            requestBody: { name: 'tv_shared_registry.json', parents: ['appDataFolder'] },
            media: media,
        });
    }
}

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Council Registry: Missing Google Credentials");
        return NextResponse.json({ error: 'System_Configuration_Error' }, { status: 500 });
    }

    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ access_token: token.accessToken as string });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const registry = await getRegistry(drive);

        // Fallback to env admins if registry is empty
        if (registry.admins.length === 0) {
            const envAdmins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
            registry.admins = envAdmins.filter(e => e.length > 0);
        }

        return NextResponse.json(registry);
    } catch (e) {
        console.error("Council Registry: GET 500", e);
        return NextResponse.json({ error: 'Failed to fetch registry' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, email, type } = body;

    if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Invalid_Request: Missing email' }, { status: 400 });
    }

    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ access_token: token.accessToken as string });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const registry = await getRegistry(drive);

        // Root Authority Fallback
        if (registry.admins.length === 0) {
            registry.admins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
        }

        // Security: Only current admins can modify the council
        const userEmail = token.email?.toLowerCase();
        if (!userEmail || !registry.admins.includes(userEmail)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const targetEmail = email.toLowerCase().trim();

        if (type === 'ADMIN') {
            if (action === 'ADD') {
                if (!registry.admins.includes(targetEmail)) registry.admins.push(targetEmail);
            } else {
                registry.admins = registry.admins.filter((e: string) => e !== targetEmail);
            }
        } else if (type === 'COLLABORATOR') {
            if (action === 'ADD') {
                if (!registry.collaborators.find((c: any) => c.email === targetEmail)) {
                    registry.collaborators.push({ email: targetEmail, role: 'EDITOR', addedAt: new Date().toISOString() });
                }
            } else {
                registry.collaborators = registry.collaborators.filter((c: any) => c.email !== targetEmail);
            }
        }

        await saveRegistry(drive, registry);
        return NextResponse.json(registry);
    } catch (e) {
        console.error("Council Registry: POST 500", e);
        return NextResponse.json({ error: 'Failed to update registry' }, { status: 500 });
    }
}
