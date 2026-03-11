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
            className={`group relative flex items-center p-3 my-2 bg-white/[0.03] border transition-all cursor-pointer overflow-hidden rounded-md
                ${isActive ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]' :
                  isLinked ? 'border-neon-green/40 bg-neon-green/5 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                  'border-white/10 hover:border-accent/40'}`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isActive ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : isLinked ? 'bg-neon-green shadow-[0_0_20px_#22c55e]' : 'bg-white/10 group-hover:bg-accent/40'}`} />

            <div className={`h-8 w-8 rounded-sm mr-3 flex items-center justify-center border transition-all ${isActive ? 'border-accent bg-accent/20' : isLinked ? 'border-neon-green bg-neon-green/20' : 'border-white/10 bg-white/5'}`}>
                 <div className={`h-3 w-3 rounded-full transition-all ${isLinked ? 'bg-neon-green animate-pulse shadow-[0_0_15px_#22c55e]' : isActive ? 'bg-accent animate-pulse shadow-[0_0_15px_var(--accent)]' : 'bg-white/10'}`} />
            </div>

            <div className="flex flex-col">
                <span className={`system-text text-[10px] font-black tracking-widest ${isActive ? 'text-accent' : isLinked ? 'text-white' : 'text-white/40'}`}>{name}</span>
                <span className={`text-[7px] font-bold uppercase tracking-tighter transition-colors ${isLinked ? 'text-neon-green font-black' : 'text-white/20'}`}>
                    {isLinked ? 'Connected' : subtext || 'Local'}
                </span>
            </div>

            {/* Delayed Pop-up Tooltip (Hidden on touch devices) */}
            {showTooltip && (
                <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-4 w-64 bg-black/95 border-2 border-accent/30 p-4 rounded-lg shadow-2xl z-20 animate-slide-up">
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
    isAdmin?: boolean;
    onToggleExercises?: () => void;
}

export default function SideNav({ activeModule, onModuleChange, isAdmin, onToggleExercises }: SideNavProps) {
    const { data: session } = useSession();
    const [status, setStatus] = useState({ notion: false, gemini: false, openai: false, tavily: false });

    useEffect(() => {
        const checkKeys = () => {
            const storage = session ? localStorage : sessionStorage;
            setStatus({
                notion: !!storage.getItem("tv_notion_key"),
                gemini: !!storage.getItem("tv_gemini_key"),
                openai: !!storage.getItem("tv_api_key"),
                tavily: !!storage.getItem("tv_search_key")
            });
        };
        checkKeys();
        const interval = setInterval(checkKeys, 5000); // Throttled to 5s for mobile battery
        return () => clearInterval(interval);
    }, [session]);

    return (
        <nav className="w-64 p-6 border-r border-white/10 bg-black/95 flex flex-col relative shrink-0 h-full overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
                <h2 className="system-text text-[10px] text-accent font-black tracking-[0.3em] mb-1 uppercase">Cognitive Surfaces</h2>
                <div className="h-px w-full bg-gradient-to-r from-accent to-transparent" />
            </div>

            <div className="flex-grow space-y-1 overflow-y-auto scrollbar-none pr-1">
                <NavItem name="The Bridge" isActive={activeModule === 'BRIDGE'} onClick={() => onModuleChange?.('BRIDGE')} subtext="Strategic Cockpit" description="The expression layer of your Twin+. High-level synthesis of all cognitive data." />
                <NavItem name="I/O Bay" isActive={activeModule === 'IO_BAY'} onClick={() => onModuleChange?.('IO_BAY')} subtext="Intelligence Conduit" description="Combined signal triage and real-time ledger auditing." />
                <NavItem name="Project Board" isActive={activeModule === 'PROJECTS'} onClick={() => onModuleChange?.('PROJECTS')} subtext="Strategic Objectives" description="Manage multi-stage strategic objectives and heavy artillery tasks." />
                <NavItem name="Sovereign To-Do" isActive={activeModule === 'TODO'} onClick={() => onModuleChange?.('TODO')} subtext="Tactical Infantry" description="Quick-action checklist for micro-signals and the tire store principle." />
                <NavItem name="The Mirror" isActive={activeModule === 'MIRROR'} onClick={() => onModuleChange?.('MIRROR')} subtext="Identity Graph" description="Reflect on your behavioral patterns and Twin+ affinity model." />
                <NavItem name="Corkboard" isActive={activeModule === 'CORKBOARD'} onClick={() => onModuleChange?.('CORKBOARD')} subtext="Spatial Memory" description="Organize messy thoughts and unstructured tactical intel." />
                <NavItem name="Wishes" isActive={activeModule === 'WISHES'} onClick={() => onModuleChange?.('WISHES')} subtext="Future Development" description="Log requests for system expansion." />

                <div className="pt-2">
                    <NavItem
                        name="Neural Exercises"
                        onClick={onToggleExercises}
                        subtext="Cognitive Calibration"
                        description="Fun, direct learning games designed to calibrate your Twin+ identity and motor flow."
                    />
                </div>
            </div>

            {isAdmin && (
                <div className="shrink-0 mt-4 border-t border-accent/20 pt-4 animate-pulse">
                    <NavItem name="Command" isActive={activeModule === 'ADMIN'} onClick={() => onModuleChange?.('ADMIN')} subtext="Root Authority" description="Newtonian Command Board for aggregate telemetry and wish manifestation." />
                </div>
            )}

            <div className="shrink-0 mt-4 border-t border-white/5 pt-4">
                <div className="mb-2">
                    <h2 className="system-text text-[10px] text-white/30 font-black tracking-[0.3em] mb-1 uppercase text-white">External Nodes</h2>
                    <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-none">
                    <NavItem name="Google" isLinked={!!session} onClick={!session ? () => signIn('google') : undefined} subtext={session ? "Briefcase Stable" : "Auth Required"} description="Identity confirmed. Cross-device sync active via Google Drive vault." />
                    <NavItem name="Gemini" isLinked={status.gemini} subtext="Sovereign Search" description="Google Search grounding pipeline is active." />
                    <NavItem name="OpenAI" isLinked={status.openai} subtext="Neural Synthesis" description="GPT-4o Reasoning Engine is stable." />
                    <NavItem name="Notion" isLinked={status.notion} subtext="Knowledge Base" description="Persistent bridge to Notion workspace is active." />
                    <NavItem name="Internet" isLinked={status.tavily} subtext="Tavily Triage" description="High-speed internet signal filtering is active." />
                </div>

                <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                    <div className="flex flex-col gap-1 text-white">
                        <div className="flex justify-between items-center text-white">
                            <span className="system-text text-[7px] text-white/20 font-black uppercase tracking-widest text-white">Twin+ Confidence</span>
                            <span className="text-[7px] text-accent font-black text-white">94%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent w-[94%] opacity-80 shadow-[0_0_10px_var(--accent)]" style={{ width: '94%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
