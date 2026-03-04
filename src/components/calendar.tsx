// src/components/calendar.tsx
"use client";

import React from 'react';
import { Event } from './DailyBrief';

// A single calendar event item - RESTORED AESTHETIC
const EventItem = ({ summary, startTime, isPast }: { summary: string, startTime: string, isPast: boolean }) => (
  <div className={`flex items-center justify-between p-3 hud-panel bg-black/40 border border-white/5 transition-opacity relative ${isPast ? 'opacity-40' : 'opacity-100'}`}>
    <div className="bracket-tl" />
    <div className="bracket-br" />
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-4 ml-1 ${isPast ? 'bg-white/20' : 'bg-neon-green shadow-[0_0_10px_#22c55e]'}`}></div>
      <div>
        <p className="text-white/90 font-medium system-text">{summary}</p>
        <p className="text-xs text-white/40 font-black tracking-widest">{new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  </div>
);

// The Calendar component now receives events as a prop
export default function Calendar({ events }: { events: Event[] }) {
  const now = new Date();

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.start.dateTime!).getTime() - new Date(b.start.dateTime!).getTime());

  if (sortedEvents.length === 0) {
      return (
        <section>
            <h2 className="system-text text-lg font-black tracking-widest my-4">Today's Focus</h2>
            <p className="text-white/50">No events scheduled for today.</p>
        </section>
      )
  }

  return (
    <section>
      <h2 className="system-text text-lg font-black tracking-widest my-4">Today's Focus</h2>
      <div className="space-y-3">
        {sortedEvents.map(event => (
          <EventItem
            key={event.id}
            summary={event.summary}
            startTime={event.start.dateTime!}
            isPast={new Date(event.start.dateTime!) < now}
          />
        ))}
      </div>
    </section>
  );
}
