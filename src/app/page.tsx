"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Bridge from "@/components/bridge";
import SideNav from "@/components/SideNav";
import WorkoutTracker from "@/components/WorkoutTracker";
import ReviewScreen from "@/components/ReviewScreen";
import SignalBay from "@/components/SignalBay";
import Corkboard from "@/components/Corkboard";
import QuoteBoard from "@/components/QuoteBoard";
import Winboard from "@/components/Winboard";
import ProjectBoard from "@/components/ProjectBoard";
import SovereignTodo from "@/components/SovereignTodo";
import GroceryList from "@/components/GroceryList";
import ClockTower from "@/components/ClockTower";
import IdentityMirror from "@/components/IdentityMirror";
import DailyBrief from "@/components/DailyBrief";
import ReadyRoom from "@/components/ReadyRoom";
import AdminBoard from "@/components/AdminBoard";
import WishBoard from "@/components/WishBoard";
import ExerciseHub from "@/components/ExerciseHub";
import { useSession, signIn, signOut } from "next-auth/react";
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";

export type Module = "BRIDGE" | "READY_ROOM" | "SIGNAL_BAY" | "PROJECTS" | "TODO" | "WINBOARD" | "CORKBOARD" | "QUOTES" | "CLOCK_TOWER" | "MIRROR" | "ADMIN" | "WISHES" | "SETTINGS";

const VERSION = "12.0.0-COGNITIVE";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceLayer?: string;
}

interface TwinMemory {
  id: string;
  kind: 'preference' | 'style' | 'priority' | 'relationship' | 'profile';
  key: string;
  value: string;
  confidence: number;
  reinforcementCount: number;
  source: 'conversation' | 'user_confirmed' | 'assistant_inferred';
  createdAt: string;
  updatedAt: string;
}

interface SituationalState {
  id: string;
  key: string;
  value: string;
  timestamp: string;
  expiresAt?: string;
}

interface PatternSignal {
  id: string;
  category: "behavior" | "workflow" | "communication";
  pattern: string;
  evidenceCount: number;
  confidence: number;
  lastObserved: string;
  lastReflected?: string;
}

export default function Home() {
  const { status } = useSession();
  const [isKernelReady, setIsKernelReady] = useState(false);
  useEffect(() => { async function start() { try { await twinPlusKernel.init(); setIsKernelReady(true); } catch (e) {} } start(); }, []);
  if (status === "loading" || !isKernelReady) return <div className="h-dvh w-screen bg-black flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--accent)]" /><p className="system-text text-accent animate-pulse tracking-[0.4em]">INITIALIZING NEURAL LINK...</p></div></div>;
  return <AppShell />;
}

function AppShell() {
  const { data: session, status } = useSession();
  const [activeModule, setActiveModule] = useState<Module>("BRIDGE");
  const [apiKey, setApiKey] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [assistantName, setAssistantName] = useState("J5");

  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [identityMemory, setIdentityMemory] = useState<TwinMemory[]>([]);
  const [situationalState, setSituationalState] = useState<SituationalState[]>([]);
  const [patternSignals, setPatternSignals] = useState<PatternSignal[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const isMichaelAdmin = session?.user?.email ? ["michael.gregory1@gmail.com", "stewart.jared@gmail.com", "michael@tempusvicta.com"].includes(session.user.email.toLowerCase()) : false;

  // Persistence logic for Governed Tiers
  useEffect(() => {
    setHasMounted(true);
    setApiKey(localStorage.getItem("tv_api_key") || "");
    setSearchKey(localStorage.getItem("tv_search_key") || "");
    try {
        setIdentityMemory(JSON.parse(localStorage.getItem("tv_identity") || "[]"));
        setSituationalState(JSON.parse(localStorage.getItem("tv_situation") || "[]"));
        setPatternSignals(JSON.parse(localStorage.getItem("tv_patterns") || "[]"));
        setTasks(JSON.parse(localStorage.getItem("tv_tasks") || "[]"));
        setMessages(JSON.parse(localStorage.getItem("tv_messages") || "[]"));
    } catch (e) {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !isHydrated) return;
    localStorage.setItem("tv_identity", JSON.stringify(identityMemory));
    localStorage.setItem("tv_situation", JSON.stringify(situationalState));
    localStorage.setItem("tv_patterns", JSON.stringify(patternSignals));
    localStorage.setItem("tv_tasks", JSON.stringify(tasks));
    localStorage.setItem("tv_messages", JSON.stringify(messages));
  }, [identityMemory, situationalState, patternSignals, tasks, messages]);

  const handleCloudSync = useCallback(async (direction: 'PUSH' | 'PULL') => {
    if (!session || isSyncing) return;
    setIsSyncing(true);
    try {
        if (direction === 'PUSH') {
            await fetch('/api/sync?file=identity_memory.json', { method: 'POST', body: JSON.stringify(identityMemory) });
            await fetch('/api/sync?file=session_state.json', { method: 'POST', body: JSON.stringify(situationalState) });
            await fetch('/api/sync?file=pattern_signals.json', { method: 'POST', body: JSON.stringify(patternSignals) });
            await fetch('/api/sync?file=tasks.json', { method: 'POST', body: JSON.stringify(tasks) });
        } else {
            const resId = await fetch('/api/sync?file=identity_memory.json');
            if (resId.ok) setIdentityMemory(await resId.json());
            const resSit = await fetch('/api/sync?file=session_state.json');
            if (resSit.ok) setSituationalState(await resSit.json());
            const resPat = await fetch('/api/sync?file=pattern_signals.json');
            if (resPat.ok) setPatternSignals(await resPat.json());
        }
    } catch (e) {} finally { setIsSyncing(false); }
  }, [session, identityMemory, situationalState, patternSignals, tasks]);

  useEffect(() => {
    if (status === 'authenticated' && !isHydrated) handleCloudSync('PULL');
  }, [status, isHydrated, handleCloudSync]);

  const mergeGovernedMemory = (candidates: any[]) => {
      setIdentityMemory(prev => {
          const updated = [...prev];
          const situationals: SituationalState[] = [];

          candidates.forEach(c => {
              if (c.isSituational) {
                  situationals.push({ id: Date.now().toString(), key: c.key, value: c.value, timestamp: new Date().toISOString() });
              } else {
                  const existing = updated.find(m => m.key === c.key);
                  if (!existing) {
                      updated.push({
                          id: Date.now().toString(),
                          kind: c.kind,
                          key: c.key,
                          value: c.value,
                          confidence: c.source === 'user_confirmed' ? 0.9 : 0.4,
                          reinforcementCount: 1,
                          source: c.source,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                      });
                  } else {
                      existing.reinforcementCount += 1;
                      existing.confidence = Math.min(1, existing.confidence + 0.1);
                      existing.value = c.value;
                      existing.updatedAt = new Date().toISOString();
                  }
              }
          });
          if (situationals.length > 0) setSituationalState(prevSit => [...situationals, ...prevSit].slice(0, 10));
          return updated;
      });
  };

  if (!hasMounted) return null;

  return (
    <div className="h-dvh w-screen overflow-hidden bg-black text-white flex flex-col uppercase text-[10px]">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-10 shrink-0">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
             <span className="system-text text-xl font-black text-accent tracking-[0.3em]">Tempus Victa</span>
         </div>
         <div className="flex gap-4">
            {isSyncing && <div className="text-accent animate-pulse">Syncing...</div>}
            <button onClick={() => status === 'authenticated' ? signOut() : signIn('google')} className="border border-accent/40 px-4 py-1 hover:bg-accent hover:text-black transition-all">
                {status === 'authenticated' ? 'Linked' : 'Offline'}
            </button>
         </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        <SideNav onModuleChange={setActiveModule} activeModule={activeModule} isAdmin={isMichaelAdmin} />
        <main className="flex-grow overflow-hidden relative bg-black/20">
             <div className="absolute inset-0 p-8 overflow-y-auto scrollbar-thin">
              {activeModule === "BRIDGE" && <Bridge tasks={tasks} calendar={[]} onNavigate={setActiveModule as any} onQuickTask={() => {}} />}
              {activeModule === "READY_ROOM" && (
                <ReadyRoom
                    messages={messages} setMessages={setMessages}
                    identityMemory={identityMemory} situationalState={situationalState} patternSignals={patternSignals}
                    apiKey={apiKey} searchKey={searchKey} assistantName={assistantName} userName={session?.user?.name || "User"}
                    tasks={tasks} calendar={[]}
                    onMemoryUpdate={mergeGovernedMemory}
                />
              )}
            </div>
        </main>
      </div>

      <footer className="h-14 border-t border-white/10 bg-black flex items-center justify-center gap-1 shrink-0">
          {["BRIDGE", "READY_ROOM", "SETTINGS"].map(m => (
              <button key={m} onClick={() => setActiveModule(m as Module)} className={`px-6 py-2 transition-all ${activeModule === m ? 'text-white border-b-2 border-accent' : 'text-white/20 hover:text-white/40'}`}>{m}</button>
          ))}
      </footer>
    </div>
  );
}
