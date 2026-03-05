// src/app/api/calendar/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
        access_token: token.accessToken as string,
        refresh_token: token.refreshToken as string
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      maxResults: 25,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json(response.data.items || []);

  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    // If it's a 401, the token is definitely dead and needs re-auth
    if (error.code === 401) {
        return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
