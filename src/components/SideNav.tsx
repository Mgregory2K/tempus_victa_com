// src/components/SideNav.tsx
"use client";

import React from 'react';
import { useSession, signIn } from "next-auth/react";

const NavItem = ({ name, isLinked, isActive, onClick }: { name: string, isLinked?: boolean, isActive?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`group relative flex items-center p-3 my-3 bg-white/[0.02] border transition-all cursor-pointer overflow-hidden ${isActive ? 'border-accent/60 bg-accent/5' : 'border-white/5 hover:border-accent/40'}`}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isLinked ? 'bg-neon-green shadow-[0_0_10px_#22c55e]' : 'bg-white/10 group-hover:bg-accent/40'}`} />

        <div className={`h-8 w-8 rounded-sm mr-3 flex items-center justify-center border ${isLinked ? 'border-neon-green/30 bg-neon-green/5' : 'border-white/10 bg-white/5'}`}>
             <div className={`h-1.5 w-1.5 rounded-full ${isLinked ? 'bg-neon-green animate-pulse' : 'bg-white/20'}`} />
        </div>

        <div className="flex flex-col">
            <span className={`system-text text-[10px] font-black tracking-widest ${isActive ? 'text-accent' : isLinked ? 'text-white' : 'text-white/40'}`}>{name}</span>
            <span className="text-[7px] text-white/20 font-bold uppercase tracking-tighter">
                {isLinked ? 'Link Stable' : 'Pending Auth'}
            </span>
        </div>

        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-accent/40" />
    </div>
);

interface SideNavProps {
    activeModule?: string;
    onModuleChange?: (module: any) => void;
}

export default function SideNav({ activeModule, onModuleChange }: SideNavProps) {
    const { data: session } = useSession();

    return (
        <nav className="w-64 p-6 border-r border-white/10 bg-black/40 hidden lg:block relative shrink-0">
            <div className="mb-8">
                <h2 className="system-text text-[10px] text-accent font-black tracking-[0.3em] mb-1">NEURAL NODES</h2>
                <div className="h-px w-full bg-gradient-to-r from-accent/40 to-transparent" />
            </div>

            <div className="space-y-1">
                <NavItem
                    name="Google Cloud"
                    isLinked={!!session}
                    onClick={!session ? () => signIn('google') : undefined}
                />
                <NavItem
                    name="Wrike P2"
                    isActive={activeModule === 'MISSIONS'}
                    onClick={() => onModuleChange?.('MISSIONS')}
                />
                <NavItem
                    name="Signal Bay"
                    isActive={activeModule === 'SIGNALS'}
                    onClick={() => onModuleChange?.('SIGNALS')}
                />
                <NavItem
                    name="Corkboard"
                    isActive={activeModule === 'CORKBOARD'}
                    onClick={() => onModuleChange?.('CORKBOARD')}
                />
                <NavItem
                    name="Quotes"
                    isActive={activeModule === 'QUOTES'}
                    onClick={() => onModuleChange?.('QUOTES')}
                />
            </div>

            {/* Bottom System Status Decor */}
            <div className="absolute bottom-8 left-6 right-6 space-y-4">
                <div className="h-px w-full bg-white/5" />
                <div className="flex flex-col gap-1">
                    <span className="system-text text-[7px] text-white/20 font-black">Memory Pressure</span>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[34%] opacity-60" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="system-text text-[7px] text-white/20 font-black">Neural Temp</span>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 w-[12%] opacity-60" />
                    </div>
                </div>
            </div>
        </nav>
    );
}
