// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';
import { refreshAccessToken } from '@/lib/auth-utils';

/**
 * MOTHERSHIP SYNC v7.3 - SOVEREIGN IDENTITY & PROACTIVE AUTH
 * Objective: Return defaults for bootstrap files to prevent 404 loops during first-run.
 */

const ALLOWED_FILES = new Set([
    'identity_memory.json',
    'session_state.json',
    'pattern_signals.json',
    'memory_archive.json',
    'tasks.json',
    'chats.json',
    'quotes.json',
    'wishes.json',
    'notes.json',
    'shared_lists.json',
    'mirror_state.json',
    'twin_manifest.json',
    'committed_memory.json',
    'durable_facts.json',
    'relationships.json',
    'generic_projection.json',
    'gemini_projection.json',
    'behavioral_patterns.json',
    'promotion_rules.json'
]);

// Map of default content for core bootstrap files to prevent 404 errors on fresh accounts
const FILE_DEFAULTS: Record<string, any> = {
    'twin_manifest.json': { twin_id: 'pending_anchor', version: '1.0', created_at: new Date().toISOString() },
    'committed_memory.json': [],
    'gemini_projection.json': {},
    'durable_facts.json': [],
    'identity_memory.json': {}
};

async function getAuthorizedDrive(token: any, req: Request) {
    let currentToken = token;
    const isExpired = Date.now() >= (currentToken.expiresAt as number * 1000) - 30000;

    if (isExpired) {
        console.log("[Sync] Access token expired. Refreshing...");
        currentToken = await refreshAccessToken(currentToken);
        if (currentToken.error) throw new Error("PROACTIVE_REFRESH_FAILED");
    }

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: currentToken.accessToken as string });
    return google.drive({ version: 'v3', auth });
}

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('file');

  if (!filename || !ALLOWED_FILES.has(filename)) {
      return NextResponse.json({ error: 'Forbidden_Filename' }, { status: 403 });
  }

  try {
    const drive = await getAuthorizedDrive(token, req);
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: `name = '${filename}'`,
      fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];

    if (!file) {
        // If file is missing but has a default, return the default instead of 404
        if (FILE_DEFAULTS[filename] !== undefined) {
            console.log(`[Sync] Returning default for missing file: ${filename}`);
            return NextResponse.json(FILE_DEFAULTS[filename]);
        }
        return NextResponse.json({ message: 'Not_Found' }, { status: 404 });
    }

    const content = await drive.files.get({ fileId: file.id!, alt: 'media' });
    return NextResponse.json(content.data);
  } catch (error: any) {
    console.error("[Sync] GET Error:", error.message || error);
    if (error.message === "PROACTIVE_REFRESH_FAILED") {
        return NextResponse.json({ error: 'Auth_Session_Expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Sync_Failure' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('file');

  if (!filename || !ALLOWED_FILES.has(filename)) {
      return NextResponse.json({ error: 'Forbidden_Filename' }, { status: 403 });
  }

  let incomingData;
  try {
      incomingData = await req.json();
  } catch (e) {
      return NextResponse.json({ error: 'Invalid_JSON' }, { status: 400 });
  }

  try {
    const drive = await getAuthorizedDrive(token, req);
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: `name = '${filename}'`,
      fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(incomingData),
    };

    if (file) {
      await drive.files.update({ fileId: file.id!, media: media });
    } else {
      await drive.files.create({
        requestBody: { name: filename, parents: ['appDataFolder'] },
        media: media,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Sync] POST Error:", error.message || error);
    if (error.message === "PROACTIVE_REFRESH_FAILED") {
        return NextResponse.json({ error: 'Auth_Session_Expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Transmission_Failure' }, { status: 500 });
  }
}
