// src/components/SideNav.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";

const NavItem = ({ name, isLinked, isActive, onClick, subtext, description }: { name: string, isLinked?: boolean, isActive?: boolean, onClick?: () => void, subtext?: string, description?: string }) => (
    <div
        onClick={onClick}
        className={`group relative flex items-center p-3 my-3 bg-white/[0.02] border transition-all cursor-pointer overflow-hidden ${isActive ? 'border-accent/60 bg-accent/5' : 'border-white/5 hover:border-accent/40'}`}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isLinked ? 'bg-neon-green shadow-[0_0_15px_#22c55e]' : 'bg-white/10 group-hover:bg-accent/40'}`} />

        <div className={`h-8 w-8 rounded-sm mr-3 flex items-center justify-center border transition-all ${isLinked ? 'border-neon-green/50 bg-neon-green/10 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]' : 'border-white/10 bg-white/5'}`}>
             <div className={`h-2 w-2 rounded-full transition-all ${isLinked ? 'bg-neon-green animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-white/20'}`} />
        </div>

        <div className="flex flex-col">
            <span className={`system-text text-[10px] font-black tracking-widest ${isActive ? 'text-accent' : isLinked ? 'text-white' : 'text-white/40'}`}>{name}</span>
            <span className={`text-[7px] font-bold uppercase tracking-tighter transition-colors ${isLinked ? 'text-neon-green' : 'text-white/20'}`}>
                {isLinked ? 'Link Stable' : subtext || 'Local Sovereignty'}
            </span>
        </div>

        {/* Hover Reveal Info */}
        <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 z-10 pointer-events-none">
            <p className="text-[8px] font-black text-accent tracking-[0.2em]">{description || `NODE_${name.toUpperCase()}_ACTIVE`}</p>
        </div>

        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-accent/40" />
    </div>
);

interface SideNavProps {
    activeModule?: string;
    onModuleChange?: (module: any) => void;
    notionLinked?: boolean;
}

export default function SideNav({ activeModule, onModuleChange }: SideNavProps) {
    const { data: session } = useSession();
    const [status, setStatus] = useState({
        notion: false,
        gemini: false,
        openai: false,
        tavily: false
    });

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
        <nav className="w-64 p-6 border-r border-white/10 bg-black/40 hidden lg:block relative shrink-0 overflow-y-auto scrollbar-thin">
            <div className="mb-8">
                <h2 className="system-text text-[10px] text-accent font-black tracking-[0.3em] mb-1">COGNITIVE SURFACES</h2>
                <div className="h-px w-full bg-gradient-to-r from-accent/40 to-transparent" />
            </div>

            <div className="space-y-1">
                <NavItem
                    name="Signal Bay"
                    isActive={activeModule === 'SIGNALS'}
                    onClick={() => onModuleChange?.('SIGNALS')}
                    subtext="Triage engine active"
                    description="TRIAGE_INBOUND_SIGNAL_STREAM"
                />
                <NavItem
                    name="Winboard"
                    isActive={activeModule === 'WINBOARD'}
                    onClick={() => onModuleChange?.('WINBOARD')}
                    subtext="Strategic execution"
                    description="EXECUTE_HIGH_VALUE_OBJECTIVES"
                />
                <NavItem
                    name="Clock Tower"
                    isActive={activeModule === 'CLOCK_TOWER'}
                    onClick={() => onModuleChange?.('CLOCK_TOWER')}
                    subtext="Flux Capacitor"
                    description="AUDIT_IMMUTABLE_EVENT_LEDGER"
                />
                <NavItem
                    name="Corkboard"
                    isActive={activeModule === 'CORKBOARD'}
                    onClick={() => onModuleChange?.('CORKBOARD')}
                    subtext="Spatial ideation"
                    description="SPATIAL_MEMORY_PROJECTION"
                />
                <NavItem
                    name="Quote Board"
                    isActive={activeModule === 'QUOTES'}
                    onClick={() => onModuleChange?.('QUOTES')}
                    subtext="Crystallized meaning"
                    description="CRYSTALLIZE_LINGUISTIC_INTEL"
                />
            </div>

            <div className="mt-12 mb-8">
                <h2 className="system-text text-[10px] text-white/30 font-black tracking-[0.3em] mb-1">EXTERNAL NODES</h2>
                <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="space-y-1">
                <NavItem
                    name="Google Cloud"
                    isLinked={!!session}
                    onClick={!session ? () => signIn('google') : undefined}
                    subtext={session ? "Identity Verified" : "Auth Required"}
                    description={session ? `USER: ${session.user?.name?.toUpperCase()}` : "OAUTH_HANDSHAKE_PENDING"}
                />
                <NavItem
                    name="Gemini"
                    isLinked={status.gemini}
                    subtext="Sovereign Search"
                    description={status.gemini ? "GOOGLE_SEARCH_GROUNDING_ACTIVE" : "GEMINI_KEY_MISSING"}
                />
                <NavItem
                    name="OpenAI"
                    isLinked={status.openai}
                    subtext="Neural Synthesis"
                    description={status.openai ? "GPT4O_NEURAL_PIPELINE_STABLE" : "OPENAI_KEY_MISSING"}
                />
                <NavItem
                    name="Notion"
                    isLinked={status.notion}
                    subtext="Cloud Knowledge Base"
                    description={status.notion ? "PERSISTENT_MEMORY_SYNC_ACTIVE" : "NOTION_TOKEN_MISSING"}
                />
            </div>

            <div className="absolute bottom-8 left-6 right-6 space-y-4 pt-12">
                <div className="h-px w-full bg-white/5" />
                <div className="flex flex-col gap-1">
                    <span className="system-text text-[7px] text-white/20 font-black uppercase">Twin+ Confidence</span>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[82%] opacity-60" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="system-text text-[7px] text-white/20 font-black uppercase">Entropy Level</span>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                        <div className="h-full bg-orange-500 w-[14%] opacity-60" />
                        <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                    </div>
                </div>
            </div>
        </nav>
    );
}
