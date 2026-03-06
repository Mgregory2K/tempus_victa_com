// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: token.accessToken as string });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 1. Find the Tempus Victa ledger file in AppData
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: "name = 'tv_sovereign_ledger.json'",
      fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];

    if (!file) {
      return NextResponse.json({ message: 'No ledger found' }, { status: 404 });
    }

    // 2. Download the ledger
    const content = await drive.files.get({
      fileId: file.id!,
      alt: 'media',
    });

    return NextResponse.json(content.data);
  } catch (error) {
    console.error('Sync Download Failed', error);
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const ledgerData = await req.json();

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: token.accessToken as string });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 1. Check if file exists
    const list = await drive.files.list({
      spaces: 'appDataFolder',
      q: "name = 'tv_sovereign_ledger.json'",
      fields: 'files(id, name)',
    });

    const file = list.data.files?.[0];

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(ledgerData),
    };

    if (file) {
      // Update existing
      await drive.files.update({
        fileId: file.id!,
        media: media,
      });
    } else {
      // Create new
      await drive.files.create({
        requestBody: {
          name: 'tv_sovereign_ledger.json',
          parents: ['appDataFolder'],
        },
        media: media,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync Upload Failed', error);
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}
