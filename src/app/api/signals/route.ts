// src/app/api/signals/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

/**
 * EXTERNAL SIGNALS API v3.4 - GMAIL & SHEETS INTELLIGENCE
 * J5 polls the newly enabled nodes to surface unread signals and sheet updates.
 */

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'Auth_Link_Severed' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: token.accessToken as string });

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Poll Gmail for Unread Summary
    const gmailRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread category:primary',
        maxResults: 5
    });

    const unreadCount = gmailRes.data.resultSizeEstimate || 0;
    const recentMessages = await Promise.all((gmailRes.data.messages || []).map(async (m) => {
        const detail = await gmail.users.messages.get({ userId: 'me', id: m.id! });
        const subject = detail.data.payload?.headers?.find(h => h.name === 'Subject')?.value || "No Subject";
        const from = detail.data.payload?.headers?.find(h => h.name === 'From')?.value || "Unknown";
        return { id: m.id, subject, from, snippet: detail.data.snippet };
    }));

    // 2. Poll Sheets/Drive for Recent Activity
    // We look for spreadsheets modified in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const sheetsRes = await drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.spreadsheet' and modifiedTime > '${yesterday.toISOString()}'`,
        fields: 'files(id, name, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 5
    });

    return NextResponse.json({
        gmail: {
            unreadCount,
            signals: recentMessages
        },
        sheets: {
            activeFiles: sheetsRes.data.files || []
        },
        timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[SIGNAL POLL ERROR]:', error.message);
    return NextResponse.json({ error: 'Signal_Bay_Timeout' }, { status: 500 });
  }
}
