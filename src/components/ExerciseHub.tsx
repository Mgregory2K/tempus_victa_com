"use client";

import React, { useState, useEffect, useRef } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

type GameType = 'HUB' | 'MINESWEEPER' | 'SNAKE' | 'BLACKJACK' | 'CALIBRATION';

interface ExerciseHubProps {
    onDismiss: () => void;
}

export default function ExerciseHub({ onDismiss }: ExerciseHubProps) {
    const [activeGame, setActiveGame] = useState<GameType>('HUB');

    const GameCard = ({ title, desc, type, icon, color }: { title: string, desc: string, type: GameType, icon: string, color: string }) => (
        <div
            onClick={() => setActiveGame(type)}
            className="hud-panel p-6 bg-black/60 border-white/10 hover:border-accent/40 cursor-pointer transition-all group relative overflow-hidden"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 bg-${color}`} />
            <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
                <h3 className="system-text text-sm font-black text-white tracking-widest uppercase">{title}</h3>
            </div>
            <p className="text-[10px] text-white/40 normal-case leading-relaxed mb-4">{desc}</p>
            <div className="flex justify-between items-center">
                <span className="text-[7px] text-accent font-black uppercase tracking-[0.2em]">Ready for Calibration</span>
                <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
            </div>
        </div>
    );

    return (
        <div className="relative bg-black/95 p-6 md:p-10 border border-accent/20 shadow-2xl rounded-lg w-full max-w-4xl h-[80dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6 shrink-0">
                <div>
                    <h2 className="system-text text-2xl font-black italic text-accent tracking-tighter uppercase">Cognitive Calibration Hub</h2>
                    <p className="text-[8px] text-white/20 font-black tracking-[0.4em] uppercase mt-2">Neural Exercise Surface // J5 Observed</p>
                </div>
                <div className="flex gap-3">
                    {activeGame !== 'HUB' && (
                        <button
                            onClick={() => setActiveGame('HUB')}
                            className="px-4 py-2 border border-white/10 text-[8px] font-black text-white/40 hover:text-white hover:border-white transition-all uppercase"
                        >
                            [ BACK_TO_HUB ]
                        </button>
                    )}
                    <button
                        onClick={onDismiss}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/40 text-red-500 text-[8px] font-black hover:bg-red-500 hover:text-white transition-all uppercase"
                    >
                        [ TERMINATE_SESSION ]
                    </button>
                </div>
            </div>

            {/* Main Surface */}
            <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
                {activeGame === 'HUB' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GameCard
                            title="Mindsweeper"
                            desc="Spatial logic and risk analysis. Every move is a signal. Do not hit the entropy mines."
                            type="MINESWEEPER"
                            icon="💣"
                            color="red-500"
                        />
                        <GameCard
                            title="Sovereign Snake"
                            desc="Flow state and motor calibration. Measures touch precision and reaction latency."
                            type="SNAKE"
                            icon="🐍"
                            color="accent"
                        />
                        <GameCard
                            title="Triage Blackjack"
                            desc="Probability and risk threshold calibration. How do you handle uncertainty?"
                            type="BLACKJACK"
                            icon="🃏"
                            color="purple-500"
                        />
                        <GameCard
                            title="J5 Calibration"
                            desc="Direct neural exercises. Scenario-based decision making moderated by J5."
                            type="CALIBRATION"
                            icon="🧠"
                            color="neon-green"
                        />
                    </div>
                )}

                {activeGame === 'MINESWEEPER' && <MinesweeperGame />}
                {activeGame === 'SNAKE' && <SnakeGame />}
                {activeGame === 'BLACKJACK' && <BlackjackGame />}
                {activeGame === 'CALIBRATION' && <CalibrationScenarios />}
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center shrink-0">
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[7px] text-white/20 font-black uppercase mb-1">Focus State</span>
                        <span className="text-[10px] text-accent font-bold italic uppercase">Optimal</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] text-white/20 font-black uppercase mb-1">Direct Learning</span>
                        <span className="text-[10px] text-neon-green font-bold italic uppercase">Active</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[8px] text-white/10 font-mono tracking-widest uppercase">Twin+ Substrate // v3.4.0_CAL</span>
                </div>
            </footer>
        </div>
    );
}

// --- GAME COMPONENTS (SCAFFOLDED) ---

function MinesweeperGame() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="text-4xl">💣</div>
            <h3 className="system-text text-xl font-black text-white italic uppercase">Mindsweeper Engine</h3>
            <p className="text-white/40 max-w-xs text-xs">Initializing spatial logic grid... Entropy mines being placed. Strategy required.</p>
            <div className="hud-panel p-12 border-dashed border-white/10 text-white/20 text-[10px] font-black uppercase tracking-widest">
                Under Construction
            </div>
        </div>
    );
}

function SnakeGame() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="text-4xl">🐍</div>
            <h3 className="system-text text-xl font-black text-accent italic uppercase">Sovereign Snake</h3>
            <p className="text-white/40 max-w-xs text-xs">Calibrating touch surface precision... Preparing flow-state ingestion.</p>
            <div className="hud-panel p-12 border-dashed border-accent/20 text-accent/20 text-[10px] font-black uppercase tracking-widest">
                Awaiting Motor Link
            </div>
        </div>
    );
}

function BlackjackGame() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="text-4xl">🃏</div>
            <h3 className="system-text text-xl font-black text-purple-500 italic uppercase">Triage Blackjack</h3>
            <p className="text-white/40 max-w-xs text-xs">Shuffling uncertainty deck... Calculating risk thresholds.</p>
            <div className="hud-panel p-12 border-dashed border-purple-500/20 text-purple-500/20 text-[10px] font-black uppercase tracking-widest">
                Probability Engine Standby
            </div>
        </div>
    );
}

function CalibrationScenarios() {
    const scenarios = [
        { id: 1, title: "Resource Conflict", desc: "Project Alpha and a critical personal errand collide. How do you route?" },
        { id: 2, title: "Information Overload", desc: "Ten signals arrive at once. Only one can be processed now. Which one?" }
    ];

    return (
        <div className="space-y-6 p-4">
            <div className="mb-10 text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="system-text text-xl font-black text-neon-green italic uppercase">Neural Calibration</h3>
                <p className="text-white/40 text-xs mt-2">Scenario-based decision capture for Twin+ refinement.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {scenarios.map(s => (
                    <div key={s.id} className="hud-panel p-6 bg-white/[0.02] border-white/5 hover:border-neon-green/40 transition-all cursor-pointer group">
                        <h4 className="text-sm font-black text-white uppercase italic mb-2">{s.title}</h4>
                        <p className="text-[10px] text-white/40 normal-case">{s.desc}</p>
                        <div className="mt-4 flex justify-end">
                            <span className="text-[8px] font-black text-neon-green/40 group-hover:text-neon-green uppercase tracking-widest">[ BEGIN_EXERCISE ]</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
