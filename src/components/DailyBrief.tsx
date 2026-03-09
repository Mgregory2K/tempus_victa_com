"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";
import { createEvent } from "@/core/twin_plus/twin_event";

interface DailyBriefProps {
    tasks?: any[];
    apiKey?: string;
    searchKey?: string;
    userName?: string;
    onDismiss?: () => void;
}

export default function DailyBrief({ tasks = [], apiKey, searchKey, userName, onDismiss }: DailyBriefProps) {
    const [loading, setLoading] = useState(true);
    const [intel, setIntel] = useState<any>(null);
    const [timeContext, setTimeContext] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
    const [currentZip, setCurrentZip] = useState(localStorage.getItem("tv_zip") || "45202");
    const [isEditingZip, setIsEditingZip] = useState(false);

    const name = userName?.split(' ')[0] || "User";

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 11) setTimeContext('Morning');
        else if (hour < 17) setTimeContext('Afternoon');
        else setTimeContext('Evening');
    }, []);

    const fetchIntel = useCallback(async (zip = currentZip) => {
        const keywords = tasks.filter(t => t.status !== 'DONE').map(t => t.title.toLowerCase());
        setLoading(true);
        try {
            const response = await fetch('/api/intel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zipCode: zip,
                    searchKey: searchKey || localStorage.getItem("tv_search_key"),
                    context: timeContext.toUpperCase(),
                    userName: name,
                    contextWords: keywords.slice(0, 15)
                })
            });
            if (response.ok) {
                const data = await response.json();
                setIntel(data);
            }
        } catch (error) {
            setIntel({ isOffline: true });
        } finally {
            setLoading(false);
        }
    }, [currentZip, name, searchKey, tasks, timeContext]);

    // Refresh data every time the brief is opened
    useEffect(() => {
        fetchIntel();
        twinPlusKernel.observe(createEvent('DAILY_BRIEF_VIEWED', { context: timeContext, sector: currentZip }, 'BRIDGE'));
    }, [fetchIntel, timeContext, currentZip]);

    const handleZipUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("tv_zip", currentZip);
        setIsEditingZip(false);
        fetchIntel(currentZip);
    };

    const completedToday = tasks.filter(t => t.status === 'DONE').length;
    const pendingTargets = tasks.filter(t => t.status !== 'DONE').length;

    const DossierSection = ({ title, data, icon, color = "text-red-900" }: { title: string, data?: any, icon?: string, color?: string }) => (
        <div className="mb-6 border-b border-black/5 pb-4 relative group">
            <h3 className={`font-mono text-[9px] font-black ${color} uppercase tracking-[0.2em] mb-2 flex items-center gap-2`}>
                <span className={`h-1.5 w-1.5 ${color.replace('text-', 'bg-')} rounded-full`} />
                {icon} {title}
            </h3>
            <p className="text-black font-serif italic text-[13px] leading-relaxed pr-8">
                {data?.answer || "Scanning sector signals..."}
            </p>
            {data?.results?.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                    {data.results.slice(0, 2).map((item: any, i: number) => (
                        <a key={i} href={item.url} target="_blank" className="text-[9px] text-blue-800 underline uppercase font-mono truncate max-w-full hover:text-accent transition-colors">
                            {">"} REF: {item.title}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="relative bg-[#fdfdfb] p-6 md:p-12 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] border-l-[8px] md:border-l-[12px] border-accent/20 rotate-[-0.5deg] max-h-[90dvh] w-full flex flex-col text-black max-w-2xl mx-auto border border-black/10 rounded-sm overflow-y-auto group scrollbar-thin scrollbar-thumb-black/10">
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

            <header className="flex justify-between items-start mb-12 border-b-2 border-black/10 pb-8 relative z-10 shrink-0">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 bg-black flex items-center justify-center text-white text-[10px] font-black">TV</div>
                        <h1 className="font-serif text-2xl md:text-3xl font-black italic tracking-tight text-black/90">Daily Intelligence</h1>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <p className="font-mono text-[9px] text-black/40 uppercase tracking-widest">
                            SECTOR_{currentZip} // STATUS: {loading ? "SYNCING" : "LOCKED"}
                        </p>
                        {isEditingZip ? (
                            <form onSubmit={handleZipUpdate} className="flex gap-2">
                                <input autoFocus className="bg-white border border-black/10 px-2 py-0.5 text-[10px] font-mono outline-none focus:border-accent" value={currentZip} onChange={(e) => setCurrentZip(e.target.value)} />
                                <button type="submit" className="text-[8px] font-black text-accent uppercase">[ SET ]</button>
                            </form>
                        ) : (
                            <button onClick={() => setIsEditingZip(true)} className="text-[8px] font-black text-accent/40 hover:text-accent uppercase transition-colors">[ CHANGE ]</button>
                        )}
                        <button onClick={() => fetchIntel()} className="text-[8px] font-black text-black/40 hover:text-accent border border-black/10 px-3 py-1 uppercase tracking-widest transition-all">[ REFRESH ]</button>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                    <p className="font-mono text-2xl md:text-3xl font-black text-black/80 leading-none mb-4">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <button onClick={onDismiss} className="text-[9px] font-black text-white bg-black hover:bg-red-700 px-4 py-1.5 uppercase tracking-[0.2em] transition-all rounded-sm shadow-lg">MINIMIZE</button>
                </div>
            </header>

            <main className="flex-grow space-y-10 relative z-10">
                {loading && !intel ? (
                    <div className="py-24 text-center">
                        <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <p className="font-mono text-[9px] text-black/40 uppercase mt-6 tracking-[0.5em] animate-pulse">Synchronizing Sector Intel...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {/* THE J5 LEAD SUMMARY */}
                        <div className="mb-12 bg-black/[0.03] p-6 md:p-8 border-l-4 border-black shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 font-mono text-[7px] text-black/10 font-bold">CONFIDENTIAL // J5-CHIEF</div>
                            <h3 className="font-mono text-[10px] font-black text-black/60 uppercase mb-4 italic tracking-widest">Executive Briefing</h3>
                            <p className="text-[15px] md:text-[16px] font-serif italic leading-relaxed text-black/90 first-letter:text-4xl first-letter:font-black first-letter:mr-1 first-letter:float-left first-letter:leading-none">
                                {timeContext === 'Morning' ?
                                    `${name}, I've mapped the board for today. ${intel?.weather?.answer || "Conditions in Sector " + currentZip + " are holding."} You have ${pendingTargets} active signals. I've optimized your logistical path—see below for synergy wins near ${currentZip}. Operational window is green.` :
                                    `${name}, afternoon audit complete. You've secured ${completedToday} Triumphs. Sector ${currentZip} remains stable. Tomorrow's window looks ${intel?.weather?.tomorrow || "favorable"} for high-velocity execution.`
                                }
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-x-16 gap-y-6">
                            <DossierSection title="Atmosphere" data={intel?.weather} icon="🌤" color="text-blue-900" />
                            <DossierSection title="Logistical Synergy" data={intel?.synergy} icon="🛰" color="text-accent/90" />
                            <DossierSection title="Local Signals" data={intel?.news} icon="📰" color="text-black/60" />
                            <DossierSection title="Sector Events" data={intel?.events} icon="📅" color="text-red-900/60" />
                        </div>

                        {/* Momentum Footer */}
                        <div className="mt-12 pt-8 border-t border-black/10 flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="font-mono text-[9px] font-black text-black/30 uppercase mb-1 tracking-widest">Momentum Chain</h4>
                                    <p className="text-[13px] font-serif text-black/80 italic">
                                        {completedToday} Strategic Triumphs logged. {pendingTargets} pending signals in the queue.
                                    </p>
                                </div>
                                <div className="text-right">
                                     <span className="text-[10px] font-mono font-black text-black/20">94% AFFINITY</span>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${(completedToday / Math.max(1, (completedToday + pendingTargets))) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-12 pt-8 border-t border-black/10 flex justify-between items-end italic text-[9px] font-serif text-black/30 uppercase tracking-[0.3em] relative z-10 shrink-0">
                <div>Observed via Twin+ Substrate // J5</div>
                <div className="text-right">DOCTRINE_VERIFIED // {new Date().toLocaleDateString()}</div>
            </footer>
        </div>
    );
}
