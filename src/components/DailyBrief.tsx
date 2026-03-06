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
    const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [zipCode, setZipCode] = useState("");
    const [searchKey, setSearchKey] = useState("");
    const [showZipInput, setShowZipInput] = useState(false);
    const [intel, setIntel] = useState<IntelData | null>(null);

    useEffect(() => {
        const savedZip = localStorage.getItem("tv_zip");
        const savedSearchKey = localStorage.getItem("tv_search_key");
        if (savedZip) setZipCode(savedZip);
        if (savedSearchKey) setSearchKey(savedSearchKey);
        setShowZipInput(!savedZip);
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

    const handleZipSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("tv_zip", zipCode);
        setShowZipInput(false);
        fetchIntel();
    };

    const Section = ({ icon, title, data, children }: { icon: string, title: string, data?: any, children?: React.ReactNode }) => (
        <section className="animate-slide-up border-t border-white/5 pt-6">
            <div className="flex items-center gap-3 mb-4 px-2">
                <span className="text-xl">{icon}</span>
                <h2 className="system-text text-[11px] font-black tracking-widest text-white/90 uppercase">{title}</h2>
            </div>
            {loading && !intel ? (
                <div className="text-center py-8 text-xs text-white/20 italic">LOADING INTEL...</div>
            ) : children ? (
                children
            ) : (
                <div className="text-sm text-white/60 space-y-4 font-light italic px-2">
                    <p>{data?.answer || "No new intelligence for this sector."}</p>
                    <div className="flex flex-wrap gap-2">
                        {data?.results?.map((item: any) => (
                            <a href={item.url} target="_blank" key={item.url} className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-accent hover:text-black transition-colors">{item.title}</a>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );

    return (
        <div className="space-y-10 pb-20 max-w-4xl mx-auto">
            <header className="flex justify-between items-start bg-accent/5 p-6 border border-accent/20 rounded-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black italic text-white leading-none">👋 Morning Glory</h1>
                    <p className="system-text text-[9px] text-accent font-black tracking-[0.3em] mt-2 italic">Actionable Intelligence Brief</p>
                </div>
                <div className="text-right relative z-10">
                    <p className="text-2xl font-black text-white leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[8px] text-white/40 font-bold uppercase mt-1 tracking-widest cursor-pointer" onClick={() => setShowZipInput(true)}>
                        {zipCode ? `📍 ${zipCode}` : "SET_LOCATION"}
                    </p>
                </div>
            </header>

            {showZipInput && (
                <form onSubmit={handleZipSubmit} className="hud-panel p-6 bg-black/90 border-accent/40 animate-slide-up flex gap-4">
                    <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Enter ZIP Code for Intel..." className="flex-grow bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:border-accent outline-none" />
                    <button type="submit" className="bg-accent px-6 py-2 system-text text-[10px] font-black">GENERATE</button>
                </form>
            )}

            {intel ? (
                <div className="space-y-8">
                    <Section icon="🌤️" title="Weather" data={intel.weather} />
                    <Section icon="🚗" title="Traffic" data={intel.traffic} />
                    <Section icon="📰" title="Local News" data={intel.news} />
                    <Section icon="🎟️" title="Events" data={intel.events} />
                    <Section icon="💰" title="Financial Intel" data={intel.finance} />
                </div>
            ) : !showZipInput && (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-lg">
                    <p className="system-text text-sm text-white/20 tracking-[0.4em]">Awaiting Directives...</p>
                </div>
            )}
        </div>
    );
}
