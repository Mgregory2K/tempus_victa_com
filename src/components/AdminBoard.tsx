"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { TwinEvent } from '@/core/twin_plus/twin_event';
import { MiniBarChart, SparkLine, HeatMap, StatusIndicator } from './TelemetryCharts';

interface AdminBoardProps {
    wishes: any[];
    setWishes: React.Dispatch<React.SetStateAction<any[]>>;
    setTasks: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AdminBoard({ wishes, setWishes, setTasks }: AdminBoardProps) {
    const [events, setEvents] = useState<TwinEvent[]>([]);
    const [registry, setRegistry] = useState<{ admins: string[], collaborators: any[] }>({ admins: [], collaborators: [] });
    const [newEmail, setNewEmail] = useState("");
    const [activeTab, setActiveTab] = useState<"ENGINE" | "READY" | "COLLAB" | "VOID">("ENGINE");

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
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [wishes]);

    // --- TELEMETRY ENGINE ---
    const telemetry = useMemo(() => {
        const usage: Record<string, number> = {};
        const intents: Record<string, number> = {};
        const readyRoomFeedback = { up: 0, down: 0 };
        const trends = new Array(12).fill(0); // Last 12 segments of history
        let completed = 0;
        let authFailures = 0;

        events.forEach((e, idx) => {
            usage[e.surface] = (usage[e.surface] || 0) + 1;
            if (e.type === 'TASK_COMPLETED') completed++;
            if (e.type === 'INTENT_ROUTED') {
                const intent = e.payload.intent?.intentType || 'QUERY';
                intents[intent] = (intents[intent] || 0) + 1;
                if (e.payload.feedback === 'UP') readyRoomFeedback.up++;
                if (e.payload.feedback === 'DOWN') readyRoomFeedback.down++;
            }

            // Trend mapping (very basic bucketization of the current loaded events)
            const segment = Math.floor((idx / Math.max(events.length, 1)) * 12);
            trends[segment]++;
        });

        const snapshot = twinPlusKernel.snapshot();
        const kernelUsage = snapshot.features?.usage || { local: 0, scout: 0, neural: 0, estimatedCost: 0 };
        const rhythm = snapshot.features?.rhythm || new Array(24).fill(0);

        return {
            usage,
            intents,
            readyRoomFeedback,
            trends,
            completed,
            kernelUsage,
            rhythm,
            totalHoursSaved: completed * 0.25,
            activeUsers: 1, // Scaffolded (Local-first)
            systemStatus: "NOMINAL" as const,
            errorRate: (authFailures / Math.max(events.length, 1)) * 100
        };
    }, [events]);

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

    const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
        <div className="mb-6 flex justify-between items-end border-b border-white/5 pb-2">
            <div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{title}</h3>
                <p className="text-[7px] text-white/30 font-bold uppercase tracking-widest">{subtitle}</p>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-accent/40 to-transparent" />
        </div>
    );

    return (
        <div className="h-full space-y-8 animate-slide-up pb-40 overflow-y-auto px-4 md:px-8 relative scrollbar-none bg-[#020205]">

            {/* 🛰️ STARSHIP STATUS STRIP */}
            <div className="sticky top-0 z-50 py-4 bg-black/80 backdrop-blur-xl border-b border-white/10 -mx-8 px-8 flex items-center justify-between overflow-x-auto no-scrollbar">
                <div className="flex gap-2 items-center">
                    <div className="h-2 w-2 bg-accent animate-pulse rounded-full shadow-[0_0_10px_var(--accent)]" />
                    <StatusIndicator status={telemetry.systemStatus} value="READY" label="MISSION_CONTROL" />
                </div>
                <div className="flex">
                    <StatusIndicator value={telemetry.activeUsers} label="ACTIVE_USERS" />
                    <StatusIndicator value={`${telemetry.kernelUsage.neural}`} label="TWIN_STRIKES" />
                    <StatusIndicator value={`${Math.round((telemetry.readyRoomFeedback.up / Math.max(1, telemetry.readyRoomFeedback.up + telemetry.readyRoomFeedback.down)) * 100)}%`} label="TWIN_ACCEPTANCE" />
                    <StatusIndicator value={telemetry.totalHoursSaved.toFixed(1)} label="TIME_SAVED_HRS" />
                    <StatusIndicator value={telemetry.errorRate.toFixed(2)} label="ERROR_RATE %" />
                </div>
            </div>

            {/* 🏛️ PRIMARY COMMAND HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-6 pt-4">
                <div className="space-y-2">
                    <h1 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none">
                        Bridge <span className="text-accent">Telemetry</span>
                    </h1>
                    <p className="system-text text-[10px] text-white/40 font-black tracking-[0.5em] uppercase italic">Centralized Observability Deck // v5.0.0</p>
                </div>
                <div className="flex gap-4">
                    {["ENGINE", "READY", "COLLAB", "VOID"].map((t: any) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-6 py-2 text-[9px] font-black tracking-widest uppercase border transition-all ${activeTab === t ? 'bg-accent text-black border-accent shadow-[0_0_15px_var(--accent)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
                        >
                            {t}_BAY
                        </button>
                    ))}
                </div>
            </header>

            {/* 📊 MAIN TELEMETRY GRID */}
            {activeTab === 'ENGINE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* SYSTEM HEALTH / ENGINE ROOM */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="hud-panel p-8 bg-black/60 border-white/10 relative group overflow-hidden">
                            <SectionHeader title="System Pulse" subtitle="Neural Processing & Latency Trends" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] text-white/40 uppercase font-black">Neural Load</span>
                                        <span className="text-xs font-black text-accent italic">NOMINAL</span>
                                    </div>
                                    <SparkLine data={telemetry.trends} />
                                    <p className="text-[7px] text-white/20 uppercase font-bold">Signal volume per epoch</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] text-white/40 uppercase font-black">Memory Depth</span>
                                        <span className="text-xs font-black text-white italic">{events.length}</span>
                                    </div>
                                    <MiniBarChart data={telemetry.trends.map(v => v * Math.random())} color="var(--neon-green)" />
                                    <p className="text-[7px] text-white/20 uppercase font-bold">Ledger persistence state</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] text-white/40 uppercase font-black">Sync Health</span>
                                        <span className="text-xs font-black text-white italic">100%</span>
                                    </div>
                                    <div className="h-8 flex items-center gap-1">
                                        {[1,1,1,1,1,1,0.8,1,1,1,1,1].map((v, i) => (
                                            <div key={i} className="flex-grow h-full bg-accent/20 border border-accent/40" />
                                        ))}
                                    </div>
                                    <p className="text-[7px] text-white/20 uppercase font-bold">Mothership connectivity</p>
                                </div>
                            </div>
                            <div className="bracket-tl border-accent/40" /><div className="bracket-br border-accent/40" />
                        </div>

                        {/* MODULE USAGE TELEMETRY */}
                        <div className="hud-panel p-8 bg-black/40 border-white/5 relative">
                            <SectionHeader title="Module Saturation" subtitle="Operational engagement by surface" />
                            <div className="space-y-6">
                                {Object.entries(telemetry.usage).sort((a,b) => b[1] - a[1]).map(([module, count]) => (
                                    <div key={module} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">{module}</span>
                                            <span className="text-[9px] font-black text-accent">{count} OPS</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 relative">
                                            <div
                                                className="h-full bg-accent transition-all duration-1000"
                                                style={{ width: `${(count / events.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bracket-tl border-white/10" /><div className="bracket-br border-white/10" />
                        </div>
                    </div>

                    {/* FLIGHT RECORDER / EVENT STREAM */}
                    <div className="hud-panel p-6 bg-black border-white/10 relative flex flex-col h-[600px]">
                        <SectionHeader title="Flight Recorder" subtitle="Real-time Neural Manifestations" />
                        <div className="flex-grow overflow-y-auto space-y-4 scrollbar-thin pr-2 font-mono">
                            {events.slice(-30).reverse().map((e) => (
                                <div key={e.id} className="border-l-2 border-accent/20 pl-4 py-1 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex justify-between items-center text-[7px] mb-1">
                                        <span className="text-accent font-black uppercase italic">{e.type}</span>
                                        <span className="text-white/20 font-bold">{new Date(e.ts).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-[9px] text-white/60 lowercase italic truncate group-hover:text-white transition-colors">
                                        {e.surface} » {e.payload?.intent?.query || e.payload?.action || 'NOMINAL_OP'}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-40">
                            <span className="text-[6px] font-black text-white tracking-widest uppercase italic">Streaming_Active...</span>
                            <div className="flex gap-1">
                                <div className="h-1 w-1 bg-accent rounded-full animate-ping" />
                                <div className="h-1 w-1 bg-accent rounded-full" />
                            </div>
                        </div>
                        <div className="bracket-tl border-accent/40" /><div className="bracket-br border-accent/40" />
                    </div>
                </div>
            )}

            {/* 🧠 READY ROOM INTELLIGENCE */}
            {activeTab === 'READY' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    <div className="hud-panel p-8 bg-black border-accent/10">
                        <SectionHeader title="Cognitive Intents" subtitle="Ready Room query distribution" />
                        <div className="grid grid-cols-2 gap-8">
                            {Object.entries(telemetry.intents).length > 0 ? Object.entries(telemetry.intents).map(([intent, count]) => (
                                <div key={intent} className="p-4 bg-white/[0.02] border border-white/5">
                                    <span className="text-[8px] text-white/40 uppercase font-black block mb-2">{intent}</span>
                                    <span className="text-2xl font-black italic text-white">{count}</span>
                                </div>
                            )) : <p className="col-span-2 text-[9px] text-white/20 italic text-center py-10 uppercase tracking-widest">No cognitive patterns detected.</p>}
                        </div>
                    </div>
                    <div className="hud-panel p-8 bg-black border-accent/10">
                        <SectionHeader title="Temporal Rhythm" subtitle="Neural activity across 24h cycle" />
                        <HeatMap data={telemetry.rhythm} />
                        <div className="mt-6 flex justify-between text-[6px] text-white/30 font-black tracking-widest uppercase italic">
                            <span>00:00 (MIDNIGHT)</span>
                            <span>12:00 (NOON)</span>
                            <span>23:59 (EOD)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛡️ AUTHORITY MANAGEMENT / COLLAB */}
            {activeTab === 'COLLAB' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    <div className="hud-panel p-6 bg-black border-red-500/20 relative shadow-2xl">
                        <SectionHeader title="High Council" subtitle="Root authority management" />
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
                        <SectionHeader title="Mind Links" subtitle="Active collaboration bridges" />
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
            )}

            {/* 🌠 THE MANIFESTATION VOID */}
            {activeTab === 'VOID' && (
                <div className="hud-panel p-8 md:p-12 bg-black border-accent/20 relative group shadow-2xl">
                    <SectionHeader title="Manifestation Void" subtitle="User-submitted wishes awaiting core integration" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8">
                        {wishes.map(wish => (
                            <div key={wish.id} className="p-6 md:p-8 bg-white/[0.02] border border-white/10 relative group hover:border-accent hover:bg-accent/[0.02] transition-all shadow-xl">
                                <span className="text-accent font-black text-[8px] md:text-[9px] tracking-[0.4em] uppercase italic mb-4 block">{wish.user || 'USER_SIG'}</span>
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
                        {wishes.length === 0 && <p className="col-span-full text-center py-20 text-white/10 italic text-xs uppercase tracking-[0.3em]">The void is silent.</p>}
                    </div>
                    <div className="bracket-tl border-accent/40" /><div className="bracket-br border-accent/40" />
                </div>
            )}
        </div>
    );
}
