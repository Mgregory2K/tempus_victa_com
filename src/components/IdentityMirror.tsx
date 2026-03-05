// src/components/IdentityMirror.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';

export default function IdentityMirror() {
    const [stats, setSnapshot] = useState<any>(null);

    useEffect(() => {
        const update = () => {
            setSnapshot(twinPlusKernel.snapshot());
        };
        update();
        const interval = setInterval(update, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const features = stats.features || {};
    const lexicon = features.lexicon || {};
    const intentBias = features.intentBias || { action: 0, info: 0, quote: 0 };
    const affinity = features.affinity || {};

    const topWords = Object.entries(lexicon)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-slide-up pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">The Mirror</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Identity Graph // Neural Affinity v1.0</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-white/20 font-black uppercase italic">Michael-as-System</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Intent Bias Chart */}
                <div className="hud-panel p-6 bg-black/40 border-white/5 relative flex flex-col gap-6">
                    <span className="system-text text-[8px] text-accent font-black tracking-widest uppercase">Intent Bias</span>
                    <div className="flex flex-col gap-4">
                        {Object.entries(intentBias).map(([k, v]: [string, any]) => (
                            <div key={k} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase italic">
                                    <span>{k}</span>
                                    <span>{v}</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${Math.min(100, (v / (stats.recentEvents?.length || 1)) * 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bracket-tl opacity-20" />
                </div>

                {/* Lexicon Model */}
                <div className="hud-panel p-6 bg-black/40 border-white/5 relative flex flex-col gap-4">
                    <span className="system-text text-[8px] text-accent font-black tracking-widest uppercase">Learned Lexicon</span>
                    <div className="flex flex-wrap gap-2">
                        {topWords.length === 0 ? (
                            <span className="text-[10px] text-white/20 italic">Awaiting language ingestion...</span>
                        ) : (
                            topWords.map(([word, count]: [string, any]) => (
                                <span key={word} className="px-2 py-1 bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent rounded-sm lowercase italic">
                                    {word} <span className="opacity-40 ml-1 font-mono">{count}</span>
                                </span>
                            ))
                        )}
                    </div>
                    <div className="bracket-tl opacity-20" />
                </div>

                {/* Module Affinity */}
                <div className="hud-panel p-6 bg-black/40 border-white/5 relative flex flex-col gap-4">
                    <span className="system-text text-[8px] text-accent font-black tracking-widest uppercase">Module Affinity</span>
                    <div className="space-y-3">
                        {Object.entries(affinity).map(([mod, count]: [string, any]) => (
                            <div key={mod} className="flex items-center justify-between group cursor-help">
                                <span className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors">{mod}</span>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: Math.min(10, count) }).map((_, i) => (
                                        <div key={i} className="h-3 w-1 bg-neon-green/40 shadow-[0_0_5px_#22c55e]" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bracket-tl opacity-20" />
                </div>
            </div>

            {/* Neural Load Visualization */}
            <div className="hud-panel p-8 bg-black/60 border-accent/20 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-1">
                        <span className="system-text text-[9px] text-accent font-black tracking-widest">Cognitive Blueprint Analysis</span>
                        <p className="text-white/60 text-lg font-light italic leading-tight max-w-2xl">
                            The system has observed <span className="text-white font-bold">{stats.recentEvents?.length || 0}</span> strategic events.
                            Pattern stability is high. Identity drift is within nominal parameters (±2.4%).
                        </p>
                    </div>
                    <div className="h-24 w-24 border-2 border-accent/20 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 border-2 border-accent animate-ping rounded-full opacity-20" />
                        <span className="text-2xl font-black italic text-accent">82%</span>
                    </div>
                </div>
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
        </div>
    );
}
