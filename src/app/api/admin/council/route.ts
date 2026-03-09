// src/app/api/admin/council/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

/**
 * SOVEREIGN COUNCIL API v3.4
 * Objective: Manage the high council (admins) and mind-link collaborators.
 * Storage: tv_shared_registry.json in appDataFolder.
 */

async function getRegistry(drive: any) {
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
    return content.data;
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

export async function GET(req: Request) {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ access_token: token.accessToken as string });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const registry = await getRegistry(drive);
        // Fallback to env admins if registry is empty
        if (registry.admins.length === 0) {
            const envAdmins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
            registry.admins = envAdmins;
        }
        return NextResponse.json(registry);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch registry' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, email, type } = body; // action: ADD|REMOVE, type: ADMIN|COLLABORATOR

    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ access_token: token.accessToken as string });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const registry = await getRegistry(drive);

        // Root Authority Fallback
        if (registry.admins.length === 0) {
            registry.admins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
        }

        // Security: Only current admins can modify the council
        if (!registry.admins.includes(token.email?.toLowerCase())) {
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
        return NextResponse.json({ error: 'Failed to update registry' }, { status: 500 });
    }
}
