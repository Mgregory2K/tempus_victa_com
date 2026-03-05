"use client";

import { useState, useEffect, useRef } from "react";
import Bridge from "@/components/bridge";
import SideNav from "@/components/SideNav";
import WorkoutTracker from "@/components/WorkoutTracker";
import ReviewScreen from "@/components/ReviewScreen";
import SignalBay from "@/components/SignalBay";
import Corkboard from "@/components/Corkboard";
import QuoteBoard from "@/components/QuoteBoard";
import { useSession } from "next-auth/react";
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";
import { createEvent } from "@/core/twin_plus/twin_event";

type Module = "BRIDGE" | "READY_ROOM" | "DOCTRINE" | "SETTINGS" | "MISSIONS" | "REVIEW" | "SIGNALS" | "CORKBOARD" | "QUOTES";

interface Message {
  role: string;
  content: string;
  layer?: string;
  timestamp?: string;
  id: string;
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

export default function Home() {
  const { status } = useSession();

  useEffect(() => {
    twinPlusKernel.init();
  }, []);

  if (status === "loading") {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--accent)]" />
            <p className="system-text text-accent animate-pulse tracking-[0.4em]">INITIALIZING NEURAL LINK...</p>
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
  const [assistantName, setAssistantName] = useState("Twin+");
  const [isOnline, setIsOnline] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isProtocolActive, setIsProtocolActive] = useState(false);
  const [showTrrpModal, setShowTrrpModal] = useState(false);
  const [matrixPending, setMatrixPending] = useState(false);
  const [matrixMessage, setMatrixMessage] = useState("INITIATING");

  const [currentTime, setCurrentTime] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
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

  const logEvent = (type: any, payload: any) => {
    twinPlusKernel.observe(createEvent(type, payload, activeModule));
  };

  const terminateProtocol = () => {
    setMatrixMessage("TERMINATING");
    setIsMatrixActive(true);
    logEvent('PROTOCOL_TERMINATED', { topic: trrpParams.topic });
    setTimeout(() => {
      setIsMatrixActive(false);
      setIsProtocolActive(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Ready Room Protocol Terminated. Virtual environment collapsed. Returning to Sovereign Control.',
        timestamp: new Date().toISOString(),
        layer: 'LOCAL'
      }]);
    }, 3000);
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isTyping) return;

    if (text.toLowerCase() === 'end protocol' && isProtocolActive) {
      terminateProtocol();
      setInput("");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

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
          searchKey,
          apiKey,
          aiEnhanced: aiEnhanced,
          history: currentHistory.slice(-15),
          assistantName,
          protocolParams: isProtocolActive ? trrpParams : null
        }),
      });
      const data = await response.json();

      if (data.intent) {
          logEvent('INTENT_ROUTED', { intent: data.intent, layer: data.sourceLayer });
      }

      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: data.role,
          content: data.content,
          layer: data.sourceLayer,
          timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Neural pipeline failure. Verification required.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startTRRP = () => {
    if (!trrpParams.members || !trrpParams.topic) return;
    setShowTrrpModal(false);
    setMessages(prev => [...prev,
      { id: Date.now().toString(), role: "user", content: `Invoke Ready Room Protocol: ${trrpParams.topic}`, timestamp: new Date().toISOString() },
      { id: (Date.now()+1).toString(), role: "assistant", content: "Protocol parameters ingested. Neural mapping initiated. Prepare for simulation entry.", timestamp: new Date().toISOString(), layer: "SYSTEM" }
    ]);
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
      const p = trrpParams;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `**PROTOCOL ACTIVE**\n\n**Topic:** ${p.topic}\n**Moderator:** ${p.moderator}\n**Members:** ${p.members}\n\nEnvironment stable. Anti-puppeteering locks engaged. Begin deliberation. (Type "end protocol" to collapse simulation)`,
        timestamp: new Date().toISOString(),
        layer: "NEURAL_PROTOCOL"
      }]);
    }, 4000);
  };

  const abortTRRP = () => {
    setMatrixPending(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "system",
      content: "Protocol aborted. Neural link maintained.",
      timestamp: new Date().toISOString(),
      layer: "LOCAL"
    }]);
  }

  const clearHistory = () => {
    if (confirm("Execute master ledger wipe?")) {
      setMessages([{
        id: "reset",
        role: "system",
        content: "OS Initialized. Neural link stable.",
        layer: "LOCAL",
        timestamp: new Date().toISOString()
      }]);
      localStorage.removeItem("tv_chat_history");
      logEvent('ENTROPY_REDUCED', { action: 'MASTER_RESET' });
    }
  };

  useEffect(() => {
    setHasMounted(true);
    const timer = setInterval(() => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    setIsOnline(navigator.onLine);
    const setOn = () => setIsOnline(true);
    const setOff = () => setIsOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);

    const savedKey = localStorage.getItem("tv_api_key");
    if (savedKey) setApiKey(savedKey);
    const savedSearch = localStorage.getItem("tv_search_key");
    if (savedSearch) setSearchKey(savedSearch);
    const savedName = localStorage.getItem("tv_assistant_name");
    if (savedName) setAssistantName(savedName);

    const savedHistory = localStorage.getItem("tv_chat_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      } catch (e) {
        setMessages([{ id: "init", role: "system", content: "Neural link stable.", timestamp: new Date().toISOString() }]);
      }
    } else {
      setMessages([{ id: "init", role: "system", content: "Neural link stable.", timestamp: new Date().toISOString() }]);
    }

    const savedModule = localStorage.getItem("tv_active_module");
    if (savedModule && ["BRIDGE", "READY_ROOM", "MISSIONS", "DOCTRINE", "SETTINGS", "REVIEW", "SIGNALS", "CORKBOARD", "QUOTES"].includes(savedModule)) {
        setActiveModule(savedModule as Module);
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("tv_api_key", apiKey);
    localStorage.setItem("tv_search_key", searchKey);
    localStorage.setItem("tv_assistant_name", assistantName);
    localStorage.setItem("tv_chat_history", JSON.stringify(messages));
    localStorage.setItem("tv_active_module", activeModule);
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [apiKey, searchKey, assistantName, messages, activeModule, hasMounted]);

  if (!hasMounted) return null;

  const isSystemLinked = isOnline && status === 'authenticated';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white p-2 selection:bg-accent/30 font-sans uppercase">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.12),transparent_70%)] opacity-60" />
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
                <span className="system-text text-[8px] text-white/30 font-black tracking-widest uppercase">Clock</span>
                <span className="system-text text-[13px] font-black text-white/80 italic">{currentTime}</span>
             </div>
             <div className="flex flex-col items-center border-l border-white/5 pl-16">
                <span className="system-text text-[8px] text-white/30 font-black tracking-widest uppercase">Neural Load</span>
                <div className="flex gap-1 items-end h-4">
                   {[1,2,3,4,5,6,5,4,3,2,1].map((h, i) => (
                     <div key={i} className={`w-1 rounded-t-sm transition-all duration-700 ${apiKey ? 'bg-accent shadow-[0_0_5px_var(--accent)]' : 'bg-white/10'}`} style={{ height: apiKey ? `${h*16}%` : '2px' }} />
                   ))}
                </div>
             </div>
          </div>

          <div className={`flex items-center gap-6 px-8 py-2 border-2 ${isSystemLinked ? 'border-neon-green/40 bg-neon-green/5' : 'border-red-500/40 bg-red-500/5'} transition-all`}>
             <div className={`h-2.5 w-2.5 rounded-full ${isSystemLinked ? 'bg-neon-green shadow-[0_0_15px_#22c55e]' : 'bg-red-500'} ${isOnline && !session ? '' : 'animate-pulse'}`} />
             <span className="system-text text-[10px] text-white font-black italic tracking-widest">{isSystemLinked ? 'Linked' : (isOnline ? 'UNAUTHENTICATED' : 'Offline')}</span>
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden relative">
          <SideNav onModuleChange={setActiveModule} activeModule={activeModule} />
          <main className="flex-grow overflow-hidden relative">
             <div className="absolute inset-0 p-8 overflow-y-auto scrollbar-thin">
              {activeModule === "BRIDGE" && (
                <div className="module-enter">
                  <Bridge />
                </div>
              )}
              {activeModule === "SIGNALS" && (
                <div className="module-enter">
                  <SignalBay />
                </div>
              )}
              {activeModule === "CORKBOARD" && (
                <div className="module-enter h-full">
                  <Corkboard />
                </div>
              )}
              {activeModule === "QUOTES" && (
                <div className="module-enter">
                  <QuoteBoard />
                </div>
              )}
              {activeModule === "READY_ROOM" && (
                <div className={`module-enter flex flex-col h-full ${isMaximized ? 'fixed inset-0 z-[100] bg-black p-4' : 'w-full max-w-full'}`}>
                  {isMatrixActive && (
                    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
                      <div className="matrix-container">
                        {Array.from({ length: 100 }).map((_, i) => (
                          <div key={i} className="matrix-column" style={{ animationDuration: `${Math.random()*3+2}s`, left: `${i}%`, fontSize: '14px' }}>
                            {Array.from({ length: 40 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('\n')}
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center z-[2001] bg-black/40">
                        <span className="system-text text-4xl font-black text-neon-green animate-pulse tracking-[1em]">{matrixMessage}</span>
                      </div>
                    </div>
                  )}
                  {showTrrpModal && (
                    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                      <div className="hud-panel max-w-3xl w-full p-8 border-accent/40 shadow-[0_0_100px_rgba(0,212,255,0.25)]">
                        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                            <h3 className="system-text text-xl font-black text-accent tracking-widest italic">Protocol_Matrix.v2</h3>
                            <span className="text-[10px] text-white/20 font-black">HOLODECK CONFIG</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left uppercase">
                          <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                              <label className="text-[8px] text-white/40 font-bold tracking-[0.2em]">Moderator</label>
                              <input value={trrpParams.moderator} onChange={e => setTrrpParams({...trrpParams, moderator: e.target.value})} className="bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none font-mono text-white" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[8px] text-white/40 font-bold tracking-[0.2em]">Members (Simulated Profiles)</label>
                              <input value={trrpParams.members} onChange={e => setTrrpParams({...trrpParams, members: e.target.value})} placeholder="e.g. Steve Jobs, Marcus Aurelius" className="bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none font-mono text-white placeholder:text-white/10" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[8px] text-white/40 font-bold tracking-[0.2em]">Topic / Problem Statement</label>
                              <textarea rows={4} value={trrpParams.topic} onChange={e => setTrrpParams({...trrpParams, topic: e.target.value})} className="bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none font-mono resize-none text-white" />
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                              <label className="text-[8px] text-white/40 font-bold tracking-[0.2em]">Deliberation Format</label>
                              <select value={trrpParams.format} onChange={e => setTrrpParams({...trrpParams, format: e.target.value})} className="bg-white/5 border border-white/10 p-3 text-sm text-white">
                                <option>Continuous Round Robin</option>
                                <option>Socratic Debate</option>
                                <option>Direct Critique</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[8px] text-white/40 font-bold tracking-[0.2em]">Rules of Engagement</label>
                              <input value={trrpParams.rules} onChange={e => setTrrpParams({...trrpParams, rules: e.target.value})} className="bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none font-mono text-white" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[8px] text-white/40 font-bold tracking-[0.2em]">Neural Tone</label>
                              <input value={trrpParams.tone} onChange={e => setTrrpParams({...trrpParams, tone: e.target.value})} className="bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none font-mono text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-12 flex gap-4">
                          <button onClick={startTRRP} className="flex-grow bg-accent py-4 text-xs font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-[0.2em]">GENERATE SIMULATION</button>
                          <button onClick={() => setShowTrrpModal(false)} className="px-10 border border-white/10 text-[9px] text-white/40 hover:text-white transition-all">CANCEL</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4 px-2">
                     <div className="text-left text-nowrap flex items-center gap-4">
                        <h2 className={`text-3xl font-black italic transition-colors ${isProtocolActive ? 'text-neon-green' : 'text-white'}`}>
                            {isProtocolActive ? 'PROTOCOL_ACTIVE' : 'READY ROOM'}
                        </h2>
                        <div className={`h-px w-8 ${isProtocolActive ? 'bg-neon-green/40' : 'bg-white/10'}`} />
                        <p className={`system-text text-[8px] tracking-[0.2em] font-black uppercase ${isProtocolActive ? 'text-neon-green animate-pulse' : 'text-accent'}`}>
                            STATUS: {isProtocolActive ? 'SIMULATION_LAYER' : (apiKey ? 'ONLINE' : 'LOCAL')}
                        </p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setIsMaximized(!isMaximized)} className="glass px-4 py-1.5 text-[9px] font-black text-accent uppercase tracking-widest">{isMaximized ? 'MINIMIZE' : 'MAXIMIZE'}</button>
                        {!isProtocolActive && (
                            <button onClick={() => setShowTrrpModal(true)} className="glass px-4 py-1.5 text-[9px] font-black text-neon-green border-neon-green/30 uppercase tracking-widest">PROTOCOL</button>
                        )}
                        {isProtocolActive && (
                            <button onClick={terminateProtocol} className="glass px-4 py-1.5 text-[9px] font-black text-red-500 border-red-500/30 uppercase tracking-widest">END SIM</button>
                        )}
                     </div>
                  </div>
                  <div className={`flex-grow hud-panel flex flex-col overflow-hidden relative shadow-2xl transition-colors duration-1000 ${isProtocolActive ? 'bg-black/80 border-neon-green/20' : 'bg-black/60 border-white/10'}`}>
                     <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto font-sans text-sm space-y-8 scrollbar-thin bg-black/20">
                        {messages.map((m) => (
                          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-full animate-slide-up`}>
                            <div className="flex items-center gap-2 mb-2 uppercase">
                               {m.layer && <span className={`text-[7px] font-black border px-1.5 py-0.5 rounded-sm ${m.layer === 'LOCAL' ? 'border-white/20 text-white/40' : m.layer.includes('PROTOCOL') ? 'border-neon-green/40 text-neon-green/60' : 'border-accent/40 text-accent/60'}`}>{m.layer}</span>}
                               <span className={`system-text text-[8px] tracking-[0.1em] font-black ${m.role === 'user' ? 'text-white/20' : 'text-accent'}`}>{m.role === 'user' ? (session?.user?.name?.split(' ')[0] || 'MICHAEL') : assistantName.toUpperCase()}</span>
                            </div>
                            <div className={`max-w-[95%] p-4 border shadow-xl relative group ${m.role === 'user' ? 'glass-accent border-accent/20 rounded-2xl rounded-tr-sm text-right' : 'glass border-white/10 rounded-2xl rounded-tl-sm text-left bg-white/[0.01]'} ${isProtocolActive && m.role !== 'user' ? 'border-neon-green/10' : ''}`}>
                                <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-[14px] font-light">{m.content}</p>
                                {m.role === 'assistant' && !isProtocolActive && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleFeedback(m.id, 'up')} className="text-white/20 hover:text-neon-green transition-colors">
                                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                            </button>
                                            <button onClick={() => handleFeedback(m.id, 'down')} className="text-white/20 hover:text-red-500 transition-colors">
                                              <svg className="h-4 w-4 transform rotate-180" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                            </button>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            {["Too verbose", "Wrong source", "Not my voice"].map(chip => (
                                              <button key={chip} onClick={() => handleFeedback(m.id, chip)} className="text-[7px] border border-white/10 px-2 py-0.5 rounded-full text-white/40 hover:border-accent hover:text-white uppercase tracking-widest">{chip}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                          </div>
                        ))}
                        {matrixPending && (
                          <div className="flex flex-col items-center justify-center p-12 border border-neon-green/30 bg-neon-green/5 mx-auto max-w-xl animate-pulse shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                             <div className="h-10 w-10 border-2 border-neon-green flex items-center justify-center mb-6">
                                <span className="text-neon-green font-black">!</span>
                             </div>
                             <span className="system-text text-[12px] mb-8 text-neon-green font-black tracking-[0.4em] text-center">NEURAL PROFILE MAPPING COMPLETE</span>
                             <div className="flex gap-4 w-full">
                                <button onClick={confirmTRRP} className="flex-grow bg-neon-green/20 border border-neon-green/50 py-4 text-neon-green font-black text-[11px] hover:bg-neon-green hover:text-black transition-all uppercase tracking-[0.2em]">PROCEED TO SIMULATION</button>
                                <button onClick={abortTRRP} className="px-10 py-4 border border-white/10 text-white/40 text-[9px] hover:text-red-500 transition-all uppercase">ABORT</button>
                             </div>
                          </div>
                        )}
                        {isTyping && <div className="flex flex-col items-start animate-pulse"><div className="p-4 glass border-white/10 h-10 w-24 flex items-center gap-2 rounded-2xl rounded-tl-sm"><div className={`h-1.5 w-1.5 rounded-full animate-bounce ${isProtocolActive ? 'bg-neon-green' : 'bg-accent'}`} /><div className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:0.2s] ${isProtocolActive ? 'bg-neon-green' : 'bg-accent'}`} /><div className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:0.4s] ${isProtocolActive ? 'bg-neon-green' : 'bg-accent'} shadow-[0_0_10px_rgba(0,212,255,1)]`} /></div></div>}
                     </div>
                     <div className="p-4 bg-black/80 border-t border-white/10 flex flex-col gap-2 shrink-0 uppercase">
                        <div className="flex gap-4">
                          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={isProtocolActive ? "Deliberate..." : `Signal ${assistantName}...`} className="flex-grow bg-transparent border-b border-white/10 px-4 py-3 text-[18px] focus:outline-none focus:border-accent/50 transition-colors placeholder:text-white/10 font-mono text-white" />
                          <button onClick={() => handleSend()} disabled={isTyping} className={`${isProtocolActive ? 'bg-neon-green/80' : 'bg-accent'} px-10 py-3 system-text text-[11px] font-black text-white hover:bg-white hover:text-black disabled:opacity-50 tracking-widest transition-colors uppercase`}>Engage</button>
                        </div>
                        <div className="flex items-center justify-between px-1 tracking-widest">
                          <button onClick={() => apiKey && setAiEnhanced(!aiEnhanced)} className={`flex items-center gap-3 text-[9px] font-black tracking-widest transition-all ${aiEnhanced ? 'text-accent' : 'text-white/20'}`}>
                            <div className={`h-2.5 w-2.5 rounded-full transition-all ${aiEnhanced ? 'bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]' : 'bg-white/10'}`} />
                            NEURAL ENHANCE {aiEnhanced ? 'ACTIVE' : 'OFF'}
                          </button>
                          <span className="text-[8px] text-white/10 font-black italic">learning through observation</span>
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
                        {[{ t: "LOCAL", d: "Sovereign knowledge. Persistent, private, deterministic. The foundation of the system.", s: "ACTIVE" }, { t: "INTERNET", d: "Live factual validation via WiFi/Cellular escalation. Trusted sources cache.", s: isOnline ? "STABLE" : "OFFLINE" }, { t: "AI", d: "Opt-in neural modeling. Learning substrate (Twin+). Synthesis layer.", s: apiKey ? "ACTIVE" : "STANDBY" }].map(d => (
                          <div key={d.t} className="hud-panel p-8 flex flex-col gap-4 group hover:border-accent/50 transition-all bg-black/60 shadow-2xl relative">
                            <span className="system-text text-xl font-black italic text-white group-hover:text-accent tracking-tighter">{d.t}</span>
                            <p className="text-[13px] text-white/50 font-light leading-relaxed">{d.d}</p>
                            <div className="pt-4 border-t border-white/5"><span className="system-text text-[8px] text-white/30 font-black">{d.s}</span></div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "SETTINGS" && (
                <div className="module-enter h-full overflow-y-auto pr-2 scrollbar-thin text-left uppercase">
                  <div className="flex flex-col max-w-3xl mx-auto py-12 w-full uppercase">
                     <h2 className="text-4xl font-black italic tracking-tighter mb-10 text-white">CONFIG</h2>
                     <div className="space-y-12 uppercase">
                        <div className="flex flex-col gap-4">
                          <label className="system-text text-[10px] text-white/50 font-black tracking-widest uppercase">Neural Key (OpenAI) - OPT-IN AI</label>
                          <div className="flex gap-4">
                            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="flex-grow hud-panel bg-black/60 border-white/10 px-4 py-3 text-sm focus:border-accent/50 font-mono text-white shadow-inner uppercase" />
                            <button onClick={() => { localStorage.setItem("tv_api_key", apiKey); alert("Stored"); } } className="bg-accent px-10 py-2 system-text text-[10px] font-black text-white hover:bg-white hover:text-black uppercase">Store</button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4">
                          <label className="system-text text-[10px] text-white/50 font-black tracking-widest uppercase">Search Key (Tavily) - INTERNET SEARCH</label>
                          <div className="flex gap-4">
                            <input type="password" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} placeholder="API Key..." className="flex-grow hud-panel bg-black/60 border-white/10 px-4 py-3 text-sm focus:border-accent/50 font-mono text-white shadow-inner uppercase" />
                            <button onClick={() => { localStorage.setItem("tv_search_key", searchKey); alert("Stored"); } } className="bg-accent px-10 py-2 system-text text-[10px] font-black text-white hover:bg-white hover:text-black uppercase">Store</button>
                          </div>
                        </div>
                        <button onClick={clearHistory} className="w-full py-3 border border-red-500/30 text-red-500/50 system-text text-[9px] font-black hover:bg-red-500 hover:text-white transition-all uppercase">Master Reset</button>
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "MISSIONS" && (
                <div className="module-enter h-full p-8 max-w-7xl mx-auto w-full overflow-y-auto scrollbar-thin text-left uppercase">
                   <WorkoutTracker />
                </div>
              )}
              {activeModule === "REVIEW" && (
                <div className="module-enter h-full p-8 max-w-7xl mx-auto w-full overflow-y-auto scrollbar-thin text-left uppercase">
                   <ReviewScreen />
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="h-10 border-t border-white/10 bg-black/95 flex items-center justify-center gap-6 px-10 shrink-0 z-50 uppercase shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
           <div className="flex items-center gap-1 bg-white/[0.01] border border-white/10 p-1 h-7 uppercase">
              {[
                { id: "BRIDGE", label: "TODAY" },
                { id: "SIGNALS", label: "SIGNAL BAY" },
                { id: "MISSIONS", label: "PROJECTS" },
                { id: "CORKBOARD", label: "CORKBOARD" },
                { id: "REVIEW", label: "REVIEW" },
                { id: "QUOTES", label: "QUOTES" },
                { id: "READY_ROOM", label: "READY ROOM" }
              ].map(item => (
                <button key={item.id} onClick={() => setActiveModule(item.id as Module)} className={`px-6 system-text text-[9px] font-black transition-all relative overflow-hidden group min-w-[100px] h-full ${activeModule === item.id ? 'text-white bg-accent/20' : 'text-white/20 hover:text-white/60 uppercase'}`}>
                  <span className="relative z-10 italic uppercase">{item.label}</span>
                  {activeModule === item.id && <div className="absolute bottom-0 left-0 h-0.5 w-full bg-accent shadow-[0_-5px_40px_rgba(0,212,255,1)] uppercase" />}
                </button>
              ))}
           </div>
           <div className="absolute right-10 flex flex-col items-end gap-0 opacity-40 uppercase">
              <span className="system-text text-[7px] font-black italic tracking-widest uppercase">39.1031° N // 84.5120° W</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
