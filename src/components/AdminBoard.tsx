"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { TwinEvent } from '@/core/twin_plus/twin_event';

interface AdminBoardProps {
    wishes: any[];
    setWishes: React.Dispatch<React.SetStateAction<any[]>>;
    setTasks: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AdminBoard({ wishes, setWishes, setTasks }: AdminBoardProps) {
    const [events, setEvents] = useState<TwinEvent[]>([]);
    const [admins, setAdmins] = useState<string[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [stats, setStats] = useState<any>({
        moduleUsage: {},
        totalEvents: 0,
        feedback: { up: 0, down: 0, stale: 0 }
    });

    // 🏛 SYNC WITH GLOBAL COUNCIL (Server-side)
    useEffect(() => {
        const fetchCouncil = async () => {
            try {
                const res = await fetch('/api/admin/council');
                if (res.ok) {
                    const data = await res.json();
                    setAdmins(data);
                }
            } catch (e) { console.error("Council Sync Error", e); }
        };
        fetchCouncil();
    }, []);

    useEffect(() => {
        // Load local ledger events
        const allEvents = twinPlusKernel.ledger.query({});
        setEvents(allEvents);

        // Calculate Stats
        const usage: Record<string, number> = {};
        let up = 0, down = 0, stale = 0;

        allEvents.forEach(e => {
            usage[e.surface] = (usage[e.surface] || 0) + 1;
            if (e.type === 'INTENT_ROUTED' && e.payload.feedback) {
                if (e.payload.feedback === 'UP') up++;
                if (e.payload.feedback === 'DOWN') down++;
                if (e.payload.feedback === 'WRONG_SOURCE') stale++;
            }
        });

        setStats({
            moduleUsage: usage,
            totalEvents: allEvents.length,
            feedback: { up, down, stale }
        });
    }, [wishes]);

    const addAdmin = async () => {
        if (!newAdminEmail.includes("@")) return;
        const updated = [...new Set([...admins, newAdminEmail.toLowerCase().trim()])];
        setAdmins(updated);

        // PUSH TO SERVER-SIDE SHARED COUNCIL
        try {
            await fetch('/api/admin/council', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: updated })
            });
            localStorage.setItem("tv_authorized_admins", JSON.stringify(updated));
            setNewAdminEmail("");
        } catch (e) { alert("Failed to secure Council. Persistence offline."); }
    };

    const removeAdmin = async (email: string) => {
        const updated = admins.filter(a => a !== email);
        setAdmins(updated);

        try {
            await fetch('/api/admin/council', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: updated })
            });
            localStorage.setItem("tv_authorized_admins", JSON.stringify(updated));
        } catch (e) { alert("Failed to update Council."); }
    };

    return (
        <div className="h-full space-y-8 animate-slide-up pb-20 overflow-y-auto pr-2 scrollbar-thin">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-accent uppercase tracking-tight">Admin Command Board</h1>
                    <p className="system-text text-[10px] text-white/40 font-black tracking-widest mt-1 uppercase italic">Sovereign Instance Control // v3.2.3</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-white italic">{stats.totalEvents}</span>
                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Total Neural Events</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 📊 USAGE TELEMETRY */}
                <div className="lg:col-span-2 hud-panel p-6 bg-black/40 border-white/10 relative">
                    <h3 className="system-text text-[10px] text-accent font-black tracking-widest uppercase mb-6 italic">Surface Usage Distribution</h3>
                    <div className="space-y-4">
                        {Object.entries(stats.moduleUsage).sort((a:any, b:any) => b[1] - a[1]).map(([surface, count]: [string, any]) => (
                            <div key={surface} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-black uppercase">
                                    <span className="text-white/60">{surface.replace('_', ' ')}</span>
                                    <span className="text-accent">{count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent shadow-[0_0_10px_var(--accent)] transition-all duration-1000"
                                        style={{ width: `${(count / Math.max(1, stats.totalEvents)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                </div>

                {/* 🛡️ IDENTITY ACCESS CONTROL */}
                <div className="hud-panel p-6 bg-black/40 border-white/10 relative">
                    <h3 className="system-text text-[10px] text-accent font-black tracking-widest uppercase mb-6 italic">Authorized Council</h3>
                    <div className="space-y-3 mb-6 max-h-40 overflow-y-auto scrollbar-none">
                        {admins.map(email => (
                            <div key={email} className="flex justify-between items-center p-2 bg-white/5 border border-white/5 rounded group transition-all hover:bg-white/10">
                                <span className="text-[10px] font-bold text-white/80 lowercase">{email}</span>
                                <button onClick={() => removeAdmin(email)} className="opacity-0 group-hover:opacity-100 text-red-500 text-[8px] font-black uppercase transition-opacity">Remove</button>
                            </div>
                        ))}
                        {admins.length === 0 && <p className="text-[9px] text-white/20 italic text-center py-4 uppercase">No External Identities Authorized</p>}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            placeholder="ADMIN EMAIL..."
                            className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-accent lowercase italic"
                        />
                        <button onClick={addAdmin} className="bg-accent text-black px-4 py-2 text-[8px] font-black uppercase hover:bg-white transition-all">Add</button>
                    </div>
                    <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 💭 NEURAL FEEDBACK LEDGER */}
                <div className="hud-panel p-6 bg-black/40 border-white/10 relative">
                    <h3 className="system-text text-[10px] text-accent font-black tracking-widest uppercase mb-6 italic">Twin+ Alignment Metrics</h3>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 bg-neon-green/5 border border-neon-green/10">
                            <span className="text-2xl font-black text-neon-green italic">{stats.feedback.up}</span>
                            <p className="text-[7px] text-white/20 font-black uppercase mt-1">High Alignment</p>
                        </div>
                        <div className="text-center p-4 bg-red-500/5 border border-red-500/10">
                            <span className="text-2xl font-black text-red-500 italic">{stats.feedback.down}</span>
                            <p className="text-[7px] text-white/20 font-black uppercase mt-1">Off Target</p>
                        </div>
                        <div className="text-center p-4 bg-orange-500/5 border border-orange-500/10">
                            <span className="text-2xl font-black text-orange-500 italic">{stats.feedback.stale}</span>
                            <p className="text-[7px] text-white/20 font-black uppercase mt-1">Stale Sources</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-2">
                        {events.filter(e => e.type === 'INTENT_ROUTED' && e.payload.feedback).reverse().map((e, i) => (
                            <div key={i} className="p-3 bg-white/[0.02] border border-white/5 text-[9px] flex justify-between">
                                <span className="text-white/40 italic">"{e.payload.messageId.substring(0,8)}..."</span>
                                <span className={`font-black uppercase ${e.payload.feedback === 'UP' ? 'text-neon-green' : 'text-red-500'}`}>{e.payload.feedback}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                </div>

                {/* 🌠 TESTER WISH LEDGER */}
                <div className="hud-panel p-6 bg-black/40 border-white/10 relative overflow-hidden">
                    <h3 className="system-text text-[10px] text-accent font-black tracking-widest uppercase mb-6 italic">Tester Wish Manifestations</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
                        {wishes.map(wish => (
                            <div key={wish.id} className="p-4 bg-white/[0.03] border border-white/10 relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-accent font-black text-[8px] tracking-widest uppercase italic">{wish.user}</span>
                                    <span className="text-[7px] text-white/20 uppercase">{new Date(wish.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[11px] font-bold italic text-white/90 uppercase leading-tight">"I wish this app would {wish.text}"</p>
                                <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setTasks(prev => [{id: Date.now().toString(), title: `WISH: ${wish.text}`, status: 'TODO', priority: 'MED', source: wish.user}, ...prev]);
                                            setWishes(prev => prev.filter(w => w.id !== wish.id));
                                        }}
                                        className="bg-neon-green/10 border border-neon-green/20 px-3 py-1 text-[7px] font-black text-neon-green uppercase hover:bg-neon-green hover:text-black transition-all"
                                    >
                                        Manifest As Task
                                    </button>
                                    <button onClick={() => setWishes(prev => prev.filter(w => w.id !== wish.id))} className="text-red-500/40 text-[7px] font-black uppercase hover:text-red-500 transition-all">Archive</button>
                                </div>
                            </div>
                        ))}
                        {wishes.length === 0 && <p className="text-[9px] text-white/20 italic text-center py-10 uppercase border border-dashed border-white/5">No Pending Manifestations</p>}
                    </div>
                    <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                </div>
            </div>
        </div>
    );
}
