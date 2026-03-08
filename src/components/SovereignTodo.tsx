// src/components/SovereignTodo.tsx
"use client";

import React, { useState } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Task {
    id: string;
    title: string;
    priority: 'HIGH' | 'MED' | 'LOW';
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
    source: string;
    completed_at?: string;
}

interface SovereignTodoProps {
    externalTasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function SovereignTodo({ externalTasks, setTasks }: SovereignTodoProps) {
    const [newItem, setNewItem] = useState("");

    // Filter for "Tactical" items (things from the To-Do source or general loose signals)
    const todoItems = externalTasks.filter(t =>
        (t.source === 'TACTICAL_TODO' || t.source === 'WORKING_MEMORY') &&
        t.status !== 'DONE' &&
        t.status !== 'SNOOZED'
    );

    const toggleComplete = (id: string) => {
        const ts = new Date().toISOString();
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'DONE', completed_at: ts } : t));

        const item = externalTasks.find(t => t.id === id);
        twinPlusKernel.observe(createEvent('TASK_COMPLETED', {
            text: item?.title,
            source: 'TACTICAL_TODO'
        }, 'TODO'));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title: newItem.trim(),
            priority: 'MED',
            status: 'TODO',
            source: 'TACTICAL_TODO',
            completed_at: undefined
        };

        setTasks(prev => [newTask, ...prev]);
        setNewItem("");

        twinPlusKernel.observe(createEvent('ACTION_CREATED', {
            action: 'ADD_TACTICAL_TODO',
            title: newTask.title
        }, 'TODO'));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-slide-up pb-24 text-left">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Sovereign To-Do</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-[0.4em] mt-2 uppercase">Tactical Infantry // The Micro-Signal Ledger</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-white/20 font-black uppercase italic">"Don't forget the tire store."</span>
                </div>
            </header>

            {/* Quick Capture */}
            <div className="hud-panel p-4 bg-accent/5 border-accent/20 relative group">
                <form onSubmit={handleAdd} className="flex gap-4">
                    <input
                        autoFocus
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Capture a tactical reminder..."
                        className="flex-grow bg-transparent border-b border-white/10 p-2 text-md font-bold italic text-white outline-none focus:border-accent placeholder:text-white/10 uppercase"
                    />
                    <button type="submit" className="bg-accent text-black px-6 py-2 text-[10px] font-black uppercase hover:bg-white transition-all">ADD</button>
                </form>
                <div className="bracket-tl" /><div className="bracket-br" />
            </div>

            <div className="space-y-3">
                {todoItems.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-white/5 rounded-lg">
                        <p className="system-text text-[10px] text-white/10 font-black tracking-[0.3em] uppercase">No pending micro-signals.</p>
                    </div>
                ) : (
                    todoItems.map(todo => (
                        <div
                            key={todo.id}
                            onClick={() => toggleComplete(todo.id)}
                            className="hud-panel p-5 flex items-center gap-6 cursor-pointer bg-black/40 border-white/5 hover:border-accent/40 group transition-all"
                        >
                            {/* Tactical Checkbox */}
                            <div className="h-10 w-10 border-2 border-white/10 flex items-center justify-center group-hover:border-accent transition-all shrink-0">
                                <div className="h-4 w-4 bg-transparent border border-white/5 group-hover:bg-accent/10" />
                            </div>

                            <div className="flex-grow">
                                <p className="text-lg font-bold italic text-white/90 group-hover:text-white transition-colors uppercase leading-tight">
                                    {todo.title}
                                </p>
                                <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">{todo.source} // {new Date(parseInt(todo.id)).toLocaleDateString()}</span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black text-accent animate-pulse px-2 py-1 border border-accent/20 uppercase">Complete_Signal</span>
                            </div>

                            <div className="bracket-tl opacity-10" />
                            <div className="bracket-br opacity-10" />
                        </div>
                    ))
                )}
            </div>

            <footer className="pt-8 text-center">
                 <p className="text-[8px] text-white/10 font-bold uppercase tracking-[0.5em] italic">Tactical items do not require project architecture.</p>
            </footer>
        </div>
    );
}
