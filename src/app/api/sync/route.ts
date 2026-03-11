// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

/**
 * MOTHERSHIP SYNC v5.1 - HARDENED PERSISTENCE
 */

const ALLOWED_FILES = [
    'identity_memory.json',
    'session_state.json',
    'pattern_signals.json',
    'memory_archive.json',
    'tasks.json',
    'tv_sovereign_ledger.json'
];

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('file') || 'tv_sovereign_ledger.json';

  if (!ALLOWED_FILES.includes(filename)) {
      return NextResponse.json({ error: 'Forbidden_Filename' }, { status: 403 });
  }

  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: token.accessToken as string });
  const drive = google.drive({ version: 'v3', auth });

  try {
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: `name = '${filename}'`,
      fields: 'files(id, name)',
    });
    const file = list.data.files?.[0];
    if (!file) return NextResponse.json({ message: 'Not_Found' }, { status: 404 });

    const content = await drive.files.get({ fileId: file.id!, alt: 'media' });
    return NextResponse.json(content.data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Sync_Failure' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('file') || 'tv_sovereign_ledger.json';

  if (!ALLOWED_FILES.includes(filename)) {
      return NextResponse.json({ error: 'Forbidden_Filename' }, { status: 403 });
  }

  let incomingData;
  try {
      incomingData = await req.json();
  } catch (e) {
      return NextResponse.json({ error: 'Invalid_JSON' }, { status: 400 });
  }

  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: token.accessToken as string });
  const drive = google.drive({ version: 'v3', auth });

  try {
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
    return NextResponse.json({ error: 'Transmission_Failure' }, { status: 500 });
  }
}
