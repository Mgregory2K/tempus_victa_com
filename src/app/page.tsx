"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Bridge from "@/components/bridge";
import SideNav from "@/components/SideNav";
import WorkoutTracker from "@/components/WorkoutTracker";
import ReviewScreen from "@/components/ReviewScreen";
import IOBay from "@/components/IOBay";
import Corkboard from "@/components/Corkboard";
import QuoteBoard from "@/components/QuoteBoard";
import Winboard from "@/components/Winboard";
import ProjectBoard from "@/components/ProjectBoard";
import SovereignTodo from "@/components/SovereignTodo";
import GroceryList from "@/components/GroceryList";
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

export type Module = "BRIDGE" | "READY_ROOM" | "IO_BAY" | "PROJECTS" | "TODO" | "CORKBOARD" | "MIRROR" | "ADMIN" | "WISHES" | "SETTINGS";

const VERSION = "17.0.0-TWIN-PLUS-SOVEREIGN";

// --- NATIVE ICON SET ---
const Icons = {
    BRIDGE: ({ className }: { className: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    READY_ROOM: ({ className }: { className: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    ),
    IO_BAY: ({ className }: { className: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    PROJECTS: ({ className }: { className: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    ),
    TODO: ({ className }: { className: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    CONFIG: ({ className }: { className: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    )
};

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceLayer?: string;
  vote?: number | null; // 1 for Up, -1 for Down
}

export interface ChatSegment {
    id: string;
    messages: Message[];
    attachments: any[];
    isSealed: boolean;
    timestamp: string;
}

export interface Chat {
    id: string;
    title: string;
    scopeId: string; // Project ID or "PROTOCOL"
    segments: ChatSegment[];
    updatedAt: string;
}

export interface Note {
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
    color: string;
}

export interface Quote {
    id: string;
    text: string;
    author: string;
    timestamp: string;
    context?: string;
    isSynced?: boolean;
}

export interface Wish {
    id: string;
    text: string;
    timestamp: string;
    status: 'PENDING' | 'MANIFESTED';
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
  const [chats, setChats] = useState<Chat[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);

  // Twin+ Sovereign Identity Pack State
  const [twinManifest, setTwinManifest] = useState<any>(null);
  const [committedMemory, setCommittedMemory] = useState<any>(null);
  const [geminiProjection, setGeminiProjection] = useState<any>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [identityMemory, setIdentityMemory] = useState<TwinMemory[]>([]);
  const [situationalState, setSituationalState] = useState<SituationalState[]>([]);
  const [patternSignals, setPatternSignals] = useState<PatternSignal[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isExercisesOpen, setIsExercisesOpen] = useState(false);

  const isMichaelAdmin = session?.user?.email ? ["michael.gregory1@gmail.com", "stewart.jared@gmail.com", "michael@tempusvicta.com"].includes(session.user.email.toLowerCase()) : false;

  const hasPulledRef = useRef(false);

  // 1. INITIAL HYDRATION (Local Storage)
  useEffect(() => {
    setHasMounted(true);
    setApiKey(localStorage.getItem("tv_api_key") || "");
    setSearchKey(localStorage.getItem("tv_search_key") || "");
    try {
        setIdentityMemory(JSON.parse(localStorage.getItem("tv_identity") || "[]"));
        setSituationalState(JSON.parse(localStorage.getItem("tv_situation") || "[]"));
        setPatternSignals(JSON.parse(localStorage.getItem("tv_patterns") || "[]"));
        setTasks(JSON.parse(localStorage.getItem("tv_tasks") || "[]"));
        setChats(JSON.parse(localStorage.getItem("tv_chats") || "[]"));
        setNotes(JSON.parse(localStorage.getItem("tv_notes") || "[]"));
        setQuotes(JSON.parse(localStorage.getItem("tv_quotes") || "[]"));
        setWishes(JSON.parse(localStorage.getItem("tv_wishes") || "[]"));

        // Twin+ Hydration
        setTwinManifest(JSON.parse(localStorage.getItem("twin_manifest") || "null"));
        setCommittedMemory(JSON.parse(localStorage.getItem("committed_memory") || "null"));
        setGeminiProjection(JSON.parse(localStorage.getItem("gemini_projection") || "null"));
    } catch (e) { console.error("Hydration Error", e); }
    setIsHydrated(true);
  }, []);

  // 2. CLOUD SYNC LOGIC
  const handleCloudSync = useCallback(async (direction: 'PUSH' | 'PULL') => {
    if (!session || isSyncing) return;
    setIsSyncing(true);
    try {
        if (direction === 'PUSH') {
            await Promise.all([
                fetch('/api/sync?file=identity_memory.json', { method: 'POST', body: JSON.stringify(identityMemory) }),
                fetch('/api/sync?file=chats.json', { method: 'POST', body: JSON.stringify(chats) }),
                fetch('/api/sync?file=tasks.json', { method: 'POST', body: JSON.stringify(tasks) }),
                fetch('/api/sync?file=notes.json', { method: 'POST', body: JSON.stringify(notes) }),
                fetch('/api/sync?file=quotes.json', { method: 'POST', body: JSON.stringify(quotes) }),
                fetch('/api/sync?file=wishes.json', { method: 'POST', body: JSON.stringify(wishes) }),
                fetch('/api/sync?file=pattern_signals.json', { method: 'POST', body: JSON.stringify(patternSignals) }),
                fetch('/api/sync?file=session_state.json', { method: 'POST', body: JSON.stringify(situationalState) }),

                // Twin+ Sovereign Push
                twinManifest && fetch('/api/sync?file=twin_manifest.json', { method: 'POST', body: JSON.stringify(twinManifest) }),
                committedMemory && fetch('/api/sync?file=committed_memory.json', { method: 'POST', body: JSON.stringify(committedMemory) }),
                geminiProjection && fetch('/api/sync?file=gemini_projection.json', { method: 'POST', body: JSON.stringify(geminiProjection) })
            ].filter(Boolean) as Promise<any>[]);
        } else {
            const fetchFile = async (name: string) => {
                const res = await fetch(`/api/sync?file=${name}`);
                return res.ok ? res.json() : null;
            };
            const [id, c, t, n, q, w, p, s, tm, cm, gp] = await Promise.all([
                fetchFile('identity_memory.json'), fetchFile('chats.json'), fetchFile('tasks.json'),
                fetchFile('notes.json'), fetchFile('quotes.json'), fetchFile('wishes.json'),
                fetchFile('pattern_signals.json'), fetchFile('session_state.json'),
                fetchFile('twin_manifest.json'), fetchFile('committed_memory.json'), fetchFile('gemini_projection.json')
            ]);
            if (id) setIdentityMemory(id);
            if (c) setChats(c);
            if (t) setTasks(t);
            if (n) setNotes(n);
            if (q) setQuotes(q);
            if (w) setWishes(w);
            if (p) setPatternSignals(p);
            if (s) setSituationalState(s);

            // Twin+ Pull rehydration
            if (tm) setTwinManifest(tm);
            if (cm) setCommittedMemory(cm);
            if (gp) setGeminiProjection(gp);
        }
    } catch (e) { console.error("Sync Error", e); } finally { setIsSyncing(false); }
  }, [session, isSyncing, identityMemory, chats, tasks, notes, quotes, wishes, patternSignals, situationalState, twinManifest, committedMemory, geminiProjection]);

  // 3. PERSISTENCE TRIGGER (Local + Immediate Cloud Push)
  useEffect(() => {
    if (!hasMounted || !isHydrated) return;
    localStorage.setItem("tv_identity", JSON.stringify(identityMemory));
    localStorage.setItem("tv_situation", JSON.stringify(situationalState));
    localStorage.setItem("tv_patterns", JSON.stringify(patternSignals));
    localStorage.setItem("tv_tasks", JSON.stringify(tasks));
    localStorage.setItem("tv_chats", JSON.stringify(chats));
    localStorage.setItem("tv_notes", JSON.stringify(notes));
    localStorage.setItem("tv_quotes", JSON.stringify(quotes));
    localStorage.setItem("tv_wishes", JSON.stringify(wishes));

    // Twin+ Persistence
    if (twinManifest) localStorage.setItem("twin_manifest", JSON.stringify(twinManifest));
    if (committedMemory) localStorage.setItem("committed_memory", JSON.stringify(committedMemory));
    if (geminiProjection) localStorage.setItem("gemini_projection", JSON.stringify(geminiProjection));

    // Auto-sync on significant changes (debounced by React state cycle)
    const timer = setTimeout(() => handleCloudSync('PUSH'), 5000);
    return () => clearTimeout(timer);
  }, [identityMemory, situationalState, patternSignals, tasks, chats, notes, quotes, wishes, twinManifest, committedMemory, geminiProjection, hasMounted, isHydrated, handleCloudSync]);

  useEffect(() => {
    if (status === 'authenticated' && !hasPulledRef.current && isHydrated) {
        hasPulledRef.current = true;
        handleCloudSync('PULL');
    }
  }, [status, isHydrated, handleCloudSync]);

  // 4. MODULES
  const projects = tasks.filter(t => t.source === 'PROJECTS' || t.isProject).map(t => ({ id: t.id, title: t.title }));

  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchCal = async () => {
        try {
            const res = await fetch('/api/calendar');
            if (res.ok) { const data = await res.json(); setCalendar(data); }
        } catch (e) {}
    };
    fetchCal();
    const interval = setInterval(fetchCal, 300000);
    return () => clearInterval(interval);
  }, [status]);

  const mergeGovernedMemory = useCallback((candidates: any[], lastUserMessage?: string) => {
      const durableCandidates = candidates.filter(c => !c.isSituational);
      setIdentityMemory(prev => governIdentity(prev, durableCandidates));
      if (lastUserMessage) setPatternSignals(prev => detectPatterns(lastUserMessage, prev));
  }, []);

  if (!hasMounted) return null;

  const NavItem = ({ id, label }: { id: Module | "CONFIG", label: string }) => {
      const isActive = activeModule === id || (id === "CONFIG" && activeModule === "SETTINGS");
      const iconKey = (id === "SETTINGS" || id === "CONFIG" ? "CONFIG" : id) as keyof typeof Icons;
      const IconComponent = Icons[iconKey] || Icons.BRIDGE;

      return (
          <button
              onClick={() => setActiveModule(id === "CONFIG" ? "SETTINGS" : id as Module)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all touch-target ${isActive ? 'text-accent' : 'text-white/30'}`}
          >
              <IconComponent className={`w-5 h-5 mb-1 ${isActive ? 'drop-shadow-[0_0_8px_var(--accent)]' : ''}`} />
              <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
          </button>
      );
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-black text-white flex flex-col uppercase text-[10px]">
      {isExercisesOpen && <ExerciseHub onDismiss={() => setIsExercisesOpen(false)} />}

      {/* --- MOBILE/DESKTOP HEADER --- */}
      <header className="h-14 md:h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-4 md:px-10 shrink-0 relative z-50 pt-[var(--sat)]">
         <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="lg:hidden p-2 text-white/60 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileNavOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
             </button>
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
                 <div className="h-8 w-8 border border-accent flex items-center justify-center text-accent font-black tracking-tighter">TV</div>
                 <span className="system-text text-[10px] md:text-lg font-black text-accent tracking-[0.3em] hidden sm:block">Tempus Victa</span>
             </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
                 <span className="text-[6px] text-white/20 font-black tracking-widest">{isSyncing ? "SYNCING..." : "SYNCED"}</span>
            </div>
            <div onClick={() => status === 'authenticated' ? signOut() : signIn('google')} className={`flex items-center gap-2 px-3 py-1.5 border cursor-pointer transition-all rounded-sm ${status === 'authenticated' ? 'border-accent/40 bg-accent/5' : 'border-red-500/40 bg-red-500/5'}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${status === 'authenticated' ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[8px] font-black tracking-widest">{status === 'authenticated' ? 'LINKED' : 'OFFLINE'}</span>
            </div>
         </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        {/* --- DRAWER (Mobile) / SIDEBAR (Desktop) --- */}
        <aside className={`fixed inset-0 lg:relative z-40 transition-transform duration-300 lg:translate-x-0 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileNavOpen(false)} />
            <div className="relative w-72 h-full shadow-2xl">
                <SideNav
                    onModuleChange={(m) => { setActiveModule(m); setIsMobileNavOpen(false); }}
                    activeModule={activeModule}
                    isAdmin={isMichaelAdmin}
                    onToggleExercises={() => setIsExercisesOpen(true)}
                />
            </div>
        </aside>

        {/* --- MAIN STAGE --- */}
        <main className="flex-grow overflow-hidden relative bg-black/20">
             <div className="absolute inset-0 p-4 md:p-8 overflow-y-auto hide-scrollbar">
              {activeModule === "BRIDGE" && <Bridge tasks={tasks} calendar={calendar} onNavigate={setActiveModule as any} onQuickTask={(t) => setTasks(prev => [{id: Date.now().toString(), title: t, status: 'TODO', source: 'WORKING_MEMORY'}, ...prev])} />}
              {activeModule === "READY_ROOM" && (
                <ReadyRoom
                    chats={chats} setChats={setChats} activeChatId={activeChatId} setActiveChatId={setActiveChatId}
                    projects={projects}
                    identityMemory={identityMemory} situationalState={situationalState}
                    apiKey={apiKey} searchKey={searchKey} assistantName={assistantName} userName={session?.user?.name || "User"}
                    tasks={tasks} calendar={calendar}
                    onMemoryUpdate={mergeGovernedMemory}
                    twinProjection={geminiProjection}
                />
              )}
              {activeModule === "IO_BAY" && <IOBay onNavigate={setActiveModule as any} onRouteToTask={(s) => setTasks(prev => [{id: s.id, title: s.content, status: 'TODO', source: 'SIGNAL_BAY'}, ...prev])} />}
              {activeModule === "PROJECTS" && <ProjectBoard externalTasks={tasks} setTasks={setTasks} />}
              {activeModule === "TODO" && <SovereignTodo externalTasks={tasks} setTasks={setTasks} />}
              {activeModule === "CORKBOARD" && (
                <Corkboard
                  externalNotes={notes}
                  setNotes={setNotes}
                  userName={session?.user?.name || "User"}
                  onArchive={(id) => setNotes(prev => prev.filter(n => n.id !== id))}
                  onPromote={(id, target) => {
                    const note = notes.find(n => n.id === id);
                    if (!note) return;
                    setTasks(prev => [{
                      id: Date.now().toString(),
                      title: note.text,
                      status: 'TODO',
                      source: target === 'PROJECTS' ? 'PROJECTS' : 'CORKBOARD',
                      isProject: target === 'PROJECTS'
                    }, ...prev]);
                    setNotes(prev => prev.filter(n => n.id !== id));
                  }}
                />
              )}
              {activeModule === "MIRROR" && (
                  <IdentityMirror
                    externalTasks={tasks} setExternalTasks={setTasks}
                    externalQuotes={quotes} setQuotes={setQuotes}
                    userName={session?.user?.name || "User"}
                  />
              )}
              {activeModule === "WISHES" && (
                <WishBoard
                  wishes={wishes}
                  onWish={(text) => setWishes(prev => [{ id: Date.now().toString(), text, timestamp: new Date().toISOString(), status: 'PENDING' }, ...prev])}
                />
              )}
              {activeModule === "ADMIN" && <AdminBoard wishes={wishes} setWishes={setWishes} setTasks={setTasks} />}
              {activeModule === "SETTINGS" && (
                  <div className="flex flex-col items-center py-6 md:py-12 animate-slide-up">
                      <div className="w-full max-w-xl p-6 md:p-8 hud-panel rounded-xl">
                          <h2 className="system-text text-xl font-black italic text-accent mb-8">COGNITIVE CONFIG</h2>
                          <div className="space-y-6 text-left">
                              {[{ l: "OpenAI Key", v: apiKey, s: setApiKey, k: "tv_api_key" }, { l: "Tavily Key", v: searchKey, s: setSearchKey, k: "tv_search_key" }].map(f => (
                                <div key={f.l} className="flex flex-col gap-2"><label className="text-[8px] text-white/40 font-bold uppercase">{f.l}</label><input type="password" value={f.v} onChange={(e) => f.s(e.target.value)} onBlur={() => localStorage.setItem(f.k, f.v)} className="bg-white/5 border border-white/10 p-3 text-xs text-white outline-none focus:border-accent" /></div>
                              ))}
                          </div>
                          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                            <span className="text-[8px] text-white/20 italic tracking-widest uppercase">Sovereign Link Stable // v{VERSION.split('-')[0]}</span>
                            <button onClick={() => handleCloudSync('PUSH')} className="w-full md:w-auto bg-accent/10 border border-accent/20 px-6 py-3 text-accent text-[8px] font-black hover:bg-accent hover:text-black transition-all uppercase tracking-widest">FORCE PERSISTENCE</button>
                          </div>
                      </div>
                  </div>
              )}
            </div>
        </main>
      </div>

      {/* --- THUMB-FRIENDLY BOTTOM NAV (Mobile Only) --- */}
      <footer className="lg:hidden mobile-bottom-nav flex items-center justify-around z-50 px-2">
          <NavItem id="BRIDGE" label="Bridge" />
          <NavItem id="READY_ROOM" label="Room" />
          <NavItem id="IO_BAY" label="Signal" />
          <NavItem id="PROJECTS" label="Focus" />
          <NavItem id="CONFIG" label="Config" />
      </footer>

      {/* --- PARALLELOGRAM NAV (Desktop Only) --- */}
      <footer className="hidden lg:flex h-14 border-t border-white/10 bg-black/95 items-center justify-center px-4 overflow-x-auto scrollbar-none gap-1 shrink-0 z-50">
          {[
            { id: "BRIDGE", label: "Bridge" }, { id: "READY_ROOM", label: "Ready Room" }, { id: "IO_BAY", label: "I/O Bay" }, { id: "PROJECTS", label: "Projects" }, { id: "TODO", label: "To-Do" }, { id: "CORKBOARD", label: "Corkboard" }, { id: "MIRROR", label: "Mirror" }, { id: "WISHES", label: "Wishes" }, { id: "SETTINGS", label: "Config" },
            ...(isMichaelAdmin ? [{ id: "ADMIN", label: "Command" }] : [])
          ].map(item => (
            <button key={item.id} onClick={() => setActiveModule(item.id as Module)} className={`nav-parallelogram px-6 py-2 system-text text-[8px] font-black transition-all border relative overflow-hidden uppercase ${activeModule === item.id ? 'text-white border-accent nav-active-pulse' : 'text-white/20 border-white/10 hover:border-white/40 hover:text-white/60'}`}><span className="nav-text-fix relative z-10 block whitespace-nowrap">{item.label}</span></button>
          ))}
      </footer>
    </div>
  );
}
