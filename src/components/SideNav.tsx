// src/components/SideNav.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";

const NavItem = ({ name, isLinked, isActive, onClick, subtext, description }: { name: string, isLinked?: boolean, isActive?: boolean, onClick?: () => void, subtext?: string, description?: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    let tooltipTimeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
        tooltipTimeout = setTimeout(() => {
            setShowTooltip(true);
        }, 700);
    };

    const handleMouseLeave = () => {
        clearTimeout(tooltipTimeout);
        setShowTooltip(false);
    };

    return (
        <div
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`group relative flex items-center p-3 my-2 bg-white/[0.03] border transition-all cursor-pointer overflow-hidden rounded-md ${isActive ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]' : 'border-white/10 hover:border-accent/40'}`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isActive ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : isLinked ? 'bg-neon-green shadow-[0_0_20px_#22c55e]' : 'bg-white/10 group-hover:bg-accent/40'}`} />

            <div className={`h-8 w-8 rounded-sm mr-3 flex items-center justify-center border transition-all ${isActive ? 'border-accent bg-accent/20' : isLinked ? 'border-neon-green bg-neon-green/20' : 'border-white/10 bg-white/5'}`}>
                 <div className={`h-3 w-3 rounded-full transition-all ${isLinked ? 'bg-neon-green animate-pulse shadow-[0_0_15px_#22c55e]' : isActive ? 'bg-accent animate-pulse shadow-[0_0_15px_var(--accent)]' : 'bg-white/10'}`} />
            </div>

            <div className="flex flex-col">
                <span className={`system-text text-[10px] font-black tracking-widest ${isActive ? 'text-accent' : isLinked ? 'text-white' : 'text-white/40'}`}>{name}</span>
                <span className={`text-[7px] font-bold uppercase tracking-tighter transition-colors ${isLinked ? 'text-neon-green font-black' : 'text-white/20'}`}>
                    {isLinked ? 'LINK_SOLID' : subtext || 'LOCAL_ONLY'}
                </span>
            </div>

            {/* Delayed Pop-up Tooltip */}
            {showTooltip && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-64 bg-black/95 border-2 border-accent/30 p-4 rounded-lg shadow-2xl z-20 animate-slide-up">
                    <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 bg-black/95 border-l-2 border-b-2 border-accent/30 rotate-45" />
                    <p className="text-sm font-bold text-accent tracking-widest uppercase mb-2 italic">{name}</p>
                    <p className="text-[10px] font-light text-white/80 normal-case leading-snug tracking-wide">{description}</p>
                </div>
            )}
        </div>
    );
};

interface SideNavProps {
    activeModule?: string;
    onModuleChange?: (module: any) => void;
}

export default function SideNav({ activeModule, onModuleChange }: SideNavProps) {
    const { data: session } = useSession();
    const [status, setStatus] = useState({ notion: false, gemini: false, openai: false, tavily: false });

    useEffect(() => {
        const checkKeys = () => {
            setStatus({
                notion: !!localStorage.getItem("tv_notion_key"),
                gemini: !!localStorage.getItem("tv_gemini_key"),
                openai: !!localStorage.getItem("tv_api_key"),
                tavily: !!localStorage.getItem("tv_search_key")
            });
        };
        checkKeys();
        const interval = setInterval(checkKeys, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="w-64 p-6 border-r border-white/10 bg-black/60 hidden lg:flex flex-col relative shrink-0 h-full overflow-hidden">
            <div className="mb-6">
                <h2 className="system-text text-[10px] text-accent font-black tracking-[0.3em] mb-1">COGNITIVE SURFACES</h2>
                <div className="h-px w-full bg-gradient-to-r from-accent to-transparent" />
            </div>

            <div className="flex-grow space-y-1 overflow-y-auto scrollbar-none pr-1">
                <NavItem name="Signal Bay" isActive={activeModule === 'SIGNALS'} onClick={() => onModuleChange?.('SIGNALS')} subtext="Triage Engine" description="Filter and route all incoming life signals—emails, notifications, and thoughts into your cognitive field." />
                <NavItem name="Project Board" isActive={activeModule === 'PROJECTS'} onClick={() => onModuleChange?.('PROJECTS')} subtext="Objectives" description="Manage multi-stage strategic objectives. Turn large goals into executable tactical tasks." />
                <NavItem name="Win Board" isActive={activeModule === 'WINBOARD'} onClick={() => onModuleChange?.('WINBOARD')} subtext="Daily Triumphs" description="A visual ledger of every completed action today. Identity reinforcement through proof of execution." />
                <NavItem name="The Mirror" isActive={activeModule === 'MIRROR'} onClick={() => onModuleChange?.('MIRROR')} subtext="Identity Graph" description="Reflect on your behavioral patterns. Visualize the Twin+ model of your focus and affinity." />
                <NavItem name="Clock Tower" isActive={activeModule === 'CLOCK_TOWER'} onClick={() => onModuleChange?.('CLOCK_TOWER')} subtext="Immutable Ledger" description="The raw heartbeat of the system. Audit every event, signal, and neural decision in real-time." />
                <NavItem name="Corkboard" isActive={activeModule === 'CORKBOARD'} onClick={() => onModuleChange?.('CORKBOARD')} subtext="Spatial Memory" description="A freeform spatial canvas for messy thoughts, unstructured intel, and evolving ideas." />
                <NavItem name="Quote Board" isActive={activeModule === 'QUOTES'} onClick={() => onModuleChange?.('QUOTES')} subtext="Crystallized Intel" description="Store and review high-fidelity linguistic patterns. Language shapes the way you think and execute." />
            </div>

            <div className="shrink-0 mt-4 border-t border-white/5 pt-4">
                <div className="mb-2">
                    <h2 className="system-text text-[10px] text-white/30 font-black tracking-[0.3em] mb-1">EXTERNAL NODES</h2>
                    <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-none">
                    <NavItem name="Google" isLinked={!!session} onClick={!session ? () => signIn('google') : undefined} subtext={session ? "Identity Stable" : "Auth Required"} description={session ? `Neural link established with ${session.user?.name?.split(' ')[0]}. Cross-device sync enabled.` : "Connect your Google ID to bridge the Mothership and unify your memory."} />
                    <NavItem name="Gemini" isLinked={status.gemini} subtext="Sovereign Search" description={status.gemini ? "Google Search grounding pipeline is active and verified." : "Requires Gemini API Key. Enables real-time internet validation for neural outputs."} />
                    <NavItem name="OpenAI" isLinked={status.openai} subtext="Neural Synthesis" description={status.openai ? "GPT-4o Reasoning Engine is stable and ready for command." : "Requires OpenAI Neural Key. Enables deep synthesis, planning, and Socrates mode."} />
                    <NavItem name="Notion" isLinked={status.notion} subtext="Knowledge Base" description={status.notion ? "Persistent memory bridge to Notion workspace is synced." : "Requires Notion Token. Sync your crystallized intel to an external knowledge graph."} />
                    <NavItem name="Internet" isLinked={status.tavily} subtext="Tavily Triage" description={status.tavily ? "Internet triage engine is filtering live data signals." : "Requires Tavily Key. Optimized for high-speed news, traffic, and finance ingestion."} />
                </div>

                <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="system-text text-[7px] text-white/20 font-black uppercase tracking-widest">Twin+ Confidence</span>
                            <span className="text-[7px] text-accent font-black">82%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent w-[82%] opacity-80 shadow-[0_0_10px_var(--accent)]" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="system-text text-[7px] text-white/20 font-black uppercase tracking-widest">Entropy Level</span>
                            <span className="text-[7px] text-orange-500 font-black">14%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                            <div className="h-full bg-orange-500 w-[14%] opacity-80 shadow-[0_0_10px_#f97316]" />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
