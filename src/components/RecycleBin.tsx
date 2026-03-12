"use client";

import React, { useState } from 'react';

interface DeletedItem {
    id: string;
    text: string;
    type: 'list' | 'task' | 'project' | 'note';
    deletedAt: string;
    originalOwner: string;
}

export default function RecycleBin() {
    const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([
        { id: 'del_1', text: 'Old Grocery List', type: 'list', deletedAt: new Date().toISOString(), originalOwner: 'michael@tempusvicta.com' },
        { id: 'del_2', text: 'Stale Project Proposal', type: 'project', deletedAt: new Date().toISOString(), originalOwner: 'michael@tempusvicta.com' }
    ]);

    const restoreItem = (id: string) => {
        setDeletedItems(prev => prev.filter(item => item.id !== id));
        // Logic to move back to original module would go here
        alert("Restoring item context...");
    };

    const permanentDelete = (id: string) => {
        if (confirm("Permanently incinerate this signal?")) {
            setDeletedItems(prev => prev.filter(item => item.id !== id));
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col space-y-6 animate-slide-up pb-20">
            <header className="border-b border-white/10 pb-4">
                <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Recycle Bin</h1>
                <p className="system-text text-[10px] text-red-500 font-black tracking-[0.4em] mt-1">Stale Intelligence // Awaiting Incineration</p>
            </header>

            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {deletedItems.length > 0 ? (
                    deletedItems.map(item => (
                        <div key={item.id} className="hud-panel p-4 bg-red-500/5 border-red-500/10 flex items-center justify-between group">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">{item.type}</span>
                                <span className="text-sm font-bold text-white/80">{item.text}</span>
                                <span className="text-[7px] text-white/20 uppercase mt-1 italic">Deleted: {new Date(item.deletedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => restoreItem(item.id)}
                                    className="bg-white/5 border border-white/10 px-3 py-1 text-[8px] font-black text-white/40 hover:bg-white/10 hover:text-white transition-all uppercase"
                                >
                                    Restore
                                </button>
                                <button
                                    onClick={() => permanentDelete(item.id)}
                                    className="bg-red-500/10 border border-red-500/20 px-3 py-1 text-[8px] font-black text-red-500 hover:bg-red-500 hover:text-black transition-all uppercase"
                                >
                                    Incinerate
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-lg">
                        <p className="system-text text-[10px] text-white/10 font-black uppercase italic tracking-[0.5em]">Incinerator Empty // No Stale Signals Detected</p>
                    </div>
                )}
            </div>
        </div>
    );
}
