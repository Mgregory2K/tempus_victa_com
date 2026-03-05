// src/components/Corkboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Note {
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
    color: string;
}

export default function Corkboard() {
    const [notes, setNotes] = useState<Note[]>([
        { id: '1', text: 'Structure Volume IV: Trust Mathematics needs a deeper dive into decay constants.', x: 50, y: 80, rotation: -2, color: 'bg-yellow-200/80' },
        { id: '2', text: 'Remember to check the local-first benchmark for the Lexicon engine.', x: 400, y: 120, rotation: 3, color: 'bg-blue-200/80' },
        { id: '3', text: 'The Holodeck transition needs to be faster. Reduce matrix delay by 500ms?', x: 220, y: 300, rotation: 1, color: 'bg-green-200/80' },
        { id: '4', text: 'Call property tax office re: exemptions.', x: 550, y: 350, rotation: -4, color: 'bg-orange-200/80' },
    ]);

    const handleDragEnd = (id: string, e: React.DragEvent) => {
        // Simple coordinate mapping relative to board
        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        const newX = e.clientX - rect.left - 100;
        const newY = e.clientY - rect.top - 50;

        setNotes(prev => prev.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));

        // Persist spatial memory to Twin+
        twinPlusKernel.observe(createEvent('CORKBOARD_PIN', {
            id,
            coordinates: { x: newX, y: newY }
        }, 'CORKBOARD'));
    };

    return (
        <div className="relative w-full h-full min-h-[700px] bg-[#2a1a0a] rounded-xl border-8 border-[#3d2b1f] shadow-2xl overflow-hidden animate-slide-up select-none">
            {/* Cork Texture Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '4px 4px' }} />

            <div className="absolute top-6 left-8 z-10">
                <h1 className="text-4xl font-black text-white/30 italic uppercase tracking-widest">Corkboard</h1>
                <p className="system-text text-[10px] text-white/20 font-black tracking-[0.4em]">Spatial Memory // Volume I, Ch 7</p>
            </div>

            {notes.map(note => (
                <div key={note.id}
                     draggable
                     onDragEnd={(e) => handleDragEnd(note.id, e)}
                     className={`absolute p-6 w-64 shadow-2xl cursor-grab active:cursor-grabbing transition-transform hover:brightness-110 ${note.color} text-black font-medium text-sm z-20`}
                     style={{
                        left: `${note.x}px`,
                        top: `${note.y}px`,
                        transform: `rotate(${note.rotation}deg)`,
                        boxShadow: '10px 10px 25px rgba(0,0,0,0.4)',
                        transition: 'box-shadow 0.2s'
                     }}>
                    {/* Pushpin */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 shadow-xl border border-red-800 z-30">
                        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/40" />
                    </div>

                    <p className="font-handwriting leading-tight text-lg">{note.text}</p>

                    <div className="mt-6 flex justify-between items-center opacity-40 border-t border-black/10 pt-2">
                        <span className="text-[8px] font-black uppercase tracking-tighter">TV-MEM-0{note.id}</span>
                        <div className="h-1 w-4 bg-black/20 rounded-full" />
                    </div>
                </div>
            ))}

            <div className="absolute bottom-8 right-8 flex gap-4 z-30">
                <button className="h-14 w-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-2xl backdrop-blur-md">
                    <span className="text-3xl">+</span>
                </button>
            </div>

            <style jsx>{`
                .font-handwriting {
                    font-family: 'Comic Sans MS', 'Marker Felt', cursive;
                }
            `}</style>
        </div>
    );
}
