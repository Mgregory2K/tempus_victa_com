"use client";

import React, { useState } from 'react';

interface Wish {
    id: string;
    text: string;
    timestamp: string;
    status: 'PENDING' | 'MANIFESTED';
}

export default function WishBoard({ wishes, onWish }: { wishes: any[], onWish: (text: string) => void }) {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onWish(input.trim());
        setInput("");
    };

    return (
        <div className="h-full flex flex-col space-y-8 animate-slide-up pb-20">
            <header className="border-b border-white/10 pb-4">
                <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Wish Board</h1>
                <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1 uppercase">Manifesting Future Capabilities</p>
            </header>

            <div className="max-w-2xl mx-auto w-full space-y-8">
                <div className="hud-panel p-8 bg-accent/5 border border-accent/20 relative">
                    <h3 className="system-text text-[10px] text-accent font-black tracking-widest uppercase mb-4 text-left">Manifest a Desire</h3>
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="I wish this app would..."
                            className="flex-grow bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-accent italic uppercase placeholder:text-white/20"
                        />
                        <button type="submit" className="bg-accent text-black px-8 py-3 text-[10px] font-black uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)]">Manifest</button>
                    </form>
                    <div className="bracket-tl opacity-40" /><div className="bracket-br opacity-40" />
                </div>

                <div className="space-y-4">
                    <h3 className="system-text text-[10px] text-white/40 font-black tracking-widest uppercase text-left">Recent Manifestations</h3>
                    <div className="space-y-3">
                        {wishes.map((wish: any) => (
                            <div key={wish.id} className="p-4 bg-white/[0.02] border border-white/5 flex justify-between items-center group">
                                <p className="text-sm font-bold italic text-white/80 uppercase">"I wish this app would {wish.text}"</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-1 ${wish.status === 'MANIFESTED' ? 'bg-neon-green/20 text-neon-green' : 'text-white/20'}`}>
                                    {wish.status}
                                </span>
                            </div>
                        ))}
                        {wishes.length === 0 && <p className="text-center py-12 text-white/10 uppercase text-[10px] tracking-[0.2em] italic border border-dashed border-white/5">No wishes logged yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
