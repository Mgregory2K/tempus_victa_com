"use client";

import React, { useState, useEffect } from 'react';
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
    const [timeContext, setTimeContext] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('MORNING');
    const name = userName?.split(' ')[0] || "Michael";

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 11) setTimeContext('MORNING');
        else if (hour < 17) setTimeContext('AFTERNOON');
        else setTimeContext('EVENING');
    }, []);

    const fetchIntel = async () => {
        const zipCode = localStorage.getItem("tv_zip") || "45202";
        setLoading(true);
        try {
            const response = await fetch('/api/intel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zipCode,
                    searchKey: searchKey || localStorage.getItem("tv_search_key"),
                    context: timeContext,
                    userName: name
                })
            });
            if (response.ok) {
                const data = await response.json();
                setIntel(data);
            }
        } catch (error) {
            console.error("Intel fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntel();
        twinPlusKernel.observe(createEvent('DAILY_BRIEF_VIEWED', { context: timeContext }, 'BRIDGE'));
    }, [timeContext]);

    const completedToday = tasks.filter(t => t.status === 'DONE').length;
    const timeSavedMinutes = completedToday * 15;

    const DossierSection = ({ title, data }: { title: string, data?: any }) => (
        <div className="mb-6 border-b border-black/10 pb-4 relative group">
            <h3 className="font-mono text-[9px] font-black text-red-900 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-red-900 rounded-full" />
                Section: {title.toUpperCase()}
            </h3>
            <p className="text-black font-serif italic text-[13px] leading-relaxed pr-8">
                {data?.answer || "SIGNAL_EMPTY // NO RELEVANT DATA DETECTED IN SECTOR."}
            </p>
            {data?.results?.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                    {data.results.slice(0, 2).map((item: any, i: number) => (
                        <a key={i} href={item.url} target="_blank" className="text-[9px] text-blue-800 underline uppercase font-mono truncate max-w-full">
                            {">"} Ref: {item.title}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="relative bg-[#fafaf7] p-8 md:p-10 shadow-xl border-l-8 border-accent/20 rotate-[-0.5deg] min-h-[60vh] flex flex-col text-black max-w-2xl mx-auto border border-black/5 rounded-sm overflow-hidden group">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-black/10 pb-4">
                <div>
                    <h1 className="font-serif text-2xl font-black italic tracking-tight text-black/80">Daily Intelligence Brief</h1>
                    <p className="font-mono text-[9px] text-black/40 uppercase tracking-widest mt-1">Ref: {timeContext}_OPS_{new Date().toISOString().slice(0,10)}</p>
                </div>
                <div className="text-right">
                    <p className="font-mono text-xl font-black text-black/80 leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <button
                        onClick={() => {
                            twinPlusKernel.observe(createEvent('DAILY_BRIEF_DISMISSED', {}, 'BRIDGE'));
                            onDismiss?.();
                        }}
                        className="text-[9px] font-black text-black/20 hover:text-accent uppercase mt-2 tracking-widest transition-colors"
                    >
                        [ Dismiss ]
                    </button>
                </div>
            </div>

            <div className="flex-grow space-y-6">
                {loading && !intel ? (
                    <div className="py-20 text-center">
                        <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {/* THE LEAD SUMMARY */}
                        <div className="mb-6 bg-black/[0.03] p-4 border-l-2 border-accent/40">
                            <h3 className="font-mono text-[9px] font-black text-black/60 uppercase mb-2">Executive Summary: {timeContext}</h3>
                            <p className="text-[14px] font-serif italic leading-relaxed text-black/90">
                                {timeContext === 'MORNING' ?
                                    `Operational conditions are favorable. ${intel?.weather?.answer || "The sky is clear for deployment."} Your tactical objectives for today are locked. Bundle your transit to save 20 minutes.` :
                                    `${name}, mid-day audit complete. You've secured ${completedToday} Triumphs. Tomorrow's preview suggests a ${intel?.weather?.tomorrow || "stable"} window for high-value execution.`
                                }
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <DossierSection title="Atmospheric" data={intel?.weather} />
                            <DossierSection title="Logistics" data={intel?.traffic} />
                            <DossierSection title="Local Intel" data={intel?.news} />
                            <DossierSection title="Tactical Events" data={intel?.events} />
                        </div>

                        <div className="mt-4 pt-4 border-t border-black/5">
                            <h4 className="font-mono text-[8px] font-black text-black/30 uppercase mb-1">Momentum Tracking</h4>
                            <p className="text-[12px] font-serif text-black/80 italic">{completedToday} Wins logged today. +{timeSavedMinutes}m Cognitive Gain.</p>
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-8 pt-4 border-t border-black/5 flex justify-between items-end italic text-[9px] font-serif text-black/40">
                <div>Observed via Twin+ // J5 Chief of Staff</div>
                <div className="text-right">Generated: {new Date().toLocaleDateString()}</div>
            </footer>
        </div>
    );
}
