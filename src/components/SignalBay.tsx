// src/components/SignalBay.tsx
"use client";

import React, { useState } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Signal {
    id: string;
    source: string;
    content: string;
    trustScore: number;
    timestamp: string;
    type: 'COMM' | 'SYSTEM' | 'INTEL' | 'ALERT';
    actionTaken: boolean;
    isSnoozed?: boolean;
}

interface SignalBayProps {
    onRouteToCorkboard?: (signal: Signal) => void;
    onRouteToTask?: (signal: Signal) => void;
}

export default function SignalBay({ onRouteToCorkboard, onRouteToTask }: SignalBayProps) {
    const [signals, setSignals] = useState<Signal[]>([
        { id: '1', source: 'Jen', content: 'Did you see the mail about the property tax?', trustScore: 0.98, timestamp: '10:45 AM', type: 'COMM', actionTaken: false },
        { id: '2', source: 'System', content: 'Neural key rotation required in 48h.', trustScore: 1.0, timestamp: '09:30 AM', type: 'SYSTEM', actionTaken: false },
        { id: '3', source: 'Wrike P2', content: 'New task: Ingest Volume IV specs.', trustScore: 0.85, timestamp: '08:15 AM', type: 'INTEL', actionTaken: true },
        { id: '4', source: 'Unknown', content: 'Click here to claim your reward!', trustScore: 0.05, timestamp: '07:00 AM', type: 'ALERT', actionTaken: false },
    ]);

    const handleRoute = (signal: Signal, destination: 'CORKBOARD' | 'TASK') => {
        setSignals(prev => prev.map(s => s.id === signal.id ? { ...s, actionTaken: true } : s));

        if (destination === 'CORKBOARD') {
            onRouteToCorkboard?.(signal);
            twinPlusKernel.observe(createEvent('SIGNAL_ROUTED', { signalId: signal.id, to: 'CORKBOARD' }, 'SIGNAL_BAY'));
        } else {
            onRouteToTask?.(signal);
            twinPlusKernel.observe(createEvent('SIGNAL_ROUTED', { signalId: signal.id, to: 'PROJECTS' }, 'SIGNAL_BAY'));
        }
    };

    const handleDecay = (id: string) => {
        setSignals(prev => prev.filter(s => s.id !== id));
        twinPlusKernel.observe(createEvent('SIGNAL_DECAYED', { signalId: id }, 'SIGNAL_BAY'));
    };

    const activeSignals = signals.filter(s => !s.isSnoozed);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-32 px-2">
            <header className="flex justify-between items-end border-b border-white/10 pb-4 relative">
                <div className="absolute -top-10 -left-4 opacity-5 pointer-events-none text-6xl font-black italic select-none">INTAKE</div>
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Signal Bay</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1 uppercase">Triage Engine // Active Filtering</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Noise Filtered: 84%</span>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {activeSignals.map(signal => (
                    <div key={signal.id}
                         className={`hud-panel p-6 flex flex-col md:flex-row md:items-center justify-between group transition-all ${signal.trustScore < 0.2 ? 'opacity-30 grayscale' : ''} ${signal.actionTaken ? 'border-neon-green/30 bg-neon-green/[0.02]' : 'border-white/5 bg-black/40'}`}>

                        <div className="flex items-center gap-6 mb-6 md:mb-0">
                            {/* Trust Indicator (Now more tactile) */}
                            <div className="flex flex-col items-center gap-1 min-w-[64px]">
                                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Trust</span>
                                <div className="h-14 w-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                    <div className={`absolute bottom-0 w-full transition-all duration-1000 ${signal.trustScore > 0.8 ? 'bg-neon-green shadow-[0_0_10px_#22c55e]' : signal.trustScore > 0.4 ? 'bg-accent' : 'bg-red-500'}`}
                                         style={{ height: `${signal.trustScore * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-black italic tracking-tighter">{Math.round(signal.trustScore * 100)}%</span>
                            </div>

                            <div className="space-y-2 flex-grow">
                                <div className="flex items-center flex-wrap gap-3">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm tracking-widest uppercase ${signal.type === 'COMM' ? 'bg-blue-500/20 text-blue-400' : signal.type === 'SYSTEM' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'}`}>
                                        {signal.type}
                                    </span>
                                    <span className="system-text text-[10px] font-black text-white/60 tracking-wider uppercase">{signal.source}</span>
                                    <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{signal.timestamp}</span>
                                </div>
                                <p className={`text-xl font-bold italic tracking-tight leading-tight uppercase ${signal.actionTaken ? 'text-white/30' : 'text-white'}`}>
                                    {signal.content}
                                </p>
                            </div>
                        </div>

                        {/* Tactical Actions (Full-width on mobile) */}
                        <div className="flex flex-row md:flex-row gap-2 w-full md:w-auto">
                            {!signal.actionTaken ? (
                                <>
                                    <button onClick={() => handleRoute(signal, 'CORKBOARD')} className="flex-grow md:flex-none px-6 py-4 md:py-2 border-2 border-accent/30 text-accent system-text text-[9px] font-black hover:bg-accent hover:text-black transition-all uppercase shadow-lg">Pin</button>
                                    <button onClick={() => handleRoute(signal, 'TASK')} className="flex-grow md:flex-none px-6 py-4 md:py-2 border-2 border-neon-green/30 text-neon-green system-text text-[9px] font-black hover:bg-neon-green hover:text-white transition-all uppercase shadow-lg">Task</button>
                                    <button onClick={() => handleDecay(signal.id)} className="flex-grow md:flex-none px-6 py-4 md:py-2 border-2 border-white/10 text-white/20 system-text text-[9px] font-black hover:text-white transition-all uppercase shadow-lg">Decay</button>
                                </>
                            ) : (
                                <div className="flex items-center gap-3 px-6 py-4 md:py-2 bg-neon-green/10 border border-neon-green/20 rounded w-full justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                                    <span className="text-neon-green system-text text-[10px] font-black uppercase tracking-widest">Resolved</span>
                                </div>
                            )}
                        </div>

                        <div className="bracket-tl opacity-20" />
                        <div className="bracket-br opacity-20" />
                    </div>
                ))}
                {activeSignals.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <p className="system-text text-[12px] text-white/20 font-black tracking-[0.5em] uppercase">Signals Clear</p>
                        <p className="text-[8px] text-white/10 font-bold uppercase mt-2 italic tracking-widest">Awaiting new neural inputs...</p>
                    </div>
                )}
            </div>

            {/* Bottom Intelligence Summary */}
            <div className="hud-panel p-8 bg-black border-white/5 relative group overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-2">
                        <span className="system-text text-[9px] text-accent font-black tracking-[0.4em] uppercase">Cognitive Load Assessment</span>
                        <p className="text-white/60 text-sm font-light italic uppercase tracking-wide">Signal density is low. Optimal execution environment maintained.</p>
                    </div>
                    <div className="hidden md:flex gap-1.5 h-10 items-end">
                        {[2,5,3,8,4,6,3,2,5,7].map((h, i) => (
                            <div key={i} className="w-1.5 bg-accent/40 rounded-t-sm animate-pulse" style={{ height: `${h*10}%`, animationDelay: `${i*0.1}s` }} />
                        ))}
                    </div>
                </div>
                <div className="bracket-tl border-accent/20" /><div className="bracket-br border-accent/20" />
            </div>
        </div>
    );
}
