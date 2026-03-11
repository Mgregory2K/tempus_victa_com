"use client";

import React, { useState, useEffect, useRef } from 'react';
import { VoiceButton, Message } from '@/app/page';

interface ReadyRoomProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    identityMemory?: any[];
    situationalState?: any[];
    patternSignals?: any[];
    apiKey: string;
    searchKey: string;
    assistantName: string;
    userName?: string;
    tasks?: any[];
    calendar?: any[];
    onMemoryUpdate?: (candidates: any[], lastUserMessage?: string) => void;
}

export default function ReadyRoom({
    messages,
    setMessages,
    identityMemory = [],
    situationalState = [],
    patternSignals = [],
    apiKey,
    searchKey,
    assistantName,
    userName,
    tasks = [],
    calendar = [],
    onMemoryUpdate
}: ReadyRoomProps) {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (overrideInput?: string) => {
        let text = overrideInput || input.trim();
        if (!text || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date().toISOString()
        };

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
                    userName,
                    apiKey,
                    searchKey,
                    tasks,
                    calendar,
                    identityMemory,
                    situationalState,
                    patternSignals
                }),
            });

            const data = await response.json();

            // 🧬 IDENTITY UPDATE
            if (data.candidateMemories && data.candidateMemories.length > 0) {
                onMemoryUpdate?.(data.candidateMemories, text);
            }

            const aiMsg: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: data.content,
                sourceLayer: data.sourceLayer,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Neural link fuzzy. Status maintained.",
                timestamp: new Date().toISOString(),
                sourceLayer: "Local Partner"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-black/40 rounded-xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex flex-col text-left">
                    <h2 className="system-text text-[10px] font-black tracking-[0.3em] text-accent uppercase">
                        {assistantName || "J5"} // Ready Room
                    </h2>
                    <span className="text-[6px] text-white/40 font-bold uppercase tracking-widest mt-1 italic">
                        Governed Cognitive Identity Mode
                    </span>
                </div>
            </div>

            {/* Messages Feed */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin bg-black/20">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="group relative max-w-[85%] md:max-w-[70%]">
                            <div className={`p-4 rounded-2xl border ${
                                msg.role === 'user' ? 'bg-accent/10 border-accent/30 rounded-tr-none' : 'bg-white/[0.03] border-white/10 rounded-tl-none'
                            } transition-all relative text-left`}>
                                <div className="flex justify-between items-center mb-2 gap-4">
                                    <span className={`system-text text-[7px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-accent' : 'text-white/40'}`}>
                                        {msg.role === 'user' ? `${userName || 'User'} // Root` : (msg.sourceLayer || 'Neural_Substrate')}
                                    </span>
                                </div>
                                <div className="text-[12px] font-medium leading-relaxed tracking-wide text-white/90 whitespace-pre-wrap">
                                    {msg.content}
                                </div>
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
                            placeholder={`Talk to ${assistantName || "J5"}...`}
                            className="w-full bg-transparent p-4 text-[13px] font-medium text-white outline-none resize-none placeholder:text-white/20 min-h-[56px] max-h-32 uppercase"
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
