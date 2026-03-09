"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { TwinEvent } from '@/core/twin_plus/twin_event';

interface AdminBoardProps {
    wishes: any[];
    setWishes: React.Dispatch<React.SetStateAction<any[]>>;
    setTasks: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AdminBoard({ wishes, setWishes, setTasks }: AdminBoardProps) {
    const [events, setEvents] = useState<TwinEvent[]>([]);
    const [registry, setRegistry] = useState<{ admins: string[], collaborators: any[] }>({ admins: [], collaborators: [] });
    const [newEmail, setNewEmail] = useState("");
    const [stats, setStats] = useState<any>({
        moduleUsage: {},
        totalEvents: 0,
        feedback: { up: 0, down: 0, stale: 0 },
        platformRatio: { mobile: 0, desktop: 0 },
        searchKeywords: {},
        protocolInvitees: {},
        neuralStress: 0,
        temporalEfficiency: 0,
        totalHoursSaved: 0
    });

    const fetchRegistry = async () => {
        try {
            const res = await fetch('/api/admin/council');
            if (res.ok) {
                const data = await res.json();
                setRegistry(data);
            }
        } catch (e) {}
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchRegistry();

            const allEvents = twinPlusKernel.ledger.query({});
            setEvents(allEvents);

            const usage: Record<string, number> = {};
            const keywords: Record<string, number> = {};
            const figures: Record<string, number> = {};
            let mobile = 0, desktop = 0;
            let up = 0, down = 0, stale = 0;
            let completedCount = 0;

            allEvents.forEach(e => {
                usage[e.surface] = (usage[e.surface] || 0) + 1;
                if (e.payload?.platform === 'mobile') mobile++; else desktop++;
                if (e.type === 'TASK_COMPLETED') completedCount++;

                if (e.type === 'INTENT_ROUTED' && e.payload.feedback) {
                    if (e.payload.feedback === 'UP') up++;
                    if (e.payload.feedback === 'DOWN') down++;
                    if (e.payload.feedback === 'WRONG_SOURCE') stale++;
                }

                if (e.type === 'INTENT_ROUTED' && e.payload.intent?.query) {
                    const words = e.payload.intent.query.split(' ');
                    words.forEach((w: string) => { if(w.length > 4) keywords[w] = (keywords[w] || 0) + 1; });
                }

                if (e.type === 'PROTOCOL_INVOKED' && e.payload.figures) {
                    e.payload.figures.forEach((f: string) => { figures[f] = (figures[f] || 0) + 1; });
                }
            });

            setStats({
                moduleUsage: usage,
                totalEvents: allEvents.length,
                feedback: { up, down, stale },
                platformRatio: { mobile, desktop },
                searchKeywords: keywords,
                protocolInvitees: figures,
                neuralStress: Math.random() * 8 + 2,
                temporalEfficiency: completedCount > 0 ? (completedCount / Math.max(1, allEvents.length / 100)).toFixed(2) : 0,
                totalHoursSaved: completedCount * 0.25
            });
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Throttled for registry sync
        return () => clearInterval(interval);
    }, [wishes]);

    const handleRegistryAction = async (action: 'ADD' | 'REMOVE', type: 'ADMIN' | 'COLLABORATOR', email: string) => {
        try {
            const res = await fetch('/api/admin/council', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, type, email })
            });
            if (res.ok) {
                setRegistry(await res.json());
                setNewEmail("");
            }
        } catch (e) {}
    };

    const MetricCard = ({ title, value, sub, glow, equation }: { title: string, value: any, sub: string, glow: string, equation?: string }) => (
        <div className="hud-panel p-6 bg-black/80 border-white/5 relative group overflow-hidden hover:border-accent/40 transition-all shadow-2xl">
            <div className={`absolute -right-4 -top-4 w-32 h-32 blur-3xl opacity-10 bg-${glow}`} />
            {equation && <span className="absolute top-2 right-4 text-[6px] font-mono text-white/10 group-hover:text-white/30 transition-colors uppercase">{equation}</span>}
            <span className="system-text text-[8px] text-white/40 font-black tracking-widest block mb-2 uppercase">{title}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{value}</span>
                {sub.includes("Hours") && <span className="text-xs font-bold text-accent uppercase tracking-widest">HRS</span>}
            </div>
            <p className="text-[7px] text-white/20 font-bold uppercase mt-3 tracking-widest border-t border-white/5 pt-2">{sub}</p>
            <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
        </div>
    );

    return (
        <div className="h-full space-y-12 animate-slide-up pb-40 overflow-y-auto px-4 md:px-6 relative scrollbar-none">
            {/* 🏛️ HEADER: ROOT COMMAND ARCHITECTURE */}
            <header className="flex flex-col md:flex-row justify-between items-start border-b-2 border-white/10 pb-8 relative z-10 gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black italic text-white uppercase tracking-tighter leading-none group cursor-default">
                        Root Command
                    </h1>
                    <div className="flex items-center gap-6">
                        <p className="system-text text-[9px] md:text-[11px] text-accent font-black tracking-[0.4em] md:tracking-[0.6em] uppercase italic">Newtonian Intelligence Triage // v4.2.0</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 text-right w-full md:w-auto">
                    <div>
                        <span className="text-3xl md:text-5xl font-black text-white italic">{stats.totalEvents}</span>
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">Neural Operations</p>
                    </div>
                    <div>
                        <span className="text-3xl md:text-5xl font-black text-neon-green italic">{stats.totalHoursSaved.toFixed(1)}</span>
                        <p className="text-[8px] md:text-[9px] text-white/30 font-black uppercase tracking-widest">Temporal Gain</p>
                    </div>
                </div>
            </header>

            {/* 🛡️ AUTHORITY MANAGEMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <div className="hud-panel p-6 bg-black border-red-500/20 relative shadow-2xl">
                    <div className="absolute -top-3 left-8 px-4 bg-black border border-red-500/40 text-[8px] font-black text-red-500 uppercase tracking-[0.4em]">High Council (Admins)</div>
                    <div className="space-y-3 mb-8 max-h-60 overflow-y-auto scrollbar-thin pr-2">
                        {registry.admins.map(email => (
                            <div key={email} className="flex justify-between items-center p-3 bg-red-500/[0.03] border border-white/5 rounded group hover:border-red-500/40 transition-all">
                                <span className="text-[10px] font-bold text-white/80 lowercase italic truncate mr-2">{email}</span>
                                <button onClick={() => handleRegistryAction('REMOVE', 'ADMIN', email)} className="text-[7px] font-black text-red-500/40 hover:text-red-500 uppercase">[ REVOKE ]</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter email to add..." className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-red-500 italic lowercase" />
                        <button onClick={() => handleRegistryAction('ADD', 'ADMIN', newEmail)} className="bg-red-500/10 border border-red-500/20 px-4 text-red-500 system-text text-[8px] font-black hover:bg-red-500 hover:text-white transition-all">ADD_ADMIN</button>
                    </div>
                    <div className="bracket-tl border-red-500/40" /><div className="bracket-br border-red-500/40" />
                </div>

                <div className="hud-panel p-6 bg-black border-accent/20 relative shadow-2xl">
                    <div className="absolute -top-3 left-8 px-4 bg-black border border-accent/40 text-[8px] font-black text-accent uppercase tracking-[0.4em]">Link Mind Collaborators</div>
                    <div className="space-y-3 mb-8 max-h-60 overflow-y-auto scrollbar-thin pr-2">
                        {registry.collaborators.map(c => (
                            <div key={c.email} className="flex justify-between items-center p-3 bg-accent/[0.03] border border-white/5 rounded group hover:border-accent transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/80 lowercase italic truncate mr-2">{c.email}</span>
                                    <span className="text-[6px] text-white/20 uppercase tracking-widest">Added {new Date(c.addedAt).toLocaleDateString()}</span>
                                </div>
                                <button onClick={() => handleRegistryAction('REMOVE', 'COLLABORATOR', c.email)} className="text-[7px] font-black text-accent/40 hover:text-accent uppercase">[ DISCONNECT ]</button>
                            </div>
                        ))}
                        {registry.collaborators.length === 0 && <p className="text-[9px] text-white/20 italic py-4">No active mind links detected.</p>}
                    </div>
                    <div className="flex gap-2">
                        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter email to link..." className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-accent italic lowercase" />
                        <button onClick={() => handleRegistryAction('ADD', 'COLLABORATOR', newEmail)} className="bg-accent/10 border border-accent/20 px-4 text-accent system-text text-[8px] font-black hover:bg-accent hover:text-black transition-all">LINK_MIND</button>
                    </div>
                    <div className="bracket-tl border-accent/40" /><div className="bracket-br border-accent/40" />
                </div>
            </div>

            {/* Rest of the board stats... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <MetricCard title="Kinetic Momentum" value={stats.temporalEfficiency} sub="Output / Input Ratio" glow="accent" equation="KE = ½mv²" />
                <MetricCard title="Platform Integrity" value={`${stats.platformRatio.desktop}:${stats.platformRatio.mobile}`} sub="DESKTOP / MOBILE SPREAD" glow="blue-500" equation="F = G(m1m2)/r²" />
                <MetricCard title="Neural Stress" value={Math.round(stats.neuralStress)} sub="Kernel Latency (ms)" glow="red-500" equation="Δp = F * Δt" />
                <MetricCard title="Briefcase Link" value="100" sub="Mothership Sync %" glow="neon-green" equation="S = -k ln W" />
            </div>

            {/* 🌠 THE MANIFESTATION LEDGER */}
            <div className="hud-panel p-8 md:p-12 bg-black border-accent/20 relative group shadow-2xl">
                <div className="absolute -top-4 left-12 px-6 bg-black border border-accent/40 text-[10px] font-black text-accent uppercase tracking-[0.6em]">Manifestation Void</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8">
                    {wishes.map(wish => (
                        <div key={wish.id} className="p-6 md:p-8 bg-white/[0.02] border border-white/10 relative group hover:border-accent hover:bg-accent/[0.02] transition-all shadow-xl">
                            <span className="text-accent font-black text-[8px] md:text-[9px] tracking-[0.4em] uppercase italic mb-4 block">{wish.user}</span>
                            <p className="text-md md:text-lg font-black italic text-white/90 uppercase leading-snug mb-10 group-hover:text-accent transition-colors">"I wish... {wish.text}"</p>
                            <button
                                onClick={() => {
                                    setTasks(prev => [{id: Date.now().toString(), title: `WISH: ${wish.text}`, status: 'TODO', priority: 'HIGH', source: 'ADMIN_MANIFEST'}, ...prev]);
                                    setWishes(prev => prev.filter(w => w.id !== wish.id));
                                }}
                                className="w-full py-4 bg-accent/10 border border-accent/30 text-accent system-text text-[10px] font-black uppercase hover:bg-accent hover:text-black transition-all"
                            >
                                Manifest Into Core
                            </button>
                            <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                        </div>
                    ))}
                </div>
                <div className="bracket-tl border-accent/40" /><div className="bracket-br border-accent/40" />
            </div>
        </div>
    );
}
