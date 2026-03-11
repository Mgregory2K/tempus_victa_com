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
import {
    TwinMemory, SituationalState, PatternSignal,
    governIdentity, runMemoryCompression, detectPatterns
} from "@/core/memory/governance";

export type Module = "BRIDGE" | "READY_ROOM" | "SIGNAL_BAY" | "PROJECTS" | "TODO" | "WINBOARD" | "CORKBOARD" | "QUOTES" | "CLOCK_TOWER" | "MIRROR" | "ADMIN" | "WISHES" | "SETTINGS";

const VERSION = "14.0.0-COGNITIVE";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceLayer?: string;
}

// 🎤 SHARED VOICE COMPONENT
export const VoiceButton = ({ onTranscript, isTyping, size = "md" }: { onTranscript: (text: string) => void, isTyping?: boolean, size?: "sm" | "md" }) => {
    const [isListening, setIsListening] = useState(false);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const startListening = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Neural Voice Ingestion not supported.");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new AudioContext();
            analyzerRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyzerRef.current);
            analyzerRef.current.fftSize = 64;
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            const updateFrequency = () => {
                if (analyzerRef.current) {
                    analyzerRef.current.getByteFrequencyData(dataArray);
                    setAudioData(new Uint8Array(dataArray));
                    animationRef.current = requestAnimationFrame(updateFrequency);
                }
            };
            updateFrequency();
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                setIsListening(false);
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                if (audioContextRef.current) audioContextRef.current.close();
                setAudioData(new Uint8Array(0));
            };
            recognition.onresult = (event: any) => onTranscript(event.results[0][0].transcript);
            recognition.start();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex items-center gap-3">
            {isListening && <div className="flex gap-[2px] items-center h-4">{Array.from(audioData).slice(0, 8).map((val, i) => (<div key={i} className="w-[3px] bg-accent shadow-[0_0_8px_var(--accent)] rounded-full transition-all duration-75" style={{ height: `${Math.max(15, (val / 255) * 100)}%` }} />))}</div>}
            <button type="button" onClick={startListening} disabled={isTyping} className={`rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'text-white/20 hover:text-accent'} ${size === "sm" ? "p-1" : "p-2"}`}><svg className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
        </div>
    );
};

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

  const msgCountRef = useRef(0);

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
  }, [identityMemory, situationalState, patternSignals, tasks, messages, hasMounted, isHydrated]);

  const handleCloudSync = useCallback(async (direction: 'PUSH' | 'PULL') => {
    if (!session || isSyncing) return;
    setIsSyncing(true);
    try {
        if (direction === 'PUSH') {
            await Promise.all([
                fetch('/api/sync?file=identity_memory.json', { method: 'POST', body: JSON.stringify(identityMemory) }),
                fetch('/api/sync?file=session_state.json', { method: 'POST', body: JSON.stringify(situationalState) }),
                fetch('/api/sync?file=pattern_signals.json', { method: 'POST', body: JSON.stringify(patternSignals) }),
                fetch('/api/sync?file=tasks.json', { method: 'POST', body: JSON.stringify(tasks) })
            ]);
        } else {
            const [resId, resSit, resPat, resTasks] = await Promise.all([
                fetch('/api/sync?file=identity_memory.json'),
                fetch('/api/sync?file=session_state.json'),
                fetch('/api/sync?file=pattern_signals.json'),
                fetch('/api/sync?file=tasks.json')
            ]);
            if (resId.ok) setIdentityMemory(await resId.json());
            if (resSit.ok) setSituationalState(await resSit.json());
            if (resPat.ok) setPatternSignals(await resPat.json());
            if (resTasks.ok) setTasks(await resTasks.json());
        }
    } catch (e) {} finally { setIsSyncing(false); }
  }, [session, identityMemory, situationalState, patternSignals, tasks, isSyncing]);

  useEffect(() => {
    if (status === 'authenticated' && !hasPulledRef.current && isHydrated) {
        hasPulledRef.current = true;
        handleCloudSync('PULL');
    }
  }, [status, isHydrated, handleCloudSync]);

  const hasPulledRef = useRef(false);

  const mergeGovernedMemory = useCallback((candidates: any[], lastUserMessage?: string) => {
      // 1. Split and Merge durable/transient
      const durableCandidates = candidates.filter(c => !c.isSituational);
      const situationalCandidates = candidates.filter(c => c.isSituational);

      setIdentityMemory(prev => governIdentity(prev, durableCandidates));

      if (situationalCandidates.length > 0) {
          setSituationalState(prev => {
              const newSits = situationalCandidates.map(c => ({
                  id: Math.random().toString(36).substring(2, 11),
                  key: c.key,
                  value: c.value,
                  timestamp: new Date().toISOString()
              }));
              return [...newSits, ...prev].slice(0, 15); // Governance: Cap situational state
          });
      }

      // 2. Pattern Detection
      if (lastUserMessage) {
          setPatternSignals(prev => detectPatterns(lastUserMessage, prev));
      }

      // 3. Periodic Compression (Every 10 learning cycles)
      msgCountRef.current += 1;
      if (msgCountRef.current % 10 === 0) {
          setIdentityMemory(prev => {
              const { active, archived } = runMemoryCompression(prev);
              if (archived.length > 0) {
                  fetch('/api/sync?file=memory_archive.json', { method: 'POST', body: JSON.stringify(archived) });
              }
              return active;
          });
      }

      setTimeout(() => handleCloudSync('PUSH'), 2000);
  }, [handleCloudSync]);

  if (!hasMounted) return null;

  return (
    <div className="h-dvh w-screen overflow-hidden bg-black text-white flex flex-col uppercase text-[10px]">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-10 shrink-0 bg-black/80 backdrop-blur-md relative z-50">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
             <div className="h-8 w-8 border border-accent flex items-center justify-center text-accent font-black">TV</div>
             <span className="system-text text-lg font-black text-accent tracking-[0.3em] hidden md:block">Tempus Victa</span>
         </div>
         <div className="flex items-center gap-6">
            {isSyncing && <div className="text-accent animate-pulse tracking-widest text-[8px] italic">Synchronizing Neural Data...</div>}
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${status === 'authenticated' ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : 'bg-red-500'}`} />
                <button onClick={() => status === 'authenticated' ? signOut() : signIn('google')} className="text-[8px] font-bold tracking-tighter opacity-60 hover:opacity-100 transition-opacity">
                    {status === 'authenticated' ? 'LINKED' : 'OFFLINE'}
                </button>
            </div>
         </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        <SideNav onModuleChange={setActiveModule} activeModule={activeModule} isAdmin={isMichaelAdmin} />
        <main className="flex-grow overflow-hidden relative bg-black/20">
             <div className="absolute inset-0 p-4 md:p-8 overflow-y-auto scrollbar-thin">
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
              {activeModule === "SETTINGS" && (
                  <div className="flex flex-col items-center py-20 animate-fade-in">
                      <div className="w-full max-w-xl p-8 border border-white/10 bg-white/[0.02] rounded-xl relative">
                          <h2 className="system-text text-xl font-black italic text-accent mb-8">COGNITIVE CONFIG</h2>
                          <div className="space-y-6">
                              <div className="flex flex-col gap-2">
                                  <label className="text-[8px] text-white/40 font-bold tracking-widest">OPENAI_KEY</label>
                                  <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} onBlur={() => localStorage.setItem("tv_api_key", apiKey)} className="bg-white/5 border border-white/10 p-3 text-xs text-white outline-none focus:border-accent/40" />
                              </div>
                              <div className="flex flex-col gap-2">
                                  <label className="text-[8px] text-white/40 font-bold tracking-widest">TAVILY_KEY</label>
                                  <input type="password" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} onBlur={() => localStorage.setItem("tv_search_key", searchKey)} className="bg-white/5 border border-white/10 p-3 text-xs text-white outline-none focus:border-accent/40" />
                              </div>
                          </div>
                          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[8px] text-white/20 italic">SOVEREIGN_MODE_ACTIVE</span>
                              <button onClick={() => handleCloudSync('PUSH')} className="bg-accent/10 border border-accent/20 px-6 py-2 text-accent text-[8px] font-black hover:bg-accent hover:text-black transition-all">FORCE SYNC</button>
                          </div>
                      </div>
                  </div>
              )}
            </div>
        </main>
      </div>

      <footer className="h-14 border-t border-white/10 bg-black/95 flex items-center justify-center gap-1 shrink-0 z-50">
          {[
              { id: "BRIDGE", label: "The Bridge" },
              { id: "READY_ROOM", label: "Ready Room" },
              { id: "SETTINGS", label: "Config" }
          ].map(m => (
              <button key={m.id} onClick={() => setActiveModule(m.id as Module)} className={`px-8 py-2 transition-all font-black tracking-widest text-[8px] ${activeModule === m.id ? 'text-white border-b-2 border-accent' : 'text-white/20 hover:text-white/40'}`}>
                  {m.label}
              </button>
          ))}
      </footer>
    </div>
  );
}
