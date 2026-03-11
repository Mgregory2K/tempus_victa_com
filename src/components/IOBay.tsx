// src/components/IOBay.tsx
"use client";

import React from 'react';
import SignalBay from './SignalBay';
import ClockTower from './ClockTower';

interface IOBayProps {
    onNavigate?: (module: string) => void;
    onRouteToTask?: (signal: any) => void;
}

export default function IOBay({ onNavigate, onRouteToTask }: IOBayProps) {
    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in">
            <header className="border-b border-white/10 pb-4">
                <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">I/O Bay</h1>
                <p className="system-text text-[10px] text-accent font-black tracking-[0.4em] mt-1">Unified Intelligence Conduit // Signal & Audit</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
                <div className="overflow-y-auto scrollbar-thin pr-2">
                    <SignalBay onRouteToTask={onRouteToTask} />
                </div>
                <div className="overflow-y-auto scrollbar-thin pr-2 border-l border-white/5 pl-4">
                    <ClockTower onNavigate={onNavigate} />
                </div>
            </div>
        </div>
    );
}
