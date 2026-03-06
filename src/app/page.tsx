"use client";

import { useState, useEffect, useRef } from "react";
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
import { useSession, signIn } from "next-auth/react";
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";
import { createEvent } from "@/core/twin_plus/twin_event";

type Module = "BRIDGE" | "READY_ROOM" | "DOCTRINE" | "SETTINGS" | "MISSIONS" | "REVIEW" | "SIGNALS" | "CORKBOARD" | "QUOTES" | "WINBOARD" | "PROJECTS" | "LISTS" | "TODO" | "CLOCK_TOWER" | "MIRROR" | "ADMIN";

const VERSION = "3.0.2-MAGICIAN";
const ADMIN_EMAILS = ["michaelagregory@gmail.com", "adam@example.com"];

interface SuggestedAction {
  type: string;
  label: string;
  payload: any;
}

interface Message {
  role: string;
  content: string;
  layer?: string;
  timestamp?: string;
  id: string;
  suggestedActions?: SuggestedAction[];
  isManifested?: boolean;
  feedback?: "UP" | "DOWN";
}

interface Note {
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
    color: string;
}

// SHARED VOICE COMPONENT
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
            const bufferLength = analyzerRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
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
  if (status === "loading" || !isKernelReady) return <div className="h-screen w-screen bg-black flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--accent)]" /><p className="system-text text-accent animate-pulse tracking-[0.4em]">INITIALIZING NEURAL LINK...</p></div></div>;
  return <AppShell />;
}

function AppShell() {
  const { data: session, status } = useSession();
  const [activeModule, setActiveModule] = useState<Module>("BRIDGE");
  const [apiKey, setApiKey] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [notionKey, setNotionKey] = useState("");
  const [assistantName, setAssistantName] = useState("Twin+");
  const [isOnline, setIsOnline] = useState(true);

  // PERSISTENT STATE
  const [tasks, setTasks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [wishes, setWishes] = useState<any[]>([]);

  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isProtocolActive, setIsProtocolActive] = useState(false);
  const [showTrrpModal, setShowTrrpModal] = useState(false);
  const [showDailyBrief, setShowDailyBrief] = useState(false);
  const [matrixPending, setMatrixPending] = useState(false);
  const [matrixMessage, setMatrixMessage] = useState("INITIATING");

  const [hasMounted, setHasMounted] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // HYDRATION
  useEffect(() => {
    setHasMounted(true);
    setIsOnline(navigator.onLine);
    setApiKey(localStorage.getItem("tv_api_key") || "");
    setSearchKey(localStorage.getItem("tv_search_key") || "");
    setGeminiKey(localStorage.getItem("tv_gemini_key") || "");
    setNotionKey(localStorage.getItem("tv_notion_key") || "");
    setAssistantName(localStorage.getItem("tv_assistant_name") || "Twin+");
    try {
        setTasks(JSON.parse(localStorage.getItem("tv_tasks") || "[]"));
        setQuotes(JSON.parse(localStorage.getItem("tv_quotes") || "[]"));
        setNotes(JSON.parse(localStorage.getItem("tv_notes") || "[]"));
        setMessages(JSON.parse(localStorage.getItem("tv_chat_history") || "[]"));
        setWishes(JSON.parse(localStorage.getItem("tv_wishes") || "[]"));
    } catch (e) {}

    // AUTOMATION: Check for 6 AM Brief
    const now = new Date();
    const lastBriefSeen = localStorage.getItem("tv_last_brief_seen");
    const todayStr = now.toLocaleDateString();
    if (now.getHours() >= 6 && lastBriefSeen !== todayStr) {
        setShowDailyBrief(true);
        localStorage.setItem("tv_last_brief_seen", todayStr);
    }
  }, []);

  // AUTO-SAVE TO LOCAL
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("tv_tasks", JSON.stringify(tasks));
    localStorage.setItem("tv_quotes", JSON.stringify(quotes));
    localStorage.setItem("tv_notes", JSON.stringify(notes));
    localStorage.setItem("tv_chat_history", JSON.stringify(messages));
    localStorage.setItem("tv_wishes", JSON.stringify(wishes));
  }, [tasks, quotes, notes, messages, wishes, hasMounted]);

  // CLOUD SYNC ENGINE
  const handleCloudSync = async (direction: 'PUSH' | 'PULL') => {
    if (!session) return alert("Link Google Identity first.");
    setIsSyncing(true);
    try {
        if (direction === 'PUSH') {
            const ledger = { tasks, quotes, notes, messages, wishes, config: { apiKey, searchKey, geminiKey, notionKey, assistantName }, lastSync: new Date().toISOString() };
            const res = await fetch('/api/sync', { method: 'POST', body: JSON.stringify(ledger) });
            if (res.ok) alert("Sovereign Ledger Pushed to Cloud.");
        } else {
            const res = await fetch('/api/sync');
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []); setQuotes(data.quotes || []); setNotes(data.notes || []); setMessages(data.messages || []); setWishes(data.wishes || []);
                if (data.config) {
                    setApiKey(data.config.apiKey || ""); setSearchKey(data.config.searchKey || "");
                    setGeminiKey(data.config.geminiKey || ""); setNotionKey(data.config.notionKey || "");
                    localStorage.setItem("tv_api_key", data.config.apiKey || "");
                }
                alert("Sovereign Ledger Hydrated.");
            }
        }
    } catch (e) { alert("Sync Failure."); }
    finally { setIsSyncing(false); }
  };

  // TESTER WISH ENGINE
  const submitWish = (text: string) => {
      const newWish = { id: Date.now().toString(), user: session?.user?.name || "Tester", text, timestamp: new Date().toISOString(), status: 'PENDING' };
      setWishes(prev => [newWish, ...prev]);
      alert("Wish Manifested. The System will Review.");
  };

  // UNIVERSAL INGESTION
  const handleUniversalIngest = (text: string) => {
    const lowText = text.toLowerCase();
    let routedTo = "";
    if (lowText.includes("cork it") || lowText.includes("corkboard")) {
        const cleaned = text.replace(/cork it/i, "").replace(/corkboard/i, "").trim();
        setNotes(prev => [...prev, { id: Date.now().toString(), text: cleaned || text, x: 100, y: 100, rotation: 0, color: 'bg-yellow-200/80' }]);
        routedTo = "CORKBOARD";
    } else if (lowText.includes("task") || lowText.includes("reminder")) {
        const cleaned = text.replace(/task/i, "").replace(/reminder/i, "").trim();
        setTasks(prev => [{ id: Date.now().toString(), title: cleaned || text, priority: 'MED', status: 'TODO', source: 'VOICE' }, ...prev]);
        routedTo = "PROJECTS";
    } else if (lowText.includes("i wish")) {
        const cleaned = text.replace(/i wish/i, "").replace(/the app would/i, "").trim();
        submitWish(cleaned);
        routedTo = "ADMIN (WISH)";
    } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: `[INGEST]: ${text}`, timestamp: new Date().toISOString() }]);
        routedTo = "SIGNALS";
    }
    const toast = document.createElement('div');
    toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-accent text-black px-6 py-2 system-text text-[10px] font-black z-[3000] animate-bounce uppercase shadow-[0_0_20px_#00d4ff] border-2 border-black';
    toast.innerText = `ROUTED TO ${routedTo}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideInput) setInput("");
    setIsTyping(true);
    try {
      const response = await fetch('/api/ready-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: text,
            history: messages.slice(-10),
            assistantName,
            aiEnhanced: aiEnhanced || isProtocolActive,
            apiKey,
            searchKey,
            geminiKey
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now().toString(), role: data.role, content: data.content, layer: data.sourceLayer, timestamp: new Date().toISOString(), suggestedActions: data.suggestedActions }]);
    } catch (error) { setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Neural failure.", timestamp: new Date().toISOString() }]); }
    finally { setIsTyping(false); }
  };

  if (!hasMounted) return null;
  const isSystemLinked = isOnline && status === 'authenticated';
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white p-1 md:p-2 selection:bg-accent/30 font-sans uppercase text-[10px]">
      <div className="fixed inset-0 z-0 pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_70%)] opacity-60" /><div className="scanline" /></div>

      {/* 🌤 MORNING GLORY POPUP MODAL (Over Bridge) */}
      {showDailyBrief && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl p-4 md:p-12 overflow-y-auto animate-slide-up">
            <div className="max-w-4xl mx-auto relative">
                <button onClick={() => setShowDailyBrief(false)} className="absolute -top-8 right-0 text-white/40 hover:text-white system-text text-[10px] font-black tracking-widest transition-all">✕ DISMISS_BRIEF</button>
                <DailyBrief />
            </div>
        </div>
      )}

      {/* 🎙 UNIVERSAL RECORD BUTTON (Bottom Right) */}
      <div className="fixed bottom-24 right-8 z-[2000] flex flex-col items-center gap-2">
          <span className="text-[7px] font-black text-accent bg-black/60 px-2 py-1 rounded border border-accent/20 backdrop-blur-sm tracking-[0.2em]">RECORD_INTENT</span>
          <div className="h-16 w-16 rounded-full border-2 border-accent/40 bg-black/80 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:scale-110 transition-all cursor-pointer group">
              <VoiceButton onTranscript={handleUniversalIngest} size="md" />
          </div>
      </div>

      <div className="relative z-10 h-full w-full flex flex-col hud-panel border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md rounded-none md:rounded-lg">
        <header className="h-14 md:h-16 border-b border-white/10 bg-black/80 flex items-center justify-between px-4 md:px-10 shrink-0 relative">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
             <div className="h-10 w-10 md:h-12 border-2 border-accent/40 bg-black flex items-center justify-center relative shadow-[0_0_15px_rgba(0,212,255,0.2)]"><span className="system-text text-xl font-black text-accent">T</span><div className="bracket-tl" /><div className="bracket-br" /></div>
             <div className="flex flex-col text-left"><span className="system-text text-[10px] font-black tracking-[0.4em] text-white/90 uppercase font-black tracking-widest leading-none">The Bridge</span><span className="system-text text-[6px] text-accent/60 font-black italic mt-1 leading-none">v{VERSION} // {activeModule}</span></div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowDailyBrief(true)} className="hidden md:flex items-center gap-2 px-4 py-2 border border-accent/20 bg-accent/5 text-accent system-text text-[8px] font-black hover:bg-accent hover:text-black transition-all">🌤 DAILY_BRIEF</button>
            <div onClick={() => !session ? signIn('google') : null} className={`flex items-center gap-3 px-4 py-1 md:py-2 border-2 cursor-pointer group transition-all ${isSystemLinked ? 'border-accent shadow-[0_0_15px_#00d4ff] animate-pulse' : 'border-red-500 bg-red-500/10 animate-pulse'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${isSystemLinked ? 'bg-accent shadow-[0_0_15px_#00d4ff]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`} />
                <div className="flex flex-col text-left uppercase text-white font-bold"><span className="system-text text-[8px] tracking-widest leading-none">{isSystemLinked ? 'Mothership_Stable' : 'Identity_Unlinked'}</span><span className="text-[6px] text-white/20 font-bold mt-0.5 tracking-tighter">{isSystemLinked ? 'SYNC_ACTIVE' : 'SIGN_IN_REQUIRED'}</span></div>
            </div>
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden relative">
          <SideNav onModuleChange={setActiveModule} activeModule={activeModule} isAdmin={isAdmin} />
          <main className="flex-grow overflow-hidden relative">
             <div className="absolute inset-0 p-4 md:p-8 overflow-y-auto scrollbar-thin">
              {activeModule === "BRIDGE" && <div className="module-enter h-full text-white"><Bridge tasks={tasks} notes={notes} messages={messages} onNavigate={(m) => setActiveModule(m as Module)} /></div>}
              {activeModule === "SIGNALS" && <div className="module-enter"><SignalBay onRouteToCorkboard={(s) => setNotes(prev => [...prev, {id: s.id, text: s.content, x: 100, y: 100, rotation: 0, color: 'bg-yellow-200/80'}])} onRouteToTask={(s) => setTasks(prev => [...prev, {id: s.id, title: s.content, priority: 'MED', status: 'TODO', source: 'SIGNAL_BAY'}])} /></div>}
              {activeModule === "PROJECTS" && <div className="module-enter h-full"><ProjectBoard externalTasks={tasks} setTasks={setTasks} /></div>}
              {activeModule === "WINBOARD" && <div className="module-enter h-full"><Winboard externalTasks={tasks} /></div>}
              {activeModule === "CORKBOARD" && <div className="module-enter h-full"><Corkboard externalNotes={notes} setNotes={setNotes} onPromote={(id) => { const n = notes.find(x => x.id === id); if(n) { setTasks(prev => [...prev, {id: n.id, title: n.text, status: 'TODO', priority: 'HIGH', source: 'CORKBOARD'}]); setNotes(prev => prev.filter(x => x.id !== id)); setActiveModule('PROJECTS'); } }} onArchive={(id) => setNotes(prev => prev.filter(x => x.id !== id))} /></div>}
              {activeModule === "QUOTES" && <div className="module-enter"><QuoteBoard externalQuotes={quotes} setQuotes={setQuotes} /></div>}
              {activeModule === "CLOCK_TOWER" && <div className="module-enter h-full"><ClockTower onNavigate={(m) => setActiveModule(m as Module)} /></div>}
              {activeModule === "MIRROR" && <div className="module-enter h-full"><IdentityMirror /></div>}
              {activeModule === "ADMIN" && isAdmin && (
                  <div className="module-enter h-full text-white text-left">
                      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4 uppercase">
                          <div>
                              <h2 className="text-3xl font-black text-accent italic">Tester_Wish_Ledger</h2>
                              <p className="system-text text-[10px] text-white/20 font-black tracking-widest mt-1 uppercase">Sovereign Scaling & Intelligence</p>
                          </div>
                          <div className="text-right">
                              <span className="text-4xl font-black text-accent">1</span>
                              <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Unique_Test_Users</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 text-white">
                          {wishes.map(wish => (
                              <div key={wish.id} className="hud-panel p-6 bg-black/40 border-white/10 relative group text-white">
                                  <div className="flex justify-between items-start mb-4 text-white">
                                      <span className="text-accent font-black text-[10px] tracking-widest uppercase">{wish.user} // SIGNAL</span>
                                      <span className="text-[8px] text-white/20 uppercase">{new Date(wish.timestamp).toLocaleString()}</span>
                                  </div>
                                  <p className="text-lg font-bold italic text-white/90 text-white uppercase">"I wish this app would {wish.text}"</p>
                                  <div className="mt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                                      <button onClick={() => { setTasks(prev => [{id: Date.now().toString(), title: `WISH: ${wish.text}`, status: 'TODO', priority: 'MED', source: wish.user}, ...prev]); setWishes(prev => prev.filter(w => w.id !== wish.id)); }} className="bg-neon-green/10 border border-neon-green/40 px-4 py-2 text-[8px] font-black text-neon-green uppercase">PROMOTE_TO_TASK</button>
                                      <button onClick={() => setWishes(prev => prev.filter(w => w.id !== wish.id))} className="text-red-500/40 text-[8px] font-black uppercase">Archive</button>
                                  </div>
                                  <div className="bracket-tl opacity-20" /><div className="bracket-br opacity-20" />
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              {activeModule === "SETTINGS" && (
                <div className="module-enter h-full overflow-y-auto uppercase flex flex-col items-center py-12 text-left">
                  <div className="w-full max-w-2xl bg-black/40 border border-white/10 p-8 rounded-lg shadow-2xl relative text-white">
                    <h2 className="text-3xl font-black italic text-accent mb-8 tracking-tighter uppercase text-white font-black tracking-widest leading-none">Cognitive_Config</h2>
                    {/* WISH INPUT */}
                    <div className="mb-12 p-6 bg-accent/5 border border-accent/20 rounded text-white">
                        <label className="text-[8px] text-accent font-black block mb-4 uppercase tracking-[0.2em]">Manifest a wish for the system development</label>
                        <div className="flex gap-4">
                            <span className="text-sm font-bold text-white/40 italic flex items-center">I wish this app would...</span>
                            <input id="wishInput" className="flex-grow bg-transparent border-b border-white/20 focus:border-accent outline-none text-white italic uppercase" placeholder="be even faster." onKeyDown={(e) => { if(e.key === 'Enter') { submitWish((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="system-text text-[10px] text-white/40 font-black mb-4 tracking-widest uppercase">Neural Substrate</h3>
                            {[{ l: "OpenAI Key", v: apiKey, sv: setApiKey, k: "tv_api_key", d: "Synthesis" }, { l: "Gemini Key", v: geminiKey, sv: setGeminiKey, k: "tv_gemini_key", d: "Grounding" }].map(field => (
                                <div key={field.l} className="flex flex-col gap-2 group text-white"><label className="text-[8px] text-white/20 font-bold uppercase group-hover:text-accent transition-colors uppercase">{field.l} // {field.d}</label><div className="flex gap-2"><input type="password" value={field.v} onChange={(e) => field.sv(e.target.value)} className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-xs focus:border-accent outline-none font-mono text-white" /><button onClick={() => { localStorage.setItem(field.k, field.v); alert("Stored"); } } className="bg-accent/10 border border-accent/20 px-4 py-2 text-[8px] font-black text-accent hover:bg-accent hover:text-black transition-all uppercase">SET</button></div></div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <h3 className="system-text text-[10px] text-white/40 font-black mb-4 tracking-widest uppercase uppercase text-white text-white">External Nodes</h3>
                            {[{ l: "Tavily Key", v: searchKey, sv: setSearchKey, k: "tv_search_key", d: "Triage" }, { l: "Notion Token", v: notionKey, sv: setNotionKey, k: "tv_notion_key", d: "Knowledge" }].map(field => (
                                <div key={field.l} className="flex flex-col gap-2 group text-white"><label className="text-[8px] text-white/20 font-bold uppercase group-hover:text-accent transition-colors uppercase">{field.l} // {field.d}</label><div className="flex gap-2"><input type="password" value={field.v} onChange={(e) => field.sv(e.target.value)} className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-xs focus:border-accent outline-none font-mono text-white" /><button onClick={() => { localStorage.setItem(field.k, field.v); alert("Stored"); } } className="bg-accent/10 border border-accent/20 px-4 py-2 text-[8px] font-black text-accent hover:bg-accent hover:text-black transition-all uppercase">SET</button></div></div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4 text-left uppercase text-white"><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 border border-red-500/20 text-red-500/40 text-[9px] font-black hover:bg-red-500 hover:text-white transition-all tracking-[0.3em] uppercase">MASTER_OS_RESET</button></div>
                    <div className="bracket-tl" /><div className="bracket-br" />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="h-12 border-t border-white/10 bg-black/95 flex items-center justify-start md:justify-center px-4 overflow-x-auto scrollbar-none gap-1 md:gap-2 shrink-0 z-50 text-white">
              {[
                { id: "BRIDGE", label: "BRIDGE" }, { id: "SIGNALS", label: "SIGNALS" }, { id: "PROJECTS", label: "PROJECTS" }, { id: "WINBOARD", label: "WINBOARD" }, { id: "CORKBOARD", label: "CORKBOARD" }, { id: "QUOTES", label: "QUOTES" }, { id: "READY_ROOM", label: "READY ROOM" }, { id: "CLOCK_TOWER", label: "CLOCK TOWER" }, { id: "SETTINGS", label: "CONFIG" },
                ...(isAdmin ? [{ id: "ADMIN", label: "WISHES" }] : [])
              ].map(item => (
                <div key={item.id} className="relative group text-white">
                    <button
                        onClick={() => setActiveModule(item.id as Module)}
                        className={`nav-parallelogram px-6 py-1.5 system-text text-[8px] font-black transition-all border relative overflow-hidden uppercase text-white ${activeModule === item.id ? 'text-white border-accent nav-active-pulse' : 'text-white/20 border-white/10 hover:border-white/40 hover:text-white/60'}`}
                    >
                        <span className="nav-text-fix relative z-10 block whitespace-nowrap uppercase text-white">{item.label}</span>
                    </button>
                </div>
              ))}
        </footer>
      </div>
    </div>
  );
}
