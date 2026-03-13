"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from "next-auth/react";
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';
import { SharedList, SharedListItem, ListPermission, DEFAULT_GROCERY_CATEGORIES } from '@/types/shared-lists';

const CATEGORY_COLORS: Record<string, string> = {
    "Produce": "text-green-400 border-green-900/50",
    "Meat": "text-red-400 border-red-900/50",
    "Dairy": "text-blue-400 border-blue-900/50",
    "Bakery": "text-yellow-400 border-yellow-900/50",
    "Frozen": "text-cyan-400 border-cyan-900/50",
    "Snacks": "text-purple-400 border-purple-900/50",
    "Drinks": "text-orange-400 border-orange-900/50",
    "Pantry": "text-amber-400 border-amber-900/50",
    "Pharmacy": "text-pink-400 border-pink-900/50",
    "Other": "text-white/60 border-white/10"
};

export default function SharedLists() {
    const { data: session } = useSession();
    const [lists, setLists] = useState<SharedList[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Other");
    const [isSharing, setIsSharing] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [sharePhone, setSharePhone] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);

    const initialLoadRef = useRef(false);
    const userEmail = session?.user?.email?.toLowerCase();

    // CANONICAL SYNC: Fetch lists from the shared registry
    const fetchLists = useCallback(async () => {
        if (!userEmail) return;
        setIsSyncing(true);
        try {
            const res = await fetch('/api/lists');
            if (res.ok) {
                const serverLists = await res.json();
                setLists(serverLists);
                if (serverLists.length > 0 && !activeListId) {
                    setActiveListId(serverLists[0].list_id);
                }
            }
        } catch (e) {
            console.error("Discovery Failed", e);
        } finally {
            setIsSyncing(false);
        }
    }, [userEmail, activeListId]);

    // Initial load
    useEffect(() => {
        if (userEmail && !initialLoadRef.current) {
            fetchLists();
            initialLoadRef.current = true;
        }
    }, [userEmail, fetchLists]);

    // Polling for updates
    useEffect(() => {
        if (!userEmail) return;
        const interval = setInterval(fetchLists, 5000);
        return () => clearInterval(interval);
    }, [userEmail, fetchLists]);

    const activeList = lists.find(l => l.list_id === activeListId);

    const saveListToServer = async (updatedList: SharedList) => {
        try {
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedList)
            });
            if (res.ok) {
                fetchLists();
            }
        } catch (e) {
            console.error("Canonical Update Failed", e);
        }
    };

    const addList = async () => {
        const name = prompt("Enter manifest name:");
        if (!name || !userEmail) return;

        const newList: SharedList = {
            list_id: `list_${Date.now()}`,
            name,
            owner: userEmail,
            created_by: userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [],
            permissions: [],
            mode: 'standard'
        };

        await saveListToServer(newList);
        twinPlusKernel.observe(createEvent('LIST_CREATED', { name }, 'SHARED_LISTS'));
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || !activeList || !userEmail) return;

        const newItem: SharedListItem = {
            item_id: `item_${Date.now()}`,
            text: newItemText.trim(),
            checked: false,
            category: newItemCategory,
            created_by: userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updatedList = { ...activeList, items: [newItem, ...activeList.items] };
        setNewItemText("");
        await saveListToServer(updatedList);
        twinPlusKernel.observe(createEvent('LIST_ITEM_ADDED', { text: newItem.text }, 'SHARED_LISTS'));
    };

    const toggleItem = async (itemId: string) => {
        if (!activeList) return;
        const updatedList = {
            ...activeList,
            items: activeList.items.map(i => i.item_id === itemId ? { ...i, checked: !i.checked, updated_at: new Date().toISOString() } : i)
        };
        await saveListToServer(updatedList);
    };

    const deleteItem = async (itemId: string) => {
        if (!activeList) return;
        const updatedList = {
            ...activeList,
            items: activeList.items.filter(i => i.item_id !== itemId)
        };
        await saveListToServer(updatedList);
    };

    const shareList = async () => {
        if (!shareEmail.trim() || !activeList) return;
        const newPermission: ListPermission = {
            email: shareEmail.trim().toLowerCase(),
            phone: sharePhone.trim() || undefined,
            role: 'editor'
        };

        const updatedList = {
            ...activeList,
            permissions: [...activeList.permissions.filter(p => p.email !== shareEmail.toLowerCase()), newPermission]
        };

        setShareEmail("");
        setSharePhone("");
        setIsSharing(false);
        await saveListToServer(updatedList);
        twinPlusKernel.observe(createEvent('LIST_SHARED', { email: shareEmail }, 'SHARED_LISTS'));
    };

    const groupedItems = activeList?.items.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, SharedListItem[]>) || {};

    const categoriesInUse = Object.keys(groupedItems).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="w-full text-left animate-slide-up pb-32">
            <header className="space-y-4 border-b border-white/10 pb-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter">
                            {activeList?.name || "Shared Lists"}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <p className="system-text text-[10px] text-neon-green font-black tracking-widest uppercase">
                                {isSyncing ? "Syncing..." : activeList?.permissions.length ? `Shared Manifest` : "Private Manifest"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsSharing(!isSharing)}
                            className={`p-2 rounded-sm border transition-all ${isSharing ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 text-white/40 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                        <button onClick={fetchLists} className="p-2 text-white/20 hover:text-white transition-all">
                             <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {isSharing && (
                    <div className="hud-panel p-4 bg-accent/5 border-accent/20 animate-slide-up space-y-3 max-w-md">
                        <label className="text-[8px] font-black uppercase text-accent/60 block tracking-widest">Add Collaborator</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="Email"
                                className="bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-accent"
                            />
                            <input
                                type="tel"
                                value={sharePhone}
                                onChange={(e) => setSharePhone(e.target.value)}
                                placeholder="Phone"
                                className="bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-accent"
                            />
                        </div>
                        <button
                            onClick={shareList}
                            className="w-full bg-accent/20 border border-accent/40 py-2 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all"
                        >
                            Grant Access
                        </button>
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
                    {lists.map(l => (
                        <button
                            key={l.list_id}
                            onClick={() => setActiveListId(l.list_id)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeListId === l.list_id ? 'border-accent bg-accent/10 text-white' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                        >
                            {l.name}
                        </button>
                    ))}
                    <button
                        onClick={addList}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/20 text-white/20 hover:border-accent/40 hover:text-accent transition-all"
                    >
                        + New Manifest
                    </button>
                </div>
            </header>

            <div className="space-y-10 max-w-5xl">
                {categoriesInUse.map(category => (
                    <div key={category} className="space-y-3">
                        <div className={`flex items-center gap-4 mb-2 px-4 py-2 border-2 rounded-sm bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}>
                            <span className="text-sm font-black uppercase tracking-[0.3em] italic">{category}</span>
                            <div className="h-0.5 flex-grow opacity-30 bg-current" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {groupedItems[category].map(item => (
                                <div
                                    key={item.item_id}
                                    className={`flex items-center gap-4 px-4 py-3 h-[56px] hud-panel bg-black/40 border-white/5 group transition-all ${item.checked ? 'opacity-30' : 'hover:border-accent/20 border-white/10'}`}
                                >
                                    <button
                                        onClick={() => toggleItem(item.item_id)}
                                        className={`h-6 w-6 shrink-0 border-2 rounded-sm flex items-center justify-center transition-all ${item.checked ? 'border-neon-green bg-neon-green/20' : 'border-white/20 group-hover:border-accent/40'}`}
                                    >
                                        {item.checked && <div className="h-3 w-3 bg-neon-green shadow-[0_0_8px_#22c55e]" />}
                                    </button>

                                    <span
                                        onClick={() => toggleItem(item.item_id)}
                                        className={`flex-grow text-sm font-bold transition-all uppercase italic tracking-tight ${item.checked ? 'line-through text-white/20' : 'text-white/90 font-black'}`}
                                    >
                                        {item.text}
                                    </span>

                                    <button
                                        onClick={() => deleteItem(item.item_id)}
                                        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-500 p-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {activeList?.items.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-lg max-w-xl">
                        <p className="system-text text-sm text-white/20 font-black uppercase italic tracking-widest">Empty Manifest.</p>
                    </div>
                )}
            </div>

            <div className="pt-12 border-t border-white/10 mt-12">
                <form onSubmit={addItem} className="space-y-4 max-w-2xl">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Quick Ingest</label>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        {DEFAULT_GROCERY_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setNewItemCategory(cat)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${newItemCategory === cat ? 'border-accent bg-accent/20 text-white shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'border-white/5 text-white/20 hover:border-white/10'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder={`Manifest in ${newItemCategory.toUpperCase()}...`}
                            className="flex-grow bg-white/5 border-2 border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-accent italic uppercase transition-all"
                        />
                        <button type="submit" className="bg-accent/10 border-2 border-accent/20 px-8 text-accent system-text text-[10px] font-black uppercase hover:bg-accent hover:text-black transition-all">
                            ADD
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
