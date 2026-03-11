"use client";

import React, { useState, useEffect, useRef } from 'react';
import { VoiceButton, Message, Chat, ChatSegment } from '@/app/page';

interface ReadyRoomProps {
    chats: Chat[];
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    identityMemory?: any[];
    situationalState?: any[];
    apiKey: string;
    searchKey: string;
    assistantName: string;
    userName?: string;
    tasks?: any[];
    calendar?: any[];
    onMemoryUpdate?: (candidates: any[], lastUserMessage?: string) => void;
}

export default function ReadyRoom({
    chats = [], setChats, activeChatId, setActiveChatId,
    identityMemory, situationalState, apiKey, searchKey, assistantName, userName, tasks, calendar, onMemoryUpdate
}: ReadyRoomProps) {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize first chat if none exists
    useEffect(() => {
        if (chats.length === 0) {
            const newChat: Chat = {
                id: Date.now().toString(),
                title: "New Session",
                segments: [{ id: 'seg_1', messages: [], attachments: [], isSealed: false, timestamp: new Date().toISOString() }],
                updatedAt: new Date().toISOString()
            };
            setChats([newChat]);
            setActiveChatId(newChat.id);
        } else if (!activeChatId) {
            setActiveChatId(chats[0].id);
        }
    }, [chats, activeChatId, setActiveChatId, setChats]);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const segments = activeChat?.segments || [];
    const currentSegment = segments.find(s => !s.isSealed) || segments[segments.length - 1];

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [activeChat, isTyping]);

    const handleSend = async (overrideInput?: string) => {
        let text = overrideInput || input.trim();
        if (!text || isTyping || !activeChat) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date().toISOString() };

        // Update Local State (Immediate)
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => s.id === currentSegment.id ? { ...s, messages: [...s.messages, userMsg] } : s),
            updatedAt: new Date().toISOString()
        } : c));

        if (!overrideInput) setInput("");
        setIsTyping(true);

        try {
            const response = await fetch('/api/ready-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: currentSegment.messages.slice(-10), // Segment-constrained context
                    assistantName, userName, apiKey, searchKey, tasks, calendar, identityMemory, situationalState
                }),
            });

            const data = await response.json();
            if (data.candidateMemories) onMemoryUpdate?.(data.candidateMemories, text);

            const aiMsg: Message = { id: Date.now().toString(), role: "assistant", content: data.content, sourceLayer: data.sourceLayer, timestamp: new Date().toISOString() };

            setChats(prev => prev.map(c => c.id === activeChatId ? {
                ...c,
                segments: c.segments.map(s => s.id === currentSegment.id ? { ...s, messages: [...s.messages, aiMsg] } : s)
            } : c));
        } catch (error) {
            console.error("Neural link fuzzy");
        } finally { setIsTyping(false); }
    };

    const addPageBreak = () => {
        if (!activeChat) return;
        const newSeg: ChatSegment = { id: Date.now().toString(), messages: [], attachments: [], isSealed: false, timestamp: new Date().toISOString() };
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => ({ ...s, isSealed: true })).concat(newSeg)
        } : c));
    };

    const clearSegmentHistory = () => {
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => s.id === currentSegment.id ? { ...s, messages: [] } : s)
        } : c));
    };

    const exportSegment = (segment: ChatSegment) => {
        const transcript = segment.messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `J5_Transcript_${segment.id}.txt`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative">
            {/* Nav Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <select value={activeChatId || ""} onChange={(e) => setActiveChatId(e.target.value)} className="bg-white/5 border border-white/10 text-accent text-[9px] font-black uppercase p-1 outline-none">
                        {chats.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <button onClick={addPageBreak} className="text-[8px] font-black text-white/40 hover:text-accent uppercase tracking-widest">+ Page Break</button>
                    <button onClick={clearSegmentHistory} className="text-[8px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest">Clear Current</button>
                </div>
                <span className="text-[6px] text-white/40 font-bold uppercase italic">Segmented Cognitive Engine v15.0</span>
            </div>

            {/* Segmented Messages Feed */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-12 scrollbar-thin bg-black/20">
                {activeChat?.segments.map((seg, sIdx) => (
                    <div key={seg.id} className="relative">
                        {sIdx > 0 && <div className="border-t border-dashed border-white/10 my-8 flex justify-center"><span className="bg-black px-4 text-[7px] text-white/20 uppercase tracking-[0.5em] -mt-[5px]">PAGE BREAK // SEALED BLOCK</span></div>}
                        <div className="space-y-8">
                            {seg.messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl border max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-accent/10 border-accent/30' : 'bg-white/[0.03] border-white/10'}`}>
                                        <span className={`system-text text-[7px] font-black uppercase mb-2 block ${msg.role === 'user' ? 'text-accent' : 'text-white/40'}`}>{msg.sourceLayer || msg.role}</span>
                                        <p className="text-[12px] font-medium leading-relaxed text-white/90 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => exportSegment(seg)} className="text-[7px] font-black text-white/20 hover:text-accent uppercase tracking-widest">Export Segment 📥</button>
                        </div>
                    </div>
                ))}
                {isTyping && <div className="flex items-center gap-2 opacity-40 animate-pulse ml-4"><div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" /></div>}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10 bg-black/90 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto flex items-end gap-4">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Talk to ${assistantName}...`} className="flex-grow bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[13px] text-white outline-none focus:border-accent/40 uppercase" rows={1} />
                    <VoiceButton onTranscript={handleSend} isTyping={isTyping} />
                    <button onClick={() => handleSend()} className="h-12 w-12 rounded-full bg-accent text-black flex items-center justify-center font-black">»</button>
                </div>
            </div>
        </div>
    );
}
