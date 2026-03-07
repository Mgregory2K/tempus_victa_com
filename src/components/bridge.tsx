// src/components/bridge.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

interface BridgeProps {
    tasks?: any[];
    notes?: any[];
    messages?: any[];
    onNavigate?: (module: any) => void;
    onQuickTask?: (text: string) => void;
    onSnooze?: (id: string, time: string) => void;
}

export default function Bridge({ tasks = [], notes = [], messages = [], onNavigate, onQuickTask, onSnooze }: BridgeProps) {
    const { data: session } = useSession();
    const [todaysEvents, setTodaysEvents] = useState<any[]>([]);
    const [loadingCalendar, setLoading] = useState(false);
    const [isCalendarHidden, setIsCalendarHidden] = useState(false);
    const [greeting, setGreeting] = useState("Good Day");
    const [quickTaskText, setQuickTaskText] = useState("");
    const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);

    const activeProjectsCount = tasks.filter(t => t.status !== 'DONE' && t.status !== 'SNOOZED').length;
    const todayWins = tasks.filter(t => t.status === 'DONE');
    const recentWin = todayWins.length > 0 ? todayWins[todayWins.length - 1] : null;
    const firstName = session?.user?.name?.split(' ')[0] || "User";

    // 🧬 WORKING MEMORY (LOOSE SIGNALS)
    const looseSignals = tasks.filter(t => t.status !== 'DONE' && t.status !== 'SNOOZED' && t.source === 'WORKING_MEMORY').slice(0, 5);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchCal = async () => {
            if (!session) return;
            setLoading(true);
            try {
                const res = await fetch('/api/calendar');
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setTodaysEvents(data);
                }
            } catch (e) { console.error(e); }
            finally { if (isMounted) setLoading(false); }
        };
        fetchCal();
        return () => { isMounted = false; };
    }, [session]);

    const handleQuickTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTaskText.trim()) return;
        onQuickTask?.(quickTaskText);
        setQuickTaskText("");
    };

    const handleSnooze = (id: string, duration: '1H' | 'TOMORROW' | 'WEEK') => {
        let targetTime = new Date();
        if (duration === '1H') targetTime.setHours(targetTime.getHours() + 1);
        if (duration === 'TOMORROW') targetTime.setDate(targetTime.getDate() + 1);
        if (duration === 'WEEK') targetTime.setDate(targetTime.getDate() + 7);

        onSnooze?.(id, targetTime.toISOString());
        setActiveSnoozeId(null);
    };

    const MetricCard = ({ title, value, unit, trend, glowColor, targetModule }: { title: string, value: string | number, unit?: string, trend?: string, glowColor: string, targetModule?: string }) => (
        <div
            onClick={() => targetModule && onNavigate?.(targetModule)}
            className="hud-panel p-4 bg-black/40 border-white/5 relative group overflow-hidden cursor-pointer hover:border-accent/40 transition-all active:scale-95 ripple"
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
            <div className="mb-8 border-b border-white/5 pb-4">
                <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none">
                    {greeting}, <span className="text-accent">{firstName}</span>
                </h1>
                <p className="system-text text-[8px] text-white/20 font-black tracking-[0.4em] mt-2 uppercase">Neural Link Stable // System Nominal</p>
            </div>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Clock Tower" value="85H" trend="12%+" glowColor="accent" targetModule="CLOCK_TOWER" />
                <MetricCard title="Affinity" value="94" unit="%" trend="PEAK" glowColor="neon-green" targetModule="MIRROR" />
                <MetricCard title="Objectives" value={activeProjectsCount} trend="ACTIVE" glowColor="purple-500" targetModule="PROJECTS" />
                <MetricCard title="Signal Bay" value="12" trend="SIGNALS" glowColor="orange-500" targetModule="SIGNAL_BAY" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {!isCalendarHidden ? (
                    <div className="lg:col-span-2 hud-panel p-6 bg-black/60 border-white/10 relative text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="system-text text-[10px] text-white/60 font-black tracking-widest uppercase">Temporal Timeline</h3>
                            <button onClick={() => setIsCalendarHidden(true)} className="text-[8px] text-white/20 hover:text-accent font-black tracking-widest uppercase italic transition-colors">Dismiss Timeline</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-2 text-left uppercase">
                            {loadingCalendar ? (
                                <div className="py-6 text-center opacity-20 animate-pulse text-[10px] text-white font-bold">SYNCING CHRONOS...</div>
                            ) : todaysEvents.length === 0 ? (
                                <div className="py-6 text-center border border-dashed border-white/5 text-[9px] text-white/20 uppercase italic font-bold">NO SCHEDULED EVENTS DETECTED</div>
                            ) : (
                                todaysEvents.map((e: any) => (
                                    <div key={e.id} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/10 rounded hover:border-accent/30 transition-all group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span className="text-[9px] font-black text-accent min-w-[50px]">{new Date(e.start.dateTime || e.start.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</span>
                                            <p className="text-[11px] font-bold italic text-white/90 truncate uppercase">{e.summary}</p>
                                        </div>
                                        <a href={e.htmlLink} target="_blank" className="text-[7px] font-black text-white/40 group-hover:text-accent transition-colors uppercase whitespace-nowrap ml-2">VIEW 🔗</a>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="bracket-tl" /><div className="bracket-br" />
                    </div>
                ) : (
                    <div onClick={() => setIsCalendarHidden(false)} className="lg:col-span-2 hud-panel p-4 bg-black/40 border-dashed border-white/10 relative text-center cursor-pointer hover:bg-white/[0.02] transition-all group">
                        <span className="system-text text-[8px] text-white/20 group-hover:text-accent font-black tracking-[0.4em] uppercase">Temporal Timeline Minimized // Click to Restore</span>
                    </div>
                )}

                <div onClick={() => onNavigate?.('WINBOARD')} className="hud-panel p-6 bg-neon-green/5 border-neon-green/20 relative cursor-pointer group hover:bg-neon-green/10 transition-all text-white ripple">
                    <h3 className="system-text text-[10px] text-neon-green font-black tracking-widest uppercase mb-6">Current Momentum</h3>
                    {recentWin ? (
                        <div className="space-y-4 text-left">
                            <p className="text-lg font-black text-white italic leading-tight uppercase group-hover:text-neon-green transition-colors">{recentWin.title}</p>
                            <p className="text-[8px] text-white/40 font-bold tracking-widest uppercase">MANIFEST LOGGED</p>
                            <div className="mt-4 flex gap-1">
                                {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-grow rounded-full ${i <= todayWins.length ? 'bg-neon-green shadow-[0_0_5px_#22c55e]' : 'bg-white/5'}`} />)}
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center border border-dashed border-neon-green/10 text-[9px] text-neon-green/30 uppercase italic font-bold">AWAITING VERIFIED WIN</div>
                    )}
                    <div className="bracket-tl border-neon-green/40" /><div className="bracket-br border-neon-green/40" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="hud-panel p-6 border-white/10 bg-black/40 relative text-white">
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <span className="system-text text-[9px] text-white/40 font-black uppercase tracking-widest">Working Memory</span>
                        <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest italic">Temporal Draft</span>
                    </div>

                    <form onSubmit={handleQuickTaskSubmit} className="mb-4 flex gap-2">
                        <input value={quickTaskText} onChange={(e) => setQuickTaskText(e.target.value)} placeholder="Manifest a loose signal (e.g. Get Gas)..." className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-accent italic uppercase" />
                        <button type="submit" className="bg-accent/10 border border-accent/20 px-4 text-accent system-text text-[8px] font-black hover:bg-accent hover:text-black transition-all">ADD</button>
                    </form>

                    <div className="space-y-2 text-left">
                        {looseSignals.length === 0 ? (
                            <p className="text-[9px] text-white/20 italic py-4 font-bold">NO LOOSE SIGNALS DETECTED. SYSTEM NOMINAL.</p>
                        ) : (
                            looseSignals.map(signal => (
                                <div key={signal.id} className="relative group">
                                    <div className="flex justify-between items-center text-[10px] p-2 bg-white/5 rounded border border-white/10 cursor-pointer hover:border-accent/40 transition-all ripple">
                                        <span className="font-bold text-white/80 uppercase truncate pr-4 italic" onClick={() => onNavigate?.('PROJECTS')}>{signal.title}</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setActiveSnoozeId(activeSnoozeId === signal.id ? null : signal.id)}
                                                className={`text-[8px] font-black uppercase transition-colors ${activeSnoozeId === signal.id ? 'text-orange-500' : 'text-white/20 hover:text-orange-500'}`}
                                            >
                                                Push To... 🕒
                                            </button>
                                            <span className="text-accent/40 font-black uppercase">Active</span>
                                        </div>
                                    </div>

                                    {/* 🕒 SNOOZE HUD POPUP */}
                                    {activeSnoozeId === signal.id && (
                                        <div className="absolute right-0 top-full mt-1 z-50 bg-black border border-orange-500/40 p-2 shadow-2xl flex flex-col gap-1 animate-slide-up">
                                            <button onClick={() => handleSnooze(signal.id, '1H')} className="text-[7px] font-black text-orange-500 hover:bg-orange-500 hover:text-black px-4 py-1.5 uppercase transition-all whitespace-nowrap border border-orange-500/20">Push 1 Hour</button>
                                            <button onClick={() => handleSnooze(signal.id, 'TOMORROW')} className="text-[7px] font-black text-orange-500 hover:bg-orange-500 hover:text-black px-4 py-1.5 uppercase transition-all whitespace-nowrap border border-orange-500/20">Push Tomorrow</button>
                                            <button onClick={() => handleSnooze(signal.id, 'WEEK')} className="text-[7px] font-black text-orange-500 hover:bg-orange-500 hover:text-black px-4 py-1.5 uppercase transition-all whitespace-nowrap border border-orange-500/20">Push 1 Week</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="bracket-tl opacity-10" /><div className="bracket-br opacity-10" />
                </div>

                <div className="hud-panel p-6 bg-accent/5 border-dashed border-accent/20 relative group hover:bg-accent/10 transition-all cursor-pointer text-white ripple" onClick={() => onNavigate?.('READY_ROOM')}>
                    <span className="system-text text-[10px] text-accent font-black tracking-[0.3em] block mb-4 uppercase">Twin+ Executive Summary</span>
                    <p className="text-white/70 text-md font-light leading-relaxed italic uppercase tracking-wide text-left">
                        {firstName}, system synchronization is stable. Neural patterns suggest high focus potential for current objectives. Ready Room simulation is calibrated for strategic synthesis.
                    </p>
                    <div className="bracket-tl opacity-40" /><div className="bracket-br opacity-40" />
                </div>
            </div>
        </div>
    );
}
