// src/components/Corkboard.tsx
"use client";

import React, { useState } from 'react';
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

interface CorkboardProps {
    externalNotes?: Note[];
    setNotes?: React.Dispatch<React.SetStateAction<Note[]>>;
    onPromote?: (id: string) => void;
    onArchive?: (id: string) => void;
    onBrainstorm?: (noteText: string) => void;
}

export default function Corkboard({ externalNotes, setNotes, onPromote, onArchive, onBrainstorm }: CorkboardProps) {
    const defaultNotes: Note[] = [
        { id: '1', text: 'Structure Volume IV: Trust Mathematics needs a deeper dive into decay constants.', x: 50, y: 80, rotation: -2, color: 'bg-yellow-200/80' },
        { id: '2', text: 'Remember to check the local-first benchmark for the Lexicon engine.', x: 400, y: 120, rotation: 3, color: 'bg-blue-200/80' },
    ];

    const activeNotes = externalNotes || defaultNotes;

    const handleDragEnd = (id: string, e: React.DragEvent) => {
        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        const newX = e.clientX - rect.left - 100;
        const newY = e.clientY - rect.top - 50;

        if (setNotes) {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));
        }

        twinPlusKernel.observe(createEvent('CORKBOARD_PIN', {
            id,
            coordinates: { x: newX, y: newY }
        }, 'CORKBOARD'));
    };

    return (
        <div className="relative w-full h-full min-h-[700px] bg-[#2a1a0a] rounded-xl border-8 border-[#3d2b1f] shadow-2xl overflow-hidden animate-slide-up select-none">
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '4px 4px' }} />

            <div className="absolute top-6 left-8 z-10">
                <h1 className="text-4xl font-black text-white/30 italic uppercase tracking-widest leading-none">Corkboard</h1>
                <p className="system-text text-[10px] text-white/20 font-black tracking-[0.4em]">Spatial Memory // Volume I, Ch 7</p>
            </div>

            {activeNotes.map(note => (
                <div key={note.id}
                     draggable
                     onDragEnd={(e) => handleDragEnd(note.id, e)}
                     className={`absolute p-6 w-64 shadow-2xl cursor-grab active:cursor-grabbing transition-all hover:brightness-110 ${note.color} text-black font-medium text-sm z-20 group`}
                     style={{
                        left: `${note.x}px`,
                        top: `${note.y}px`,
                        transform: `rotate(${note.rotation}deg)`,
                        boxShadow: '10px 10px 25px rgba(0,0,0,0.4)',
                     }}>

                    {/* Tactical Menu */}
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                        <button onClick={() => onBrainstorm?.(note.text)} className="h-6 w-6 bg-accent text-black rounded shadow-lg flex items-center justify-center hover:scale-110 transition-transform" title="Brainstorm with J5">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </button>
                        <button onClick={() => onPromote?.(note.id)} className="h-6 w-6 bg-neon-green text-black rounded shadow-lg flex items-center justify-center hover:scale-110 transition-transform" title="Promote to Task">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7-7m-7-7v18" /></svg>
                        </button>
                        <button onClick={() => onArchive?.(note.id)} className="h-6 w-6 bg-red-600 text-white rounded shadow-lg flex items-center justify-center hover:scale-110 transition-transform" title="Archive Note">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 shadow-xl border border-red-800 z-30">
                        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/40" />
                    </div>

                    <p className="font-handwriting leading-tight text-lg">{note.text}</p>

                    <div className="mt-6 flex justify-between items-center opacity-40 border-t border-black/10 pt-2">
                        <span className="text-[8px] font-black uppercase tracking-tighter">TV-MEM-0{note.id.slice(-3)}</span>
                        <div className="h-1 w-4 bg-black/20 rounded-full" />
                    </div>
                </div>
            ))}

            <style jsx>{`
                .font-handwriting {
                    font-family: 'Comic Sans MS', 'Marker Felt', cursive;
                }
            `}</style>
        </div>
    );
}
