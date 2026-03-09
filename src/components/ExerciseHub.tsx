"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
            <div className="flex-grow overflow-y-auto scrollbar-thin pr-2 flex flex-col">
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

// --- SOVEREIGN SNAKE (MOTOR CALIBRATION) ---

function SnakeGame() {
    const GRID_SIZE = 20;
    const INITIAL_SNAKE = [{ x: 10, y: 10 }];
    const INITIAL_DIR = { x: 0, y: -1 };
    const SPEED = 100;

    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [dir, setDir] = useState(INITIAL_DIR);
    const [food, setFood] = useState({ x: 5, y: 5 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [latencyLog, setLatencyLog] = useState<number[]>([]);
    const lastFoodSpawn = useRef(Date.now());

    const moveSnake = useCallback(() => {
        if (gameOver) return;

        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            triggerGameOver();
            return;
        }

        // Body Collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            triggerGameOver();
            return;
        }

        const newSnake = [head, ...snake];

        // Food Consumption
        if (head.x === food.x && head.y === food.y) {
            setScore(s => s + 1);
            const latency = Date.now() - lastFoodSpawn.current;
            setLatencyLog(prev => [...prev, latency]);
            spawnFood();
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
    }, [snake, dir, food, gameOver]);

    const spawnFood = () => {
        const newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        setFood(newFood);
        lastFoodSpawn.current = Date.now();
    };

    const triggerGameOver = () => {
        setGameOver(true);
        const avgLatency = latencyLog.length > 0 ? latencyLog.reduce((a, b) => a + b, 0) / latencyLog.length : 0;
        twinPlusKernel.observe(createEvent('MOTOR_CALIBRATION', {
            score,
            avgLatency,
            gridDensity: GRID_SIZE,
            game: 'SNAKE'
        }, 'EXERCISE_HUB'));
    };

    const reset = () => {
        setSnake(INITIAL_SNAKE);
        setDir(INITIAL_DIR);
        setScore(0);
        setGameOver(false);
        setLatencyLog([]);
        spawnFood();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (dir.y === 0) setDir({ x: 0, y: -1 }); break;
                case 'ArrowDown': if (dir.y === 0) setDir({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if (dir.x === 0) setDir({ x: -1, y: 0 }); break;
                case 'ArrowRight': if (dir.x === 0) setDir({ x: 1, y: 0 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        const interval = setInterval(moveSnake, SPEED);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, [moveSnake, dir]);

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex justify-between w-full max-w-[400px] mb-2 px-2">
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Neural Flow</span>
                    <span className="text-xl font-black text-accent italic uppercase">{score} Triumphs</span>
                </div>
                {gameOver && (
                    <button onClick={reset} className="px-4 py-1 bg-accent text-black system-text text-[10px] font-black uppercase hover:bg-white transition-all">Retry Calibration</button>
                )}
            </div>

            <div
                className="relative bg-black border-2 border-white/5 shadow-2xl"
                style={{ width: 400, height: 400, display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
            >
                {snake.map((s, i) => (
                    <div
                        key={i}
                        className={`border border-black/20 ${i === 0 ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : 'bg-accent/40'}`}
                        style={{ gridColumnStart: s.x + 1, gridRowStart: s.y + 1 }}
                    />
                ))}
                <div
                    className="bg-red-500 animate-pulse shadow-[0_0_15px_#ef4444] rounded-full m-1"
                    style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1 }}
                />

                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 border-2 border-red-500/20">
                        <h3 className="system-text text-3xl font-black text-red-500 italic uppercase mb-2">Flow Terminated</h3>
                        <p className="text-[10px] text-white/60 normal-case mb-6">Motor precision dropped below threshold. Calibration complete.</p>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="flex flex-col">
                                <span className="text-[7px] text-white/20 uppercase font-black mb-1">Latency</span>
                                <span className="text-xl font-black text-white italic">{latencyLog.length > 0 ? Math.round(latencyLog.reduce((a,b)=>a+b,0)/latencyLog.length) : 0}ms</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] text-white/20 uppercase font-black mb-1">Signals</span>
                                <span className="text-xl font-black text-white italic">{score}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
                <div />
                <button onTouchStart={() => dir.y === 0 && setDir({x:0, y:-1})} className="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white">▲</button>
                <div />
                <button onTouchStart={() => dir.x === 0 && setDir({x:-1, y:0})} className="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white">◀</button>
                <button onTouchStart={() => dir.y === 0 && setDir({x:0, y:1})} className="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white">▼</button>
                <button onTouchStart={() => dir.x === 0 && setDir({x:1, y:0})} className="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white">▶</button>
            </div>
        </div>
    );
}

// --- ENTROPY CLEARING (MINESWEEPER) ---

function MinesweeperGame() {
    const SIZE = 10;
    const MINES = 12;

    const [grid, setGrid] = useState<any[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [revealedCount, setRevealedCount] = useState(0);
    const [startTime] = useState(Date.now());

    const initGrid = useCallback(() => {
        let newGrid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null).map(() => ({
            isMine: false,
            revealed: false,
            flagged: false,
            neighborCount: 0
        })));

        // Place Mines
        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            let x = Math.floor(Math.random() * SIZE);
            let y = Math.floor(Math.random() * SIZE);
            if (!newGrid[y][x].isMine) {
                newGrid[y][x].isMine = true;
                minesPlaced++;
            }
        }

        // Calc Neighbors
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (newGrid[y][x].isMine) continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        let ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE && newGrid[ny][nx].isMine) count++;
                    }
                }
                newGrid[y][x].neighborCount = count;
            }
        }
        setGrid(newGrid);
        setGameOver(false);
        setWin(false);
        setRevealedCount(0);
    }, []);

    useEffect(() => { initGrid(); }, [initGrid]);

    const reveal = (x: number, y: number) => {
        if (gameOver || win || grid[y][x].revealed || grid[y][x].flagged) return;

        let newGrid = [...grid.map(row => [...row])];
        if (newGrid[y][x].isMine) {
            setGameOver(true);
            reportCalibration(false);
            return;
        }

        const floodFill = (cx: number, cy: number) => {
            if (cx < 0 || cx >= SIZE || cy < 0 || cy >= SIZE || newGrid[cy][cx].revealed || newGrid[cy][cx].isMine) return;
            newGrid[cy][cx].revealed = true;
            if (newGrid[cy][cx].neighborCount === 0) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) floodFill(cx + dx, cy + dy);
                }
            }
        };

        floodFill(x, y);
        setGrid(newGrid);

        const rev = newGrid.flat().filter(c => c.revealed).length;
        setRevealedCount(rev);
        if (rev === SIZE * SIZE - MINES) {
            setWin(true);
            reportCalibration(true);
        }
    };

    const toggleFlag = (e: React.MouseEvent, x: number, y: number) => {
        e.preventDefault();
        if (gameOver || win || grid[y][x].revealed) return;
        let newGrid = [...grid.map(row => [...row])];
        newGrid[y][x].flagged = !newGrid[y][x].flagged;
        setGrid(newGrid);
    };

    const reportCalibration = (success: boolean) => {
        const duration = Date.now() - startTime;
        twinPlusKernel.observe(createEvent('COGNITIVE_SCORE', {
            game: 'MINESWEEPER',
            success,
            duration,
            tilesRevealed: revealedCount
        }, 'EXERCISE_HUB'));
    };

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex justify-between w-full max-w-[350px] mb-2 px-2">
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Entropy Clear</span>
                    <span className="text-xl font-black text-red-500 italic uppercase">{MINES - grid.flat().filter(c => c.flagged).length} Signals</span>
                </div>
                {(gameOver || win) && (
                    <button onClick={initGrid} className="px-4 py-1 bg-red-500 text-white system-text text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">Re-Establish</button>
                )}
            </div>

            <div className="bg-black border-2 border-white/5 p-2 shadow-2xl" style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 2 }}>
                {grid.map((row, y) => row.map((cell, x) => (
                    <button
                        key={`${x}-${y}`}
                        onClick={() => reveal(x, y)}
                        onContextMenu={(e) => toggleFlag(e, x, y)}
                        className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[10px] font-black transition-all ${
                            cell.revealed
                                ? 'bg-white/[0.03] text-white/60'
                                : cell.flagged ? 'bg-red-500/20 text-red-500' : 'bg-white/5 hover:bg-white/10 text-transparent'
                        } border border-white/5`}
                    >
                        {cell.revealed ? (cell.isMine ? '💣' : cell.neighborCount || '') : (cell.flagged ? '🚩' : '')}
                    </button>
                )))}
            </div>

            {gameOver && <p className="text-red-500 system-text text-[10px] font-black uppercase animate-pulse">Critical Entropy Breach // Identity Model Updated</p>}
            {win && <p className="text-neon-green system-text text-[10px] font-black uppercase animate-pulse">Sector Secured // High-Fidelity Signal Found</p>}
        </div>
    );
}

// --- TRIAGE BLACKJACK ---

function BlackjackGame() {
    const [deck, setDeck] = useState<number[]>([]);
    const [playerHand, setPlayerHand] = useState<number[]>([]);
    const [dealerHand, setDealerHand] = useState<number[]>([]);
    const [status, setStatus] = useState<'DEALING' | 'PLAYING' | 'DONE'>('DEALING');
    const [msg, setMsg] = useState("Awaiting Signal Weight...");

    const getVal = (hand: number[]) => {
        let val = hand.reduce((a, b) => a + Math.min(10, b), 0);
        if (hand.includes(1) && val + 10 <= 21) val += 10;
        return val;
    };

    const initGame = () => {
        const newDeck = Array.from({ length: 52 }, (_, i) => (i % 13) + 1).sort(() => Math.random() - 0.5);
        setPlayerHand([newDeck[0], newDeck[1]]);
        setDealerHand([newDeck[2]]);
        setDeck(newDeck.slice(4));
        setStatus('PLAYING');
        setMsg("Choose Risk Threshold");
    };

    useEffect(() => { initGame(); }, []);

    const hit = () => {
        const card = deck[0];
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(deck.slice(1));
        if (getVal(newHand) > 21) {
            setStatus('DONE');
            setMsg("Signal Overflow (Bust)");
            report(false);
        }
    };

    const stand = () => {
        let dHand = [...dealerHand];
        let curDeck = [...deck];
        while (getVal(dHand) < 17) {
            dHand.push(curDeck[0]);
            curDeck = curDeck.slice(1);
        }
        setDealerHand(dHand);
        setDeck(curDeck);
        setStatus('DONE');
        const pVal = getVal(playerHand);
        const dVal = getVal(dHand);
        const win = dVal > 21 || pVal > dVal;
        setMsg(win ? "Target Secured" : "Dealer Efficiency Superior");
        report(win);
    };

    const report = (win: boolean) => {
        twinPlusKernel.observe(createEvent('COGNITIVE_SCORE', { game: 'BLACKJACK', win, pVal: getVal(playerHand) }, 'EXERCISE_HUB'));
    };

    return (
        <div className="flex flex-col items-center gap-8 py-10">
            <div className="text-center space-y-2">
                <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Signal Probability</span>
                <h3 className="system-text text-xl font-black text-white italic uppercase">{msg}</h3>
            </div>

            <div className="flex flex-col gap-10 w-full max-w-[300px]">
                <div className="space-y-2">
                    <span className="text-[7px] text-white/20 uppercase font-black">Counterpart Mass: {getVal(dealerHand)}</span>
                    <div className="flex gap-2">
                        {dealerHand.map((c, i) => <div key={i} className="w-12 h-16 bg-white/5 border border-white/10 rounded flex items-center justify-center font-black italic">{c}</div>)}
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-[7px] text-accent uppercase font-black">Your Mass: {getVal(playerHand)}</span>
                    <div className="flex gap-2">
                        {playerHand.map((c, i) => <div key={i} className="w-12 h-16 bg-accent/10 border border-accent/40 text-accent rounded flex items-center justify-center font-black italic text-xl shadow-[0_0_10px_rgba(0,212,255,0.1)]">{c}</div>)}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                {status === 'PLAYING' ? (
                    <>
                        <button onClick={hit} className="px-8 py-3 bg-accent text-black system-text text-xs font-black uppercase hover:bg-white transition-all shadow-lg">Amplify (Hit)</button>
                        <button onClick={stand} className="px-8 py-3 border border-white/20 text-white system-text text-xs font-black uppercase hover:border-white transition-all">Consolidate (Stand)</button>
                    </>
                ) : (
                    <button onClick={initGame} className="px-12 py-3 bg-white text-black system-text text-xs font-black uppercase hover:bg-accent transition-all shadow-xl">New Triage Cycle</button>
                )}
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
