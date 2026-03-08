"use client";

import React, { useState } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Task {
    id: string;
    title: string;
    priority: 'HIGH' | 'MED' | 'LOW';
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
    source: string;
    completedAt?: string;
}

interface WinboardProps {
    externalTasks?: Task[];
    setExternalTasks?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Winboard({ externalTasks = [], setExternalTasks }: WinboardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newWin, setNewWin] = useState("");
    const todayWins = externalTasks.filter(t => t.status === 'DONE');

    const handleAddWin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWin.trim() || !setExternalTasks) return;

        const win: Task = {
            id: Date.now().toString(),
            title: newWin.trim(),
            priority: 'HIGH',
            status: 'DONE',
            source: 'MANUAL_TRIUMPH',
            completedAt: new Date().toISOString()
        };

        setExternalTasks(prev => [win, ...prev]);
        setNewWin("");
        setIsAdding(false);

        // 👁️ OBSERVE
        twinPlusKernel.observe(createEvent('TRIUMPH_LOGGED', {
            title: win.title,
            manual: true
        }, 'WINBOARD'));
    };

    return (
        <div className="h-full flex flex-col space-y-8 animate-slide-up pb-20 max-w-5xl mx-auto w-full text-left">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Hall of Triumphs</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Conquering Time // Forward Movement Verified</p>
                </div>
                <div className="flex items-end gap-6">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-accent/10 border border-accent/20 px-4 py-2 text-[8px] font-black text-accent hover:bg-accent hover:text-black transition-all uppercase ripple"
                    >
                        + Record_New_Triumph
                    </button>
                    <div className="text-right">
                        <span className="text-4xl font-black text-neon-green italic shadow-[0_0_15px_rgba(34,197,94,0.2)]">{todayWins.length}</span>
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1">Manifested_Today</p>
                    </div>
                </div>
            </header>

            {isAdding && (
                <div className="hud-panel p-6 bg-accent/5 border-accent/20 relative animate-slide-up">
                    <form onSubmit={handleAddWin} className="flex gap-4">
                        <input
                            autoFocus
                            value={newWin}
                            onChange={(e) => setNewWin(e.target.value)}
                            placeholder="WHAT WAS THE STRATEGIC VICTORY?"
                            className="flex-grow bg-transparent border-b border-white/20 focus:border-accent outline-none text-white italic uppercase placeholder:text-white/10 text-lg"
                        />
                        <button type="submit" className="bg-accent text-black px-8 py-2 text-[10px] font-black uppercase hover:bg-white transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]">Record</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-white/20 text-[8px] font-black uppercase hover:text-white transition-colors">Cancel</button>
                    </form>
                    <div className="bracket-tl" /><div className="bracket-br" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {todayWins.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <p className="system-text text-[12px] text-white/20 font-black tracking-[0.4em] mb-2 uppercase">AWAITING_STRATEGIC_MOMENTUM</p>
                        <p className="text-[8px] text-white/10 font-bold uppercase italic">Execute objectives to populate the ledger of triumphs.</p>
                    </div>
                ) : (
                    todayWins.map(win => (
                        <div key={win.id} className="hud-panel p-6 bg-black/40 border-neon-green/10 relative group hover:border-neon-green/40 transition-all overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="text-4xl font-black italic text-neon-green">WIN</span>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-3 w-3 rounded-full bg-neon-green shadow-[0_0_15px_#22c55e] animate-pulse" />
                                <div className="h-px flex-grow bg-gradient-to-r from-neon-green/40 to-transparent" />
                                <span className="text-[8px] text-neon-green font-black tracking-widest uppercase italic">Verified_{win.source === 'MANUAL_TRIUMPH' ? 'Manifest' : 'Objective'}</span>
                            </div>

                            <h3 className="text-xl font-bold italic text-white leading-tight mb-8 uppercase tracking-wide group-hover:text-neon-green transition-colors">
                                {win.title}
                            </h3>

                            <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Completed At: {win.completedAt ? new Date(win.completedAt).toLocaleTimeString() : 'N/A'}</span>
                                    <span className="text-[8px] text-accent font-black uppercase tracking-widest">Sovereign_Identity_Reinforced</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-white/40 font-black italic">+ MOMENTUM</span>
                                </div>
                            </div>

                            <div className="bracket-tl border-neon-green/30" />
                            <div className="bracket-br border-neon-green/30" />
                        </div>
                    ))
                )}
            </div>

            {/* MOMENTUM TRACKER */}
            <div className="mt-12 p-10 border border-white/5 bg-white/[0.01] rounded-xl relative group">
                <div className="flex justify-between items-center mb-6">
                    <p className="system-text text-[10px] text-white/40 font-black tracking-[0.4em] uppercase">The Momentum Arc</p>
                    <span className="text-[8px] text-neon-green font-black uppercase tracking-widest italic">{todayWins.length >= 5 ? 'PEAK_PERFORMANCE' : 'BUILDING_GRAVITY'}</span>
                </div>
                <div className="flex justify-between gap-1">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-4 flex-grow rounded-sm transition-all duration-500 ${
                                i < todayWins.length ?
                                'bg-neon-green shadow-[0_0_15px_#22c55e] opacity-100' :
                                'bg-white/5 opacity-40 group-hover:bg-white/10'
                            }`}
                        />
                    ))}
                </div>
                <div className="mt-4 flex justify-between text-[7px] font-bold text-white/20 uppercase tracking-[0.5em]">
                    <span>Ground</span>
                    <span>Triumph</span>
                    <span>Peak</span>
                </div>
                <div className="bracket-tl opacity-10" /><div className="bracket-br opacity-10" />
            </div>
        </div>
    );
}
