// src/components/DailyBrief.tsx
"use client";

import React, { useState, useEffect } from 'react';

export interface Event {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    htmlLink?: string;
}

interface IntelData {
    location: { zip: string };
    weather: any;
    traffic: any;
    news: any;
    events: any;
    finance: any;
    timestamp: string;
}

export default function DailyBrief() {
    const [loading, setLoading] = useState(true);
    const [zipCode, setZipCode] = useState("");
    const [searchKey, setSearchKey] = useState("");
    const [intel, setIntel] = useState<IntelData | null>(null);

    useEffect(() => {
        const savedZip = localStorage.getItem("tv_zip");
        const savedSearchKey = localStorage.getItem("tv_search_key");
        if (savedZip) setZipCode(savedZip);
        if (savedSearchKey) setSearchKey(savedSearchKey);
    }, []);

    const fetchIntel = async () => {
        if (!zipCode || !searchKey) return;
        setLoading(true);
        try {
            const response = await fetch('/api/intel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipCode, searchKey })
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
        if (zipCode && searchKey) {
            fetchIntel();
        }
    }, [zipCode, searchKey]);

    const DossierSection = ({ title, data }: { title: string, data?: any }) => (
        <div className="mb-6 border-b border-black/10 pb-4">
            <h3 className="font-mono text-[10px] font-black text-red-800 uppercase tracking-[0.2em] mb-2">Section: {title}</h3>
            <p className="text-black font-serif italic text-sm leading-relaxed">
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
        <div className="relative bg-[#f4f1ea] p-8 md:p-12 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] border-l-[12px] border-red-900/20 rotate-[-0.5deg] min-h-[80vh] flex flex-col text-black max-w-3xl mx-auto">
            {/* Dossier Header */}
            <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-6">
                <div className="space-y-1">
                    <h1 className="font-mono text-3xl font-black tracking-tighter uppercase leading-none">Intelligence Dossier</h1>
                    <div className="flex gap-4 items-center">
                        <span className="bg-red-800 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">TOP_SECRET</span>
                        <span className="font-mono text-[10px] font-bold text-black/40">REF: MORNING_GLORY_{new Date().toISOString().slice(0,10).replace(/-/g, "")}</span>
                    </div>
                </div>
                <div className="text-right font-mono">
                    <p className="text-xl font-black leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    <p className="text-[10px] font-bold text-black/60 uppercase mt-1">Sovereign Link: Stable</p>
                </div>
            </div>

            {/* Stamped Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none text-[150px] font-black rotate-[-45deg] whitespace-nowrap">
                TEMPUS VICTA
            </div>

            <div className="flex-grow">
                {loading && !intel ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="inline-block w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
                        <p className="font-mono text-[10px] font-black uppercase tracking-widest animate-pulse">Decrypting Inbound Signals...</p>
                    </div>
                ) : intel ? (
                    <div className="animate-in fade-in duration-1000">
                        <DossierSection title="Atmospheric Conditions" data={intel.weather} />
                        <DossierSection title="Logistics & Transit" data={intel.traffic} />
                        <DossierSection title="Local Intel" data={intel.news} />
                        <DossierSection title="Tactical Events" data={intel.events} />
                        <DossierSection title="Financial Density" data={intel.finance} />
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-black/10 rounded">
                        <p className="font-mono text-[10px] text-black/40 uppercase tracking-[0.3em]">Awaiting Location Coordinates</p>
                    </div>
                )}
            </div>

            <footer className="mt-12 pt-6 border-t border-black/10 flex justify-between items-end italic text-[10px] font-serif text-black/60">
                <div>Generated via Twin+ Neural Link // J5 Chief of Staff</div>
                <div className="text-right">DO NOT REPLICATE // ROOT ACCESS ONLY</div>
            </footer>
        </div>
    );
}
