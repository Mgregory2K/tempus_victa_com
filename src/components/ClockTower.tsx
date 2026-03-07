// src/components/ClockTower.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { TwinEvent } from '@/core/twin_plus/twin_event';

interface ClockTowerProps {
    onNavigate?: (module: string) => void;
}

export default function ClockTower({ onNavigate }: ClockTowerProps) {
    const [events, setEvents] = useState<TwinEvent[]>([]);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        const updateEvents = () => {
            const allEvents = twinPlusKernel.ledger.query({});
            setEvents([...allEvents].reverse());
        };

        updateEvents();
        const interval = setInterval(updateEvents, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    const filteredEvents = filter === 'ALL'
        ? events
        : events.filter(e => {
            const typeStr = String(e.type || "");
            return typeStr.includes(filter) || e.surface === filter;
        });

    const getEventColor = (type: any) => {
        const typeStr = String(type || "");
        if (typeStr.includes('ERROR')) return 'text-red-500';
        if (typeStr.includes('ACTION')) return 'text-neon-green';
        if (typeStr.includes('SIGNAL')) return 'text-accent';
        if (typeStr.includes('PROTOCOL')) return 'text-purple-400';
        return 'text-white/60';
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-slide-up">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Sovereign Ledger</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Immutable Neural Record // v1.1</p>
                </div>
                <div className="flex gap-2">
                    {['ALL', 'SIGNAL', 'ACTION', 'WINBOARD', 'CORKBOARD'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-[8px] font-black border ${filter === f ? 'bg-accent border-accent text-black' : 'border-white/10 text-white/40'} transition-all`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-grow overflow-y-auto scrollbar-thin space-y-2 pr-2">
                {filteredEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center opacity-20 italic text-sm">
                        No events recorded in this session.
                    </div>
                ) : (
                    filteredEvents.map((event, idx) => (
                        <div key={idx} className="hud-panel p-3 bg-white/[0.02] border-white/5 flex items-start gap-4 group hover:border-white/20 transition-all">
                            <div className="flex flex-col items-center min-w-[80px] border-r border-white/5 pr-4">
                                <span className="text-[9px] font-black text-white/20">
                                    {new Date(event.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className="text-[7px] font-bold text-white/10 uppercase tracking-tighter">
                                    {new Date(event.ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>

                            <div className="flex-grow space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black tracking-widest ${getEventColor(event.type)}`}>
                                        {String(event.type)}
                                    </span>
                                    <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-white/5 text-white/40 font-black uppercase">
                                        {event.surface}
                                    </span>
                                </div>
                                <div className="text-[11px] text-white/70 font-mono break-all line-clamp-2 group-hover:line-clamp-none transition-all">
                                    {JSON.stringify(event.payload)}
                                </div>
                            </div>

                            <div className="bracket-tl opacity-10 group-hover:opacity-30" />
                            <div className="bracket-br opacity-10 group-hover:opacity-30" />
                        </div>
                    ))
                )}
            </div>

            <footer className="pt-4 border-t border-white/10 flex justify-between items-center opacity-40">
                <span className="system-text text-[8px] font-black">ENTROPY LEVEL: {(events.length * 0.12).toFixed(2)}%</span>
                <span className="system-text text-[8px] font-black uppercase tracking-[0.2em]">IDENTITY_SURFACE // KERNEL_LOG</span>
            </footer>
        </div>
    );
}
