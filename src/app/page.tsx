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
import { useSession, signIn } from "next-auth/react";
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";
import { createEvent } from "@/core/twin_plus/twin_event";

type Module = "BRIDGE" | "READY_ROOM" | "DOCTRINE" | "SETTINGS" | "MISSIONS" | "REVIEW" | "SIGNALS" | "CORKBOARD" | "QUOTES" | "WINBOARD" | "PROJECTS" | "LISTS" | "TODO" | "CLOCK_TOWER" | "MIRROR";

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

interface TRRPParams {
  moderator: string;
  members: string;
  format: string;
  sentences: string;
  purpose: string;
  rules: string;
  tone: string;
  voting: string;
  termination: string;
  topic: string;
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
        e.preventDefault();
        e.stopPropagation();

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Neural Voice Ingestion not supported.");
            return;
        }

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
        } catch (err) {
            console.error("Mic Access Denied", err);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {isListening && (
                <div className="flex gap-[2px] items-center h-4">
                    {Array.from(audioData).slice(0, 8).map((val, i) => (
                        <div key={i} className="w-[3px] bg-accent shadow-[0_0_8px_var(--accent)] rounded-full transition-all duration-75" style={{ height: `${Math.max(15, (val / 255) * 100)}%` }} />
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={startListening}
                disabled={isTyping}
                className={`rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'text-white/20 hover:text-accent'} ${size === "sm" ? "p-1" : "p-2"}`}
            >
                <svg className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
        </div>
    );
};

export default function Home() {
  const { status } = useSession();
  const [isKernelReady, setIsKernelReady] = useState(false);

  useEffect(() => {
    async function start() {
        try {
            await twinPlusKernel.init();
            setIsKernelReady(true);
        } catch (e) {
            console.error("Kernel Init Failed", e);
        }
    }
    start();
  }, []);

  if (status === "loading" || !isKernelReady) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--accent)]" />
            <p className="system-text text-accent animate-pulse tracking-[0.4em] text-xs">INITIALIZING NEURAL LINK...</p>
            <span className="text-[8px] text-white/20 font-black uppercase tracking-widest italic">{!isKernelReady ? 'Mounting_Twin+_Kernel...' : 'Syncing_Sovereign_Identity...'}</span>
        </div>
      </div>
    );
  }

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

  // SOVEREIGN STATE
  const [tasks, setTasks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', text: 'Structure Volume IV: Trust Mathematics needs a deeper dive into decay constants.', x: 50, y: 80, rotation: -2, color: 'bg-yellow-200/80' },
    { id: '2', text: 'Remember to check the local-first benchmark for the Lexicon engine.', x: 400, y: 120, rotation: 3, color: 'bg-blue-200/80' },
  ]);

  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isProtocolActive, setIsProtocolActive] = useState(false);
  const [showTrrpModal, setShowTrrpModal] = useState(false);
  const [matrixPending, setMatrixPending] = useState(false);
  const [matrixMessage, setMatrixMessage] = useState("INITIATING");

  const [hasMounted, setHasMounted] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);

  const [trrpParams, setTrrpParams] = useState<TRRPParams>({
    moderator: "James Carvell",
    members: "",
    format: "Continuous Round Robin",
    sentences: "4",
    purpose: "Critique strengths and weaknesses",
    rules: "Equal time. No repetition. Build on prior remarks.",
    tone: "Direct but constructive",
    voting: "No",
    termination: "Manual",
    topic: ""
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const logEvent = (type: any, payload: any, surface: string = activeModule) => {
    twinPlusKernel.observe(createEvent(type, payload, surface));
  };

  const handleFeedback = (id: string, type: "UP" | "DOWN") => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: type } : m));
    logEvent('SYNTHESIS_FEEDBACK', { messageId: id, feedback: type });
  };

  const handlePromoteNote = (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) return;
      const newTask = { id: Date.now().toString(), title: note.text, priority: 'HIGH', status: 'TODO', source: 'CORKBOARD' };
      setTasks(prev => [newTask, ...prev]);
      setNotes(prev => prev.filter(n => n.id !== id));
      logEvent('NOTE_PROMOTED', { noteId: id, taskId: newTask.id });
      setActiveModule('PROJECTS');
  };

  const handleArchiveNote = (id: string) => {
      setNotes(prev => prev.filter(n => n.id !== id));
      logEvent('NOTE_ARCHIVED', { noteId: id });
  };

  const handleManifestAction = (messageId: string, action: SuggestedAction) => {
    const timestamp = new Date().toISOString();
    if (action.type === 'MANIFEST_TASK') {
        const newTask = { id: Date.now().toString(), title: action.payload.title, priority: 'HIGH', status: 'TODO', source: 'READY_ROOM' };
        setTasks(prev => [newTask, ...prev]);
        logEvent('ACTION_CREATED', { ...newTask });
    } else if (action.type === 'CRYSTALLIZE_QUOTE') {
        const newQuote = { id: Date.now().toString(), text: action.payload.text, author: "Michael", timestamp: new Date().toLocaleDateString() };
        setQuotes(prev => [newQuote, ...prev]);
        logEvent('QUOTE_CAPTURED', newQuote, 'QUOTES');
    }
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isManifested: true } : m));
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isTyping) return;
    if (text.toLowerCase() === 'end protocol' && isProtocolActive) {
      terminateProtocol();
      setInput("");
      return;
    }
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
          searchKey, apiKey, geminiKey,
          history: messages.slice(-10),
          assistantName,
          protocolParams: isProtocolActive ? trrpParams : null,
          aiEnhanced: aiEnhanced || isProtocolActive
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: data.role,
          content: data.content,
          layer: data.sourceLayer,
          timestamp: new Date().toISOString(),
          suggestedActions: data.suggestedActions
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Neural failure.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const terminateProtocol = () => {
    setMatrixMessage("TERMINATING");
    setIsMatrixActive(true);
    setTimeout(() => {
      setIsMatrixActive(false);
      setIsProtocolActive(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: 'Simulation collapsed.', timestamp: new Date().toISOString(), layer: 'LOCAL' }]);
    }, 3000);
  };

  const startTRRP = () => {
    if (!trrpParams.members || !trrpParams.topic) return;
    setShowTrrpModal(false);
    setMatrixPending(true);
  };

  const confirmTRRP = () => {
    setMatrixPending(false);
    setMatrixMessage("VIRTUALIZING");
    setIsMatrixActive(true);
    setTimeout(() => {
      setIsMatrixActive(false);
      setIsProtocolActive(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `**PROTOCOL ACTIVE**`, timestamp: new Date().toISOString(), layer: "NEURAL_PROTOCOL" }]);
    }, 4000);
  };

  useEffect(() => {
    setHasMounted(true);
    setIsOnline(navigator.onLine);
    const savedKey = localStorage.getItem("tv_api_key"); if (savedKey) setApiKey(savedKey);
    const savedSearch = localStorage.getItem("tv_search_key"); if (savedSearch) setSearchKey(savedSearch);
    const savedGemini = localStorage.getItem("tv_gemini_key"); if (savedGemini) setGeminiKey(savedGemini);
    const savedNotion = localStorage.getItem("tv_notion_key"); if (savedNotion) setNotionKey(savedNotion);
    const savedName = localStorage.getItem("tv_assistant_name"); if (savedName) setAssistantName(savedName);
    const savedHistory = localStorage.getItem("tv_chat_history");
    if (savedHistory) try { setMessages(JSON.parse(savedHistory)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("tv_chat_history", JSON.stringify(messages));
  }, [messages, hasMounted]);

  if (!hasMounted) return null;

  const isSystemLinked = isOnline && status === 'authenticated';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white p-1 md:p-2 selection:bg-accent/30 font-sans uppercase">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_70%)] opacity-60" />
        <div className="scanline" />
      </div>

      <div className="relative z-10 h-full w-full flex flex-col hud-panel border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md rounded-none md:rounded-lg">
        <header className="h-14 md:h-16 border-b border-white/10 bg-black/80 flex items-center justify-between px-4 md:px-10 shrink-0 relative">
          <div className="flex items-center gap-3 md:gap-8 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
             <div className="h-10 w-10 md:h-12 md:w-12 border-2 border-accent/40 bg-black flex items-center justify-center relative shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                <span className="system-text text-xl md:text-3xl font-black text-accent">T</span>
                <div className="bracket-tl" /><div className="bracket-br" />
             </div>
             <div className="flex flex-col text-left">
                <span className="system-text text-[10px] md:text-[13px] font-black tracking-[0.4em] md:tracking-[0.6em] text-white/90">Tempus Victa</span>
                <span className="system-text text-[6px] md:text-[8px] text-accent/60 font-black italic">{activeModule} // {assistantName}</span>
             </div>
          </div>

          <div
            onClick={() => !session ? signIn('google') : null}
            className={`flex items-center gap-3 md:gap-6 px-4 md:px-8 py-1 md:py-2 border-2 cursor-pointer group transition-all ${isSystemLinked ? 'border-neon-green/40 bg-neon-green/5' : 'border-red-500 bg-red-500/10 animate-pulse'}`}
          >
             <div className={`h-2 w-2 rounded-full ${isSystemLinked ? 'bg-neon-green shadow-[0_0_15px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`} />
             <span className="system-text text-[8px] md:text-[10px] text-white font-black italic tracking-widest">{isSystemLinked ? 'LINKED' : 'UNLINKED'}</span>
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden relative">
          <SideNav onModuleChange={setActiveModule} activeModule={activeModule} />
          <main className="flex-grow overflow-hidden relative">
             <div className="absolute inset-0 p-4 md:p-8 overflow-y-auto scrollbar-thin">
              {activeModule === "BRIDGE" && <div className="module-enter"><Bridge /></div>}
              {activeModule === "SIGNALS" && <div className="module-enter"><SignalBay onRouteToCorkboard={(s) => setNotes(prev => [...prev, {id: s.id, text: s.content, x: 100, y: 100, rotation: 0, color: 'bg-yellow-200/80'}])} onRouteToTask={(s) => setTasks(prev => [...prev, {id: s.id, title: s.content, priority: 'MED', status: 'TODO', source: 'SIGNAL_BAY'}])} /></div>}
              {activeModule === "PROJECTS" && <div className="module-enter h-full"><ProjectBoard externalTasks={tasks} setTasks={setTasks} /></div>}
              {activeModule === "WINBOARD" && <div className="module-enter h-full"><Winboard externalTasks={tasks} /></div>}
              {activeModule === "CORKBOARD" && <div className="module-enter h-full"><Corkboard externalNotes={notes} setNotes={setNotes} onPromote={handlePromoteNote} onArchive={handleArchiveNote} /></div>}
              {activeModule === "QUOTES" && <div className="module-enter"><QuoteBoard externalQuotes={quotes} setQuotes={setQuotes} /></div>}
              {activeModule === "CLOCK_TOWER" && <div className="module-enter h-full"><ClockTower onNavigate={(m) => setActiveModule(m as Module)} /></div>}
              {activeModule === "MIRROR" && <div className="module-enter h-full"><IdentityMirror /></div>}
              {activeModule === "READY_ROOM" && (
                <div className="module-enter flex flex-col h-full w-full">
                  {/* Ready Room Chat Logic - Mobile Friendly UI */}
                  <div className={`flex-grow hud-panel flex flex-col overflow-hidden relative shadow-2xl transition-colors duration-1000 ${isProtocolActive ? 'bg-black/80 border-neon-green/20' : 'bg-black/60 border-white/10'}`}>
                     <div ref={scrollRef} className="flex-grow p-4 md:p-6 overflow-y-auto font-sans text-sm space-y-6 scrollbar-thin bg-black/20">
                        {messages.map((m) => (
                          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-full animate-slide-up`}>
                            <div className="flex items-center gap-2 mb-1">
                               <span className={`system-text text-[7px] font-black ${m.role === 'user' ? 'text-white/20' : 'text-accent'}`}>{m.role === 'user' ? 'USER' : assistantName}</span>
                            </div>
                            <div className={`max-w-[95%] p-3 border shadow-xl relative ${m.role === 'user' ? 'glass-accent border-accent/20 rounded-xl rounded-tr-sm' : 'glass border-white/10 rounded-xl rounded-tl-sm'}`}>
                                <p className="text-white/90 text-sm font-light leading-relaxed">{m.content}</p>
                                {m.role !== 'user' && (
                                    <div className="mt-2 flex gap-2">
                                        <button onClick={() => handleFeedback(m.id, 'UP')} className={`text-[8px] ${m.feedback === 'UP' ? 'text-neon-green' : 'text-white/20'}`}>GOOD</button>
                                        <button onClick={() => handleFeedback(m.id, 'DOWN')} className={`text-[8px] ${m.feedback === 'DOWN' ? 'text-red-500' : 'text-white/20'}`}>BAD</button>
                                    </div>
                                )}
                            </div>
                          </div>
                        ))}
                     </div>
                     <div className="p-3 bg-black/80 border-t border-white/10 flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <VoiceButton onTranscript={(text) => handleSend(text)} isTyping={isTyping} />
                          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="SIGNAL..." className="flex-grow bg-transparent border-b border-white/10 px-2 py-2 text-md focus:outline-none font-mono text-white" />
                          <button onClick={() => handleSend()} className="bg-accent px-4 py-2 system-text text-[9px] font-black tracking-widest">ENGAGE</button>
                        </div>
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "SETTINGS" && (
                <div className="module-enter h-full overflow-y-auto">
                  <div className="space-y-8 p-4">
                    <h2 className="text-2xl font-black italic">CONFIG</h2>
                    {[{ l: "Neural Key", v: apiKey, sv: setApiKey, k: "tv_api_key" }, { l: "Search Key", v: searchKey, sv: setSearchKey, k: "tv_search_key" }].map(field => (
                      <div key={field.l} className="flex flex-col gap-2">
                        <label className="text-[8px] text-white/40 font-bold uppercase">{field.l}</label>
                        <div className="flex gap-2"><input type="password" value={field.v} onChange={(e) => field.sv(e.target.value)} className="flex-grow bg-white/5 border border-white/10 px-3 py-2 text-xs" /><button onClick={() => { localStorage.setItem(field.k, field.v); alert("Stored"); } } className="bg-accent px-4 py-2 text-[8px] font-black">STORE</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="h-12 border-t border-white/10 bg-black/95 flex items-center justify-start md:justify-center px-4 overflow-x-auto scrollbar-none gap-2 shrink-0 z-50">
              {[
                { id: "BRIDGE", label: "TODAY" }, { id: "SIGNALS", label: "SIGN" }, { id: "PROJECTS", label: "PROJ" }, { id: "WINBOARD", label: "WINS" }, { id: "CORKBOARD", label: "CORK" }, { id: "READY_ROOM", label: "READY" }, { id: "SETTINGS", label: "CFG" }
              ].map(item => (
                <button key={item.id} onClick={() => setActiveModule(item.id as Module)} className={`px-4 py-1 system-text text-[8px] font-black transition-all border whitespace-nowrap ${activeModule === item.id ? 'text-white bg-accent/20 border-accent' : 'text-white/20 border-transparent'}`}>
                  {item.label}
                </button>
              ))}
        </footer>
      </div>
    </div>
  );
}
