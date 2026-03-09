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

    if (!snapshot || !snapshot.features?.identity) return (
        <div className="h-full flex items-center justify-center italic text-white/20 system-text text-xs tracking-widest animate-pulse">
            CALIBRATING_NEURAL_MIRROR...
        </div>
    );

    const { identity } = snapshot.features;
    const { recentEvents } = snapshot;
    const usage = snapshot.usage || { local: 0, scout: 0, neural: 0, estimatedCost: 0 };

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

    const totalResponses = (usage.local || 0) + (usage.scout || 0) + (usage.neural || 0);
    const neuralEfficiency = totalResponses > 0 ? Math.round(((usage.local + usage.scout) / totalResponses) * 100) : 100;

    // Derived Doctrines (from kernel features)
    const learnedLaws = identity.doctrines || [
        "Law #1: Signal integrity takes precedence over noise volume.",
        "Law #2: Strategic movement requires deterministic grounding.",
        "Law #3: The tire store callback is a non-negotiable memory anchor."
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-slide-up pb-20 px-4">
            <header className="flex justify-between items-end border-b border-white/10 pb-6 relative">
                <div className="absolute -top-10 -left-10 opacity-5 pointer-events-none text-[60px] font-black italic select-none">AFFINITY</div>
                <div>
                    <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">The Mirror</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-[0.4em] mt-2 uppercase">Neural Identity Graph // Twin+ Alignment State</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="h-12 w-12 border-2 border-accent rounded-full flex items-center justify-center mb-2 shadow-[0_0_20px_var(--accent)]">
                        <span className="text-xl font-black italic text-accent">94</span>
                    </div>
                    <span className="text-[8px] text-white/40 font-black uppercase italic tracking-widest">Affinity_Score</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 🧬 COGNITIVE DNA */}
                <div className="lg:col-span-2 hud-panel p-8 bg-black/60 border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,212,255,0.05),transparent_50%)]" />
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="system-text text-xs font-black text-accent tracking-widest uppercase italic">Cognitive DNA Substrate</h3>
                        <span className="text-[8px] text-white/20 font-bold uppercase tracking-[0.3em]">v3.5.9_STABLE</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 relative z-10">
                        <ProfileSlider label="Directness" value={identity.userProfile.directness} />
                        <ProfileSlider label="Efficiency Bias" value={identity.userProfile.efficiencyBias} />
                        <ProfileSlider label="Tone Matching" value={identity.userProfile.sarcasmTolerance} />
                        <ProfileSlider label="Challenge Index" value={identity.userProfile.challengeLevel} />
                        <ProfileSlider label="Verbosity" value={identity.userProfile.verbosity} />
                        <ProfileSlider label="Risk Parameter" value={identity.userProfile.riskTolerance} />
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center opacity-40">
                        <div className="text-[7px] font-black uppercase tracking-widest">Newtonian_Model: 1/2mv² = Kinetic_Momentum</div>
                        <div className="flex gap-2">
                            {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                        </div>
                    </div>
                    <div className="bracket-tl border-accent/40" /><div className="bracket-br border-accent/40" />
                </div>

                {/* 📊 SOVEREIGNTY METRICS */}
                <div className="space-y-8">
                    <div className="hud-panel p-6 bg-neon-green/5 border-neon-green/20 relative group overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-6xl font-black text-neon-green/10 italic">FREE</div>
                        <h3 className="system-text text-[9px] text-neon-green font-black tracking-widest uppercase mb-6">Economic Sovereignty</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{neuralEfficiency}%</p>
                                <p className="text-[8px] text-white/40 font-bold uppercase mt-1">Local Efficiency Gain</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <p className="text-sm font-black text-white">{usage.local || 0}</p>
                                    <p className="text-[6px] text-white/20 uppercase font-black">Local</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-white">{usage.scout || 0}</p>
                                    <p className="text-[6px] text-white/20 uppercase font-black">Scout</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-red-500">{usage.neural || 0}</p>
                                    <p className="text-[6px] text-white/20 uppercase font-black">Strikes</p>
                                </div>
                            </div>
                        </div>
                        <div className="bracket-tl border-neon-green/40" /><div className="bracket-br border-neon-green/40" />
                    </div>

                    <div className="hud-panel p-6 bg-black/60 border-white/10 relative">
                        <div className="flex justify-between items-center mb-4">
                            <span className="system-text text-[9px] text-white/40 font-black uppercase tracking-widest">Observation Depth</span>
                            <span className="text-[8px] text-accent font-black animate-pulse uppercase italic">Learning...</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <p className="text-3xl font-black text-white italic">{recentEvents?.length || 0}</p>
                            <div className="flex-grow h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent shadow-[0_0_10px_var(--accent)]" style={{ width: `${Math.min(100, (recentEvents?.length || 0) / 5)}%` }} />
                            </div>
                        </div>
                        <p className="text-[7px] text-white/20 font-bold uppercase mt-4 tracking-widest italic">Signals crystallized into behavioral patterns</p>
                    </div>
                </div>
            </div>

            {/* ⚖️ IMMUTABLE DOCTRINES (LEARNED LAWS) */}
            <div className="hud-panel p-10 bg-black/40 border-white/5 relative border-dashed border-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-black border border-white/10 system-text text-[9px] font-black text-white/40 tracking-[0.5em] uppercase">Learned Laws of Sovereignty</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {learnedLaws.map((law: string, i: number) => (
                        <div key={i} className="space-y-4 group cursor-default">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-accent/40" />
                                <span className="text-accent font-black text-[10px] italic">LAW_0{i+1}</span>
                            </div>
                            <p className="text-white/80 font-serif italic text-lg leading-snug group-hover:text-white transition-colors uppercase tracking-tight">
                                {law}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
            </div>

            {/* 🧾 STABILITY ASSESSMENT */}
            <div className="hud-panel p-8 border-accent/20 bg-accent/5 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg className="w-24 h-24 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
                </div>
                <p className="system-text text-[10px] text-accent font-black tracking-[0.4em] mb-4 uppercase">Identity Stability Assessment</p>
                <p className="text-white/80 text-xl font-light italic leading-relaxed uppercase tracking-wide max-w-3xl mx-auto">
                    "Neural patterns are stabilizing. Lexicon alignment is high. J5 is correctly escalating based on complexity while maintaining high local efficiency. The user identity is unified and coherent."
                </p>
                <div className="mt-8 flex justify-center gap-12 opacity-40">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-white">0.98</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest">Coherence</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-white">1.00</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest">Integrity</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-white">0.84</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest">Evolution</span>
                    </div>
                </div>
                <div className="bracket-tl" /><div className="bracket-br" />
            </div>
        </div>
    );
}
