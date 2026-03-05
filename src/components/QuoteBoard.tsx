// src/components/QuoteBoard.tsx
"use client";

import React, { useState } from 'react';

interface Quote {
    id: string;
    text: string;
    author: string;
    timestamp: string;
    context?: string;
}

export default function QuoteBoard() {
    const [quotes, setQuotes] = useState<Quote[]>([
        { id: '1', text: "The modern human does not suffer from a lack of tools. The modern human suffers from fragmentation.", author: "Tempus Victa Doctrine", timestamp: "Oct 24, 2024" },
        { id: '2', text: "Sovereignty is leverage.", author: "Michael", timestamp: "Oct 23, 2024", context: "Ready Room Protocol Discussion" },
        { id: '3', text: "Magic first, mathematics second.", author: "Twin+", timestamp: "Oct 22, 2024" },
        { id: '4', text: "An Assistant that Optimizes Life Through Automation.", author: "Mission Statement", timestamp: "Oct 21, 2024" },
    ]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Quote Board</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Memory Crystallization // Structured Capture</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-white/20 font-black uppercase italic">Language shapes behavior</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotes.map(quote => (
                    <div key={quote.id} className="hud-panel p-6 bg-black/40 border-white/5 relative group hover:border-accent/30 transition-all">
                        <div className="mb-4">
                            <span className="text-2xl text-accent/40 font-serif absolute -top-2 -left-1">"</span>
                            <p className="text-lg font-bold italic tracking-tight text-white/90 leading-snug">
                                {quote.text}
                            </p>
                            <span className="text-2xl text-accent/40 font-serif absolute -bottom-6 right-4 rotate-180">"</span>
                        </div>

                        <div className="flex justify-between items-end mt-8 pt-4 border-t border-white/5">
                            <div>
                                <p className="system-text text-[10px] font-black text-accent">{quote.author}</p>
                                {quote.context && <p className="text-[8px] text-white/20 uppercase font-bold">{quote.context}</p>}
                            </div>
                            <span className="text-[8px] text-white/20 font-black">{quote.timestamp}</span>
                        </div>

                        <div className="bracket-tl opacity-20" />
                        <div className="bracket-br opacity-20" />
                    </div>
                ))}
            </div>

            {/* Quick Capture Bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
                <div className="hud-panel p-4 bg-black/90 border-accent/40 shadow-[0_0_30px_rgba(0,212,255,0.1)] flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Crystallize a thought..."
                        className="flex-grow bg-transparent border-b border-white/10 px-2 py-2 text-sm focus:outline-none focus:border-accent text-white placeholder:text-white/10"
                    />
                    <button className="bg-accent px-6 py-2 system-text text-[10px] font-black text-white hover:bg-white hover:text-black transition-all">SAVE</button>
                </div>
            </div>
        </div>
    );
}
