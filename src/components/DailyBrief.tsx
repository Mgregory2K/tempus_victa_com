// src/components/DailyBrief.tsx
"use client";

import React, { useState, useEffect } from 'react';
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

export default function DailyBrief() {
    const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeBlocked, setTimeBlocked] = useState(0);

    useEffect(() => {
        const fetchAndAnalyze = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/calendar');
                if (response.ok) {
                    const allEvents: Event[] = await response.json();
                    const eventsForToday = allEvents.filter(e => !isAllDayEvent(e) && isToday(getStartDateTime(e)));
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

    const MetricCard = ({ title, value, subValue, gradient }: { title: string, value: string, subValue?: string, gradient: string }) => (
        <div className={`hud-panel p-4 overflow-hidden relative group`}>
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${gradient}`} />
            <div className="relative z-10">
                <span className="system-text text-[8px] text-white/60 font-black tracking-widest block mb-1">{title}</span>
                <span className="text-2xl font-black text-white italic block leading-none">{value}</span>
                {subValue && <span className="text-[10px] text-white/40 font-bold block mt-1 uppercase tracking-tighter">{subValue}</span>}
            </div>
            <div className="bracket-tl opacity-40" />
            <div className="bracket-br opacity-40" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Top Metrics Row */}
            <section className="grid grid-cols-2 gap-4">
                <MetricCard
                    title="Time Unlocked"
                    value={loading ? "..." : formatMinutes(timeBlocked)}
                    subValue="vs yesterday"
                    gradient="from-blue-600 to-cyan-400"
                />
                <MetricCard
                    title="Bullshit Avoided"
                    value="12 items"
                    subValue="Noise Neutralized"
                    gradient="from-orange-600 to-amber-400"
                />
            </section>

            {/* Secondary Metric */}
            <section>
                <div className="hud-panel p-4 flex items-center justify-between bg-black/40 border-white/5 relative">
                    <div>
                        <span className="system-text text-[8px] text-white/60 font-black tracking-widest block mb-1">Headaches Dodged</span>
                        <span className="text-3xl font-black text-white italic">5</span>
                    </div>
                    <div className="h-16 w-32 bg-white/5 rounded flex items-center justify-center border border-white/10 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-pulse" />
                         <span className="text-[8px] text-white/20 font-black uppercase">Optimization Graph</span>
                    </div>
                </div>
            </section>

            {/* Today's Focus */}
            <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h2 className="system-text text-sm font-black tracking-widest">Today's Focus</h2>
                    <span className="text-[10px] text-accent font-black italic cursor-pointer">View All</span>
                </div>

                <Calendar events={todaysEvents} />

                {/* Category Toggles */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                    {['Health', 'Admin', 'Family'].map((cat, idx) => (
                        <button key={cat} className={`py-3 px-2 border-t-2 transition-all flex flex-col items-center gap-1 ${idx === 0 ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/[0.02]'}`}>
                            <div className={`h-4 w-4 rounded-sm ${idx === 0 ? 'bg-accent' : idx === 1 ? 'bg-orange-500' : 'bg-purple-500'} opacity-60`} />
                            <span className="system-text text-[8px] font-black text-white/40">{cat}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
