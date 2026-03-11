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

  return (
    <div className="h-dvh w-screen overflow-hidden bg-black text-white flex flex-col uppercase text-[10px]">
      {isExercisesOpen && <ExerciseHub onDismiss={() => setIsExercisesOpen(false)} />}
      <header className="h-14 md:h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-4 md:px-10 shrink-0 relative z-50">
         <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="lg:hidden p-2 border border-white/10 rounded-sm hover:bg-white/5 text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{isMobileNavOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg></button>
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
                 <div className="h-8 w-8 border border-accent flex items-center justify-center text-accent font-black tracking-tighter">TV</div>
                 <span className="system-text text-[10px] md:text-lg font-black text-accent tracking-[0.3em] hidden sm:block">Tempus Victa</span>
             </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
                 <span className="text-[6px] text-white/20 font-black tracking-widest">{isSyncing ? "SYNCING_CLOUDS..." : "SYSTEM_SYNCHRONIZED"}</span>
            </div>
            <div onClick={() => status === 'authenticated' ? signOut() : signIn('google')} className={`flex items-center gap-2 px-3 py-1 border cursor-pointer transition-all ${status === 'authenticated' ? 'border-accent shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'border-red-500 bg-red-500/10'}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${status === 'authenticated' ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[8px] font-black">{status === 'authenticated' ? 'LINKED' : 'OFFLINE'}</span>
            </div>
         </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        <aside className={`absolute lg:relative z-40 transition-all duration-300 h-full ${isMobileNavOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.9)]' : '-translate-x-full lg:translate-x-0'}`}>
            <SideNav
                onModuleChange={(m) => { setActiveModule(m); setIsMobileNavOpen(false); }}
                activeModule={activeModule}
                isAdmin={isMichaelAdmin}
                onToggleExercises={() => setIsExercisesOpen(true)}
            />
        </aside>

        <main className="flex-grow overflow-hidden relative bg-black/20">
             <div className="absolute inset-0 p-4 md:p-8 overflow-y-auto scrollbar-thin">
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
                  <div className="flex flex-col items-center py-12 animate-fade-in">
                      <div className="w-full max-w-xl p-8 border border-white/10 bg-white/[0.02] rounded-xl relative">
                          <h2 className="system-text text-xl font-black italic text-accent mb-8">COGNITIVE CONFIG</h2>
                          <div className="space-y-6 text-left">
                              {[{ l: "OpenAI Key", v: apiKey, s: setApiKey, k: "tv_api_key" }, { l: "Tavily Key", v: searchKey, s: setSearchKey, k: "tv_search_key" }].map(f => (
                                <div key={f.l} className="flex flex-col gap-2"><label className="text-[8px] text-white/40 font-bold uppercase">{f.l}</label><input type="password" value={f.v} onChange={(e) => f.s(e.target.value)} onBlur={() => localStorage.setItem(f.k, f.v)} className="bg-white/5 border border-white/10 p-3 text-xs text-white outline-none" /></div>
                              ))}
                          </div>
                          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center"><span className="text-[8px] text-white/20 italic tracking-widest">Sovereign Link Stable</span><button onClick={() => handleCloudSync('PUSH')} className="bg-accent/10 border border-accent/20 px-6 py-2 text-accent text-[8px] font-black hover:bg-accent hover:text-black transition-all">FORCE PERSISTENCE</button></div>
                      </div>
                  </div>
              )}
            </div>
        </main>
      </div>

      <footer className="h-14 border-t border-white/10 bg-black/95 flex items-center justify-start px-2 md:px-4 overflow-x-auto scrollbar-none gap-1 shrink-0 z-50 text-white font-bold md:justify-center">
          {[
            { id: "BRIDGE", label: "Bridge" }, { id: "READY_ROOM", label: "Ready Room" }, { id: "IO_BAY", label: "I/O Bay" }, { id: "PROJECTS", label: "Projects" }, { id: "TODO", label: "To-Do" }, { id: "CORKBOARD", label: "Corkboard" }, { id: "MIRROR", label: "Mirror" }, { id: "WISHES", label: "Wishes" }, { id: "SETTINGS", label: "Config" },
            ...(isMichaelAdmin ? [{ id: "ADMIN", label: "Command" }] : [])
          ].map(item => (
            <button key={item.id} onClick={() => setActiveModule(item.id as Module)} className={`nav-parallelogram px-4 md:px-6 py-2 system-text text-[7px] md:text-[8px] font-black transition-all border relative overflow-hidden uppercase text-white font-bold ${activeModule === item.id ? 'text-white border-accent nav-active-pulse' : 'text-white/20 border-white/10 hover:border-white/40 hover:text-white/60'}`}><span className="nav-text-fix relative z-10 block whitespace-nowrap uppercase text-white font-bold">{item.label}</span></button>
          ))}
      </footer>
    </div>
  );
}
