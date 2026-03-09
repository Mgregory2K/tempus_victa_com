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
import { createEvent } from "@/core/twin_plus/twin_event";

export type Module = "BRIDGE" | "READY_ROOM" | "SIGNAL_BAY" | "PROJECTS" | "TODO" | "WINBOARD" | "CORKBOARD" | "QUOTES" | "CLOCK_TOWER" | "MIRROR" | "ADMIN" | "WISHES" | "SETTINGS";

const VERSION = "3.4.0-EVOLUTION";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceLayer?: string;
  vote?: number | null;
  wrongSource?: boolean;
  isPageBreak?: boolean;
}

interface Note {
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
    color: string;
    owner?: string;
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
  const [geminiKey, setGeminiKey] = useState("");
  const [notionKey, setNotionKey] = useState("");
  const [assistantName, setAssistantName] = useState("J5");

  const [tasks, setTasks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [wishes, setWishes] = useState<any[]>([]);

  const [showDailyBrief, setShowDailyBrief] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [initialReadyRoomMessage, setInitialReadyRoomMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [micPos, setMicPos] = useState({ x: 0, y: 0 });
  const isDraggingMic = useRef(false);
  const [hasMounted, setHasMounted] = useState(false);

  // 🧬 ADMIN FORCE SHIELD
  const ADMIN_EMAILS = ["michael.gregory1@gmail.com", "stewart.jared@gmail.com", "michael@tempusvicta.com"];
  const isMichaelAdmin = session?.user?.email ? ADMIN_EMAILS.includes(session.user.email.toLowerCase()) : false;

  // 🧬 SYNC ENGINE v3.0 (SACRED SYNC LOCK)
  const syncDataRef = useRef({ tasks, quotes, notes, messages, wishes, config: { apiKey, searchKey, geminiKey, notionKey, assistantName } });
  const isSyncingRef = useRef(false);
  const hasPulledRef = useRef(false);
  const lastSyncHash = useRef("");

  // 🛡️ LOCAL PERSISTENCE SHIELD: Execute immediately on state change
  useEffect(() => {
    syncDataRef.current = { tasks, quotes, notes, messages, wishes, config: { apiKey, searchKey, geminiKey, notionKey, assistantName } };

    // Write to Local Storage instantly to preserve Sovereignty
    localStorage.setItem("tv_tasks", JSON.stringify(tasks));
    localStorage.setItem("tv_messages", JSON.stringify(messages));
    localStorage.setItem("tv_notes", JSON.stringify(notes));
    localStorage.setItem("tv_quotes", JSON.stringify(quotes));
    localStorage.setItem("tv_wishes", JSON.stringify(wishes));

    // Update keys in localStorage as well
    if (apiKey) localStorage.setItem("tv_api_key", apiKey);
    if (searchKey) localStorage.setItem("tv_search_key", searchKey);
    if (geminiKey) localStorage.setItem("tv_gemini_key", geminiKey);
    if (notionKey) localStorage.setItem("tv_notion_key", notionKey);
    if (assistantName) localStorage.setItem("tv_assistant_name", assistantName);

  }, [tasks, quotes, notes, messages, wishes, apiKey, searchKey, geminiKey, notionKey, assistantName]);

  const mergeNeuralData = (local: any[], remote: any[]) => {
      const map = new Map();
      [...(remote || []), ...(local || [])].forEach(item => {
          if (item && item.id) map.set(item.id, item);
      });
      return Array.from(map.values()).sort((a,b) => (b.created_at || b.id || "").localeCompare(a.created_at || a.id || ""));
  };

  const handleCloudSync = useCallback(async (direction: 'PUSH' | 'PULL') => {
    if (!session || isSyncingRef.current) return;

    // 🔒 SYNC LOCK ENGAGED
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
        if (direction === 'PUSH') {
            const payload = {
                ...syncDataRef.current,
                mind: twinPlusKernel.snapshot(),
                lastSync: new Date().toISOString()
            };
            const currentHash = JSON.stringify({
                t: tasks.length,
                m: messages.length,
                n: notes.length,
                q: quotes.length,
                w: wishes.length,
                c: { apiKey, searchKey, geminiKey, notionKey, assistantName }
            });

            if (currentHash === lastSyncHash.current) {
                isSyncingRef.current = false;
                setIsSyncing(false);
                return;
            }

            await fetch('/api/sync', { method: 'POST', body: JSON.stringify(payload) });
            lastSyncHash.current = currentHash;
        } else {
            const res = await fetch('/api/sync');
            if (res.ok) {
                const data = await res.json();
                if (data.mind) await twinPlusKernel.hydrate(data.mind);

                // Functional updates to avoid stale closures
                setTasks(prev => mergeNeuralData(prev, data.tasks));
                setQuotes(prev => mergeNeuralData(prev, data.quotes));
                setNotes(prev => mergeNeuralData(prev, data.notes));
                setMessages(prev => mergeNeuralData(prev, data.messages));
                setWishes(prev => mergeNeuralData(prev, data.wishes));

                if (data.config) {
                    const c = data.config;
                    if (c.apiKey?.length > 10) setApiKey(c.apiKey);
                    if (c.searchKey?.length > 10) setSearchKey(c.searchKey);
                    if (c.geminiKey?.length > 10) setGeminiKey(c.geminiKey);
                    if (c.notionKey?.length > 10) setNotionKey(c.notionKey);
                    if (c.assistantName) setAssistantName(c.assistantName);
                }
            }
        }
    } catch (e) { console.error("Neural Sync Interrupted", e); }
    finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
    }
  }, [session, tasks.length, messages.length, notes.length, quotes.length, wishes.length, apiKey, searchKey, geminiKey, notionKey, assistantName]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(() => handleCloudSync('PUSH'), 60000);
    return () => clearInterval(interval);
  }, [status, handleCloudSync]);

  useEffect(() => {
    setHasMounted(true);
    const storage = status === 'authenticated' ? localStorage : sessionStorage;

    setApiKey(storage.getItem("tv_api_key") || "");
    setSearchKey(storage.getItem("tv_search_key") || "");
    setGeminiKey(storage.getItem("tv_gemini_key") || "");
    setNotionKey(storage.getItem("tv_notion_key") || "");
    setAssistantName(storage.getItem("tv_assistant_name") || "J5");
    setMicPos(JSON.parse(storage.getItem("tv_mic_pos") || '{"x":0, "y":0}'));

    try {
        setTasks(JSON.parse(storage.getItem("tv_tasks") || "[]"));
        setQuotes(JSON.parse(storage.getItem("tv_quotes") || "[]"));
        setNotes(JSON.parse(storage.getItem("tv_notes") || "[]"));
        setMessages(JSON.parse(storage.getItem("tv_messages") || "[]"));
        setWishes(JSON.parse(storage.getItem("tv_wishes") || "[]"));
    } catch (e) {}

    // 🛡️ BRIEFCASE PULL GUARD: Only once per session lifecycle
    if (status === 'authenticated' && !hasPulledRef.current) {
        hasPulledRef.current = true;
        handleCloudSync('PULL');
    }

    // 🌤 DAILY BRIEF AUTO-TRIGGER (FIRST LOGIN OF DAY)
    const today = new Date().toDateString();
    const lastBrief = localStorage.getItem("tv_last_brief_date");
    if (lastBrief !== today) {
        setShowDailyBrief(true);
        localStorage.setItem("tv_last_brief_date", today);
    }
  }, [status, handleCloudSync]);

  const onMicDrag = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDraggingMic.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setMicPos({ x: clientX - 32, y: clientY - 32 });
  };
  const stopMicDrag = () => {
      isDraggingMic.current = false;
      localStorage.setItem("tv_mic_pos", JSON.stringify(micPos));
  };

  const submitWish = (text: string) => {
    if (!text.trim()) return;
    const wish = { id: Date.now().toString(), text, status: 'PENDING', timestamp: new Date().toISOString(), user: session?.user?.name || session?.user?.email || "Guest" };
    setWishes(prev => [wish, ...prev]);
    twinPlusKernel.observe(createEvent('WISH_SUBMITTED', { text }, 'CONFIG'));
    setTimeout(() => handleCloudSync('PUSH'), 1000);
  };

  const handleUniversalIngest = (text: string, options: { isFromBrainstorm?: boolean, skipTask?: boolean, targetBoard?: 'PROJECTS' | 'TODO' } = {}) => {
    const ts = new Date().toISOString();
    const userIdentifier = session?.user?.name || session?.user?.email || "Guest";

    twinPlusKernel.observe(createEvent('UNIVERSAL_INGEST', { text, options }, 'INGEST_SURFACE'));

    if (options.isFromBrainstorm) {
        setInitialReadyRoomMessage(text);
        setActiveModule('READY_ROOM');
    } else if (text.toLowerCase().includes("cork")) {
        setNotes(prev => [{ id: Date.now().toString(), text, x: 100, y: 100, rotation: 0, color: 'bg-yellow-200/80', owner: userIdentifier }, ...prev]);
    } else if (!options.skipTask) {
        const targetSource = options.targetBoard === 'TODO' ? 'TACTICAL_TODO' : 'WORKING_MEMORY';
        setTasks(prev => [{ id: Date.now().toString(), title: text, priority: 'MED', status: 'TODO', source: targetSource, created_at: ts, owner: userIdentifier }, ...prev]);
    }

    setTimeout(() => handleCloudSync('PUSH'), 1000);
  };

  if (!hasMounted) return null;

  const userName = session?.user?.name || "User";

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-black text-white p-0 md:p-2 selection:bg-accent/30 font-sans uppercase text-[10px] flex flex-col" onMouseMove={onMicDrag} onMouseUp={stopMicDrag} onTouchMove={onMicDrag} onTouchEnd={stopMicDrag}>
      <div className="fixed inset-0 z-0 pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_70%)] opacity-60" /><div className="scanline" /></div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="hud-panel max-sm w-full p-8 border-red-500/40 text-center relative animate-slide-up">
                <h3 className="system-text text-xl font-black text-red-500 mb-4 italic uppercase">Terminate Session?</h3>
                <p className="text-white/60 text-xs mb-8 normal-case leading-relaxed">This will sever the connection to the Mothership and clear your current identity token. Local data remains on device.</p>
                <div className="flex gap-4"><button onClick={() => signOut()} className="flex-grow bg-red-500 py-3 text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest ripple">Logout</button><button onClick={() => setShowLogoutConfirm(false)} className="flex-grow border border-white/10 py-3 text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-widest ripple">Cancel</button></div>
                <div className="bracket-tl" /><div className="bracket-br" />
            </div>
        </div>
      )}

      {/* DRAGGABLE MIC */}
      <div className="fixed z-[5000] cursor-grab active:cursor-grabbing touch-none" style={{ left: micPos.x || 'auto', bottom: micPos.y ? 'auto' : '100px', top: micPos.y || 'auto', right: micPos.x ? 'auto' : '32px' }} onMouseDown={() => isDraggingMic.current = true} onTouchStart={() => isDraggingMic.current = true}>
          <div className="h-16 w-16 rounded-full border-2 border-accent/40 bg-black/80 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:scale-110 transition-transform active:bg-accent/20 relative group"><VoiceButton onTranscript={(t) => handleUniversalIngest(t)} size="md" /></div>
      </div>

      <div className="relative z-10 flex-grow w-full flex flex-col hud-panel border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md rounded-none md:rounded-lg">
        <header className="h-14 md:h-16 border-b border-white/10 bg-black/80 flex items-center justify-between px-4 md:px-10 shrink-0 relative">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="lg:hidden p-2 border border-white/10 rounded-sm hover:bg-white/5 text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{isMobileNavOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg></button>
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}><div className="h-10 w-10 md:h-12 border-2 border-accent/40 bg-black flex items-center justify-center relative shadow-[0_0_15px_rgba(0,212,255,0.2)]"><span className="system-text text-xl font-black text-accent">T</span><div className="bracket-tl" /><div className="bracket-br" /></div><div className="flex flex-col text-left uppercase text-white font-bold"><span className="system-text text-[10px] tracking-widest leading-none">The Bridge</span><span className="text-[6px] text-accent/60 font-black italic mt-1 leading-none uppercase tracking-widest">v{VERSION}</span></div></div>
          </div>
          <div className="flex gap-2 items-center">
            {isSyncing && <div className="system-text text-[8px] text-accent animate-pulse mr-2 tracking-widest italic">Synchronizing...</div>}

            {/* 🌤 DAILY BRIEF TRIGGER */}
            <button
                onClick={() => setShowDailyBrief(true)}
                className="flex items-center gap-2 px-3 py-1 md:py-2 border-2 border-accent/40 bg-accent/5 hover:bg-accent hover:text-black transition-all group mr-2 shadow-[0_0_10px_rgba(0,212,255,0.1)] active:scale-95"
            >
                <span className="text-[12px] animate-pulse">🌤</span>
                <span className="system-text text-[7px] md:text-[8px] font-black tracking-widest">BRIEF</span>
            </button>

            <div onClick={() => status === 'authenticated' ? setShowLogoutConfirm(true) : signIn('google')} className={`flex items-center gap-3 px-3 md:px-4 py-1 md:py-2 border-2 cursor-pointer transition-all ${status === 'authenticated' ? 'border-accent shadow-[0_0_15px_#00d4ff]' : 'border-red-500 bg-red-500/10'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${status === 'authenticated' ? 'bg-accent animate-pulse' : 'bg-red-500'}`} /><div className="flex flex-col text-left uppercase text-white font-bold"><span className="system-text text-[7px] md:text-[8px] leading-none">{status === 'authenticated' ? 'Briefcase Linked' : 'Identity Unlinked'}</span></div>
            </div>
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden relative">
          <div className={`absolute lg:relative z-[1500] h-full transition-all duration-500 ${isMobileNavOpen ? 'left-0' : '-left-64 lg:left-0'}`}><SideNav onModuleChange={(m) => {
              setActiveModule(m);
              setIsMobileNavOpen(false);
              twinPlusKernel.observe(createEvent('MODULE_SWITCH', { module: m }, 'SIDE_NAV'));
          }} activeModule={activeModule} isAdmin={isMichaelAdmin} onToggleExercises={() => setShowExercises(true)} /></div>
          {isMobileNavOpen && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1400] lg:hidden" onClick={() => setIsMobileNavOpen(false)} />}
          <main className="flex-grow overflow-hidden relative bg-black/20">
             <div className="absolute inset-0 p-2 md:p-8 overflow-y-auto scrollbar-thin overflow-x-hidden">
              {activeModule === "BRIDGE" && <div className="module-enter h-full text-white"><Bridge tasks={tasks} notes={notes} messages={messages} onNavigate={(m) => setActiveModule(m as any)} onQuickTask={(text) => handleUniversalIngest(text)} onSnooze={(id, time) => { twinPlusKernel.observe(createEvent('TASK_SNOOZED', { id, time }, 'BRIDGE')); setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'SNOOZED', snooze_until: time } : t)); }} /></div>}
              {activeModule === "READY_ROOM" && <div className="module-enter h-full"><ReadyRoom messages={messages} setMessages={(newMessages) => { setMessages(newMessages); setTimeout(() => handleCloudSync('PUSH'), 500); }} apiKey={apiKey} searchKey={searchKey} geminiKey={geminiKey} assistantName={assistantName} userName={userName} initialMessage={initialReadyRoomMessage} onContextConsumed={() => setInitialReadyRoomMessage(null)} /></div>}
              {activeModule === "SIGNAL_BAY" && <div className="module-enter h-full"><SignalBay onRouteToCorkboard={(s) => setNotes(prev => [...prev, {id: s.id, text: s.content, x: 100, y: 100, rotation: 0, color: 'bg-yellow-200/80'}])} onRouteToTask={(s) => setTasks(prev => [...prev, {id: s.id, title: s.content, priority: 'MED', status: 'TODO', source: 'SIGNAL_BAY'}])} /></div>}
              {activeModule === "PROJECTS" && <div className="module-enter h-full"><ProjectBoard externalTasks={tasks} setTasks={setTasks} /></div>}
              {activeModule === "TODO" && <div className="module-enter h-full"><SovereignTodo externalTasks={tasks} setTasks={setTasks} /></div>}
              {activeModule === "WINBOARD" && <div className="module-enter h-full"><Winboard externalTasks={tasks} setExternalTasks={setTasks} /></div>}
              {activeModule === "CORKBOARD" && <div className="module-enter h-full"><Corkboard externalNotes={notes} setNotes={setNotes} userName={userName} onPromote={(id, target) => { const n = notes.find(x => x.id === id); if(n) { const targetSource = target === 'PROJECTS' ? 'CORKBOARD' : 'TACTICAL_TODO'; setTasks(prev => [...prev, {id: n.id, title: n.text, status: 'TODO', priority: 'HIGH', source: targetSource}]); setNotes(prev => prev.filter(x => x.id !== id)); setActiveModule(target === 'PROJECTS' ? 'PROJECTS' : 'TODO'); } }} onArchive={(id) => { setNotes(prev => prev.filter(x => x.id !== id)); twinPlusKernel.observe(createEvent('NOTE_ARCHIVED', { id }, 'CORKBOARD')); }} onBrainstorm={(text) => { handleUniversalIngest(text, { isFromBrainstorm: true, skipTask: true }); }} /></div>}
              {activeModule === "QUOTES" && <div className="module-enter h-full"><QuoteBoard externalQuotes={quotes} setQuotes={setQuotes} userName={userName} /></div>}
              {activeModule === "CLOCK_TOWER" && <div className="module-enter h-full"><ClockTower onNavigate={(m) => setActiveModule(m as any)} /></div>}
              {activeModule === "MIRROR" && <div className="module-enter h-full"><IdentityMirror /></div>}
              {activeModule === "WISHES" && <div className="module-enter h-full"><WishBoard wishes={wishes} onWish={submitWish} /></div>}
              {activeModule === "ADMIN" && <div className="module-enter h-full"><AdminBoard wishes={wishes} setWishes={setWishes} setTasks={setTasks} /></div>}
              {activeModule === "SETTINGS" && (
                <div className="module-enter h-full overflow-y-auto uppercase flex flex-col items-center py-12 text-left">
                  <div className="w-full max-w-2xl bg-black/40 border border-white/10 p-8 rounded-lg shadow-2xl relative text-white">
                    <h2 className="text-2xl md:text-3xl font-black italic text-accent mb-8 tracking-tighter uppercase leading-none">Cognitive Config</h2>
                    <div className="mb-12 p-6 bg-accent/5 border border-accent/20 rounded text-white"><label className="text-[8px] text-accent font-black block mb-4 uppercase tracking-[0.2em]">Manifest a wish</label><div className="flex gap-4"><span className="text-sm font-bold text-white/40 italic flex items-center">I wish...</span><input id="wishInput" className="flex-grow bg-transparent border-b border-white/20 focus:border-accent outline-none text-white italic uppercase" onKeyDown={(e) => { if(e.key === 'Enter') { submitWish((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} /></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
                        <div className="space-y-6 text-white"><h3 className="system-text text-[10px] text-white/40 font-black mb-4 uppercase">Neural Substrate</h3>{[{ l: "OpenAI Key", v: apiKey, sv: setApiKey, k: "tv_api_key" }, { l: "Gemini Key", v: geminiKey, sv: setGeminiKey, k: "tv_gemini_key" }].map(field => (<div key={field.l} className="flex flex-col gap-2 group text-white"><label className="text-[8px] text-white/20 font-bold uppercase group-hover:text-accent transition-colors">{field.l}</label><div className="flex gap-2"><input type="password" value={field.v} onChange={(e) => field.sv(e.target.value)} className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-xs focus:border-accent outline-none font-mono text-white" /><button onClick={() => { localStorage.setItem(field.k, field.v); handleCloudSync('PUSH'); } } className="bg-accent/10 border border-accent/20 px-4 py-2 text-[8px] font-black text-accent hover:bg-accent hover:text-black transition-all uppercase ripple">SET</button></div></div>))}</div>
                        <div className="space-y-6 text-white"><h3 className="system-text text-[10px] text-white/40 font-black mb-4 uppercase">External Nodes</h3>{[{ l: "Tavily Key", v: searchKey, sv: setSearchKey, k: "tv_search_key" }, { l: "Notion Token", v: notionKey, sv: setNotionKey, k: "tv_notion_key" }].map(field => (<div key={field.l} className="flex flex-col gap-2 group text-white"><label className="text-[8px] text-white/20 font-bold uppercase group-hover:text-accent transition-colors">{field.l}</label><div className="flex gap-2"><input type="password" value={field.v} onChange={(e) => field.sv(e.target.value)} className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-xs focus:border-accent outline-none font-mono text-white" /><button onClick={() => { localStorage.setItem(field.k, field.v); handleCloudSync('PUSH'); } } className="bg-accent/10 border border-accent/20 px-4 py-2 text-[8px] font-black text-accent hover:bg-accent hover:text-black transition-all uppercase ripple">SET</button></div></div>))}</div>
                    </div>
                    <div className="bracket-tl" /><div className="bracket-br" />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* 🌤 DAILY BRIEF POPUP (PAPER ON DESK) */}
        {showDailyBrief && (
            <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
                <div className="relative w-full max-w-2xl transform transition-transform duration-700 animate-slide-up">
                    <DailyBrief
                        tasks={tasks}
                        searchKey={searchKey}
                        userName={userName}
                        onDismiss={() => setShowDailyBrief(false)}
                    />
                </div>
            </div>
        )}

        {/* 🎮 EXERCISE HUB POPUP */}
        {showExercises && (
            <div className="fixed inset-0 z-[7000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                <ExerciseHub onDismiss={() => setShowExercises(false)} />
            </div>
        )}

        <footer className="h-14 border-t border-white/10 bg-black/95 flex items-center justify-start px-2 overflow-x-auto scrollbar-none gap-1 shrink-0 z-50 text-white font-bold md:justify-center">
              {[
                { id: "BRIDGE", label: "Bridge" }, { id: "READY_ROOM", label: "Ready Room" }, { id: "SIGNAL_BAY", label: "Signal Bay" }, { id: "PROJECTS", label: "Projects" }, { id: "TODO", label: "To-Do" }, { id: "WINBOARD", label: "Win Board" }, { id: "CORKBOARD", label: "Corkboard" }, { id: "QUOTES", label: "Quotes" }, { id: "CLOCK_TOWER", label: "Clock Tower" }, { id: "SETTINGS", label: "Config" },
                { id: "WISHES", label: "Wishes" },
                ...(isMichaelAdmin ? [{ id: "ADMIN", label: "Command" }] : [])
              ].map(item => (
                <div key={item.id} className="relative group text-white shrink-0">
                    <button onClick={() => setActiveModule(item.id as Module)} className={`nav-parallelogram px-4 md:px-6 py-2 system-text text-[7px] md:text-[8px] font-black transition-all border relative overflow-hidden uppercase text-white font-bold ${activeModule === item.id ? 'text-white border-accent nav-active-pulse' : 'text-white/20 border-white/10 hover:border-white/40 hover:text-white/60'}`}><span className="nav-text-fix relative z-10 block whitespace-nowrap uppercase text-white font-bold">{item.label}</span></button>
                </div>
              ))}
        </footer>
      </div>
    </div>
  );
}
