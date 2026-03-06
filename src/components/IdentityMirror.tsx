// src/components/IdentityMirror.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';

export default function IdentityMirror() {
    const [identity, setIdentity] = useState<any>(null);
    const [eventsCount, setEventsCount] = useState(0);

    useEffect(() => {
        const update = () => {
            const snapshot = twinPlusKernel.snapshot();
            setIdentity(snapshot.features?.identity);
            setEventsCount(snapshot.recentEvents?.length || 0);
        };
        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!identity) return (
        <div className="h-full flex items-center justify-center italic text-white/20 system-text text-xs tracking-widest animate-pulse">
            CALIBRATING_NEURAL_MIRROR...
        </div>
    );

    const ProfileSlider = ({ label, value }: { label: string, value: number }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="system-text text-[8px] text-white/40 font-black tracking-widest uppercase">{label}</span>
                <span className="text-[10px] font-black text-accent italic">{Math.round(value * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                <div
                    className="h-full bg-accent shadow-[0_0_15px_var(--accent)] transition-all duration-1000 ease-out"
                    style={{ width: `${value * 100}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-slide-up pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">The Mirror</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1 uppercase">Identity Graph // Neural Affinity v2.0</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-white/20 font-black uppercase italic">Michael-as-System</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* 🧬 COGNITIVE DNA SLIDERS */}
                <div className="hud-panel p-8 bg-black/40 border-white/5 relative">
                    <h3 className="system-text text-xs font-black text-white/60 mb-8 tracking-widest uppercase">Cognitive DNA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <ProfileSlider label="Directness" value={identity.userProfile.directness} />
                        <ProfileSlider label="Efficiency Bias" value={identity.userProfile.efficiencyBias} />
                        <ProfileSlider label="Sarcasm Tol." value={identity.userProfile.sarcasmTolerance} />
                        <ProfileSlider label="Challenge Lvl" value={identity.userProfile.challengeLevel} />
                        <ProfileSlider label="Verbosity" value={identity.userProfile.verbosity} />
                        <ProfileSlider label="Risk Tolerance" value={identity.userProfile.riskTolerance} />
                    </div>
                    <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                </div>

                {/* 🧠 REASONING PATTERNS */}
                <div className="space-y-6">
                    <div className="hud-panel p-6 bg-accent/5 border-dashed border-accent/20 relative">
                        <h3 className="system-text text-[9px] text-accent font-black tracking-widest uppercase mb-4">Learned Doctrines</h3>
                        <div className="space-y-3">
                            {identity.doctrines.map((d: string, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-1 w-1 bg-accent rounded-full animate-pulse" />
                                    <span className="text-sm font-bold italic text-white/80 uppercase tracking-tight">{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hud-panel p-6 bg-black/60 border-white/5 relative overflow-hidden">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <span className="system-text text-[9px] text-white/40 font-black uppercase tracking-widest block mb-1">Observation Depth</span>
                                <p className="text-2xl font-black text-white italic">{eventsCount}</p>
                                <p className="text-[8px] text-white/20 font-bold uppercase mt-1">Strategic Events Logged</p>
                            </div>
                            <div className="h-16 w-16 border-2 border-accent/20 rounded-full flex items-center justify-center">
                                <span className="text-xl font-black italic text-accent">82%</span>
                            </div>
                        </div>
                        {/* Background Pulse */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.05),transparent_70%)] animate-pulse" />
                    </div>
                </div>
            </div>

            {/* 🧾 ANALYSIS FOOTER */}
            <div className="hud-panel p-8 border-accent/20 bg-white/[0.01] text-center">
                <p className="system-text text-[10px] text-white/40 font-black tracking-[0.4em] mb-4 uppercase">Identity Stability Assessment</p>
                <p className="text-white/60 text-lg font-light italic leading-relaxed uppercase tracking-wide">
                    Pattern stability is nominal. Twin+ has observed consistent preference for efficiency over accuracy. Lexicon mirroring is currently at 94% alignment.
                </p>
            </div>
        </div>
    );
}
