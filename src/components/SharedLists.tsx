"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface ListItem {
    id: string;
    text: string;
    checked: boolean;
}

interface List {
    id: string;
    name: string;
    items: ListItem[];
    sharedWith: string[];
    active_shopper?: string;
    mode?: 'standard' | 'shopping';
}

export default function SharedLists() {
    const [lists, setLists] = useState<List[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState("");
    const [isSharing, setIsSharing] = useState(false);
    const [shareEmail, setShareEmail] = useState("");

    // Load lists from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("tv_shared_lists");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setLists(parsed);
                if (parsed.length > 0) setActiveListId(parsed[0].id);
            } catch (e) {
                console.error("Failed to parse lists", e);
            }
        } else {
            // Default list if none exist
            const defaultList: List = {
                id: 'default-grocery',
                name: 'Grocery List',
                items: [
                    { id: '1', text: 'Milk', checked: false },
                    { id: '2', text: 'Bread', checked: false },
                    { id: '3', text: 'Eggs', checked: true }
                ],
                sharedWith: ['jen@tempusvicta.com'],
                mode: 'standard'
            };
            setLists([defaultList]);
            setActiveListId(defaultList.id);
        }
    }, []);

    // Save lists on change
    useEffect(() => {
        if (lists.length > 0) {
            localStorage.setItem("tv_shared_lists", JSON.stringify(lists));
        }
    }, [lists]);

    const activeList = lists.find(l => l.id === activeListId);

    const addList = () => {
        const name = prompt("Enter list name:");
        if (!name) return;
        const newList: List = {
            id: Date.now().toString(),
            name,
            items: [],
            sharedWith: [],
            mode: 'standard'
        };
        setLists([...lists, newList]);
        setActiveListId(newList.id);
        twinPlusKernel.observe(createEvent('LIST_CREATED', { name }, 'SHARED_LISTS'));
    };

    const toggleMode = () => {
        if (!activeListId) return;
        setLists(lists.map(l => {
            if (l.id === activeListId) {
                const newMode = l.mode === 'shopping' ? 'standard' : 'shopping';
                twinPlusKernel.observe(createEvent('LIST_MODE_TOGGLED', { listId: l.id, mode: newMode }, 'SHARED_LISTS'));
                return { ...l, mode: newMode, active_shopper: newMode === 'shopping' ? 'Michael' : undefined };
            }
            return l;
        }));
    };

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || !activeListId) return;
        const newItem: ListItem = {
            id: Date.now().toString(),
            text: newItemText.trim(),
            checked: false
        };
        setLists(lists.map(l => l.id === activeListId ? { ...l, items: [newItem, ...l.items] } : l));
        setNewItemText("");
        twinPlusKernel.observe(createEvent('LIST_ITEM_ADDED', { text: newItem.text }, 'SHARED_LISTS'));
    };

    const toggleItem = (itemId: string) => {
        setLists(lists.map(l => l.id === activeListId ? {
            ...l,
            items: l.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
        } : l));
    };

    const deleteItem = (itemId: string) => {
        setLists(lists.map(l => l.id === activeListId ? {
            ...l,
            items: l.items.filter(i => i.id !== itemId)
        } : l));
    };

    const shareList = () => {
        if (!shareEmail.trim() || !activeListId) return;
        setLists(lists.map(l => l.id === activeListId ? {
            ...l,
            sharedWith: [...new Set([...l.sharedWith, shareEmail.trim()])]
        } : l));
        setShareEmail("");
        setIsSharing(false);
        twinPlusKernel.observe(createEvent('LIST_SHARED', { email: shareEmail }, 'SHARED_LISTS'));
    };

    return (
        <div className="max-w-md mx-auto h-full flex flex-col space-y-6 animate-slide-up pb-20 overflow-hidden">
            <header className="shrink-0 space-y-4 border-b border-white/10 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">
                            {activeList?.name || "Shared Lists"}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="system-text text-[10px] text-neon-green font-black tracking-widest uppercase">
                                {activeList?.sharedWith.length ? `Synced: ${activeList.sharedWith.join(", ")}` : "Private Manifest"}
                            </p>
                            {activeList?.mode === 'shopping' && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/20 border border-accent/40 rounded-sm">
                                    <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                                    <span className="text-[8px] font-black text-accent uppercase tracking-tighter">LIVE: {activeList.active_shopper}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleMode}
                            title="Toggle Store Mode"
                            className={`p-2 rounded-sm border transition-all ${activeList?.mode === 'shopping' ? 'border-accent bg-accent/20 text-accent shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'border-white/10 text-white/20 hover:text-white'}`}
                        >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setIsSharing(!isSharing)}
                            className={`p-2 rounded-sm border transition-all ${isSharing ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/30'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {isSharing && (
                    <div className="hud-panel p-4 bg-accent/5 border-accent/20 animate-slide-up">
                        <label className="text-[8px] font-black uppercase text-accent/60 block mb-2 tracking-widest">Invite Collaborator</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="email@address.com"
                                className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-accent"
                            />
                            <button
                                onClick={shareList}
                                className="bg-accent/20 border border-accent/40 px-4 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all"
                            >
                                Share
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {lists.map(l => (
                        <button
                            key={l.id}
                            onClick={() => setActiveListId(l.id)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeListId === l.id ? 'border-accent bg-accent/10 text-white' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                        >
                            {l.name}
                        </button>
                    ))}
                    <button
                        onClick={addList}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/20 text-white/20 hover:border-accent/40 hover:text-accent transition-all"
                    >
                        + New List
                    </button>
                </div>
            </header>

            <div className={`flex-grow overflow-y-auto hide-scrollbar space-y-2 pr-2 transition-all duration-500 ${activeList?.mode === 'shopping' ? 'bg-accent/5 p-2 rounded-lg' : ''}`}>
                {activeList?.items.map(item => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-4 p-4 hud-panel bg-black/40 border-white/5 group transition-all ${item.checked ? 'opacity-40' : 'hover:border-accent/20'} ${activeList.mode === 'shopping' ? 'border-accent/10' : ''}`}
                    >
                        <button
                            onClick={() => toggleItem(item.id)}
                            className={`h-6 w-6 shrink-0 border-2 rounded-sm flex items-center justify-center transition-all ${item.checked ? 'border-neon-green bg-neon-green/20' : 'border-white/20 group-hover:border-accent/40'}`}
                        >
                            {item.checked && <div className="h-3 w-3 bg-neon-green shadow-[0_0_8px_#22c55e]" />}
                        </button>

                        <span
                            onClick={() => toggleItem(item.id)}
                            className={`flex-grow text-sm font-medium transition-all uppercase italic tracking-tight ${item.checked ? 'line-through text-white/20' : 'text-white/90 font-black'}`}
                        >
                            {item.text}
                        </span>

                        <button
                            onClick={() => deleteItem(item.id)}
                            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-500 p-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                {activeList?.items.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-white/5 rounded-lg">
                        <p className="system-text text-[10px] text-white/20 font-black uppercase italic tracking-widest">No items in this manifest.</p>
                    </div>
                )}
            </div>

            <form onSubmit={addItem} className="shrink-0 pt-4 bg-gradient-to-t from-black via-black to-transparent pb-24">
                <div className="flex gap-2">
                    <input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Manifest an item..."
                        className="flex-grow bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-accent italic uppercase transition-all"
                    />
                    <button
                        type="submit"
                        className="bg-accent/10 border border-accent/20 px-6 text-accent system-text text-[10px] font-black uppercase hover:bg-accent hover:text-black transition-all"
                    >
                        ADD
                    </button>
                </div>
            </form>
        </div>
    );
}
