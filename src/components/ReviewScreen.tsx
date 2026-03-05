// src/components/ReviewScreen.tsx
"use client";

import React from 'react';

export default function ReviewScreen() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase">End-Of-Day Review</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Synced with Twin+ • Updated Just Now</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-white italic">Tuesday</span>
                    <p className="system-text text-[10px] text-white/40 font-black tracking-widest">Apr 18</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Section */}
                <div className="space-y-4">
                    <div className="hud-panel p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-transparent" />
                        <span className="system-text text-[10px] text-white/60 font-black tracking-widest block mb-2">Cognitive Reclaimed</span>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white italic">3h 45m</span>
                            <span className="text-neon-green text-xs font-black mb-2">+45m vs yesterday</span>
                        </div>
                        {/* Mini Chart Mockup */}
                        <div className="flex gap-1 items-end h-12 mt-4">
                            {[40, 60, 30, 80, 45, 90, 70].map((h, i) => (
                                <div key={i} className="flex-grow bg-accent/40 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="hud-panel p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent" />
                        <span className="system-text text-[10px] text-white/60 font-black tracking-widest block mb-2">Noise Filtered</span>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white italic">12 items</span>
                            <span className="text-orange-500 text-xs font-black mb-2">Down 7 yesterday</span>
                        </div>
                        <div className="flex gap-1 items-end h-12 mt-4">
                            {[70, 40, 90, 50, 30, 60, 40].map((h, i) => (
                                <div key={i} className="flex-grow bg-orange-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="hud-panel p-6 border-white/10 bg-black/60">
                    <h3 className="system-text text-sm font-black tracking-widest mb-6 border-b border-white/5 pb-2">Review Today's Activity</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <span className="system-text text-[9px] text-white/30 font-black mt-1">10:10 AM</span>
                            <div>
                                <p className="text-sm font-bold text-white/90 italic">Dave: Hey free for drinks tonight?</p>
                                <p className="text-[10px] text-neon-green font-black tracking-widest mt-1">✨ Auto-replied: Busy until 8 PM</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="system-text text-[9px] text-white/30 font-black mt-1">09:45 AM</span>
                            <div>
                                <p className="text-sm font-bold text-white/90 italic">DMV process: check text mail.</p>
                                <p className="text-[10px] text-accent font-black tracking-widest mt-1">📍 Task Created in Admin</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-2">
                         <button className="flex-grow py-3 bg-neon-green/10 border border-neon-green/30 text-neon-green system-text text-[9px] font-black hover:bg-neon-green hover:text-black transition-all">GOOD CALL</button>
                         <button className="flex-grow py-3 bg-red-500/10 border border-red-500/30 text-red-500 system-text text-[9px] font-black hover:bg-red-500 hover:text-white transition-all">MISSED CHANCE</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
