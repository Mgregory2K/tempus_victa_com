// src/components/bridge.tsx
"use client";

import React from 'react';
import { useSession } from "next-auth/react";

interface BridgeProps {
    tasks?: any[];
    notes?: any[];
    messages?: any[];
}

export default function Bridge({ tasks = [], notes = [], messages = [] }: BridgeProps) {
    const { data: session } = useSession();

    const activeProjects = tasks.filter(t => t.status !== 'DONE').length;
    const todayWins = tasks.filter(t => t.status === 'DONE').length;
    const pendingSignals = 12; // Mock value until integrated with global signal state

    const MetricCard = ({ title, value, unit, trend, glowColor }: { title: string, value: string | number, unit?: string, trend?: string, glowColor: string }) => (
        <div className="hud-panel p-6 bg-black/40 border-white/5 relative group overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${glowColor}`} />
            <span className="system-text text-[9px] text-white/40 font-black tracking-widest block mb-2">{title}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white italic tracking-tighter">{value}</span>
                {unit && <span className="text-xs font-bold text-white/20 uppercase tracking-widest">{unit}</span>}
            </div>
            {trend && <p className="text-[8px] text-neon-green font-black mt-2 tracking-[0.2em] animate-pulse">↑ {trend}</p>}
            <div className="bracket-tl opacity-20" />
            <div className="bracket-br opacity-20" />
        </div>
    );

    return (
        <div className="space-y-8 animate-slide-up pb-20">
            <header className="flex justify-between items-start mb-12 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-5xl font-black text-white italic tracking-tight leading-none mb-3 uppercase">
                        Welcome to the <span className="text-accent">Bridge</span>, Michael.
                    </h1>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-neon-green shadow-[0_0_10px_#22c55e] animate-pulse" />
                            <p className="system-text text-[10px] text-white/60 font-black tracking-[0.3em]">STRATEGIC_COCKPIT // ACTIVE</p>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <p className="system-text text-[10px] text-white/20 font-black tracking-[0.3em]">SOVEREIGNTY_LEVEL: ABSOLUTE</p>
                    </div>
                </div>
            </header>

            {/* High-Level Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Time Unlocked" value="85H 30M" trend="12% VS YESTERDAY" glowColor="accent" />
                <MetricCard title="Cognitive Focus" value="94" unit="%" trend="OPTIMAL_STATE" glowColor="neon-green" />
                <MetricCard title="System Efficiency" value="1.8" unit="x" trend="PEAK_PERFORMANCE" glowColor="purple-500" />
            </section>

            {/* Strategic Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                {/* Cognitive Load Visualization */}
                <div className="hud-panel p-8 bg-black/60 border-white/10 relative">
                    <h3 className="system-text text-xs font-black text-white/60 mb-8 tracking-widest">Neural Entropy Analysis</h3>
                    <div className="flex items-end gap-3 h-48 mb-6 px-4">
                        {[40, 65, 30, 85, 45, 90, 55, 70, 35, 80, 50, 60].map((h, i) => (
                            <div
                                key={i}
                                className={`flex-grow rounded-t-sm transition-all duration-1000 ${h > 80 ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-accent shadow-[0_0_10px_#00d4ff]'}`}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[8px] text-white/20 font-black uppercase">06:00 HRS</span>
                        <span className="system-text text-[9px] text-accent font-black">CURRENT_LOAD: 14%</span>
                        <span className="text-[8px] text-white/20 font-black uppercase">18:00 HRS</span>
                    </div>
                    <div className="bracket-tl" /><div className="bracket-br" />
                </div>

                {/* Strategic Status Table */}
                <div className="hud-panel p-8 bg-black/60 border-white/10 relative overflow-hidden">
                    <h3 className="system-text text-xs font-black text-white/60 mb-8 tracking-widest uppercase">System Status Ledger</h3>
                    <div className="space-y-6">
                        {[
                            { label: "Active Projects", value: activeProjects, color: "text-accent", status: "STABLE" },
                            { label: "Pending Signals", value: pendingSignals, color: "text-orange-500", status: "TRIAGE_REQ" },
                            { label: "Crystallized Quotes", value: notes.length, color: "text-purple-400", status: "SYNCED" },
                            { label: "Daily Triumphs", value: todayWins, color: "text-neon-green", status: "MANIFESTED" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`} />
                                    <span className="text-sm font-bold italic text-white/80 uppercase">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
                                    <span className="text-[8px] font-black text-white/10 group-hover:text-white/40 tracking-widest">{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bracket-tl" /><div className="bracket-br" />
                </div>
            </div>

            {/* Strategic Summary Area */}
            <section className="mt-12">
                <div className="hud-panel p-8 bg-accent/5 border-dashed border-accent/20 relative">
                    <div className="flex gap-8 items-start">
                        <div className="h-16 w-16 border-2 border-accent/40 bg-black flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                            <span className="text-3xl font-black text-accent italic">Σ</span>
                        </div>
                        <div>
                            <span className="system-text text-[10px] text-accent font-black tracking-widest block mb-2 uppercase">Synthesized Executive Summary</span>
                            <p className="text-white/70 text-lg font-light leading-relaxed italic uppercase tracking-wide">
                                Michael, your cognitive landscape is highly optimized. Career transition signals are peaking—recommend focusing 120 minutes on LinkedIn networking before 14:00 HRS. Three wins are pending verification in the Signal Bay.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
