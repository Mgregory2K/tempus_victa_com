"use client";

import React, { useState, useEffect, useRef } from 'react';
import { VoiceButton } from '@/app/page';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceLayer?: string;
  vote?: number | null;
  wrongSource?: boolean;
}

interface ProtocolConfig {
    intent: string;
    issue: string;
    figures: string[];
}

export default function ReadyRoom({
    messages: externalMessages,
    setMessages: setExternalMessages,
    apiKey,
    searchKey,
    geminiKey,
    assistantName
}: {
    messages: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    apiKey: string,
    searchKey: string,
    geminiKey: string,
    assistantName: string
}) {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [matrixStage, setMatrixStage] = useState<'IDLE' | 'ENTERING' | 'EXITING'>('IDLE');
    const [isProtocolActive, setIsProtocolActive] = useState(false);
    const [protocolConfig, setProtocolConfig] = useState<ProtocolConfig | null>(null);
    const [forceLocal, setForceLocal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [externalMessages, isTyping]);

    const handleSend = async (overrideInput?: string) => {
        const text = overrideInput || input.trim();
        if (!text || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date().toISOString()
        };

        setExternalMessages(prev => [...prev, userMsg]);
        if (!overrideInput) setInput("");
        setIsTyping(true);

        // Twin+ Observation
        twinPlusKernel.observe(createEvent('SIGNAL_INPUT', { content: text, protocolActive: isProtocolActive }, 'READY_ROOM'));

        try {
            const response = await fetch('/api/ready-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: externalMessages.slice(-15), // increased history for better memory
                    assistantName,
                    aiEnhanced: isProtocolActive,
                    apiKey,
                    searchKey,
                    geminiKey,
                    protocolParams: isProtocolActive ? protocolConfig : null,
                    identityProfile: twinPlusKernel.snapshot().features?.identity,
                    forceLocal: forceLocal
                }),
            });
            const data = await response.json();

            const aiMsg: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: data.content,
                sourceLayer: data.sourceLayer,
                timestamp: new Date().toISOString()
            };

            setExternalMessages(prev => [...prev, aiMsg]);

            // Log success to Twin+
            twinPlusKernel.observe(createEvent('ENTROPY_REDUCED', {
                source: data.sourceLayer,
                length: data.content.length
            }, 'READY_ROOM'));

        } catch (error) {
            setExternalMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "NEURAL_LINK_HAZY. TRY_AGAIN_LATER.",
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFeedback = (msgId: string, type: 'UP' | 'DOWN' | 'WRONG_SOURCE') => {
        setExternalMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            if (type === 'UP') return { ...m, vote: m.vote === 1 ? null : 1 };
            if (type === 'DOWN') return { ...m, vote: m.vote === -1 ? null : -1 };
            if (type === 'WRONG_SOURCE') return { ...m, wrongSource: !m.wrongSource };
            return m;
        }));

        twinPlusKernel.observe(createEvent('INTENT_ROUTED', {
            messageId: msgId,
            feedback: type
        }, 'READY_ROOM'));
    };

    const invokeProtocol = () => {
        setMatrixStage('ENTERING');
        setProtocolConfig({
            intent: "Strategic Deliberation",
            issue: "High-Fidelity Simulation",
            figures: ["Socratic", "Spock", "Kirk"]
        });
    };

    const confirmProtocolEntry = () => {
        setIsProtocolActive(true);
        setMatrixStage('IDLE');
        handleSend("INITIATE_PROTOCOL_SIMULATION");
        twinPlusKernel.observe(createEvent('PROTOCOL_INVOKED', { config: protocolConfig }, 'READY_ROOM'));
    };

    const exitProtocol = () => {
        setMatrixStage('EXITING');
        twinPlusKernel.observe(createEvent('PROTOCOL_TERMINATED', {}, 'READY_ROOM'));
        setTimeout(() => {
            setIsProtocolActive(false);
            setProtocolConfig(null);
            setMatrixStage('IDLE');
        }, 3000);
    };

    const brainBreak = () => {
        if (confirm("Initiate Brain Break? This will clear current session memory.")) {
            setExternalMessages([]);
            twinPlusKernel.observe(createEvent('ENTROPY_REDUCED', { action: 'BRAIN_BREAK' }, 'READY_ROOM'));
        }
    };

    const exportConversation = () => {
        const text = externalMessages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ready_room_export_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-black/40 rounded-xl border border-white/10 shadow-2xl">
            {/* Matrix Rain Overlay */}
            {matrixStage !== 'IDLE' && (
                <div className="fixed inset-0 z-[5000] bg-black/95 flex flex-col items-center justify-center">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="matrix-container opacity-60">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <div key={i} className="matrix-column" style={{ left: `${i * 2.5}%`, animationDuration: `${1 + Math.random() * 3}s` }}>
                                    {Array.from({ length: 30 }).map((_, j) => (
                                        <span key={j} className="system-text text-[10px] text-accent animate-pulse block">
                                            {String.fromCharCode(0x30A0 + Math.random() * 96)}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {matrixStage === 'ENTERING' && (
                        <div className="relative z-[5001] flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000">
                            <h2 className="system-text text-4xl font-black text-accent tracking-[0.5em] animate-pulse text-center px-4">INVOKING_PROTOCOL</h2>
                            <button
                                onClick={confirmProtocolEntry}
                                className="px-12 py-4 bg-accent text-black system-text text-xl font-black hover:bg-white transition-all shadow-[0_0_30px_var(--accent)] active:scale-95"
                            >
                                PROCEED
                            </button>
                        </div>
                    )}

                    {matrixStage === 'EXITING' && (
                        <div className="relative z-[5001] flex flex-col items-center gap-8 animate-out fade-out zoom-out duration-1000">
                            <h2 className="system-text text-4xl font-black text-red-500 tracking-[0.5em] animate-pulse text-center px-4">TERMINATING_SIMULATION</h2>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex flex-col">
                    <h2 className="system-text text-[10px] font-black tracking-[0.3em] text-accent uppercase">
                        {isProtocolActive ? "Ready Room // Protocol Active" : `${assistantName || "Twin+"} // Ready Room`}
                    </h2>
                    <span className="text-[6px] text-white/40 font-bold uppercase tracking-widest mt-1">
                        {isProtocolActive ? "SIMULATION_MODE_ENGAGED" : "Sovereign_Cognition_Layer"}
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={exportConversation} title="Export Transcript" className="p-2 text-white/20 hover:text-accent transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                    <button onClick={brainBreak} title="Brain Break" className="p-2 text-white/20 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button
                        onClick={() => setForceLocal(!forceLocal)}
                        className={`px-3 py-1.5 border system-text text-[7px] font-black transition-all uppercase ${forceLocal ? 'border-orange-500 text-orange-500 bg-orange-500/5 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'border-white/10 text-white/20 hover:border-white/40'}`}
                    >
                        Local_Only
                    </button>
                    <button
                        onClick={isProtocolActive ? exitProtocol : invokeProtocol}
                        className={`px-4 py-1.5 border system-text text-[8px] font-black transition-all uppercase ${isProtocolActive ? 'border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white' : 'border-accent text-accent bg-accent/5 hover:bg-accent hover:text-black shadow-[0_0_15px_rgba(0,212,255,0.15)]'}`}
                    >
                        {isProtocolActive ? "Terminate" : "Protocol"}
                    </button>
                </div>
            </div>

            {/* Messages Feed */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.02),transparent_70%)]">
                {externalMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <div className="h-24 w-24 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <span className="system-text text-3xl font-black text-white/40">Σ</span>
                        </div>
                        <p className="system-text text-[10px] tracking-[0.4em] italic uppercase">Awaiting Neural Signal...</p>
                    </div>
                )}

                {externalMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                        <div className={`group relative max-w-[85%] md:max-w-[70%]`}>
                            {/* Android Bubble Style */}
                            <div className={`p-4 rounded-2xl border ${
                                msg.role === 'user'
                                ? 'bg-accent/10 border-accent/30 rounded-tr-none text-right shadow-[0_0_20px_rgba(0,212,255,0.05)]'
                                : 'bg-white/[0.03] border-white/10 rounded-tl-none text-left backdrop-blur-sm'
                            } transition-all duration-300 relative`}>

                                {/* AI Sparkles Effect */}
                                {msg.role === 'assistant' && msg.sourceLayer?.includes('NEURAL') && (
                                    <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-transparent to-purple-500/20 blur-lg rounded-2xl -z-10 animate-pulse" />
                                )}

                                <div className="flex justify-between items-center mb-2 gap-4">
                                    <span className={`system-text text-[7px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-accent' : 'text-white/40'}`}>
                                        {msg.role === 'user' ? 'Michael // Root' : (msg.sourceLayer || 'Neural_Substrate')}
                                    </span>
                                    <span className="text-[6px] text-white/20 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-[12px] font-medium leading-relaxed tracking-wide text-white/90 whitespace-pre-wrap">
                                    {msg.content}
                                </p>

                                {/* Feedback Floating Controls */}
                                {msg.role === 'assistant' && (
                                    <div className="absolute -bottom-10 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 bg-black/60 rounded-lg border border-white/10 backdrop-blur-xl">
                                        <button onClick={() => handleFeedback(msg.id, 'UP')} className={`p-1.5 rounded transition-all hover:bg-white/10 ${msg.vote === 1 ? 'text-neon-green scale-110' : 'text-white/20 hover:text-neon-green'}`} title="Helpful">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
                                        </button>
                                        <button onClick={() => handleFeedback(msg.id, 'DOWN')} className={`p-1.5 rounded transition-all hover:bg-white/10 ${msg.vote === -1 ? 'text-red-500 scale-110' : 'text-white/20 hover:text-red-500'}`} title="Off-Target">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
                                        </button>
                                        <button onClick={() => handleFeedback(msg.id, 'WRONG_SOURCE')} className={`p-1.5 rounded transition-all hover:bg-white/10 ${msg.wrongSource ? 'text-orange-500 scale-110' : 'text-white/20 hover:text-orange-500'}`} title="Stale Source">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-center gap-3 opacity-40 animate-pulse ml-4">
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
            </div>

            {/* Input Surface */}
            <div className="p-6 border-t border-white/10 bg-black/90 backdrop-blur-xl relative">
                <div className="max-w-4xl mx-auto flex items-end gap-4 relative">
                    <div className="flex-grow relative bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent/40 focus-within:bg-white/[0.05] transition-all shadow-inner">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isProtocolActive ? "PROTOCOL_ACTIVE: Command_Simulation..." : forceLocal ? "Local Sovereign Access..." : `Talk to ${assistantName || "Twin+"}...`}
                            className="w-full bg-transparent p-4 text-[13px] font-medium text-white outline-none resize-none placeholder:text-white/20 min-h-[56px] max-h-32"
                            rows={1}
                        />
                    </div>
                    <div className="flex items-center gap-3 shrink-0 mb-2">
                        <VoiceButton onTranscript={(t) => handleSend(t)} isTyping={isTyping} size="md" />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${input.trim() && !isTyping ? 'bg-accent border-accent text-black shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-105 active:scale-90' : 'border-white/10 text-white/20'}`}
                        >
                            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
