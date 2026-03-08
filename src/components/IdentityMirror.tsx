"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';

export default function IdentityMirror() {
    const [snapshot, setSnapshot] = useState<any>(null);

    useEffect(() => {
        const update = () => {
            setSnapshot(twinPlusKernel.snapshot());
        };
        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!snapshot || !snapshot.identity) return (
        <div className="h-full flex items-center justify-center italic text-white/20 system-text text-xs tracking-widest animate-pulse">
            CALIBRATING_NEURAL_MIRROR...
        </div>
    );

    const { identity, usage, recentEvents } = snapshot;

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

    const totalResponses = (usage?.local || 0) + (usage?.scout || 0) + (usage?.neural || 0);
    const neuralEfficiency = totalResponses > 0 ? Math.round(((usage?.local + usage?.scout) / totalResponses) * 100) : 100;

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-slide-up pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">The Mirror</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1 uppercase">Identity Graph // Neural Affinity v3.5.9</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-white/20 font-black uppercase italic">Neural Counterpart State</span>
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

                {/* 📊 USAGE & SOVEREIGNTY */}
                <div className="space-y-6">
                    <div className="hud-panel p-6 bg-accent/5 border-accent/20 relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="system-text text-[9px] text-accent font-black tracking-widest uppercase mb-4">Economic Sovereignty</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-2xl font-black text-white italic">{neuralEfficiency}%</p>
                                        <p className="text-[8px] text-white/40 font-bold uppercase">Local Efficiency (Keyless Gain)</p>
                                    </div>
                                    <div className="flex gap-8">
                                        <div>
                                            <p className="text-lg font-black text-neon-green italic">{usage?.local || 0}</p>
                                            <p className="text-[7px] text-white/20 font-bold uppercase">Local Mates</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-blue-400 italic">{usage?.scout || 0}</p>
                                            <p className="text-[7px] text-white/20 font-bold uppercase">Public Scouts</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-red-500 italic">{usage?.neural || 0}</p>
                                            <p className="text-[7px] text-white/20 font-bold uppercase">Neural Strikes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-accent italic">-${usage?.estimatedCost?.toFixed(2) || "0.00"}</p>
                                <p className="text-[7px] text-white/20 font-bold uppercase">Est. Key Burn</p>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,212,255,0.05),transparent_50%)]" />
                    </div>

                    <div className="hud-panel p-6 bg-black/60 border-white/5 relative">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <span className="system-text text-[9px] text-white/40 font-black uppercase tracking-widest block mb-1">Observation Depth</span>
                                <p className="text-2xl font-black text-white italic">{recentEvents?.length || 0}</p>
                                <p className="text-[8px] text-white/20 font-bold uppercase mt-1">Strategic Events Logged</p>
                            </div>
                            <div className="h-16 w-16 border-2 border-accent/20 rounded-full flex items-center justify-center">
                                <span className="text-xl font-black italic text-accent">{Math.min(99, Math.round((recentEvents?.length || 0) / 10))}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🧾 ANALYSIS FOOTER */}
            <div className="hud-panel p-8 border-accent/20 bg-white/[0.01] text-center relative">
                <p className="system-text text-[10px] text-white/40 font-black tracking-[0.4em] mb-4 uppercase">Identity Stability Assessment</p>
                <p className="text-white/60 text-lg font-light italic leading-relaxed uppercase tracking-wide">
                    Neural patterns are stabilizing. Lexicon alignment is high. J5 is correctly escalating based on complexity while maintaining high local efficiency.
                </p>
                <div className="bracket-tl opacity-10" /><div className="bracket-br opacity-10" />
            </div>
        </div>
    );
}
