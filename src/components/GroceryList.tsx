// src/components/GroceryList.tsx
"use client";

import React, { useState } from 'react';

interface GroceryItem {
    id: string;
    text: string;
    checked: boolean;
    category: 'Produce' | 'Dairy' | 'Other';
}

export default function GroceryList() {
    const [items, setItems] = useState<GroceryItem[]>([
        { id: '1', text: 'Apples', checked: false, category: 'Produce' },
        { id: '2', text: 'Spinach', checked: false, category: 'Produce' },
        { id: '3', text: 'Avocados', checked: false, category: 'Produce' },
        { id: '4', text: 'Bananas', checked: true, category: 'Produce' },
        { id: '5', text: 'Almond Milk', checked: true, category: 'Dairy' },
        { id: '6', text: 'Eggs', checked: true, category: 'Dairy' },
        { id: '7', text: 'Dates', checked: false, category: 'Dairy' },
    ]);

    const toggleItem = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const renderCategory = (category: string) => (
        <div key={category} className="space-y-3">
            <div className="flex items-center gap-4">
                <h3 className="system-text text-xs font-black text-white/90">{category}</h3>
                <div className="h-px flex-grow bg-white/10" />
            </div>
            <div className="space-y-1">
                {items.filter(i => i.category === category).map(item => (
                    <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center justify-between p-4 hud-panel bg-black/40 border-white/5 cursor-pointer transition-all ${item.checked ? 'opacity-40' : 'hover:border-accent/30'}`}
                    >
                        <span className={`text-sm font-medium ${item.checked ? 'line-through' : 'text-white/90'}`}>{item.text}</span>
                        <div className={`h-5 w-5 border-2 rounded-sm flex items-center justify-center transition-all ${item.checked ? 'border-neon-green bg-neon-green/20' : 'border-white/20'}`}>
                            {item.checked && <div className="h-2 w-2 bg-neon-green" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto space-y-8 animate-slide-up pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Shared Grocery List</h1>
                    <p className="system-text text-[10px] text-neon-green font-black tracking-widest mt-1">Synced with Jen • Updated Just Now</p>
                </div>
            </header>

            <div className="space-y-8">
                {['Produce', 'Dairy'].map(renderCategory)}
            </div>

            <button className="w-full py-4 bg-white/5 border border-white/10 text-white/60 system-text text-xs font-black hover:bg-white hover:text-black transition-all">
                + Add Item
            </button>

            <div className="opacity-10 pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2 w-full px-8">
                <div className="h-32 w-full bg-gradient-to-t from-neon-green/40 to-transparent rounded-t-3xl border-t border-neon-green/30" />
            </div>
        </div>
    );
}
