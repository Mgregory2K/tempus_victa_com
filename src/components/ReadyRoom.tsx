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
    assistantName,
    initialMessage,
    onContextConsumed
}: {
    messages: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    apiKey: string,
    searchKey: string,
    geminiKey: string,
    assistantName: string,
    initialMessage?: string | null,
    onContextConsumed?: () => void
}) {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [matrixStage, setMatrixStage] = useState<'IDLE' | 'ENTERING' | 'EXITING'>('IDLE');
    const [isProtocolActive, setIsProtocolActive] = useState(false);
    const [protocolConfig, setProtocolConfig] = useState<ProtocolConfig | null>(null);
    const [forceLocal, setForceLocal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasConsumedInitial = useRef(false);

    // 🧬 BRAINSTORM HANDSHAKE
    useEffect(() => {
        if (initialMessage && !hasConsumedInitial.current) {
            hasConsumedInitial.current = true;
            handleSend(`[BRAINSTORM_CONTEXT]: ${initialMessage}`);
            onContextConsumed?.();
        }
    }, [initialMessage]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [externalMessages, isTyping]);

    const handleSend = async (overrideInput?: string) => {
        let text = overrideInput || input.trim();
        if (!text || isTyping) return;

        if (!overrideInput && text.length > 0) {
            text = text.charAt(0).toUpperCase() + text.slice(1);
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date().toISOString()
        };

        setExternalMessages(prev => [...prev, userMsg]);
        if (!overrideInput) setInput("");
        setIsTyping(true);

        try {
            const isBrainstorm = text.startsWith("[BRAINSTORM_CONTEXT]");
            const response = await fetch('/api/ready-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: externalMessages.slice(-10),
                    assistantName,
                    aiEnhanced: isProtocolActive || isBrainstorm,
                    apiKey,
                    searchKey,
                    geminiKey,
                    isBrainstorm,
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
        } catch (error) {
            setExternalMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Link's a bit fuzzy. Give me a second to re-establish.",
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
    };

    const exitProtocol = () => {
        setMatrixStage('EXITING');
        setTimeout(() => {
            setIsProtocolActive(false);
            setProtocolConfig(null);
            setMatrixStage('IDLE');
        }, 3000);
    };

    const renderContent = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
        const elements: React.ReactNode[] = [];
        const segments = content.split(/(\[[^\]]+\]\(https?:\/\/[^\s]+\)|https?:\/\/[^\s]+)/g);

        segments.forEach((seg, i) => {
            if (seg.match(markdownLinkRegex)) {
                const match = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/.exec(seg);
                if (match) {
                    elements.push(<a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-white transition-colors">{match[1]}</a>);
                }
            } else if (seg.match(urlRegex)) {
                elements.push(<a key={i} href={seg} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-white transition-colors">{seg}</a>);
            } else {
                elements.push(<span key={i}>{seg}</span>);
            }
        });

        return elements;
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
                        <div className="relative z-[5001] flex flex-col items-center gap-8">
                            <h2 className="system-text text-4xl font-black text-accent tracking-[0.5em] animate-pulse">INVOKING_PROTOCOL</h2>
                            <button onClick={confirmProtocolEntry} className="px-12 py-4 bg-accent text-black system-text text-xl font-black hover:bg-white transition-all">PROCEED</button>
                        </div>
                    )}
                    {matrixStage === 'EXITING' && (
                        <div className="relative z-[5001] flex flex-col items-center gap-8">
                            <h2 className="system-text text-4xl font-black text-red-500 tracking-[0.5em] animate-pulse">TERMINATING_SIMULATION</h2>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex flex-col">
                    <h2 className="system-text text-[10px] font-black tracking-[0.3em] text-accent uppercase">
                        {isProtocolActive ? "Protocol Simulation" : `${assistantName || "J5"} // Ready Room`}
                    </h2>
                    <span className="text-[6px] text-white/40 font-bold uppercase tracking-widest mt-1 italic">
                        {isProtocolActive ? "Active Insight Grid" : "Sovereign Partnership"}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setForceLocal(!forceLocal)} className={`px-3 py-1.5 border system-text text-[7px] font-black transition-all ${forceLocal ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-white/10 text-white/20'}`}>Local Only</button>
                    <button onClick={isProtocolActive ? exitProtocol : invokeProtocol} className={`px-4 py-1.5 border system-text text-[8px] font-black transition-all ${isProtocolActive ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-accent text-accent bg-accent/5 hover:bg-accent hover:text-black shadow-[0_0_15px_rgba(0,212,255,0.15)]'}`}>
                        {isProtocolActive ? "Terminate" : "Protocol"}
                    </button>
                </div>
            </div>

            {/* Messages Feed */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin bg-black/20">
                {externalMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                        <div className="group relative max-w-[85%] md:max-w-[70%]">
                            <div className={`p-4 rounded-2xl border ${
                                msg.role === 'user' ? 'bg-accent/10 border-accent/30 rounded-tr-none' : 'bg-white/[0.03] border-white/10 rounded-tl-none'
                            } transition-all relative`}>
                                <div className="flex justify-between items-center mb-2 gap-4">
                                    <span className={`system-text text-[7px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-accent' : 'text-white/40'}`}>
                                        {msg.role === 'user' ? 'Michael // Root' : (msg.sourceLayer || 'Neural_Substrate')}
                                    </span>
                                    <span className="text-[6px] text-white/20 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-[12px] font-medium leading-relaxed tracking-wide text-white/90 whitespace-pre-wrap">
                                    {renderContent(msg.content)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && <div className="flex items-center gap-2 opacity-40 animate-pulse ml-4"><div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" /></div>}
            </div>

            {/* Input Surface */}
            <div className="p-6 border-t border-white/10 bg-black/90 backdrop-blur-xl relative">
                <div className="max-w-4xl mx-auto flex items-end gap-4 relative">
                    <div className="flex-grow relative bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent/40 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isProtocolActive ? "Simulation Active..." : `Talk to ${assistantName || "J5"}...`}
                            className="w-full bg-transparent p-4 text-[13px] font-medium text-white outline-none resize-none placeholder:text-white/20 min-h-[56px] max-h-32"
                            rows={1}
                        />
                    </div>
                    <div className="flex items-center gap-3 shrink-0 mb-2">
                        <VoiceButton onTranscript={(t) => handleSend(t)} isTyping={isTyping} size="md" />
                        <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${input.trim() && !isTyping ? 'bg-accent border-accent text-black shadow-[0_0_20px_rgba(0,212,255,0.3)]' : 'border-white/10 text-white/20'}`}>
                            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
