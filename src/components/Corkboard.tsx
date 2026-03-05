// src/components/Corkboard.tsx
"use client";

import React, { useState } from 'react';

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

    return (
        <div className="relative w-full h-full min-h-[600px] bg-[#2a1a0a] rounded-xl border-8 border-[#3d2b1f] shadow-inner overflow-hidden animate-slide-up">
            {/* Cork Texture Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '4px 4px' }} />

            <div className="absolute top-4 left-6 z-10">
                <h1 className="text-3xl font-black text-white/40 italic uppercase tracking-widest">Corkboard</h1>
                <p className="system-text text-[8px] text-white/20 font-black tracking-[0.4em]">Controlled Chaos // Spatial Ideation</p>
            </div>

            {notes.map(note => (
                <div key={note.id}
                     className={`absolute p-6 w-64 shadow-2xl cursor-move transition-transform hover:scale-105 active:scale-95 ${note.color} text-black font-medium text-sm`}
                     style={{
                        left: `${note.x}px`,
                        top: `${note.y}px`,
                        transform: `rotate(${note.rotation}deg)`,
                        boxShadow: '5px 5px 15px rgba(0,0,0,0.3)'
                     }}>
                    {/* Pushpin */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-inner border border-red-800">
                        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>

                    <p className="font-handwriting leading-tight">{note.text}</p>

                    <div className="mt-4 flex justify-between items-center opacity-40">
                        <span className="text-[9px] font-bold uppercase tracking-tighter">10.24.2024</span>
                        <div className="flex gap-1">
                             <div className="h-1 w-4 bg-black/20 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}

            {/* Bottom Overlay Actions */}
            <div className="absolute bottom-6 right-6 flex gap-4">
                <button className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-xl">
                    <span className="text-2xl">+</span>
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
