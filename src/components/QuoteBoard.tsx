// src/components/QuoteBoard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Quote {
    id: string;
    text: string;
    author: string;
    timestamp: string;
    context?: string;
    isSynced?: boolean;
}

export default function QuoteBoard() {
    const [input, setInput] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [quotes, setQuotes] = useState<Quote[]>([
        { id: '1', text: "The modern human does not suffer from a lack of tools. The modern human suffers from fragmentation.", author: "Tempus Victa Doctrine", timestamp: "Oct 24, 2024", isSynced: true },
        { id: '2', text: "Sovereignty is leverage.", author: "Michael", timestamp: "Oct 23, 2024", context: "Ready Room Protocol Discussion", isSynced: true },
        { id: '3', text: "Magic first, mathematics second.", author: "Twin+", timestamp: "Oct 22, 2024", isSynced: false },
    ]);

    const handleSave = async () => {
        if (!input.trim()) return;

        const newQuote: Quote = {
            id: Date.now().toString(),
            text: input,
            author: "Michael",
            timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            isSynced: false
        };

        setQuotes(prev => [newQuote, ...prev]);
        setInput("");

        // Log to Twin+ Ledger
        twinPlusKernel.observe(createEvent('QUOTE_CRYSTALLIZED', { text: input }, 'QUOTES'));

        // Push to Notion Bridge if key exists
        const notionKey = localStorage.getItem("tv_notion_key");
        if (notionKey) {
            setIsSyncing(true);
            try {
                const res = await fetch('/api/notion/push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'CRYSTALLIZED_QUOTE',
                        content: input,
                        author: "Michael",
                        notionKey
                    })
                });
                if (res.ok) {
                    setQuotes(prev => prev.map(q => q.id === newQuote.id ? { ...q, isSynced: true } : q));
                }
            } catch (e) {
                console.error("Notion Sync Failed", e);
            } finally {
                setIsSyncing(false);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-32">
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
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] text-white/20 font-black">{quote.timestamp}</span>
                                {quote.isSynced && (
                                    <div className="flex items-center gap-1">
                                        <div className="h-1 w-1 rounded-full bg-neon-green shadow-[0_0_5px_#22c55e]" />
                                        <span className="text-[6px] text-neon-green font-black tracking-widest uppercase">Synced to Notion</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bracket-tl opacity-20" />
                        <div className="bracket-br opacity-20" />
                    </div>
                ))}
            </div>

            {/* Quick Capture Bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
                <div className="hud-panel p-4 bg-black/90 border-accent/40 shadow-[0_0_30px_rgba(0,212,255,0.2)] flex gap-4 items-center backdrop-blur-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="Crystallize a thought..."
                        className="flex-grow bg-transparent border-b border-white/10 px-2 py-2 text-sm focus:outline-none focus:border-accent text-white placeholder:text-white/10"
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSyncing || !input}
                        className="bg-accent px-6 py-2 system-text text-[10px] font-black text-white hover:bg-white hover:text-black transition-all disabled:opacity-50"
                    >
                        {isSyncing ? 'SYNCING...' : 'CRYSTALLIZE'}
                    </button>
                </div>
            </div>
        </div>
    );
}
