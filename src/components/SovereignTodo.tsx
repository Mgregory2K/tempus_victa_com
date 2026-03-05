// src/components/SovereignTodo.tsx
"use client";

import React, { useState } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    priority: boolean;
}

export default function SovereignTodo() {
    const [todos, setTodos] = useState<TodoItem[]>([
        { id: '1', text: 'Verify Trust Mathematics decay constant', completed: false, priority: true },
        { id: '2', text: 'Call property tax office', completed: false, priority: false },
        { id: '3', text: 'Crystallize philosophy for Volume VII', completed: true, priority: true },
        { id: '4', text: 'Refine Matrix Rain alpha transparency', completed: false, priority: false },
    ]);

    const toggleTodo = (id: string) => {
        setTodos(prev => prev.map(t => {
            if (t.id === id) {
                const newState = !t.completed;
                if (newState) {
                    twinPlusKernel.observe(createEvent('TASK_COMPLETED', { text: t.text }, 'TODO'));
                }
                return { ...t, completed: newState };
            }
            return t;
        }));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-slide-up pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Sovereign To-Do</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Checklist // Individual Objectives</p>
                </div>
            </header>

            <div className="space-y-2">
                {todos.map(todo => (
                    <div
                        key={todo.id}
                        onClick={() => toggleTodo(todo.id)}
                        className={`hud-panel p-4 flex items-center gap-4 cursor-pointer transition-all ${todo.completed ? 'opacity-30' : 'bg-black/40 border-white/5 hover:border-accent/30'}`}
                    >
                        <div className={`h-5 w-5 border-2 flex items-center justify-center transition-all ${todo.completed ? 'border-neon-green bg-neon-green/20' : todo.priority ? 'border-accent/60' : 'border-white/10'}`}>
                            {todo.completed && <div className="h-2 w-2 bg-neon-green shadow-[0_0_8px_#22c55e]" />}
                        </div>

                        <div className="flex-grow">
                            <p className={`text-sm font-bold italic ${todo.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                                {todo.text}
                            </p>
                        </div>

                        {todo.priority && !todo.completed && (
                            <span className="text-[7px] font-black text-accent border border-accent/30 px-1.5 py-0.5 animate-pulse">PRIORITY</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4">
                <input
                    type="text"
                    placeholder="Capture new objective..."
                    className="w-full bg-black/60 border border-white/10 p-4 system-text text-xs focus:border-accent outline-none text-white placeholder:text-white/10 shadow-inner"
                />
            </div>
        </div>
    );
}
