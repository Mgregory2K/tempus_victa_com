"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';
import { SharedList, SharedListItem, ListPermission, DEFAULT_GROCERY_CATEGORIES } from '@/types/shared-lists';

export default function SharedLists() {
    const [lists, setLists] = useState<SharedList[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Other");
    const [isSharing, setIsSharing] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [sharePhone, setSharePhone] = useState("");
    const [isSendingAlert, setIsSendingAlert] = useState(false);

    // Load lists from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("tv_shared_lists_v2");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setLists(parsed);
                if (parsed.length > 0) setActiveListId(parsed[0].list_id);
            } catch (e) {
                console.error("Failed to parse lists", e);
            }
        } else {
            // Default list if none exist
            const defaultList: SharedList = {
                list_id: 'grocery_001',
                name: 'Grocery List',
                owner: 'michael.gregory1@gmail.com',
                created_by: 'michael.gregory1@gmail.com',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                items: [
                    { item_id: '1', text: 'Milk', checked: false, category: 'Dairy', created_by: 'michael.gregory1@gmail.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { item_id: '2', text: 'Eggs', checked: false, category: 'Dairy', created_by: 'michael.gregory1@gmail.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { item_id: '3', text: 'Bananas', checked: true, category: 'Produce', created_by: 'michael.gregory1@gmail.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ],
                permissions: [
                    { email: 'jenmariehines@gmail.com', phone: '+15133157616', role: 'editor' }
                ],
                mode: 'standard'
            };
            setLists([defaultList]);
            setActiveListId(defaultList.list_id);
        }
    }, []);

    // Save lists on change
    useEffect(() => {
        if (lists.length > 0) {
            localStorage.setItem("tv_shared_lists_v2", JSON.stringify(lists));
            // Trigger background sync to cloud if session exists
            fetch('/api/sync?file=shared_lists.json', {
                method: 'POST',
                body: JSON.stringify(lists)
            }).catch(err => console.debug("Sync deferred: No active session"));
        }
    }, [lists]);

    const activeList = lists.find(l => l.list_id === activeListId);

    const addList = () => {
        const name = prompt("Enter list name:");
        if (!name) return;
        const newList: SharedList = {
            list_id: Date.now().toString(),
            name,
            owner: 'michael.gregory1@gmail.com',
            created_by: 'michael.gregory1@gmail.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [],
            permissions: [],
            mode: 'standard'
        };
        setLists([...lists, newList]);
        setActiveListId(newList.list_id);
        twinPlusKernel.observe(createEvent('LIST_CREATED', { name }, 'SHARED_LISTS'));
    };

    const startShopping = async () => {
        if (!activeList || activeList.mode === 'shopping') return;

        setIsSendingAlert(true);
        try {
            // Update local state first
            const updatedLists = lists.map(l => {
                if (l.list_id === activeListId) {
                    return {
                        ...l,
                        mode: 'shopping' as const,
                        active_shopper: 'Michael',
                        shopping_started_at: new Date().toISOString()
                    };
                }
                return l;
            });
            setLists(updatedLists);

            // Trigger SMS alert if not sent already
            if (!activeList.shopping_alert_sent) {
                const response = await fetch('/api/lists/start-shopping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listId: activeList.list_id,
                        shopperName: 'Michael',
                        collaborators: activeList.permissions.filter(p => p.phone)
                    })
                });

                if (response.ok) {
                    setLists(prev => prev.map(l =>
                        l.list_id === activeListId ? { ...l, shopping_alert_sent: true } : l
                    ));
                }
            }

            twinPlusKernel.observe(createEvent('SHOPPING_STARTED', { listId: activeList.list_id }, 'SHARED_LISTS'));
        } catch (error) {
            console.error("Failed to start shopping:", error);
        } finally {
            setIsSendingAlert(false);
        }
    };

    const stopShopping = () => {
        if (!activeListId) return;
        setLists(lists.map(l => {
            if (l.list_id === activeListId) {
                return { ...l, mode: 'standard', active_shopper: undefined, shopping_alert_sent: false };
            }
            return l;
        }));
        twinPlusKernel.observe(createEvent('SHOPPING_ENDED', { listId: activeListId }, 'SHARED_LISTS'));
    };

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || !activeListId) return;

        const newItem: SharedListItem = {
            item_id: Date.now().toString(),
            text: newItemText.trim(),
            checked: false,
            category: newItemCategory,
            created_by: 'michael.gregory1@gmail.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        setLists(lists.map(l => l.list_id === activeListId ? { ...l, items: [newItem, ...l.items] } : l));
        setNewItemText("");
        twinPlusKernel.observe(createEvent('LIST_ITEM_ADDED', { text: newItem.text, category: newItem.category }, 'SHARED_LISTS'));
    };

    const toggleItem = (itemId: string) => {
        setLists(lists.map(l => l.list_id === activeListId ? {
            ...l,
            items: l.items.map(i => i.item_id === itemId ? { ...i, checked: !i.checked, updated_at: new Date().toISOString() } : i)
        } : l));
    };

    const deleteItem = (itemId: string) => {
        setLists(lists.map(l => l.list_id === activeListId ? {
            ...l,
            items: l.items.filter(i => i.item_id !== itemId)
        } : l));
    };

    const shareList = () => {
        if (!shareEmail.trim() || !activeListId) return;
        const newPermission: ListPermission = {
            email: shareEmail.trim(),
            phone: sharePhone.trim() || undefined,
            role: 'editor'
        };
        setLists(lists.map(l => l.list_id === activeListId ? {
            ...l,
            permissions: [...l.permissions.filter(p => p.email !== shareEmail.trim()), newPermission]
        } : l));
        setShareEmail("");
        setSharePhone("");
        setIsSharing(false);
        twinPlusKernel.observe(createEvent('LIST_SHARED', { email: shareEmail, phone: sharePhone }, 'SHARED_LISTS'));
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
        <div className="max-w-md mx-auto h-full flex flex-col space-y-6 animate-slide-up pb-20 overflow-hidden">
            <header className="shrink-0 space-y-4 border-b border-white/10 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">
                            {activeList?.name || "Shared Lists"}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="system-text text-[10px] text-neon-green font-black tracking-widest uppercase">
                                {activeList?.permissions.length ? `Shared with ${activeList.permissions.length} manifest(s)` : "Private Manifest"}
                            </p>
                            {activeList?.mode === 'shopping' && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/20 border border-accent/40 rounded-sm">
                                    <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                                    <span className="text-[8px] font-black text-accent uppercase tracking-tighter">LIVE: {activeList.active_shopper} SHOPPING</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {activeList?.mode === 'shopping' ? (
                             <button
                                onClick={stopShopping}
                                className="px-3 py-1.5 bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded-sm"
                            >
                                Done
                            </button>
                        ) : (
                            <button
                                onClick={startShopping}
                                disabled={isSendingAlert}
                                className="px-3 py-1.5 bg-accent/10 border border-accent/40 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all rounded-sm disabled:opacity-50"
                            >
                                {isSendingAlert ? 'Alerting...' : 'Start Shopping'}
                            </button>
                        )}
                        <button
                            onClick={() => setIsSharing(!isSharing)}
                            className={`p-2 rounded-sm border transition-all ${isSharing ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 text-white/40 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {isSharing && (
                    <div className="hud-panel p-4 bg-accent/5 border-accent/20 animate-slide-up space-y-3">
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
                                placeholder="Phone (+1...)"
                                className="bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-accent"
                            />
                        </div>
                        <button
                            onClick={shareList}
                            className="w-full bg-accent/20 border border-accent/40 py-2 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-black transition-all"
                        >
                            Confirm Access
                        </button>
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {lists.map(l => (
                        <button
                            key={l.list_id}
                            onClick={() => setActiveListId(l.list_id)}
                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeListId === l.list_id ? 'border-accent bg-accent/10 text-white' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                        >
                            {l.name}
                        </button>
                    ))}
                    <button
                        onClick={addList}
                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-dashed border-white/20 text-white/20 hover:border-accent/40 hover:text-accent transition-all"
                    >
                        + New
                    </button>
                </div>
            </header>

            <div className={`flex-grow overflow-y-auto hide-scrollbar space-y-6 pr-1 transition-all duration-500 ${activeList?.mode === 'shopping' ? 'bg-accent/5 p-2 rounded-lg' : ''}`}>
                {categoriesInUse.map(category => (
                    <div key={category} className="space-y-1">
                        <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{category}</span>
                            <div className="h-px flex-grow bg-white/5" />
                        </div>
                        {groupedItems[category].map(item => (
                            <div
                                key={item.item_id}
                                className={`flex items-center gap-3 px-3 py-2 h-[48px] hud-panel bg-black/40 border-white/5 group transition-all ${item.checked ? 'opacity-30' : 'hover:border-accent/20'} ${activeList?.mode === 'shopping' ? 'border-accent/10' : ''}`}
                            >
                                <button
                                    onClick={() => toggleItem(item.item_id)}
                                    className={`h-5 w-5 shrink-0 border rounded-sm flex items-center justify-center transition-all ${item.checked ? 'border-neon-green bg-neon-green/20' : 'border-white/20 group-hover:border-accent/40'}`}
                                >
                                    {item.checked && <div className="h-2 w-2 bg-neon-green shadow-[0_0_8px_#22c55e]" />}
                                </button>

                                <span
                                    onClick={() => toggleItem(item.item_id)}
                                    className={`flex-grow text-xs font-bold transition-all uppercase italic tracking-tight ${item.checked ? 'line-through text-white/20' : 'text-white/90 font-black'}`}
                                >
                                    {item.text}
                                </span>

                                <button
                                    onClick={() => deleteItem(item.item_id)}
                                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-500 p-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                ))}

                {activeList?.items.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-white/5 rounded-lg">
                        <p className="system-text text-[10px] text-white/20 font-black uppercase italic tracking-widest">No items in this manifest.</p>
                    </div>
                )}
            </div>

            <form onSubmit={addItem} className="shrink-0 space-y-2 pt-2 bg-gradient-to-t from-black via-black to-transparent pb-24">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {DEFAULT_GROCERY_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setNewItemCategory(cat)}
                            className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${newItemCategory === cat ? 'border-accent bg-accent/20 text-white' : 'border-white/5 text-white/20 hover:border-white/10'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder={`Add to ${newItemCategory}...`}
                        className="flex-grow bg-white/5 border border-white/10 px-4 py-2 text-xs text-white outline-none focus:border-accent italic uppercase transition-all"
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
