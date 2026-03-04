// src/components/DailyBrief.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { TwinEvent } from '@/core/twin_plus/twin_event';
import { v4 as uuidv4 } from 'uuid';
import Calendar from './calendar';

export interface Event {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
}

const isAllDayEvent = (event: Event): boolean => !!event.start.date;
const getStartDateTime = (event: Event): Date => new Date(event.start.dateTime || event.start.date!);

const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const formatMinutes = (minutes: number): string => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

// --- The Restored, Visually Correct Component ---
export default function DailyBrief() {
    const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeBlocked, setTimeBlocked] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);

    useEffect(() => {
        const fetchAndAnalyze = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/calendar');
                if (response.ok) {
                    const allEvents: Event[] = await response.json();
                    const now = new Date();
                    const eventsForToday = allEvents.filter(e => !isAllDayEvent(e) && isToday(getStartDateTime(e)));

                    const pastEvents = eventsForToday.filter(e => getStartDateTime(e) < now);
                    setTasksCompleted(pastEvents.length);
                    setTodaysEvents(eventsForToday);

                    const totalMinutes = eventsForToday.reduce((total, event) => {
                         if (event.start.dateTime && event.end.dateTime) {
                            const start = new Date(event.start.dateTime);
                            const end = new Date(event.end.dateTime);
                            return total + (end.getTime() - start.getTime()) / (1000 * 60);
                        }
                        return total;
                    }, 0);
                    setTimeBlocked(totalMinutes);
                }
            } catch (error) {
                console.error("Failed to fetch calendar for brief", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndAnalyze();
    }, []);

    const HudCard = ({ title, value, subValue, accentColor = 'accent' }: { title: string, value: string, subValue?: string, accentColor?: 'accent' | 'neon-green' }) => (
        <div className={`hud-panel p-4 border-white/5 bg-black/40`}>
            <span className="system-text text-[8px] text-white/40 font-black uppercase tracking-widest">{title}</span>
            <span className="text-2xl font-black text-white italic">{value}</span>
            {subValue && <div className={`h-1 ${accentColor === 'accent' ? 'bg-accent' : 'bg-neon-green'} w-[70%] mt-2`} />}
        </div>
    );

    if (loading) {
        return (
             <section className="grid grid-cols-2 gap-4 my-4">
                <HudCard title="Time Blocked" value="..." />
                <HudCard title="Tasks Cleared" value="..." accentColor="neon-green" />
            </section>
        );
    }

    return (
        <>
            <section className="grid grid-cols-2 gap-4 my-4">
                 <HudCard title="Time Blocked" value={formatMinutes(timeBlocked)} subValue={`${todaysEvents.length} events`} />
                 <HudCard title="Tasks Cleared" value={`${tasksCompleted} items`} accentColor="neon-green" />
            </section>

            <Calendar events={todaysEvents} />
        </>
    );
}
