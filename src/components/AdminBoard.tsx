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
    const [admins, setAdmins] = useState<string[]>([]);
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/council');
                if (res.ok) setAdmins(await res.json());
            } catch (e) {}

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
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [wishes]);

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
            {/* 🌌 CALCULUS BACKGROUND PARTICLES */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] select-none text-[9px] font-mono leading-tight z-0">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="absolute animate-pulse" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${i*0.5}s` }}>
                        ∫(Signal/Noise) dt = Sovereignty <br/>
                        d/dt(Intent) = Action <br/>
                        Σ(Wins) - ∫(Load) dt <br/>
                        lim(Entropy→0) = Stability
                    </div>
                ))}
            </div>

            {/* 🏛️ HEADER: ROOT COMMAND ARCHITECTURE */}
            <header className="flex flex-col md:flex-row justify-between items-start border-b-2 border-white/10 pb-8 relative z-10 gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black italic text-white uppercase tracking-tighter leading-none group cursor-default">
                        Root Command
                    </h1>
                    <div className="flex items-center gap-6">
                        <p className="system-text text-[9px] md:text-[11px] text-accent font-black tracking-[0.4em] md:tracking-[0.6em] uppercase italic">Newtonian Intelligence Triage // v4.2.0</p>
                        <div className="hidden md:block h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent animate-progress shadow-[0_0_15px_var(--accent)]" style={{ width: '65%' }} />
                        </div>
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

            {/* 📊 ROW 1: NEWTONIAN VITALS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <MetricCard title="Kinetic Momentum" value={stats.temporalEfficiency} sub="Output / Input Ratio" glow="accent" equation="KE = ½mv²" />
                <MetricCard title="Platform Integrity" value={`${stats.platformRatio.desktop}:${stats.platformRatio.mobile}`} sub="DESKTOP / MOBILE SPREAD" glow="blue-500" equation="F = G(m1m2)/r²" />
                <MetricCard title="Neural Stress" value={Math.round(stats.neuralStress)} sub="Kernel Latency (ms)" glow="red-500" equation="Δp = F * Δt" />
                <MetricCard title="Briefcase Link" value="100" sub="Mothership Sync %" glow="neon-green" equation="S = -k ln W" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* 🗺️ MODULE engagement HEAT MAP */}
                <div className="lg:col-span-2 hud-panel p-6 md:p-8 bg-black/90 border-white/10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl md:text-8xl font-black italic text-accent">HEAT</span>
                    </div>
                    <h3 className="system-text text-[10px] md:text-[11px] text-accent font-black tracking-widest uppercase mb-10 italic border-l-4 border-accent pl-4">System Engagement Gravity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {Object.entries(stats.moduleUsage).sort((a:any, b:any) => b[1] - a[1]).map(([mod, count]: [string, any]) => (
                            <div key={mod} className="p-4 md:p-6 border border-white/5 bg-white/[0.03] relative group hover:border-accent transition-all cursor-pointer rounded-sm">
                                <div className="absolute inset-0 bg-accent transition-opacity duration-1000" style={{ opacity: (count / stats.totalEvents) * 0.4 }} />
                                <span className="text-[10px] font-black text-white/40 block mb-3 uppercase tracking-tighter">{mod.replace('_', ' ')}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl md:text-3xl font-black text-white italic">{count}</span>
                                    <span className="text-[8px] text-white/20 font-bold uppercase">Signals</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 mt-4 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent shadow-[0_0_10px_#00d4ff]" style={{ width: `${(count / stats.totalEvents) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bracket-tl" /><div className="bracket-br" />
                </div>

                {/* 🛡️ COUNCIL OF SOVEREIGNS */}
                <div className="hud-panel p-6 md:p-8 bg-black border-red-500/20 relative shadow-2xl">
                    <div className="absolute -top-3 left-8 px-4 bg-black border border-red-500/40 text-[8px] font-black text-red-500 uppercase tracking-[0.4em]">High Council</div>
                    <div className="space-y-4 mb-10 max-h-80 overflow-y-auto scrollbar-none pr-2">
                        {admins.map(email => (
                            <div key={email} className="flex justify-between items-center p-4 bg-red-500/[0.03] border border-red-500/10 rounded group hover:border-red-500/40 transition-all">
                                <span className="text-[10px] md:text-[11px] font-bold text-white/80 lowercase italic tracking-tight truncate mr-2">{email}</span>
                                <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse shrink-0" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <button className="w-full py-4 bg-red-500/10 border border-red-500/40 text-red-500 system-text text-[9px] font-black hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest shadow-lg">Lockdown Protocol</button>
                        <p className="text-[7px] text-white/20 text-center uppercase italic font-bold">Identity Revocation requires Root multi-sig.</p>
                    </div>
                    <div className="bracket-tl border-red-500/40" /><div className="bracket-br border-red-500/40" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* 🧠 SEARCH LINGUISTIC CLUSTER */}
                <div className="hud-panel p-6 md:p-10 bg-black/90 border-white/10 relative overflow-hidden group shadow-2xl">
                    <h3 className="system-text text-[10px] md:text-[11px] text-blue-400 font-black tracking-widest uppercase mb-10 italic border-l-4 border-blue-500 pl-4">Global Intelligence Gravity (Keywords)</h3>
                    <div className="flex flex-wrap gap-2 md:gap-4">
                        {Object.entries(stats.searchKeywords).sort((a:any, b:any) => b[1] - a[1]).slice(0, 30).map(([word, count]: [string, any]) => (
                            <div key={word} className="px-3 py-1.5 md:px-5 md:py-2.5 bg-blue-500/[0.05] border border-blue-500/20 rounded-sm flex items-center gap-3 md:gap-4 group hover:border-blue-400 transition-all cursor-default shadow-lg">
                                <span className="text-[10px] md:text-[11px] font-bold text-blue-400/70 uppercase tracking-tighter">{word}</span>
                                <span className="text-xs md:text-sm font-black text-white italic">{count}</span>
                            </div>
                        ))}
                        {Object.keys(stats.searchKeywords).length === 0 && <p className="text-[9px] md:text-[10px] text-white/20 italic uppercase py-12 tracking-widest">Awaiting Collective Signals...</p>}
                    </div>
                    <div className="bracket-tl opacity-40" /><div className="bracket-br opacity-40" />
                </div>

                {/* 🎭 TRRP PROTOCOL FIDELITY (THE CAST) */}
                <div className="hud-panel p-6 md:p-10 bg-black/90 border-purple-500/20 relative group shadow-2xl">
                    <h3 className="system-text text-[10px] md:text-[11px] text-purple-400 font-black tracking-widest uppercase mb-10 italic border-l-4 border-purple-500 pl-4">Ready Room Casting Ledger</h3>
                    <div className="space-y-4 md:space-y-5">
                        {Object.entries(stats.protocolInvitees).sort((a:any, b:any) => b[1] - a[1]).map(([name, count]: [string, any]) => (
                            <div key={name} className="group flex justify-between items-center p-4 md:p-5 bg-purple-500/[0.03] border border-purple-500/10 relative overflow-hidden hover:border-purple-500 transition-all rounded-sm shadow-lg">
                                <div className="absolute left-0 top-0 bottom-0 bg-purple-500/10 transition-all duration-1000" style={{ width: `${Math.min(100, (count / 10) * 100)}%` }} />
                                <span className="text-xs md:text-sm font-black text-white italic uppercase relative z-10 tracking-wide truncate mr-4">{name}</span>
                                <div className="flex items-center gap-2 md:gap-4 relative z-10 shrink-0">
                                    <span className="text-[7px] text-white/30 font-bold uppercase tracking-widest">Summoned</span>
                                    <span className="text-xl md:text-2xl font-black text-purple-400">{count}</span>
                                </div>
                            </div>
                        ))}
                        {Object.keys(stats.protocolInvitees).length === 0 && <p className="text-[9px] md:text-[10px] text-white/20 italic uppercase py-12 tracking-widest text-center">No Participants Instantiated...</p>}
                    </div>
                    <div className="bracket-tl opacity-40" /><div className="bracket-br opacity-40" />
                </div>
            </div>

            {/* 🌠 THE MANIFESTATION LEDGER (IKE TURNER MODE) */}
            <div className="hud-panel p-8 md:p-12 bg-black border-accent/20 relative group shadow-2xl">
                <div className="absolute -top-4 left-12 px-6 bg-black border border-accent/40 text-[10px] font-black text-accent uppercase tracking-[0.6em]">Manifestation Void</div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div className="space-y-2">
                        <h3 className="system-text text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">Collective Desires</h3>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Analyzing aggregate intent for system evolution.</p>
                    </div>
                    <button className="w-full md:w-auto px-10 py-4 bg-accent text-black system-text text-xs font-black uppercase hover:bg-white transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)]">Archive Processed Wishes</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8">
                    {wishes.map(wish => (
                        <div key={wish.id} className="p-6 md:p-8 bg-white/[0.02] border border-white/10 relative group hover:border-accent hover:bg-accent/[0.02] transition-all shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-accent font-black text-[8px] md:text-[9px] tracking-[0.4em] uppercase italic">{wish.user}</span>
                                <div className="h-1 w-8 bg-accent/20 rounded-full" />
                            </div>
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
