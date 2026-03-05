// src/app/api/calendar/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
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

    // 1. Get all calendars the user has access to
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. Fetch events from all calendars in parallel
    const allEventPromises = calendars.map(cal =>
        calendar.events.list({
            calendarId: cal.id!,
            timeMin: today.toISOString(),
            timeMax: tomorrow.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        })
    );

    const allEventResponses = await Promise.all(allEventPromises);

    // 3. Merge and de-duplicate events
    const allEvents = allEventResponses.flatMap(res => res.data.items || []);
    const uniqueEvents = Array.from(new Map(allEvents.map(event => [event.id, event])).values());

    // 4. Filter out events the user has declined
    const acceptedEvents = uniqueEvents.filter(event => {
        const self = event.attendees?.find(a => a.self);
        return !self || self.responseStatus !== 'declined';
    });

    // 5. Sort all events by start time
    acceptedEvents.sort((a, b) => {
        const timeA = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
        const timeB = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
        return timeA - timeB;
    });

    return NextResponse.json(acceptedEvents);

  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    if (error.code === 401) {
        return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
