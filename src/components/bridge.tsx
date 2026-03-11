"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";
import { createEvent } from "@/core/twin_plus/twin_event";

interface BridgeProps {
    tasks?: any[];
    notes?: any[];
    messages?: any[];
    calendar?: any[];
    onNavigate?: (module: any) => void;
    onQuickTask?: (text: string) => void;
    onSnooze?: (id: string, time: string) => void;
}

export default function Bridge({ tasks = [], notes = [], messages = [], calendar = [], onNavigate, onQuickTask, onSnooze }: BridgeProps) {
    const { data: session } = useSession();
    const [isCalendarHidden, setIsCalendarHidden] = useState(false);
    const [greeting, setGreeting] = useState("Good Day");
    const [quickTaskText, setQuickTaskText] = useState("");
    const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);

    const activeProjectsCount = tasks.filter(t => t.status !== 'DONE' && t.status !== 'SNOOZED').length;

    // 🧬 MOMENTUM CALCULATION
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const allWins = tasks.filter(t => t.status === 'DONE');
    const dayWins = allWins.filter(t => new Date(t.completed_at || t.completedAt).toDateString() === todayStr).length;
    const mtdWins = allWins.filter(t => {
        const d = new Date(t.completed_at || t.completedAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const ytdWins = allWins.filter(t => new Date(t.completed_at || t.completedAt).getFullYear() === currentYear).length;

    const recentWins = [...allWins].sort((a, b) =>
        new Date(b.completed_at || b.completedAt || 0).getTime() - new Date(a.completed_at || a.completedAt || 0).getTime()
    ).slice(0, 3);

    const firstName = session?.user?.name?.split(' ')[0] || "User";

    // 🧬 DYNAMIC SUMMARY
    const [executiveSummary, setExecutiveSummary] = useState("System synchronization is stable. Neural patterns suggest high focus potential.");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

        if (twinPlusKernel.ready()) {
            const snapshot = twinPlusKernel.snapshot();
            const recentEvents = snapshot.recentEvents || [];
            if (recentEvents.length > 0) {
                const lastAction = recentEvents[0].type.replace('_', ' ').toLowerCase();
                setExecutiveSummary(`${firstName}, system nominal. Tracking recent ${lastAction} signals. Momentum is holding at ${dayWins} Triumphs today.`);
            }
        }
    }, [firstName, dayWins]);

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

    const navigateWithTelemetry = (module: string) => {
        twinPlusKernel.observe(createEvent('BRIDGE_NAVIGATION', { target: module }, 'BRIDGE'));
        onNavigate?.(module);
    };

    const MetricCard = ({ title, value, unit, trend, glowColor, targetModule }: { title: string, value: string | number, unit?: string, trend?: string, glowColor: string, targetModule?: string }) => (
        <div
            onClick={() => targetModule && navigateWithTelemetry(targetModule)}
            className="hud-panel p-4 bg-black/40 border-white/5 relative group overflow-hidden cursor-pointer hover:border-accent/40 transition-all active:scale-95 ripple"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${glowColor}`} />
            <span className="system-text text-[8px] text-white/40 font-black tracking-widest block mb-1 uppercase">{title}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white italic tracking-tighter">{value}</span>
                {unit && <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{unit}</span>}
            </div>
            {trend && <p className="text-[7px] text-neon-green font-black mt-1 tracking-[0.2em]">↑ {trend}</p>}
            <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
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

            {/* 🧬 VITAL SIGNS */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Audit Ledger" value="85H" trend="ACTIVE" glowColor="accent" targetModule="IO_BAY" />
                <MetricCard title="Affinity" value="94" unit="%" trend="PEAK" glowColor="neon-green" targetModule="MIRROR" />
                <MetricCard title="Objectives" value={activeProjectsCount} trend="ACTIVE" glowColor="purple-500" targetModule="PROJECTS" />
                <MetricCard title="Signal Bay" value="12" trend="SIGNALS" glowColor="orange-500" targetModule="IO_BAY" />
            </section>

            {/* 🧬 MOMENTUM HUD */}
            <section className="grid grid-cols-3 gap-4">
                {[
                    { label: "Daily Momentum", value: dayWins, sub: "Triumphs Today" },
                    { label: "Monthly Streak", value: mtdWins, sub: "MTD Progress" },
                    { label: "Annual Velocity", value: ytdWins, sub: "YTD Output" }
                ].map((m, i) => (
                    <div key={i} className="hud-panel p-3 bg-neon-green/5 border-neon-green/20 relative flex flex-col items-center justify-center group overflow-hidden">
                        <div className="absolute inset-0 bg-neon-green/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <span className="system-text text-[7px] text-neon-green/60 font-black tracking-[0.2em] uppercase relative z-10">{m.label}</span>
                        <span className="text-2xl font-black text-white italic relative z-10">{m.value}</span>
                        <span className="text-[6px] text-white/30 font-bold uppercase tracking-widest relative z-10">{m.sub}</span>
                        <div className="bracket-tl border-neon-green/30" /><div className="bracket-br border-neon-green/30" />
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {!isCalendarHidden ? (
                    <div className="lg:col-span-2 hud-panel p-6 bg-black/60 border-white/10 relative text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="system-text text-[10px] text-white/60 font-black tracking-widest uppercase">Temporal Timeline</h3>
                            <button onClick={() => {
                                setIsCalendarHidden(true);
                                twinPlusKernel.observe(createEvent('TIMELINE_DISMISSED', {}, 'BRIDGE'));
                            }} className="text-[8px] text-white/20 hover:text-accent font-black tracking-widest uppercase italic transition-colors">Dismiss Timeline</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-2 text-left uppercase">
                            {calendar.length === 0 ? (
                                <div className="py-6 text-center border border-dashed border-white/5 text-[9px] text-white/20 uppercase italic font-bold">NO SCHEDULED EVENTS DETECTED</div>
                            ) : (
                                calendar.map((e: any) => (
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

                <div onClick={() => navigateWithTelemetry('MIRROR')} className="hud-panel p-6 bg-neon-green/5 border-neon-green/20 relative cursor-pointer group hover:bg-neon-green/10 transition-all text-white ripple">
                    <h3 className="system-text text-[10px] text-neon-green font-black tracking-widest uppercase mb-4">Recent Triumphs</h3>
                    <div className="space-y-3">
                        {recentWins.length > 0 ? (
                            recentWins.map((win, idx) => (
                                <div key={win.id} className={`pb-2 ${idx !== recentWins.length - 1 ? 'border-b border-white/5' : ''} text-left`}>
                                    <p className="text-[11px] font-black text-white/90 italic uppercase truncate group-hover:text-neon-green transition-colors">{win.title}</p>
                                    <p className="text-[6px] text-white/30 font-bold uppercase tracking-widest">{new Date(win.completed_at || win.completedAt).toLocaleDateString()} // VERIFIED</p>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center border border-dashed border-neon-green/10 text-[9px] text-neon-green/30 uppercase italic font-bold">AWAITING VERIFIED WIN</div>
                        )}
                    </div>
                    <div className="mt-6">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-[7px] text-neon-green/40 font-black uppercase">Momentum Chain</span>
                             <span className="text-[7px] text-white/40 font-black italic">{dayWins}/10</span>
                         </div>
                        <div className="flex gap-1">
                            {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className={`h-1 flex-grow rounded-full transition-all duration-700 ${i <= dayWins ? 'bg-neon-green shadow-[0_0_8px_#22c55e]' : 'bg-white/5'}`} />)}
                        </div>
                    </div>
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
                        <input value={quickTaskText} onChange={(e) => setQuickTaskText(e.target.value)} placeholder="Manifest a loose signal..." className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-accent italic uppercase" />
                        <button type="submit" className="bg-accent/10 border border-accent/20 px-4 text-accent system-text text-[8px] font-black hover:bg-accent hover:text-black transition-all">ADD</button>
                    </form>
                    <div className="space-y-2 text-left">
                        {tasks.filter(t => t.status !== 'DONE' && t.status !== 'SNOOZED' && t.source === 'WORKING_MEMORY').slice(0, 5).length === 0 ? (
                            <p className="text-[9px] text-white/20 italic py-4 font-bold">NO LOOSE SIGNALS DETECTED. SYSTEM NOMINAL.</p>
                        ) : (
                            tasks.filter(t => t.status !== 'DONE' && t.status !== 'SNOOZED' && t.source === 'WORKING_MEMORY').slice(0, 5).map(signal => (
                                <div key={signal.id} className="relative group">
                                    <div className="flex justify-between items-center text-[10px] p-2 bg-white/5 rounded border border-white/10 cursor-pointer hover:border-accent/40 transition-all ripple">
                                        <span className="font-bold text-white/80 uppercase truncate pr-4 italic" onClick={() => navigateWithTelemetry('PROJECTS')}>{signal.title}</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    setActiveSnoozeId(activeSnoozeId === signal.id ? null : signal.id);
                                                    twinPlusKernel.observe(createEvent('TASK_SNOOZE_CLICK', { id: signal.id }, 'BRIDGE'));
                                                }}
                                                className={`text-[8px] font-black uppercase transition-colors ${activeSnoozeId === signal.id ? 'text-orange-500' : 'text-white/20 hover:text-orange-500'}`}
                                            >
                                                Push To... 🕒
                                            </button>
                                            <span className="text-accent/40 font-black uppercase">Active</span>
                                        </div>
                                    </div>
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
                <div className="hud-panel p-6 bg-accent/5 border-dashed border-accent/20 relative group hover:bg-accent/10 transition-all cursor-pointer text-white ripple" onClick={() => navigateWithTelemetry('READY_ROOM')}>
                    <span className="system-text text-[10px] text-accent font-black tracking-[0.3em] block mb-4 uppercase">Twin+ Executive Summary</span>
                    <p className="text-white/70 text-md font-light leading-relaxed italic uppercase tracking-wide text-left">
                        {executiveSummary}
                    </p>
                    <div className="bracket-tl opacity-40" /><div className="bracket-br opacity-40" />
                </div>
            </div>
        </div>
    );
}
