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
                    history: externalMessages.slice(-10),
                    assistantName,
                    aiEnhanced: isProtocolActive,
                    apiKey,
                    searchKey,
                    geminiKey,
                    protocolParams: isProtocolActive ? protocolConfig : null
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

            // Log successful response
            twinPlusKernel.observe(createEvent('ENTROPY_REDUCED', {
                source: data.sourceLayer,
                length: data.content.length
            }, 'READY_ROOM'));

        } catch (error) {
            setExternalMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "NEURAL_LINK_FAILURE. CHECK_COGNITIVE_CONFIG.",
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

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-black/20 rounded-lg border border-white/5">
            {/* Matrix Rain Overlay */}
            {matrixStage !== 'IDLE' && (
                <div className="fixed inset-0 z-[5000] bg-black/90 flex flex-col items-center justify-center">
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
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80">
                <div className="flex flex-col">
                    <h2 className="system-text text-[10px] font-black tracking-[0.3em] text-accent uppercase">
                        {isProtocolActive ? "Ready Room // Protocol Active" : "Ready Room // Command Center"}
                    </h2>
                    <span className="text-[6px] text-white/40 font-bold uppercase tracking-widest mt-1">
                        {isProtocolActive ? "SIMULATION_MODE_ENGAGED" : "Sovereign_Cognition_Layer"}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={isProtocolActive ? exitProtocol : invokeProtocol}
                        className={`px-4 py-1.5 border system-text text-[8px] font-black transition-all uppercase ${isProtocolActive ? 'border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white' : 'border-accent text-accent bg-accent/5 hover:bg-accent hover:text-black'}`}
                    >
                        {isProtocolActive ? "Terminate_Protocol" : "Invoke_Protocol"}
                    </button>
                </div>
            </div>

            {/* Messages Feed */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin">
                {externalMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <div className="h-20 w-20 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-4">
                            <span className="system-text text-2xl font-black text-white/40">Σ</span>
                        </div>
                        <p className="system-text text-[10px] tracking-widest italic uppercase">Awaiting Neural Signal...</p>
                    </div>
                )}

                {externalMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                        <div className={`max-w-[85%] p-4 rounded-none border ${msg.role === 'user' ? 'bg-accent/10 border-accent/30 text-right' : 'bg-white/5 border-white/10 text-left'} relative group`}>
                            <div className="flex justify-between items-center mb-2 gap-4">
                                <span className={`system-text text-[7px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-accent' : 'text-white/40'}`}>
                                    {msg.role === 'user' ? 'Identity_Origin' : (msg.sourceLayer || 'Neural_Substrate')}
                                </span>
                                <span className="text-[6px] text-white/20 font-bold">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[11px] font-bold italic leading-relaxed tracking-wide uppercase text-white/90 whitespace-pre-wrap">
                                {msg.content}
                            </p>

                            {/* Feedback Controls for AI Messages */}
                            {msg.role === 'assistant' && (
                                <div className="mt-4 flex gap-2 border-t border-white/5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleFeedback(msg.id, 'UP')} className={`text-[8px] font-black uppercase px-2 py-1 border ${msg.vote === 1 ? 'border-accent text-accent' : 'border-white/10 text-white/40'}`}>Helpful</button>
                                    <button onClick={() => handleFeedback(msg.id, 'DOWN')} className={`text-[8px] font-black uppercase px-2 py-1 border ${msg.vote === -1 ? 'border-red-500 text-red-500' : 'border-white/10 text-white/40'}`}>Off-Target</button>
                                    <button onClick={() => handleFeedback(msg.id, 'WRONG_SOURCE')} className={`text-[8px] font-black uppercase px-2 py-1 border ${msg.wrongSource ? 'border-orange-500 text-orange-500' : 'border-white/10 text-white/40'}`}>Stale_Source</button>
                                </div>
                            )}

                            <div className={`bracket-tl opacity-20 ${msg.role === 'user' ? 'border-accent' : ''}`} />
                            <div className={`bracket-br opacity-20 ${msg.role === 'user' ? 'border-accent' : ''}`} />
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-center gap-3 opacity-40 animate-pulse">
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
            </div>

            {/* Input Surface */}
            <div className="p-4 border-t border-white/10 bg-black/95 relative">
                <div className="max-w-4xl mx-auto flex items-end gap-4">
                    <div className="flex-grow relative bg-white/5 border border-white/10 rounded overflow-hidden focus-within:border-accent/40 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isProtocolActive ? "PROTOCOL_ACTIVE: Command_Simulation..." : "Input Neural Signal..."}
                            className="w-full bg-transparent p-3 text-[10px] font-bold text-white outline-none resize-none placeholder:text-white/20 uppercase"
                            rows={1}
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 h-10">
                        <VoiceButton onTranscript={(t) => handleSend(t)} isTyping={isTyping} size="sm" />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className={`h-full px-6 flex items-center justify-center border transition-all uppercase system-text text-[8px] font-black ${input.trim() && !isTyping ? 'border-accent text-accent hover:bg-accent hover:text-black' : 'border-white/10 text-white/20'}`}
                        >
                            Execute
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
