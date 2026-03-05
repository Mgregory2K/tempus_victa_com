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

// SHARED VOICE COMPONENT WITH VISUAL FREQUENCY MONITOR
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
            alert("Neural Voice Ingestion not supported in this browser.");
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
                        <div
                            key={i}
                            className="w-[3px] bg-accent shadow-[0_0_8px_var(--accent)] rounded-full transition-all duration-75"
                            style={{ height: `${Math.max(15, (val / 255) * 100)}%` }}
                        />
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
        <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--accent)]" />
            <p className="system-text text-accent animate-pulse tracking-[0.4em]">INITIALIZING NEURAL LINK...</p>
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

  // SHARED SOVEREIGN STATE
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

  // Auto-scroll chat
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
    const stardate = `STARDATE_${timestamp.replace(/[-:T]/g, '').slice(0, 12)}`;

    if (action.type === 'MANIFEST_TASK') {
        const newTask = { id: Date.now().toString(), title: action.payload.title, priority: 'HIGH', status: 'TODO', source: 'READY_ROOM' };
        setTasks(prev => [newTask, ...prev]);
        logEvent('ACTION_CREATED', { ...newTask, stardate });
    } else if (action.type === 'CRYSTALLIZE_QUOTE') {
        const newQuote = { id: Date.now().toString(), text: action.payload.text, author: "Michael", timestamp: new Date().toLocaleDateString(), context: stardate };
        setQuotes(prev => [newQuote, ...prev]);
        logEvent('QUOTE_CAPTURED', newQuote, 'QUOTES');
    }

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isManifested: true } : m));

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-32 right-12 bg-neon-green text-black px-6 py-2 system-text text-[10px] font-black z-[3000] animate-bounce uppercase shadow-[0_0_20px_#22c55e] border-2 border-black';
    toast.innerText = `${action.label.toUpperCase()} SUCCESSFUL // ${stardate}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
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
    logEvent('SIGNAL_INPUT', { text });

    const currentHistory = [...messages, userMsg];
    if (!overrideInput) setInput("");
    setIsTyping(true);

    try {
      const response = await fetch('/api/ready-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          searchKey, apiKey, geminiKey,
          history: currentHistory.slice(-15),
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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Neural pipeline failure. Verification required.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const terminateProtocol = () => {
    setMatrixMessage("TERMINATING");
    setIsMatrixActive(true);
    logEvent('PROTOCOL_TERMINATED', { topic: trrpParams.topic });
    setTimeout(() => {
      setIsMatrixActive(false);
      setIsProtocolActive(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: 'Ready Room Protocol Terminated. Simulation collapsed.', timestamp: new Date().toISOString(), layer: 'LOCAL' }]);
    }, 3000);
  };

  const startTRRP = () => {
    if (!trrpParams.members || !trrpParams.topic) return;
    setShowTrrpModal(false);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: `Invoke Ready Room Protocol: ${trrpParams.topic}`, timestamp: new Date().toISOString() }]);
    setMatrixPending(true);
  };

  const confirmTRRP = () => {
    setMatrixPending(false);
    setMatrixMessage("VIRTUALIZING");
    setIsMatrixActive(true);
    logEvent('PROTOCOL_INVOKED', { params: trrpParams });
    setTimeout(() => {
      setIsMatrixActive(false);
      setIsProtocolActive(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `**PROTOCOL ACTIVE**\nTopic: ${trrpParams.topic}\nEnvironment stable. Anti-puppeteering locks engaged.`, timestamp: new Date().toISOString(), layer: "NEURAL_PROTOCOL" }]);
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
    if (savedHistory) try { setMessages(JSON.parse(savedHistory)); } catch (e) {
        console.error("Failed to parse history", e);
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("tv_chat_history", JSON.stringify(messages));
  }, [messages, hasMounted]);

  if (!hasMounted) return null;

  const isSystemLinked = isOnline && status === 'authenticated';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white p-2 selection:bg-accent/30 font-sans uppercase">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_70%)] opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] bg-accent/5 rounded-full blur-[200px] neural-pulse" />
        <div className="scanline" />
      </div>

      <div className="relative z-10 h-full w-full flex flex-col hud-panel border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md">
        <header className="h-16 border-b border-white/10 bg-black/80 flex items-center justify-between px-10 shrink-0 relative">
          <div className="flex items-center gap-8 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
             <div className="h-12 w-12 border-2 border-accent/40 bg-black flex items-center justify-center relative shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                <span className="system-text text-3xl font-black text-accent">T</span>
                <div className="bracket-tl" /><div className="bracket-br" />
             </div>
             <div className="flex flex-col text-left">
                <span className="system-text text-[13px] font-black tracking-[0.6em] text-white/90">Tempus Victa</span>
                <span className="system-text text-[8px] text-accent/60 font-black italic">{assistantName} ACTIVE</span>
             </div>
          </div>

          <div className="hidden lg:flex items-center gap-16">
             <div className="flex flex-col items-center border-l border-white/5 pl-16">
                <span className="system-text text-[8px] text-white/30 font-black tracking-widest uppercase italic">Neural Load</span>
                <div className="flex gap-1 items-end h-4">
                   {[1,2,3,4,5,6,5,4,3,2,1].map((h, i) => (
                     <div key={i} className={`w-1 rounded-t-sm transition-all duration-700 ${isSystemLinked ? 'bg-accent shadow-[0_0_5px_var(--accent)]' : 'bg-white/10'}`} style={{ height: isSystemLinked ? `${h*16}%` : '2px' }} />
                   ))}
                </div>
             </div>
          </div>

          <div
            onClick={() => !session ? signIn('google') : null}
            className={`flex items-center gap-6 px-8 py-2 border-2 cursor-pointer group transition-all ${isSystemLinked ? 'border-neon-green/40 bg-neon-green/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-red-500 bg-red-500/10 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}
          >
             <div className={`h-2.5 w-2.5 rounded-full ${isSystemLinked ? 'bg-neon-green shadow-[0_0_15px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`} />
             <div className="flex flex-col">
                <span className="system-text text-[10px] text-white font-black italic tracking-widest">{isSystemLinked ? 'LINKED' : (isOnline ? 'UNAUTHENTICATED' : 'OFFLINE')}</span>
                <span className="text-[6px] text-white/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase">{session ? `ID: ${session.user?.email}` : 'HANDSHAKE_REQUIRED_NOW'}</span>
             </div>
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden relative">
          <SideNav onModuleChange={setActiveModule} activeModule={activeModule} />
          <main className="flex-grow overflow-hidden relative">
             <div className="absolute inset-0 p-8 overflow-y-auto scrollbar-thin">
              {activeModule === "BRIDGE" && <div className="module-enter"><Bridge /></div>}
              {activeModule === "SIGNALS" && <div className="module-enter"><SignalBay /></div>}
              {activeModule === "PROJECTS" && <div className="module-enter h-full"><ProjectBoard externalTasks={tasks} setTasks={setTasks} /></div>}
              {activeModule === "WINBOARD" && <div className="module-enter h-full"><Winboard externalTasks={tasks} /></div>}
              {activeModule === "MISSIONS" && <div className="module-enter"><WorkoutTracker /></div>}
              {activeModule === "TODO" && <div className="module-enter"><SovereignTodo /></div>}
              {activeModule === "LISTS" && <div className="module-enter"><GroceryList /></div>}
              {activeModule === "CORKBOARD" && (
                <div className="module-enter h-full">
                    <Corkboard
                        externalNotes={notes}
                        setNotes={setNotes}
                        onPromote={handlePromoteNote}
                        onArchive={handleArchiveNote}
                    />
                </div>
              )}
              {activeModule === "QUOTES" && <div className="module-enter"><QuoteBoard externalQuotes={quotes} setQuotes={setQuotes} /></div>}
              {activeModule === "CLOCK_TOWER" && <div className="module-enter h-full"><ClockTower onNavigate={(m) => setActiveModule(m as Module)} /></div>}
              {activeModule === "MIRROR" && <div className="module-enter h-full"><IdentityMirror /></div>}
              {activeModule === "READY_ROOM" && (
                <div className={`module-enter flex flex-col h-full w-full`}>
                  {isMatrixActive && (
                    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
                      <div className="matrix-container">
                        {Array.from({ length: 100 }).map((_, i) => (
                          <div key={i} className="matrix-column" style={{ animationDuration: `${Math.random()*3+2}s`, left: `${i}%`, fontSize: '14px' }}>
                            {Array.from({ length: 40 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('\n')}
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center z-[2001] bg-black/40 text-center">
                        <span className="system-text text-4xl font-black text-neon-green animate-pulse tracking-[1em]">{matrixMessage}</span>
                      </div>
                    </div>
                  )}
                  {showTrrpModal && (
                    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 uppercase">
                      <div className="hud-panel max-w-3xl w-full p-8 border-accent/40 shadow-[0_0_100px_rgba(0,212,255,0.25)]">
                        <h3 className="system-text text-xl font-black text-accent mb-8 italic">Protocol_Matrix.v2</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left uppercase">
                          <div className="space-y-6">
                            <label className="text-[8px] text-white/40 font-bold tracking-[0.2em] block">Members</label>
                            <input value={trrpParams.members} onChange={e => setTrrpParams({...trrpParams, members: e.target.value})} placeholder="Steve Jobs, Marcus Aurelius..." className="bg-white/5 border border-white/10 p-3 w-full text-sm font-mono text-white" />
                            <label className="text-[8px] text-white/40 font-bold tracking-[0.2em] block">Topic</label>
                            <textarea rows={4} value={trrpParams.topic} onChange={e => setTrrpParams({...trrpParams, topic: e.target.value})} className="bg-white/5 border border-white/10 p-3 w-full text-sm font-mono text-white resize-none" />
                          </div>
                          <div className="space-y-6">
                            <label className="text-[8px] text-white/40 font-bold tracking-[0.2em] block">Format</label>
                            <select value={trrpParams.format} onChange={e => setTrrpParams({...trrpParams, format: e.target.value})} className="bg-white/5 border border-white/10 p-3 w-full text-sm text-white"><option>Round Robin</option><option>Socratic</option></select>
                            <label className="text-[8px] text-white/40 font-bold tracking-[0.2em] block">Tone</label>
                            <input value={trrpParams.tone} onChange={e => setTrrpParams({...trrpParams, tone: e.target.value})} className="bg-white/5 border border-white/10 p-3 w-full text-sm text-white" />
                          </div>
                        </div>
                        <div className="mt-12 flex gap-4">
                          <button onClick={startTRRP} className="flex-grow bg-accent py-4 text-xs font-black hover:bg-white hover:text-black transition-all tracking-[0.2em]">GENERATE SIMULATION</button>
                          <button onClick={() => setShowTrrpModal(false)} className="px-10 border border-white/10 text-[9px] text-white/40 hover:text-white transition-all">CANCEL</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4 px-2">
                     <div className="text-left text-nowrap flex items-center gap-4">
                        <h2 className={`text-3xl font-black italic transition-colors ${isProtocolActive ? 'text-neon-green' : 'text-white'}`}>{isProtocolActive ? 'PROTOCOL_ACTIVE' : 'READY ROOM'}</h2>
                        <p className={`system-text text-[8px] tracking-[0.2em] font-black uppercase ${isProtocolActive ? 'text-neon-green animate-pulse' : 'text-accent'}`}>STATUS: {isProtocolActive ? 'SIMULATION_LAYER' : (apiKey ? 'ONLINE' : 'LOCAL')}</p>
                     </div>
                     <div className="flex gap-2">
                        {!isProtocolActive && <button onClick={() => setShowTrrpModal(true)} className="glass px-4 py-1.5 text-[9px] font-black text-neon-green border-neon-green/30 tracking-widest">PROTOCOL</button>}
                        {isProtocolActive && <button onClick={terminateProtocol} className="glass px-4 py-1.5 text-[9px] font-black text-red-500 border-red-500/30 tracking-widest">END SIM</button>}
                     </div>
                  </div>
                  <div className={`flex-grow hud-panel flex flex-col overflow-hidden relative shadow-2xl transition-colors duration-1000 ${isProtocolActive ? 'bg-black/80 border-neon-green/20' : 'bg-black/60 border-white/10'}`}>
                     <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto font-sans text-sm space-y-8 scrollbar-thin bg-black/20">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-4">
                                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="system-text text-[10px] font-black tracking-[0.5em]">WAITING_FOR_SIGNAL</p>
                            </div>
                        )}
                        {messages.map((m) => (
                          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-full animate-slide-up mb-6`}>
                            <div className="flex items-center gap-2 mb-2">
                               {m.layer && <span className={`text-[7px] font-black border px-1.5 py-0.5 rounded-sm ${m.layer === 'LOCAL' ? 'border-white/20 text-white/40' : m.layer.includes('PROTOCOL') ? 'border-neon-green/40 text-neon-green/60' : 'border-accent/40 text-accent/60'}`}>{m.layer}</span>}
                               <span className={`system-text text-[8px] tracking-[0.1em] font-black ${m.role === 'user' ? 'text-white/20' : 'text-accent'}`}>{m.role === 'user' ? (session?.user?.name?.split(' ')[0] || 'MICHAEL') : assistantName.toUpperCase()}</span>
                            </div>
                            <div className={`max-w-[95%] p-4 border shadow-xl relative group ${m.role === 'user' ? 'glass-accent border-accent/20 rounded-2xl rounded-tr-sm text-right' : 'glass border-white/10 rounded-2xl rounded-tl-sm text-left bg-white/[0.01]'}`}>
                                <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-[14px] font-light">{m.content}</p>

                                {m.role !== 'user' && !m.layer?.includes('PROTOCOL') && (
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleFeedback(m.id, 'UP')} className={`p-1 rounded hover:bg-white/10 transition-colors ${m.feedback === 'UP' ? 'text-neon-green' : 'text-white/20'}`}>
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 9.2a2 2 0 00-.8 1.133z" /></svg>
                                        </button>
                                        <button onClick={() => handleFeedback(m.id, 'DOWN')} className={`p-1 rounded hover:bg-white/10 transition-colors ${m.feedback === 'DOWN' ? 'text-red-500' : 'text-white/20'}`}>
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a2 2 0 00.8-1.134z" /></svg>
                                        </button>
                                    </div>
                                )}

                                {m.suggestedActions && !m.isManifested && (
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {m.suggestedActions.map((action, idx) => (
                                            <button key={idx} onClick={() => handleManifestAction(m.id, action)} className="bg-neon-green/10 border border-neon-green/40 px-4 py-2 text-[9px] font-black text-neon-green hover:bg-neon-green hover:text-black transition-all tracking-widest uppercase">MANIFEST {action.label}</button>
                                        ))}
                                    </div>
                                )}
                                {m.isManifested && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-1 w-1 bg-neon-green rounded-full shadow-[0_0_5px_#22c55e]" />
                                        <span className="text-[8px] text-neon-green font-black uppercase tracking-tighter">Manifested to Sovereign Ledger</span>
                                    </div>
                                )}
                            </div>
                          </div>
                        ))}
                        {matrixPending && (
                          <div className="flex flex-col items-center justify-center p-12 border border-neon-green/30 bg-neon-green/5 mx-auto max-w-xl animate-pulse shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                             <span className="system-text text-[12px] mb-8 text-neon-green font-black tracking-[0.4em]">NEURAL PROFILE MAPPING COMPLETE</span>
                             <div className="flex gap-4 w-full"><button onClick={confirmTRRP} className="flex-grow bg-neon-green/20 border border-neon-green/50 py-4 text-neon-green font-black text-[11px] hover:bg-neon-green hover:text-black transition-all tracking-[0.2em] uppercase">PROCEED TO SIMULATION</button></div>
                          </div>
                        )}
                        {isTyping && <div className="flex flex-col items-start animate-pulse"><div className="p-4 glass border-white/10 h-10 w-24 flex items-center gap-2 rounded-2xl rounded-tl-sm"><div className="h-1.5 w-1.5 rounded-full animate-bounce bg-accent" /><div className="h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:0.2s] bg-accent" /><div className="h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:0.4s] bg-accent" /></div></div>}
                     </div>
                     <div className="p-4 bg-black/80 border-t border-white/10 flex flex-col gap-2 shrink-0 uppercase">
                        <div className="flex gap-4 items-center">
                          <VoiceButton onTranscript={(text) => handleSend(text)} isTyping={isTyping} />
                          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={`Signal ${assistantName}...`} className="flex-grow bg-transparent border-b border-white/10 px-4 py-3 text-[18px] focus:outline-none focus:border-accent/50 font-mono text-white" />

                          <button
                            onClick={() => setAiEnhanced(!aiEnhanced)}
                            className={`px-4 py-2 border transition-all system-text text-[9px] font-black ${aiEnhanced ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_var(--accent)]' : 'border-white/10 text-white/20'}`}
                          >
                            AI_{aiEnhanced ? 'ACTIVE' : 'STANDBY'}
                          </button>

                          <button onClick={() => handleSend()} disabled={isTyping} className="bg-accent px-10 py-3 system-text text-[11px] font-black hover:bg-white hover:text-black transition-colors uppercase tracking-widest">Engage</button>
                        </div>
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "DOCTRINE" && (
                <div className="module-enter h-full overflow-y-auto pr-2 scrollbar-thin uppercase">
                  <div className="flex flex-col items-center text-center p-12 max-w-7xl mx-auto uppercase">
                     <h2 className="text-5xl font-black italic tracking-tighter mb-8 text-white">THE DOCTRINE</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                        {[{ t: "LOCAL", d: "Sovereign knowledge. Foundation.", s: "ACTIVE" }, { t: "INTERNET", d: "Live validation.", s: isOnline ? "STABLE" : "OFFLINE" }, { t: "AI", d: "Opt-in substrate.", s: apiKey ? "ACTIVE" : "STANDBY" }].map(d => (
                          <div key={d.t} className="hud-panel p-8 flex flex-col gap-4 bg-black/60 shadow-2xl relative border-white/5"><span className="system-text text-xl font-black italic text-white tracking-tighter">{d.t}</span><p className="text-[13px] text-white/50 font-light leading-relaxed">{d.d}</p></div>
                        ))}
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "SETTINGS" && (
                <div className="module-enter h-full overflow-y-auto pr-2 scrollbar-thin text-left uppercase">
                  <div className="flex flex-col max-w-3xl mx-auto py-12 w-full uppercase">
                     <h2 className="text-4xl font-black italic tracking-tighter mb-10 text-white uppercase italic">CONFIG</h2>
                     <div className="space-y-12 uppercase">
                        {[{ l: "Neural Key (OpenAI)", v: apiKey, sv: setApiKey, k: "tv_api_key" }, { l: "Search Key (Tavily)", v: searchKey, sv: setSearchKey, k: "tv_search_key" }, { l: "Gemini API Key", v: geminiKey, sv: setGeminiKey, k: "tv_gemini_key" }, { l: "Notion API Key", v: notionKey, sv: setNotionKey, k: "tv_notion_key" }].map(field => (
                          <div key={field.l} className="flex flex-col gap-4">
                            <label className="system-text text-[10px] text-white/50 font-black tracking-widest uppercase">{field.l}</label>
                            <div className="flex gap-4"><input type="password" value={field.v} onChange={(e) => field.sv(e.target.value)} className="flex-grow hud-panel bg-black/60 border-white/10 px-4 py-3 text-sm font-mono text-white shadow-inner uppercase" /><button onClick={() => { localStorage.setItem(field.k, field.v); alert("Stored"); } } className="bg-accent px-10 py-2 system-text text-[10px] font-black hover:bg-white hover:text-black uppercase">Store</button></div>
                          </div>
                        ))}
                        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 border border-red-500/30 text-red-500/50 system-text text-[9px] font-black hover:bg-red-500 hover:text-white transition-all uppercase">Master Reset</button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="h-10 border-t border-white/10 bg-black/95 flex items-center justify-center gap-6 px-10 shrink-0 z-50 uppercase shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
           <div className="flex items-center gap-1 bg-white/[0.01] border border-white/10 p-1 h-7 uppercase">
              {[
                { id: "BRIDGE", label: "TODAY" }, { id: "SIGNALS", label: "SIGNALS" }, { id: "PROJECTS", label: "PROJECTS" }, { id: "WINBOARD", label: "WINBOARD" }, { id: "LISTS", label: "LISTS" }, { id: "CORKBOARD", label: "CORKBOARD" }, { id: "QUOTES", label: "QUOTES" }, { id: "MIRROR", label: "THE MIRROR" }, { id: "CLOCK_TOWER", label: "CLOCK TOWER" }, { id: "READY_ROOM", label: "READY ROOM" }, { id: "SETTINGS", label: "CONFIG" }
              ].map(item => (
                <button key={item.id} onClick={() => setActiveModule(item.id as Module)} className={`px-6 system-text text-[9px] font-black transition-all relative min-w-[100px] h-full ${activeModule === item.id ? 'text-white bg-accent/20' : 'text-white/20 hover:text-white/60 uppercase'}`}>
                  <span className="relative z-10 italic uppercase">{item.label}</span>
                  {activeModule === item.id && <div className="absolute bottom-0 left-0 h-0.5 w-full bg-accent shadow-[0_-5px_40px_rgba(0,212,255,1)] uppercase" />}
                </button>
              ))}
           </div>
        </footer>
      </div>
    </div>
  );
}
