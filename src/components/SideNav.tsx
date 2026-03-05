// src/components/SideNav.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";

const NavItem = ({ name, isLinked, isActive, onClick, subtext, description }: { name: string, isLinked?: boolean, isActive?: boolean, onClick?: () => void, subtext?: string, description?: string }) => (
    <div
        onClick={onClick}
        className={`group relative flex items-center p-3 my-2 bg-white/[0.03] border transition-all cursor-pointer overflow-hidden ${isActive ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-white/10 hover:border-accent/40'}`}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isLinked ? 'bg-neon-green shadow-[0_0_20px_#22c55e]' : 'bg-white/10 group-hover:bg-accent/40'}`} />

        <div className={`h-8 w-8 rounded-sm mr-3 flex items-center justify-center border transition-all ${isLinked ? 'border-neon-green bg-neon-green/20 shadow-[inset_0_0_10px_rgba(34,197,94,0.3)]' : 'border-white/10 bg-white/5'}`}>
             <div className={`h-3 w-3 rounded-full transition-all ${isLinked ? 'bg-neon-green animate-pulse shadow-[0_0_15px_#fff] scale-125' : 'bg-white/10'}`} />
        </div>

        <div className="flex flex-col">
            <span className={`system-text text-[10px] font-black tracking-widest ${isActive ? 'text-accent' : isLinked ? 'text-white' : 'text-white/40'}`}>{name}</span>
            <span className={`text-[7px] font-bold uppercase tracking-tighter transition-colors ${isLinked ? 'text-neon-green font-black' : 'text-white/20'}`}>
                {isLinked ? 'LINK_SOLID' : subtext || 'LOCAL_ONLY'}
            </span>
        </div>

        {/* Hover Reveal Info */}
        <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 z-10 pointer-events-none border-l-2 border-accent">
            <p className="text-[8px] font-black text-accent tracking-[0.2em]">{description || `NODE_${name.toUpperCase()}_STABLE`}</p>
        </div>

        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-accent/40" />
    </div>
);

interface SideNavProps {
    activeModule?: string;
    onModuleChange?: (module: any) => void;
}

export default function SideNav({ activeModule, onModuleChange }: SideNavProps) {
    const { data: session } = useSession();
    const [status, setStatus] = useState({ notion: false, gemini: false, openai: false });

    useEffect(() => {
        const checkKeys = () => {
            setStatus({
                notion: !!localStorage.getItem("tv_notion_key"),
                gemini: !!localStorage.getItem("tv_gemini_key"),
                openai: !!localStorage.getItem("tv_api_key")
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
                <NavItem name="Signal Bay" isActive={activeModule === 'SIGNALS'} onClick={() => onModuleChange?.('SIGNALS')} subtext="Triage engine active" description="TRIAGE_INBOUND_SIGNAL_STREAM" />
                <NavItem name="Project Board" isActive={activeModule === 'PROJECTS'} onClick={() => onModuleChange?.('PROJECTS')} subtext="Strategic" description="MANAGE_MULTI_STAGE_OBJECTIVES" />
                <NavItem name="Win Board" isActive={activeModule === 'WINBOARD'} onClick={() => onModuleChange?.('WINBOARD')} subtext="Daily Triumphs" description="CELEBRATE_COMPLETED_WINS" />
                <NavItem name="The Mirror" isActive={activeModule === 'MIRROR'} onClick={() => onModuleChange?.('MIRROR')} subtext="Identity Graph" description="NEURAL_AFFINITY_PROJECTION" />
                <NavItem name="Clock Tower" isActive={activeModule === 'CLOCK_TOWER'} onClick={() => onModuleChange?.('CLOCK_TOWER')} subtext="Flux Capacitor" description="AUDIT_IMMUTABLE_EVENT_LEDGER" />
                <NavItem name="Corkboard" isActive={activeModule === 'CORKBOARD'} onClick={() => onModuleChange?.('CORKBOARD')} subtext="Messy thoughts" description="SPATIAL_MEMORY_PROJECTION" />
                <NavItem name="Quote Board" isActive={activeModule === 'QUOTES'} onClick={() => onModuleChange?.('QUOTES')} subtext="Crystallized intel" description="CRYSTALLIZE_LINGUISTIC_INTEL" />
            </div>

            <div className="shrink-0 mt-4 border-t border-white/5 pt-4">
                <div className="mb-2">
                    <h2 className="system-text text-[10px] text-white/30 font-black tracking-[0.3em] mb-1">EXTERNAL NODES</h2>
                    <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-none">
                    <NavItem name="Google" isLinked={!!session} onClick={!session ? () => signIn('google') : undefined} subtext={session ? "Identity Stable" : "Auth Required"} description={session ? `USER: ${session.user?.name?.toUpperCase()}` : "OAUTH_HANDSHAKE_PENDING"} />
                    <NavItem name="Gemini" isLinked={status.gemini} subtext="Sovereign Search" description={status.gemini ? "GOOGLE_SEARCH_GROUNDING_ACTIVE" : "GEMINI_KEY_MISSING"} />
                    <NavItem name="OpenAI" isLinked={status.openai} subtext="Neural Synthesis" description={status.openai ? "GPT4O_PIPELINE_STABLE" : "OPENAI_KEY_MISSING"} />
                    <NavItem name="Notion" isLinked={status.notion} subtext="Knowledge Base" description={status.notion ? "PERSISTENT_MEMORY_SYNC_ACTIVE" : "NOTION_TOKEN_MISSING"} />
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
