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
            source: 'MANUAL_ENTRY',
            completedAt: new Date().toISOString()
        };

        setExternalTasks(prev => [win, ...prev]);
        setNewWin("");
        setIsAdding(false);

        twinPlusKernel.observe(createEvent('TASK_COMPLETED', {
            id: win.id,
            title: win.title,
            source: 'WINBOARD_DIRECT'
        }, 'WINBOARD'));
    };

    return (
        <div className="h-full flex flex-col space-y-8 animate-slide-up pb-20 max-w-5xl mx-auto w-full text-left">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Win Board</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Daily Triumphs // Identity Reinforcement</p>
                </div>
                <div className="flex items-end gap-6">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-accent/10 border border-accent/20 px-4 py-2 text-[8px] font-black text-accent hover:bg-accent hover:text-black transition-all uppercase ripple"
                    >
                        + Log_New_Triumph
                    </button>
                    <div className="text-right">
                        <span className="text-4xl font-black text-accent">{todayWins.length}</span>
                        <p className="text-[8px] text-white/20 font-bold uppercase">MANIFESTED_TODAY</p>
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
                            placeholder="WHAT DID YOU CONQUER TODAY?"
                            className="flex-grow bg-transparent border-b border-white/20 focus:border-accent outline-none text-white italic uppercase placeholder:text-white/10"
                        />
                        <button type="submit" className="bg-accent text-black px-6 py-2 text-[10px] font-black uppercase hover:bg-white transition-all">Record</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-white/20 text-[8px] font-black uppercase">Cancel</button>
                    </form>
                    <div className="bracket-tl" /><div className="bracket-br" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {todayWins.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <p className="system-text text-[12px] text-white/20 font-black tracking-[0.4em] mb-2 uppercase">NO_WINS_LOGGED_IN_CURRENT_CYCLE</p>
                        <p className="text-[8px] text-white/10 font-bold uppercase italic">Execute objectives in PROJECT BOARD to manifest wins.</p>
                    </div>
                ) : (
                    todayWins.map(win => (
                        <div key={win.id} className="hud-panel p-6 bg-black/40 border-neon-green/10 relative group hover:border-neon-green/40 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-3 w-3 rounded-full bg-neon-green shadow-[0_0_15px_#22c55e] animate-pulse" />
                                <div className="h-px flex-grow bg-gradient-to-r from-neon-green/40 to-transparent" />
                                <span className="text-[8px] text-neon-green font-black tracking-widest uppercase italic">Verified_Win</span>
                            </div>

                            <h3 className="text-xl font-bold italic text-white/90 leading-tight mb-6 uppercase">
                                {win.title}
                            </h3>

                            <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                <div>
                                    <p className="system-text text-[8px] font-black text-white/40 uppercase tracking-tighter">Source: {win.source}</p>
                                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1">Impact: High</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-accent font-black tracking-widest">+20 COGNITIVE_XP</span>
                                </div>
                            </div>

                            <div className="bracket-tl border-neon-green/30" />
                            <div className="bracket-br border-neon-green/30" />
                        </div>
                    ))
                )}
            </div>

            {todayWins.length > 0 && (
                <div className="mt-12 p-8 border border-white/5 bg-white/[0.01] rounded-xl text-center">
                    <p className="system-text text-[10px] text-white/40 font-black tracking-[0.3em] mb-4">MOMENTUM_STREAK</p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-8 w-1.5 rounded-full ${i <= todayWins.length ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : 'bg-white/5'}`} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
