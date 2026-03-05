// src/components/bridge.tsx
"use client";

import React, { useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import DailyBrief from './DailyBrief';
import GroceryList from './GroceryList';

type BridgeTab = "OVERVIEW" | "LISTS";

export default function Bridge() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<BridgeTab>("OVERVIEW");

  return (
    <div className="bg-transparent text-white font-sans min-h-full pb-20">
      <main className="max-w-4xl mx-auto p-4">
        <header className="py-6 flex justify-between items-start mb-8 border-b border-white/5">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tight leading-none">
              Welcome back, <span className="text-accent">{session?.user?.name?.split(' ')[0] || 'Mike'}</span>.
            </h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="system-text text-[10px] text-white/40 font-black tracking-[0.3em]">STRATEGIC COCKPIT // v1.0.4</p>
                <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_#22c55e]" />
            </div>
          </div>
          <div className="flex gap-2">
            {session && (
                <button onClick={() => signOut()} className="system-text text-[9px] border border-red-500/20 text-red-500/60 px-4 py-2 hover:bg-red-500 hover:text-white transition-all">TERMINATE SESSION</button>
            )}
          </div>
        </header>

        {/* Sub-navigation for Bridge */}
        <div className="flex gap-8 mb-8 border-b border-white/5 px-2">
            {["OVERVIEW", "LISTS"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as BridgeTab)}
                    className={`pb-2 system-text text-[10px] font-black tracking-widest transition-all relative ${activeTab === tab ? 'text-accent' : 'text-white/20 hover:text-white/40'}`}
                >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_10px_var(--accent)]" />}
                </button>
            ))}
        </div>

        <div className="animate-slide-up">
            {activeTab === "OVERVIEW" ? <DailyBrief /> : <GroceryList />}
        </div>

      </main>
    </div>
  );
}
