"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

type GameType = 'HUB' | 'MINESWEEPER' | 'SNAKE' | 'BLACKJACK' | 'CALIBRATION';

interface ExerciseHubProps {
    onDismiss: () => void;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card {
    rank: string;
    suit: string;
    value: number;
    hidden?: boolean;
}

export default function ExerciseHub({ onDismiss }: ExerciseHubProps) {
    const [activeGame, setActiveGame] = useState<GameType>('HUB');

    return (
        <div className="fixed inset-0 z-[8000] bg-black/98 flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Unified Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80 backdrop-blur-md shrink-0">
                <div className="flex flex-col">
                    <h2 className="system-text text-[10px] font-black tracking-[0.3em] text-accent uppercase">
                        {activeGame === 'HUB' ? "Cognitive Calibration Hub" : `Calibration // ${activeGame}`}
                    </h2>
                    <span className="text-[6px] text-white/40 font-bold uppercase tracking-widest mt-1 italic">
                        Twin+ Substrate // v3.5.0_LOGIC
                    </span>
                </div>
                <div className="flex gap-2">
                    {activeGame !== 'HUB' && (
                        <button onClick={() => setActiveGame('HUB')} className="px-3 py-1.5 border border-white/10 system-text text-[7px] font-black text-white/40 hover:text-accent transition-all uppercase">Back to Hub</button>
                    )}
                    <button onClick={onDismiss} className="px-4 py-1.5 border border-red-500/40 text-red-500 system-text text-[8px] font-black bg-red-500/5 hover:bg-red-500 hover:text-white transition-all">TERMINATE_SESSION</button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto relative bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.05),transparent_70%)]">
                {activeGame === 'HUB' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 max-w-4xl mx-auto mt-10">
                        <GameCard title="Triage Blackjack" desc="High-stakes probability and risk calibration. Measures strategic alignment and decision confidence." type="BLACKJACK" icon="🃏" color="purple-500" onClick={() => setActiveGame('BLACKJACK')} />
                        <GameCard title="Mindsweeper" desc="Spatial logic and entropy clearing. Tracks logical gap analysis and risk-weighted guessing." type="MINESWEEPER" icon="💣" color="red-500" onClick={() => setActiveGame('MINESWEEPER')} />
                        <GameCard title="Sovereign Snake" desc="Motor calibration and focus state stability. Measures latency and touch precision." type="SNAKE" icon="🐍" color="accent" onClick={() => setActiveGame('SNAKE')} />
                        <GameCard title="Direct Calibration" desc="Moderated decision scenarios. J5 observes your reasoning patterns directly." type="CALIBRATION" icon="🧠" color="neon-green" onClick={() => setActiveGame('CALIBRATION')} />
                    </div>
                )}

                {activeGame === 'BLACKJACK' && <BlackjackGame />}
                {activeGame === 'MINESWEEPER' && <MinesweeperGame />}
                {activeGame === 'SNAKE' && <SnakeGame />}
            </div>
        </div>
    );
}

function GameCard({ title, desc, type, icon, color, onClick }: any) {
    return (
        <div onClick={onClick} className="hud-panel p-6 bg-black/60 border-white/10 hover:border-accent/40 cursor-pointer transition-all group relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 bg-${color}`} />
            <div className="flex items-center gap-4 mb-4 relative z-10">
                <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
                <h3 className="system-text text-sm font-black text-white tracking-widest uppercase">{title}</h3>
            </div>
            <p className="text-[10px] text-white/40 normal-case leading-relaxed mb-4 relative z-10">{desc}</p>
            <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
        </div>
    );
}

// --- 🃏 TRIAGE BLACKJACK (STRATEGIC CALIBRATION) ---

function BlackjackGame() {
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'DEALER_TURN' | 'SETTLED'>('IDLE');
    const [message, setMessage] = useState("AWAITING_STAKE");
    const [stats, setStatus] = useState({ wins: 0, losses: 0, logicAlignment: 100 });

    const createDeck = () => {
        const newDeck: Card[] = [];
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                let val = parseInt(rank);
                if (rank === 'A') val = 11;
                else if (['J', 'Q', 'K'].includes(rank)) val = 10;
                newDeck.push({ rank, suit, value: val });
            });
        });
        return newDeck.sort(() => Math.random() - 0.5);
    };

    const calculateHand = (hand: Card[]) => {
        let total = hand.reduce((acc, card) => acc + card.value, 0);
        let aces = hand.filter(c => c.rank === 'A').length;
        while (total > 21 && aces > 0) {
            total -= 10;
            aces -= 1;
        }
        return total;
    };

    const startNewHand = () => {
        const newDeck = createDeck();
        const p1 = newDeck.pop()!;
        const d1 = newDeck.pop()!;
        const p2 = newDeck.pop()!;
        const d2 = { ...newDeck.pop()!, hidden: true };

        setPlayerHand([p1, p2]);
        setDealerHand([d1, d2]);
        setDeck(newDeck);
        setGameState('PLAYING');
        setMessage("DECISION_REQUIRED");
    };

    const hit = () => {
        const newDeck = [...deck];
        const card = newDeck.pop()!;
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(newDeck);

        if (calculateHand(newHand) > 21) {
            settleHand('BUST');
        }
    };

    const stand = () => {
        setGameState('DEALER_TURN');
        let currentDealerHand = dealerHand.map(c => ({ ...c, hidden: false }));
        let currentDeck = [...deck];

        while (calculateHand(currentDealerHand) < 17) {
            currentDealerHand.push(currentDeck.pop()!);
        }

        setDealerHand(currentDealerHand);
        setDeck(currentDeck);

        const pScore = calculateHand(playerHand);
        const dScore = calculateHand(currentDealerHand);

        if (dScore > 21 || pScore > dScore) settleHand('WIN');
        else if (pScore === dScore) settleHand('PUSH');
        else settleHand('LOSS');
    };

    const settleHand = (result: 'WIN' | 'LOSS' | 'BUST' | 'PUSH') => {
        setGameState('SETTLED');
        setMessage(result);

        // Intelligence Logging
        twinPlusKernel.observe(createEvent('COGNITIVE_CALIBRATION', {
            game: 'BLACKJACK',
            outcome: result,
            playerScore: calculateHand(playerHand),
            dealerScore: calculateHand(dealerHand),
            handSize: playerHand.length
        }, 'EXERCISE_HUB'));
    };

    const CardComponent = ({ card, size = "lg" }: { card: Card, size?: "sm" | "lg" }) => (
        <div className={`${size === 'lg' ? 'w-16 h-24 text-xl' : 'w-12 h-18 text-md'} bg-white flex flex-col justify-between p-2 rounded-lg border-2 border-accent/20 shadow-xl relative overflow-hidden transition-all animate-in slide-in-from-bottom-2`}>
            {card.hidden ? (
                <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                    <span className="system-text text-[10px] text-accent font-black animate-pulse">J5</span>
                </div>
            ) : (
                <>
                    <div className={`font-black ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>
                        {card.rank}<span className="text-xs ml-1">{card.suit}</span>
                    </div>
                    <div className={`text-3xl self-center ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
                    <div className={`font-black self-end rotate-180 ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>
                        {card.rank}<span className="text-xs ml-1">{card.suit}</span>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 gap-12">
            {/* Dealer Surface */}
            <div className="flex flex-col items-center gap-4">
                <span className="system-text text-[8px] text-white/20 font-black tracking-widest uppercase italic">Counterpart Mass // {gameState === 'SETTLED' ? calculateHand(dealerHand) : '?'}</span>
                <div className="flex gap-3 h-24">
                    {dealerHand.map((c, i) => <CardComponent key={i} card={c} />)}
                </div>
            </div>

            {/* Status Feedback */}
            <div className="text-center py-4 bg-accent/5 border-y border-accent/10 w-full">
                <h3 className={`system-text text-2xl font-black italic tracking-tighter uppercase ${message === 'WIN' ? 'text-neon-green' : message === 'BUST' ? 'text-red-500' : 'text-white'}`}>
                    {message}
                </h3>
            </div>

            {/* Player Surface */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-3 h-24 mb-4">
                    {playerHand.map((c, i) => <CardComponent key={i} card={c} />)}
                </div>
                <span className="system-text text-[10px] text-accent font-black tracking-widest uppercase italic">Your Strategic Mass // {calculateHand(playerHand)}</span>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
                {gameState === 'PLAYING' ? (
                    <>
                        <button onClick={hit} className="py-4 bg-accent text-black system-text text-xs font-black uppercase shadow-[0_0_20px_rgba(0,212,255,0.2)] active:scale-95 transition-all">Amplify (Hit)</button>
                        <button onClick={stand} className="py-4 border-2 border-accent text-accent system-text text-xs font-black uppercase hover:bg-accent hover:text-black transition-all">Consolidate (Stand)</button>
                    </>
                ) : (
                    <button onClick={startNewHand} className="col-span-2 py-5 bg-white text-black system-text text-sm font-black uppercase shadow-2xl active:scale-95 transition-all">Initiate New Hand</button>
                )}
            </div>
        </div>
    );
}

// --- 💣 MINESWEEPER (SPATIAL LOGIC) ---

function MinesweeperGame() {
    const SIZE = 8;
    const MINES = 10;
    const [grid, setGrid] = useState<any[][]>([]);
    const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'WON' | 'LOST'>('IDLE');
    const [flags, setFlags] = useState(0);

    const initGrid = useCallback(() => {
        let newGrid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null).map(() => ({
            isMine: false, revealed: false, flagged: false, count: 0
        })));
        let m = 0;
        while(m < MINES) {
            let x = Math.floor(Math.random()*SIZE), y = Math.floor(Math.random()*SIZE);
            if(!newGrid[y][x].isMine) { newGrid[y][x].isMine = true; m++; }
        }
        for(let y=0; y<SIZE; y++) {
            for(let x=0; x<SIZE; x++) {
                if(newGrid[y][x].isMine) continue;
                let c = 0;
                for(let dy=-1; dy<=1; dy++) {
                    for(let dx=-1; dx<=1; dx++) {
                        let ny=y+dy, nx=x+dx;
                        if(ny>=0 && ny<SIZE && nx>=0 && nx<SIZE && newGrid[ny][nx].isMine) c++;
                    }
                }
                newGrid[y][x].count = c;
            }
        }
        setGrid(newGrid); setStatus('PLAYING'); setFlags(0);
    }, []);

    useEffect(() => { initGrid(); }, [initGrid]);

    const handleCell = (x: number, y: number, isFlag: boolean = false) => {
        if(status !== 'PLAYING' || grid[y][x].revealed) return;
        let next = [...grid.map(r => [...r])];

        if(isFlag) {
            next[y][x].flagged = !next[y][x].flagged;
            setFlags(next.flat().filter(c => c.flagged).length);
        } else {
            if(next[y][x].flagged) return;
            if(next[y][x].isMine) { setStatus('LOST'); next.flat().forEach(c => {if(c.isMine) c.revealed=true}); }
            else {
                const flood = (ix: number, iy: number) => {
                    if(ix<0 || ix>=SIZE || iy<0 || iy>=SIZE || next[iy][ix].revealed || next[iy][ix].isMine) return;
                    next[iy][ix].revealed = true;
                    if(next[iy][ix].count === 0) {
                        for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) flood(ix+dx, iy+dy);
                    }
                };
                flood(x, y);
                if(next.flat().filter(c => !c.revealed).length === MINES) setStatus('WON');
            }
        }
        setGrid(next);
    };

    return (
        <div className="flex flex-col items-center gap-8 py-10 h-full">
            <div className="flex justify-between w-full max-w-[320px] px-2">
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase font-black tracking-widest italic">Sector Integrity</span>
                    <span className="text-xl font-black text-red-500 italic uppercase">{MINES - flags} Mines</span>
                </div>
                {status !== 'PLAYING' && (
                    <button onClick={initGrid} className="px-4 py-1 bg-red-500 text-white system-text text-[10px] font-black uppercase">Recalibrate</button>
                )}
            </div>

            <div className="grid gap-1 p-2 bg-white/5 border border-white/10 rounded-lg touch-none" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
                {grid.map((row, y) => row.map((cell, x) => (
                    <button
                        key={`${x}-${y}`}
                        onClick={() => handleCell(x, y)}
                        onContextMenu={(e) => { e.preventDefault(); handleCell(x, y, true); }}
                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xs font-black transition-all border ${
                            cell.revealed
                                ? 'bg-black/40 border-white/5 text-white/60'
                                : 'bg-white/10 border-white/10 hover:bg-white/20 text-transparent'
                        } ${cell.flagged ? 'bg-red-500/20 text-red-500 text-lg' : ''}`}
                    >
                        {cell.revealed ? (cell.isMine ? '💣' : cell.count || '') : (cell.flagged ? '🚩' : '')}
                    </button>
                )))}
            </div>
            <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest italic animate-pulse">[ DESKTOP: RIGHT-CLICK TO FLAG // MOBILE: TAP TO REVEAL ]</p>
        </div>
    );
}

// --- 🐍 SOVEREIGN SNAKE (SWIPE CONTROLS) ---

function SnakeGame() {
    const SIZE = 15;
    const [snake, setSnake] = useState([{x:7, y:7}]);
    const [food, setFood] = useState({x:3, y:3});
    const [dir, setDir] = useState({x:0, y:-1});
    const [status, setStatus] = useState<'PLAYING' | 'LOST'>('PLAYING');
    const [score, setScore] = useState(0);
    const touchStart = useRef({x:0, y:0});

    const move = useCallback(() => {
        if(status !== 'PLAYING') return;
        const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
        if(head.x<0 || head.x>=SIZE || head.y<0 || head.y>=SIZE || snake.some(s => s.x===head.x && s.y===head.y)) {
            setStatus('LOST'); return;
        }
        const next = [head, ...snake];
        if(head.x===food.x && head.y===food.y) {
            setScore(s => s+1); setFood({x: Math.floor(Math.random()*SIZE), y: Math.floor(Math.random()*SIZE)});
        } else { next.pop(); }
        setSnake(next);
    }, [snake, dir, food, status]);

    useEffect(() => {
        const h = setInterval(move, 150);
        return () => clearInterval(h);
    }, [move]);

    const handleTouch = (e: any) => {
        if(e.type === 'touchstart') touchStart.current = {x: e.touches[0].clientX, y: e.touches[0].clientY};
        else {
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            if(Math.abs(dx) > Math.abs(dy)) {
                if(dx>0 && dir.x===0) setDir({x:1, y:0});
                else if(dx<0 && dir.x===0) setDir({x:-1, y:0});
            } else {
                if(dy>0 && dir.y===0) setDir({x:0, y:1});
                else if(dy<0 && dir.y===0) setDir({x:0, y:-1});
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 py-10 h-full" onTouchStart={handleTouch} onTouchEnd={handleTouch}>
            <div className="flex justify-between w-full max-w-[300px] px-2">
                <span className="text-xl font-black text-accent italic uppercase">{score} Signals</span>
                {status === 'LOST' && <button onClick={() => {setSnake([{x:7, y:7}]); setStatus('PLAYING'); setScore(0);}} className="bg-accent text-black px-4 py-1 text-[10px] font-black uppercase">Retry</button>}
            </div>
            <div className="relative bg-black border-2 border-white/10" style={{ width: 300, height: 300, display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
                {snake.map((s,i) => <div key={i} className={`border border-black/20 ${i===0 ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : 'bg-accent/40'}`} style={{ gridColumnStart: s.x+1, gridRowStart: s.y+1 }} />)}
                <div className="bg-red-500 rounded-full m-1" style={{ gridColumnStart: food.x+1, gridRowStart: food.y+1 }} />
            </div>
            <div className="grid grid-cols-3 gap-2 md:hidden">
                <div /><button onClick={()=>dir.y===0 && setDir({x:0, y:-1})} className="w-12 h-12 bg-white/10 rounded">▲</button><div />
                <button onClick={()=>dir.x===0 && setDir({x:-1, y:0})} className="w-12 h-12 bg-white/10 rounded">◀</button>
                <button onClick={()=>dir.y===0 && setDir({x:0, y:1})} className="w-12 h-12 bg-white/10 rounded">▼</button>
                <button onClick={()=>dir.x===0 && setDir({x:1, y:0})} className="w-12 h-12 bg-white/10 rounded">▶</button>
            </div>
        </div>
    );
}
