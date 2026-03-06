// src/components/bridge.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

interface BridgeProps {
    tasks?: any[];
    notes?: any[];
    messages?: any[];
    onNavigate?: (module: string) => void;
}

export default function Bridge({ tasks = [], notes = [], messages = [], onNavigate }: BridgeProps) {
    const { data: session } = useSession();
    const [todaysEvents, setTodaysEvents] = useState<any[]>([]);
    const [loadingCalendar, setLoading] = useState(false);

    const activeProjectsCount = tasks.filter(t => t.status !== 'DONE').length;
    const todayWins = tasks.filter(t => t.status === 'DONE');
    const recentWin = todayWins.length > 0 ? todayWins[todayWins.length - 1] : null;

    useEffect(() => {
        const fetchCal = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/calendar');
                if (res.ok) setTodaysEvents(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchCal();
    }, []);

    const MetricCard = ({ title, value, unit, trend, glowColor, targetModule }: { title: string, value: string | number, unit?: string, trend?: string, glowColor: string, targetModule?: string }) => (
        <div
            onClick={() => targetModule && onNavigate?.(targetModule)}
            className="hud-panel p-4 bg-black/40 border-white/5 relative group overflow-hidden cursor-pointer hover:border-accent/40 transition-all active:scale-95"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${glowColor}`} />
            <span className="system-text text-[8px] text-white/40 font-black tracking-widest block mb-1 uppercase">{title}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white italic tracking-tighter">{value}</span>
                {unit && <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{unit}</span>}
            </div>
            {trend && <p className="text-[7px] text-neon-green font-black mt-1 tracking-[0.2em]">↑ {trend}</p>}
            <div className="bracket-tl opacity-20" />
            <div className="bracket-br opacity-20" />
        </div>
    );

    return (
        <div className="space-y-6 animate-slide-up pb-20">
            {/* Interactive Metrics Row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Audit_Log" value="85H" trend="12%+" glowColor="accent" targetModule="CLOCK_TOWER" />
                <MetricCard title="Affinity" value="94" unit="%" trend="PEAK" glowColor="neon-green" targetModule="MIRROR" />
                <MetricCard title="Objectives" value={activeProjectsCount} trend="ACTIVE" glowColor="purple-500" targetModule="PROJECTS" />
                <MetricCard title="Triage" value="12" trend="SIGNALS" glowColor="orange-500" targetModule="SIGNALS" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 📅 Actionable Calendar Feed */}
                <div className="lg:col-span-2 hud-panel p-6 bg-black/60 border-white/10 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="system-text text-[10px] text-white/60 font-black tracking-widest uppercase">Temporal Timeline</h3>
                        <button onClick={() => onNavigate?.('BRIDGE')} className="text-[8px] text-accent font-black tracking-widest hover:underline uppercase italic">View_Full_Schedule</button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2 text-left uppercase">
                        {loadingCalendar ? (
                            <div className="py-10 text-center opacity-20 animate-pulse text-[10px]">SYNCING_CHRONOS...</div>
                        ) : todaysEvents.length === 0 ? (
                            <div className="py-10 text-center border border-dashed border-white/5 text-[9px] text-white/20 uppercase italic">NO_SCHEDULED_EVENTS_DETECTED</div>
                        ) : (
                            todaysEvents.map((e: any) => (
                                <div key={e.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:border-accent/30 transition-all group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <span className="text-[10px] font-black text-accent min-w-[60px]">{new Date(e.start.dateTime || e.start.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</span>
                                        <p className="text-xs font-bold italic text-white/80 truncate uppercase">{e.summary}</p>
                                    </div>
                                    <a href={e.htmlLink} target="_blank" className="text-[8px] font-black text-white/20 group-hover:text-accent transition-colors uppercase whitespace-nowrap ml-4">View_Event 🔗</a>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="bracket-tl" /><div className="bracket-br" />
                </div>

                {/* 🏆 Persistence-Driven Latest Win */}
                <div
                    onClick={() => onNavigate?.('WINBOARD')}
                    className="hud-panel p-6 bg-neon-green/5 border-neon-green/20 relative cursor-pointer group hover:bg-neon-green/10 transition-all"
                >
                    <h3 className="system-text text-[10px] text-neon-green font-black tracking-widest uppercase mb-6">Current Momentum</h3>
                    {recentWin ? (
                        <div className="space-y-4 text-left">
                            <p className="text-lg font-black text-white italic leading-tight uppercase group-hover:text-neon-green transition-colors">{recentWin.title}</p>
                            <p className="text-[8px] text-white/40 font-bold tracking-widest uppercase">MANIFESTED_LOGGED</p>
                            <div className="mt-4 flex gap-1">
                                {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-grow rounded-full ${i <= todayWins.length ? 'bg-neon-green shadow-[0_0_5px_#22c55e]' : 'bg-white/5'}`} />)}
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center border border-dashed border-neon-green/10 text-[9px] text-neon-green/30 uppercase italic">AWAITING_VERIFIED_WIN</div>
                    )}
                    <div className="bracket-tl border-neon-green/40" /><div className="bracket-br border-neon-green/40" />
                </div>
            </div>

            {/* 📬 COMMUNICATIONS & INTELLIGENCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="hud-panel p-6 border-white/5 bg-black/40 relative">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                        <span className="system-text text-[9px] text-white/40 font-black uppercase tracking-widest">Signals Summary</span>
                        <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest">SYSTEM_URGENT</span>
                    </div>
                    <div className="space-y-2 text-left">
                        <div className="flex justify-between text-[10px] p-2 bg-white/5 rounded border border-white/5 cursor-pointer hover:border-orange-500/40 transition-all" onClick={() => onNavigate?.('SIGNALS')}>
                            <span className="font-bold text-white/60 uppercase">Encrypted Texts</span><span className="text-accent font-black">8 NEW</span>
                        </div>
                        <div className="flex justify-between text-[10px] p-2 bg-white/5 rounded border border-white/5 cursor-pointer hover:border-orange-500/40 transition-all" onClick={() => onNavigate?.('SIGNALS')}>
                            <span className="font-bold text-white/60 uppercase">Strategic Emails</span><span className="text-accent font-black">14 ACTION_REQ</span>
                        </div>
                    </div>
                    <div className="bracket-tl opacity-10" /><div className="bracket-br opacity-10" />
                </div>

                {/* Σ TWIN+ DIRECTIVE */}
                <div className="hud-panel p-6 bg-accent/5 border-dashed border-accent/20 relative group hover:bg-accent/10 transition-all cursor-pointer" onClick={() => onNavigate?.('READY_ROOM')}>
                    <span className="system-text text-[10px] text-accent font-black tracking-[0.3em] block mb-4 uppercase">Twin+ Executive Summary</span>
                    <p className="text-white/70 text-md font-light leading-relaxed italic uppercase tracking-wide text-left">
                        Michael, system synchronization is stable. Your career transition signals are peaking—recommend allocating the next 90 minutes to strategic networking. Engage the Ready Room for deeper synthesis.
                    </p>
                    <div className="bracket-tl opacity-40" /><div className="bracket-br opacity-40" />
                </div>
            </div>
        </div>
    );
}
