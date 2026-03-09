// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

/**
 * MOTHERSHIP SYNC v3.4 - GROW-ONLY RECOVERY ENGINE
 * Objective: Guarantee the sacred chat log and board data is never deleted.
 * Logic: Fetch existing ledger -> Merge incoming data -> Save unique set.
 */

function mergeUniqueById(existing: any[] = [], incoming: any[] = []) {
    const map = new Map();
    // Use ID as the unique key to prevent duplicates while preserving history
    [...(existing || []), ...(incoming || [])].forEach(item => {
        if (item && item.id) {
            // If item already exists, we could implement a deep merge or 'latest-wins'
            // For now, we preserve the existing one to prevent 'wipe' issues,
            // but update with incoming if it's more recent (timestamp check).
            const existingItem = map.get(item.id);
            if (!existingItem || (item.timestamp && item.timestamp > (existingItem.timestamp || ''))) {
                map.set(item.id, item);
            }
        }
    });
    return Array.from(map.values());
}

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'Auth_Link_Severed' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: token.accessToken as string });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: "name = 'tv_sovereign_ledger.json'",
      fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];
    if (!file) return NextResponse.json({ message: 'Ledger_Not_Found' }, { status: 404 });

    const content = await drive.files.get({
      fileId: file.id!,
      alt: 'media',
    });

    return NextResponse.json(content.data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Mothership_Handshake_Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const incomingData = await req.json();

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'Auth_Link_Severed' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: token.accessToken as string });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 1. Find existing ledger
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: "name = 'tv_sovereign_ledger.json'",
      fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];
    let existingData: any = {};

    // 2. If ledger exists, perform a SAFE MERGE
    if (file) {
      const content = await drive.files.get({ fileId: file.id!, alt: 'media' });
      existingData = content.data || {};
    }

    // GROW-ONLY MERGE LOGIC
    // We never delete. We only add or update.
    const mergedData = {
        ...existingData,
        tasks: mergeUniqueById(existingData.tasks, incomingData.tasks),
        messages: mergeUniqueById(existingData.messages, incomingData.messages),
        notes: mergeUniqueById(existingData.notes, incomingData.notes),
        quotes: mergeUniqueById(existingData.quotes, incomingData.quotes),
        wishes: mergeUniqueById(existingData.wishes, incomingData.wishes),
        config: { ...(existingData.config || {}), ...(incomingData.config || {}) },
        mind: incomingData.mind || existingData.mind, // Kernel mind snapshot
        lastSync: new Date().toISOString()
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(mergedData),
    };

    if (file) {
      await drive.files.update({ fileId: file.id!, media: media });
    } else {
      await drive.files.create({
        requestBody: { name: 'tv_sovereign_ledger.json', parents: ['appDataFolder'] },
        media: media,
      });
    }

    return NextResponse.json({ success: true, merged: true });
  } catch (error: any) {
    console.error('[SYNC ERROR]:', error.message);
    return NextResponse.json({ error: 'Mothership_Transmission_Failed' }, { status: 500 });
  }
}
