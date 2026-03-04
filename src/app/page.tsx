"use client";

import { useState, useEffect, useRef } from "react";

type Module = "BRIDGE" | "READY_ROOM" | "DOCTRINE" | "SETTINGS" | "MISSIONS";

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
  const [activeModule, setActiveModule] = useState<Module>("BRIDGE");
  const [apiKey, setApiKey] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [assistantName, setAssistantName] = useState("Twin+");
  const [isOnline, setIsOnline] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [showTrrpModal, setShowTrrpModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [matrixPending, setMatrixPending] = useState(false);

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

  // --- TWIN+ LEDGER SYSTEM (Constitution 5.1) ---
  const logEvent = (type: string, payload: any) => {
    const ledger = JSON.parse(localStorage.getItem("tv_ledger") || "[]");
    ledger.push({ timestamp: new Date().toISOString(), type, payload });
    localStorage.setItem("tv_ledger", JSON.stringify(ledger.slice(-500))); // Keep last 500
  };

  // Persistence and Hydration
  useEffect(() => {
    setHasMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    setIsOnline(navigator.onLine);
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    const savedKey = localStorage.getItem("tv_api_key");
    const savedSearch = localStorage.getItem("tv_search_key");
    const savedHistory = localStorage.getItem("tv_chat_history");
    const savedModule = localStorage.getItem("tv_active_module");
    const savedName = localStorage.getItem("tv_assistant_name");

    if (savedKey) setApiKey(savedKey);
    if (savedSearch) setSearchKey(savedSearch);
    if (savedName) setAssistantName(savedName);

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        } else {
          setMessages([{ id: "init", role: "system", content: "OS Initialized. Neural link stable.", timestamp: new Date().toISOString() }]);
        }
      } catch (e) {
        setMessages([{ id: "init", role: "system", content: "OS Initialized. Neural link stable.", timestamp: new Date().toISOString() }]);
      }
    } else {
      setMessages([{ id: "init", role: "system", content: "OS Initialized. Neural link stable.", timestamp: new Date().toISOString() }]);
    }

    if (savedModule) {
        const validModules: Module[] = ["BRIDGE", "READY_ROOM", "DOCTRINE", "SETTINGS", "MISSIONS"];
        if (validModules.includes(savedModule as Module)) setActiveModule(savedModule as Module);
    }

    logEvent("APP_START", { module: savedModule || "BRIDGE" });

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  // Save Persistence
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

  const handleFeedback = (messageId: string, type: 'up' | 'down' | string) => {
    logEvent("FEEDBACK_RECEIVED", { messageId, type });
    if (type === 'up' || type === 'down') {
        // Visual confirmation could go here
    } else {
        handleSend(`[REINFORCEMENT] Feedback on signal ${messageId}: ${type}`);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isTyping) return;

    if (text.toLowerCase().startsWith("rename to ")) {
      const newName = text.split(" ").pop()?.replace(/[.!?]/g, "") || assistantName;
      setAssistantName(newName);
      const userMsg = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date().toISOString() };
      const ackMsg = { id: (Date.now()+1).toString(), role: "assistant", content: `Identity updated to: ${newName}`, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg, ackMsg]);
      setInput("");
      logEvent("IDENTITY_UPDATED", { newName });
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const currentHistory = [...messages, userMsg];
    if (!overrideInput) setInput("");
    setIsTyping(true);

    logEvent("SIGNAL_SENT", { length: text.length });

    try {
      const response = await fetch('/api/ready-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          apiKey,
          searchKey,
          enhance: aiEnhanced,
          history: currentHistory.slice(-10),
          assistantName,
          clientDate: new Date().toLocaleString()
        }),
      });
      const data = await response.json();

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.content === data.content && last.role === data.role) return prev;
        return [...prev, {
          id: Date.now().toString(),
          role: data.role,
          content: data.content,
          layer: data.sourceLayer,
          timestamp: new Date().toISOString()
        }];
      });
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Neural pipeline failure.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startTRRP = () => {
    if (!trrpParams.members || !trrpParams.topic) return;
    setShowTrrpModal(false);
    setMessages(prev => [...prev,
      { id: Date.now().toString(), role: "user", content: "Invoke Ready Room Protocol", timestamp: new Date().toISOString() },
      { id: (Date.now()+1).toString(), role: "assistant", content: "Protocol parameters ingested. Transitioning. Are you ready?", timestamp: new Date().toISOString() }
    ]);
    setMatrixPending(true);
    logEvent("PROTOCOL_INITIALIZED", { topic: trrpParams.topic });
  };

  const confirmTRRP = () => {
    setMatrixPending(false);
    setIsMatrixActive(true);
    setTimeout(() => {
      setIsMatrixActive(false);
      const p = trrpParams;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `Invoke Ready Room\nTopic: ${p.topic}\nModerator: ${p.moderator}\nMembers: ${p.members}\n\nBegin deliberation.`,
        timestamp: new Date().toISOString()
      }]);
      logEvent("PROTOCOL_INVOKED", { params: p });
    }, 4000);
  };

  const clearHistory = () => {
    if (confirm("Execute master ledger wipe?")) {
      setMessages([{ id: "reset", role: "system", content: "OS Initialized. Bridge active.", layer: "LOCAL", timestamp: new Date().toISOString() }]);
      localStorage.removeItem("tv_chat_history");
      localStorage.removeItem("tv_ledger");
      logEvent("MASTER_RESET", {});
    }
  };

  const exportHistory = () => {
    try {
      const history = localStorage.getItem("tv_chat_history");
      const ledger = localStorage.getItem("tv_ledger");

      const payload = {
        exportedAt: new Date().toISOString(),
        chatHistory: history ? JSON.parse(history) : [],
        ledger: ledger ? JSON.parse(ledger) : []
      };

      const blob = new Blob(
        [JSON.stringify(payload, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tempus_victa_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (!hasMounted) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white p-2 selection:bg-accent/30 font-sans uppercase">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.12),transparent_70%)] opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] bg-accent/5 rounded-full blur-[200px] neural-pulse" />
        <div className="scanline" />
      </div>

      <div className="relative z-10 h-full w-full flex flex-col hud-panel border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md">
        <header className="h-16 border-b border-white/10 bg-black/80 flex items-center justify-between px-10 shrink-0 relative uppercase">
          <div className="flex items-center gap-8 cursor-pointer" onClick={() => setActiveModule('BRIDGE')}>
             <div className="h-12 w-12 border-2 border-accent/40 bg-black flex items-center justify-center relative">
                <span className="system-text text-3xl font-black text-accent">T</span>
                <div className="bracket-tl" /><div className="bracket-br" />
             </div>
             <div className="flex flex-col text-left">
                <span className="system-text text-[13px] font-black tracking-[0.6em] text-white/90">Tempus Victa</span>
                <span className="system-text text-[8px] text-accent/60 font-black italic">{assistantName} ACTIVE</span>
             </div>
          </div>

          <div className="hidden lg:flex items-center gap-16 uppercase">
             <div className="flex flex-col items-center border-l border-white/5 pl-16">
                <span className="system-text text-[8px] text-white/30 font-black tracking-widest uppercase">Clock</span>
                <span className="system-text text-[13px] font-black text-white/80 italic">{currentTime}</span>
             </div>
             <div className="flex flex-col items-center border-l border-white/5 pl-16 uppercase">
                <span className="system-text text-[8px] text-white/30 font-black uppercase tracking-widest uppercase">Flux</span>
                <div className="flex gap-1 items-end h-4">
                   {[1,2,3,4,5,6,5,4,3,2,1].map((h, i) => (
                     <div key={i} className={`w-1 rounded-t-sm transition-all duration-700 ${apiKey ? 'bg-accent shadow-[0_0_5px_var(--accent)]' : 'bg-white/10'}`} style={{ height: apiKey ? `${h*16}%` : '2px' }} />
                   ))}
                </div>
             </div>
          </div>

          <div className={`flex items-center gap-6 px-8 py-2 border-2 ${isOnline ? 'border-neon-green/40 bg-neon-green/5' : 'border-red-500/40 bg-red-500/5'} transition-all uppercase`}>
             <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-neon-green shadow-[0_0_15px_#22c55e]' : 'bg-red-500 animate-ping'} animate-pulse`} />
             <span className="system-text text-[10px] text-white font-black italic tracking-widest">{isOnline ? 'Linked' : 'Offline'}</span>
          </div>
        </header>

        <main className="flex-grow overflow-hidden relative">
           <div className="absolute inset-0 p-4 overflow-y-auto">
              {activeModule === "BRIDGE" && (
                <div className="module-enter h-full grid grid-cols-12 gap-4 content-start overflow-y-auto pr-2 scrollbar-thin uppercase">
                  <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 text-left">
                     <div className="hud-panel p-8 border-accent/20 rounded-sm relative overflow-hidden group shadow-[0_0_50px_rgba(0,212,255,0.1)]">
                        <div className="bracket-tl" /><div className="bracket-tr" /><div className="bracket-bl" /><div className="bracket-br" />
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-full border-2 border-accent/20 flex items-center justify-center relative">
                                 <span className="system-text text-xl font-black text-white">{assistantName[0]}</span>
                              </div>
                              <div>
                                 <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">{assistantName} // CORE</h1>
                                 <p className="system-text text-[9px] text-neon-green mt-1 font-black flex items-center gap-2 tracking-widest">SYSTEM ONLINE</p>
                              </div>
                           </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           {[{ l: "Entropy", v: "84.2%", c: "bg-accent" }, { l: "Autonomy", v: "12.4D", c: "bg-neon-green" }, { l: "Stability", v: "9.2S", c: "bg-indigo-400" }].map(s => (
                             <div key={s.l} className="hud-panel p-4 border-white/5 bg-black/40 flex flex-col gap-2">
                                <span className="system-text text-[8px] text-white/40 font-black uppercase tracking-widest">{s.l}</span>
                                <span className="text-2xl font-black text-white italic">{s.v}</span>
                                <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden"><div className={`h-full ${s.c} w-[70%]`} /></div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="hud-panel p-6 border-white/5 bg-black/60"><h3 className="system-text text-[9px] font-black text-neon-green mb-4 italic uppercase tracking-widest">WinBoard</h3><ul className="space-y-3 text-[11px]"><li className="flex justify-between border-b border-white/5 pb-2 uppercase"><span>ITALY TRIP</span><span className="text-neon-green font-black">DONE</span></li><li className="flex justify-between uppercase"><span>LICENSE PATH</span><span className="text-red-500 font-black">RISK</span></li></ul></div>
                        <div className="hud-panel p-6 border-white/5 bg-black/60"><h3 className="system-text text-[9px] font-black text-accent mb-4 italic uppercase tracking-widest">Missions</h3><div className="space-y-4"><div className="flex flex-col gap-1.5"><div className="flex justify-between text-[9px] font-black uppercase tracking-widest"><span>WRIKE P2</span><span className="text-accent uppercase">72%</span></div><div className="h-1 bg-white/5 w-full"><div className="h-full bg-accent w-[72%]" /></div></div></div></div>
                     </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 text-left">
                     <div className="hud-panel p-8 border-accent/10 h-full bg-gradient-to-br from-black to-accent/5 uppercase">
                        <h2 className="system-text text-[10px] font-black text-white mb-6 uppercase border-b border-white/5 pb-3 tracking-widest">TACTICAL_BRIEFING</h2>
                        <p className="italic text-sm text-white/70 leading-relaxed border-l-2 border-accent/40 pl-4 uppercase">"Michael, focus window active: 09:00 - 11:30. 12m queue at BMV."</p>
                        <button className="w-full bg-accent/10 border border-accent/40 py-3 mt-8 system-text text-[9px] font-black hover:bg-white hover:text-black transition-all uppercase">Accept</button>
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "READY_ROOM" && (
                <div className={`flex flex-col h-full ${isMaximized ? 'fixed inset-0 z-[100] bg-black p-4' : 'w-full max-w-full'}`}>
                  {isMatrixActive && (
                    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
                      <div className="matrix-container">{Array.from({ length: 100 }).map((_, i) => (<div key={i} className="matrix-column" style={{ animationDuration: `${Math.random()*2+1}s`, left: `${i}%`, fontSize: '12px' }}>{Array.from({ length: 40 }).map(() => String.fromCharCode(Math.floor(Math.random()*94)+33)).join('\n')}</div>))}</div>
                      <div className="absolute inset-0 flex items-center justify-center z-[2001] bg-black/40"><span className="system-text text-4xl font-black text-neon-green animate-pulse tracking-[1em]">INITIATING</span></div>
                    </div>
                  )}
                  {showTrrpModal && (
                    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                      <div className="hud-panel max-w-3xl w-full p-8 border-accent/40 shadow-[0_0_100px_rgba(0,212,255,0.25)]">
                        <h3 className="system-text text-xl font-black mb-8 border-b border-white/10 pb-4 text-accent uppercase text-left tracking-widest">Protocol_Matrix.v2</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left uppercase">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-1"><label className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Moderator</label><input value={trrpParams.moderator} onChange={e => setTrrpParams({...trrpParams, moderator: e.target.value})} className="bg-white/5 border border-white/10 p-2 text-sm focus:border-accent outline-none font-mono text-white" /></div>
                            <div className="flex flex-col gap-1"><label className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Members</label><input value={trrpParams.members} onChange={e => setTrrpParams({...trrpParams, members: e.target.value})} className="bg-white/5 border border-white/10 p-2 text-sm focus:border-accent outline-none font-mono text-white" /></div>
                            <div className="flex flex-col gap-1"><label className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Topic</label><textarea rows={3} value={trrpParams.topic} onChange={e => setTrrpParams({...trrpParams, topic: e.target.value})} className="bg-white/5 border border-white/10 p-2 text-sm focus:border-accent outline-none font-mono resize-none text-white" /></div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex flex-col gap-1"><label className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Format</label><select value={trrpParams.format} onChange={e => setTrrpParams({...trrpParams, format: e.target.value})} className="bg-white/5 border border-white/10 p-2 text-sm text-white uppercase"><option>Continuous Round Robin</option><option>Single Pass</option></select></div>
                            <div className="flex flex-col gap-1"><label className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Tone</label><input value={trrpParams.tone} onChange={e => setTrrpParams({...trrpParams, tone: e.target.value})} className="bg-white/5 border border-white/10 p-2 text-sm focus:border-accent outline-none font-mono text-white" /></div>
                            <div className="flex flex-col gap-1"><label className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Termination</label><select value={trrpParams.termination} onChange={e => setTrrpParams({...trrpParams, termination: e.target.value})} className="bg-white/5 border border-white/10 p-2 text-sm text-white uppercase"><option>Manual</option><option>Single Pass</option></select></div>
                          </div>
                        </div>
                        <div className="mt-10 flex gap-4"><button onClick={startTRRP} className="flex-grow bg-accent py-4 text-xs font-black text-white hover:bg-white hover:text-black uppercase">Generate</button><button onClick={() => setShowTrrpModal(false)} className="px-8 border border-white/10 text-[9px] text-white/40 uppercase">Cancel</button></div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2 px-2 uppercase">
                     <div className="text-left text-nowrap flex items-center gap-4"><h2 className="text-3xl font-black italic uppercase">READY ROOM</h2><div className="h-px w-8 bg-white/10" /><p className="system-text text-[8px] text-accent tracking-[0.2em] font-black uppercase">STATUS: {apiKey ? 'ONLINE' : 'LOCAL'}</p></div>
                     <div className="flex gap-2">
                        <button onClick={() => setIsMaximized(!isMaximized)} className="glass px-4 py-1.5 text-[9px] font-black text-accent uppercase">{isMaximized ? 'MINIMIZE' : 'MAXIMIZE'}</button>
                        <button onClick={() => setShowTrrpModal(true)} className="glass px-4 py-1.5 text-[9px] font-black text-neon-green border-neon-green/30 uppercase">PROTOCOL</button>
                        <button onClick={exportHistory} className="glass px-4 py-1.5 text-[9px] font-black text-white/40 hover:text-white uppercase">EXPORT</button>
                     </div>
                  </div>
                  <div className="flex-grow hud-panel flex flex-col overflow-hidden relative shadow-2xl bg-black/60 border-white/10">
                     <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto font-sans text-sm space-y-8 scrollbar-thin bg-black/20">
                        {messages.map((m, i) => (
                          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-full animate-slide-up`}>
                            <div className="flex items-center gap-2 mb-2 uppercase"><span className={`system-text text-[8px] tracking-[0.1em] font-black ${m.role === 'user' ? 'text-white/20' : 'text-accent'}`}>{m.role === 'user' ? 'MICHAEL' : assistantName.toUpperCase()}</span></div>
                            <div className={`max-w-[95%] md:max-w-[95%] p-5 border shadow-xl relative group ${m.role === 'user' ? 'glass-accent border-accent/20 rounded-2xl rounded-tr-sm text-right' : 'glass border-white/10 rounded-2xl rounded-tl-sm text-left bg-white/[0.01]'}`}>
                                <p className={`text-white/90 leading-relaxed whitespace-pre-wrap text-[16px] font-light ${m.role === 'assistant' ? 'italic' : ''}`}>{m.content}</p>

                                {m.role === 'assistant' && (
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
                                                <button key={chip} onClick={() => handleFeedback(m.id, chip)} className="text-[7px] border border-white/10 px-2 py-0.5 rounded-full text-white/40 hover:border-accent hover:text-white uppercase">{chip}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                          </div>
                        ))}
                        {matrixPending && (
                          <div className="flex flex-col items-center justify-center p-8 border border-neon-green/30 bg-neon-green/5 mx-auto max-w-xl animate-pulse">
                             <span className="system-text text-[10px] mb-6 text-neon-green font-black tracking-widest uppercase uppercase">PROTOCOL_LOADED</span>
                             <div className="flex gap-4 w-full"><button onClick={confirmTRRP} className="flex-grow bg-neon-green/20 border border-neon-green/50 py-3 text-neon-green font-black text-[10px] hover:bg-neon-green hover:text-black">CONFIRM</button><button onClick={abortTRRP} className="px-6 py-3 border border-white/10 text-white/40 text-[9px] hover:text-red-500 uppercase">ABORT</button></div>
                          </div>
                        )}
                        {isTyping && <div className="flex flex-col items-start animate-pulse"><div className="p-4 glass border-white/10 h-10 w-24 flex items-center gap-2 rounded-2xl rounded-tl-sm"><div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" /><div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" /><div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_10px_rgba(0,212,255,1)]" /></div></div>}
                     </div>
                     <div className="p-4 bg-black/80 border-t border-white/10 flex flex-col gap-2 shrink-0 uppercase">
                        <div className="flex gap-4"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={`Signal ${assistantName}...`} className="flex-grow bg-transparent border-b border-white/10 px-4 py-3 text-[18px] focus:outline-none focus:border-accent/50 transition-colors placeholder:text-white/10 font-mono text-white" style={{ textTransform: 'none' }} /><button onClick={() => handleSend()} disabled={isTyping} className="bg-accent px-10 py-3 system-text text-[11px] font-black text-white hover:bg-white hover:text-black disabled:opacity-50 uppercase tracking-widest uppercase">Engage</button></div>
                        <div className="flex items-center justify-between px-1 uppercase tracking-widest uppercase"><button onClick={() => apiKey && setAiEnhanced(!aiEnhanced)} className={`flex items-center gap-3 text-[9px] font-black tracking-widest ${aiEnhanced ? 'text-accent' : 'text-white/20'}`}><div className={`h-2.5 w-2.5 rounded-full ${aiEnhanced ? 'bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]' : 'bg-white/10'}`} />NEURAL ENHANCE</button><span className="text-[8px] text-white/10 font-black italic uppercase">magic first, mathematics second</span></div>
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "DOCTRINE" && (
                <div className="module-enter h-full overflow-y-auto pr-2 scrollbar-thin uppercase">
                  <div className="flex flex-col items-center text-center p-12 max-w-7xl mx-auto uppercase">
                     <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-8 text-white uppercase tracking-tighter uppercase">THE DOCTRINE</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left uppercase uppercase">
                        {[{ t: "LOCAL", d: "Sovereign knowledge. Persistent, private, deterministic.", s: "ACTIVE" }, { t: "INTERNET", d: "Live factual validation via WiFi/Cellular escalation.", s: isOnline ? "STABLE" : "OFFLINE" }, { t: "AI", d: "Opt-in neural modeling.", s: apiKey ? "ACTIVE" : "STANDBY" }].map(d => (
                          <div key={d.t} className="hud-panel p-8 flex flex-col gap-4 group hover:border-accent/50 transition-all bg-black/60 shadow-2xl relative uppercase uppercase"><span className="system-text text-xl font-black italic text-white group-hover:text-accent tracking-tighter uppercase uppercase uppercase">{d.t}</span><p className="text-[13px] text-white/50 font-light leading-relaxed uppercase uppercase uppercase">{d.d}</p><div className="pt-4 border-t border-white/5"><span className="system-text text-[8px] text-white/30 font-black uppercase uppercase uppercase">{d.s}</span></div></div>
                        ))}
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "SETTINGS" && (
                <div className="module-enter h-full overflow-y-auto pr-2 scrollbar-thin uppercase text-left uppercase uppercase">
                  <div className="flex flex-col max-w-3xl mx-auto py-12 w-full uppercase uppercase uppercase">
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-10 text-white uppercase uppercase uppercase">CONFIG</h2>
                     <div className="space-y-12 uppercase uppercase uppercase">
                        <div className="flex flex-col gap-4 uppercase uppercase uppercase"><label className="system-text text-[10px] text-white/50 font-black tracking-widest uppercase uppercase uppercase">Neural Key (OpenAI)</label><div className="flex gap-4 uppercase uppercase uppercase"><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="flex-grow hud-panel bg-black/60 border-white/10 px-4 py-3 text-sm focus:border-accent/50 font-mono text-white shadow-inner uppercase" /><button onClick={() => alert("Stored")} className="bg-accent px-10 py-2 system-text text-[10px] font-black text-white hover:bg-white hover:text-black uppercase uppercase uppercase">Store</button></div></div>
                        <div className="flex flex-col gap-4 uppercase uppercase uppercase"><label className="system-text text-[10px] text-white/50 font-black tracking-widest uppercase uppercase uppercase">Search Key (Tavily/Google)</label><div className="flex gap-4 uppercase uppercase uppercase"><input type="password" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} placeholder="API Key..." className="flex-grow hud-panel bg-black/60 border-white/10 px-4 py-3 text-sm focus:border-accent/50 font-mono text-white shadow-inner uppercase" /><button onClick={() => alert("Stored")} className="bg-accent px-10 py-2 system-text text-[10px] font-black text-white hover:bg-white hover:text-black uppercase uppercase uppercase">Store</button></div></div>
                        <button onClick={clearHistory} className="w-full py-3 border border-red-500/30 text-red-500/50 system-text text-[9px] font-black hover:bg-red-500 hover:text-white transition-all uppercase uppercase uppercase">Master Reset</button>
                     </div>
                  </div>
                </div>
              )}
              {activeModule === "MISSIONS" && (
                <div className="module-enter h-full p-8 max-w-7xl mx-auto w-full overflow-y-auto scrollbar-thin uppercase text-left uppercase uppercase">
                   <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-12 text-white shadow-sm uppercase uppercase uppercase uppercase">Missions</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 uppercase uppercase uppercase uppercase uppercase">
                      <div className="hud-panel p-8 border-accent/30 relative group bg-gradient-to-br from-black to-accent/5 shadow-2xl uppercase uppercase uppercase uppercase uppercase"><div className="bracket-tl" /><div className="bracket-br" /><h4 className="system-text text-[10px] text-accent font-black italic mb-6 bg-accent/10 px-3 py-1 rounded-sm uppercase uppercase uppercase uppercase uppercase">WRIKE P2</h4><h3 className="text-xl font-black mb-4 text-white uppercase tracking-tight italic uppercase uppercase uppercase uppercase">Ingestion</h3><div className="space-y-2 uppercase uppercase uppercase uppercase uppercase">
                      <div className="flex justify-between text-[10px] font-black uppercase uppercase uppercase uppercase uppercase tracking-widest"><span>STATUS</span><span className="text-accent uppercase uppercase uppercase uppercase">72%</span></div><div className="h-1 bg-white/5 w-full"><div className="h-full bg-accent w-[72%]" /></div></div></div>
                   </div>
                </div>
              )}
           </div>
        </main>

        <footer className={`h-8 border-t border-white/10 bg-black/95 flex items-center justify-center gap-6 px-10 shrink-0 transition-transform duration-700 ${isMaximized ? 'translate-y-full' : ''} z-50 uppercase uppercase uppercase`}>
           <div className="flex items-center gap-1 bg-white/[0.01] border border-white/10 p-0.5 h-5 uppercase uppercase">
              {["BRIDGE", "READY_ROOM", "MISSIONS", "DOCTRINE", "SETTINGS"].map(id => (
                <button key={id} onClick={() => setActiveModule(id as Module)} className={`px-6 system-text text-[9px] font-black uppercase transition-all relative overflow-hidden group min-w-[140px] h-full ${activeModule === id ? 'text-white bg-accent/20' : 'text-white/20 hover:text-white/60 uppercase'}`}><span className="relative z-10 italic uppercase uppercase">{id.replace("_", " ")}</span>{activeModule === id && <div className="absolute bottom-0 left-0 h-0.5 w-full bg-accent shadow-[0_-5px_40px_rgba(0,212,255,0.5)] uppercase uppercase" />}</button>
              ))}
           </div>
           <div className="absolute right-10 flex flex-col items-end gap-0 opacity-40 uppercase uppercase uppercase uppercase">
              <span className="system-text text-[7px] font-black italic uppercase uppercase tracking-widest uppercase uppercase">39.1031° N // 84.5120° W</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
