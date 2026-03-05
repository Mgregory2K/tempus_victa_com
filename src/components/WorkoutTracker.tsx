// src/components/WorkoutTracker.tsx
"use client";

import React, { useState } from 'react';

interface Exercise {
    id: string;
    name: string;
    completedSets: number;
    totalSets: number;
    color: string;
}

export default function WorkoutTracker() {
    const [exercises, setExercises] = useState<Exercise[]>([
        { id: '1', name: 'Squats', completedSets: 4, totalSets: 4, color: 'bg-neon-green' },
        { id: '2', name: 'Leg Press', completedSets: 2, totalSets: 3, color: 'bg-accent' },
        { id: '3', name: 'Calf Raises', completedSets: 3, totalSets: 3, color: 'bg-purple-500' },
    ]);

    const handleIncrement = (id: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id === id && ex.completedSets < ex.totalSets) {
                return { ...ex, completedSets: ex.completedSets + 1 };
            }
            return ex;
        }));
    };

    return (
        <div className="max-w-md mx-auto space-y-8 animate-slide-up">
            <header className="space-y-1">
                <h1 className="text-4xl font-black italic text-white">Workout Tracker</h1>
                <p className="system-text text-xs text-white/40 font-black tracking-widest">Tuesday, Apr 18</p>
            </header>

            <div className="space-y-1">
                <h2 className="text-2xl font-black text-white italic">Legs Day</h2>
                <p className="system-text text-[10px] text-accent font-black tracking-widest">Goal: 8 Sets Complete</p>
            </div>

            <div className="space-y-4">
                {exercises.map((ex) => (
                    <div key={ex.id}
                         onClick={() => handleIncrement(ex.id)}
                         className="hud-panel p-4 bg-black/40 border-white/5 cursor-pointer group hover:border-white/20 transition-all">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`h-2 w-2 rounded-full ${ex.color} shadow-[0_0_10px_currentColor]`} />
                                <span className="system-text text-sm font-black text-white/90">{ex.name}</span>
                            </div>
                            <span className="system-text text-xs font-black text-white/40">
                                {ex.completedSets} / {ex.totalSets} <span className="text-[8px] ml-1">Sets</span>
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${ex.color} transition-all duration-500 ease-out`}
                                style={{ width: `${(ex.completedSets / ex.totalSets) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full py-4 bg-accent/10 border border-accent/30 text-accent system-text text-xs font-black hover:bg-accent hover:text-white transition-all relative overflow-hidden group">
                <span className="relative z-10">Finish Workout</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            {/* Background Graphic Element */}
            <div className="pt-8 opacity-20">
                <div className="h-32 w-full bg-gradient-to-t from-accent/20 to-transparent rounded-t-3xl border-t border-accent/30 flex items-end justify-center pb-4">
                     <span className="system-text text-[8px] tracking-[1em] text-accent animate-pulse">OPTIMIZING PHYSICAL LAYER</span>
                </div>
            </div>
        </div>
    );
}
