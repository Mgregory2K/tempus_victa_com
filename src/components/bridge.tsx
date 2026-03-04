// src/components/bridge.tsx
"use client";

import React from 'react';
import { useSession, signOut } from "next-auth/react";
import DailyBrief from './DailyBrief';

// The main Bridge component, with restored aesthetic
export default function Bridge() {
  const { data: session } = useSession();

  return (
    <div className="bg-transparent text-white font-sans">
      <main className="max-w-4xl mx-auto p-4">
        <header className="py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white italic">Welcome back, {session?.user?.name?.split(' ')[0] || 'Michael'}.</h1>
            <p className="system-text text-sm text-white/50 font-black tracking-[0.2em]">THE BRIDGE</p>
          </div>
          {session && (
              <button onClick={() => signOut()} className="system-text text-xs bg-red-500/10 text-red-400 px-4 py-2 rounded-sm border border-red-500/20 hover:bg-red-500/50 hover:text-white transition-colors">SIGN OUT</button>
          )}
        </header>

        {session && <DailyBrief />}

      </main>
    </div>
  );
}
