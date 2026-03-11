"use client";

import React, { useState, useEffect, useRef } from 'react';
import { VoiceButton, Message, Chat, ChatSegment } from '@/app/page';

interface ReadyRoomProps {
    chats: Chat[];
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    projects: { id: string, title: string }[];
    identityMemory?: any[];
    situationalState?: any[];
    apiKey: string;
    searchKey: string;
    assistantName: string;
    userName?: string;
    tasks?: any[];
    calendar?: any[];
    onMemoryUpdate?: (candidates: any[], lastUserMessage?: string) => void;
    twinProjection?: any; // Sovereign Identity Projection
}

export default function ReadyRoom({
    chats = [], setChats, activeChatId, setActiveChatId, projects = [],
    identityMemory, situationalState, apiKey, searchKey, assistantName, userName, tasks, calendar, onMemoryUpdate,
    twinProjection
}: ReadyRoomProps) {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [activeScope, setActiveScope] = useState<string>("READY_ROOM_PROTOCOL");
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize first chat if none exists
    useEffect(() => {
        if (chats.length === 0) {
            createNewChat();
        } else if (!activeChatId) {
            const lastChat = chats.find(c => c.scopeId === activeScope);
            if (lastChat) setActiveChatId(lastChat.id);
            else createNewChat();
        }
    }, [chats.length, activeChatId]);

    const createNewChat = (scopeId: string = activeScope) => {
        const newChat: Chat = {
            id: Date.now().toString(),
            title: `Neural Link ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            scopeId: scopeId,
            segments: [{ id: 'seg_' + Date.now(), messages: [], attachments: [], isSealed: false, timestamp: new Date().toISOString() }],
            updatedAt: new Date().toISOString()
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
    };

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const filteredChats = chats.filter(c => c.scopeId === activeScope);
    const currentSegment = activeChat?.segments.find(s => !s.isSealed) || activeChat?.segments[activeChat?.segments.length - 1];

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [activeChat, isTyping]);

    const handleSend = async (overrideInput?: string) => {
        let text = overrideInput || input.trim();
        if (!text || isTyping || !activeChat) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date().toISOString() };

        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => s.id === currentSegment?.id ? { ...s, messages: [...s.messages, userMsg] } : s),
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
                    history: currentSegment?.messages.slice(-10) || [],
                    assistantName, userName, apiKey, searchKey, tasks, calendar, identityMemory, situationalState,
                    twinProjection, // SOVEREIGN IDENTITY INJECTION
                    protocolParams: activeScope === "READY_ROOM_PROTOCOL" ? { mode: "MODERATED" } : null
                }),
            });

            const data = await response.json();
            if (data.candidateMemories) onMemoryUpdate?.(data.candidateMemories, text);

            const aiMsg: Message = { id: Date.now().toString(), role: "assistant", content: data.content, sourceLayer: data.sourceLayer, timestamp: new Date().toISOString() };

            setChats(prev => prev.map(c => c.id === activeChatId ? {
                ...c,
                segments: c.segments.map(s => s.id === currentSegment?.id ? { ...s, messages: [...s.messages, aiMsg] } : s)
            } : c));
        } catch (error) {
            console.error("Neural link fuzzy");
        } finally { setIsTyping(false); }
    };

    const handleRename = () => {
        if (!tempTitle.trim()) { setIsRenaming(false); return; }
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title: tempTitle } : c));
        setIsRenaming(false);
    };

    const handleVote = (msgId: string, value: number) => {
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => ({
                ...s,
                messages: s.messages.map(m => m.id === msgId ? { ...m, vote: value } : m)
            }))
        } : c));
    };

    const addPageBreak = () => {
        if (!activeChat) return;
        const newSeg: ChatSegment = { id: 'seg_' + Date.now(), messages: [], attachments: [], isSealed: false, timestamp: new Date().toISOString() };
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => ({ ...s, isSealed: true })).concat(newSeg)
        } : c));
    };

    const clearActiveSegment = () => {
        setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            segments: c.segments.map(s => s.id === currentSegment?.id ? { ...s, messages: [] } : s)
        } : c));
    };

    const exportSegment = (segment: ChatSegment) => {
        const transcript = segment.messages.map(m => `[${m.role.toUpperCase()}] ${m.content}${m.vote ? ` (Vote: ${m.vote})` : ''}`).join('\n\n');
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `J5_Segment_${segment.id}.txt`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative text-white">
            {/* Hierarchical Navigation */}
            <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex flex-col gap-1">
                    <label className="text-[6px] text-white/40 font-black uppercase tracking-widest">Cognitive Scope</label>
                    <select value={activeScope} onChange={(e) => {
                        setActiveScope(e.target.value);
                        const firstChat = chats.find(c => c.scopeId === e.target.value);
                        if (firstChat) setActiveChatId(firstChat.id);
                        else createNewChat(e.target.value);
                    }} className="bg-[#111] border border-white/10 text-accent text-[9px] font-black uppercase p-1.5 outline-none rounded cursor-pointer hover:border-accent/40 transition-colors">
                        <option value="READY_ROOM_PROTOCOL" className="bg-[#111] text-white">Ready Room Protocol</option>
                        {projects.map(p => <option key={p.id} value={p.id} className="bg-[#111] text-white">Project: {p.title}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[6px] text-white/40 font-black uppercase tracking-widest">Active Neural Link</label>
                    <div className="flex gap-2">
                        {isRenaming ? (
                            <input autoFocus value={tempTitle} onChange={e => setTempTitle(e.target.value)} onBlur={handleRename} onKeyDown={e => e.key === 'Enter' && handleRename()} className="bg-black/60 border border-accent/40 text-white text-[9px] font-black uppercase p-1 outline-none rounded" />
                        ) : (
                            <select value={activeChatId || ""} onChange={(e) => setActiveChatId(e.target.value)} onDoubleClick={() => { setTempTitle(activeChat?.title || ""); setIsRenaming(true); }} className="bg-[#111] border border-white/10 text-white/80 text-[9px] font-black uppercase p-1.5 outline-none rounded min-w-[140px] cursor-pointer hover:border-white/30 transition-colors">
                                {filteredChats.map(c => <option key={c.id} value={c.id} className="bg-[#111] text-white">{c.title}</option>)}
                                {filteredChats.length === 0 && <option value="" className="bg-[#111] text-white/40">No Chats Found</option>}
                            </select>
                        )}
                        <button onClick={() => createNewChat()} className="bg-accent/10 border border-accent/20 px-3 text-accent text-[10px] font-black uppercase hover:bg-accent hover:text-black transition-all rounded" title="Initialize New Chat">+</button>
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <button onClick={addPageBreak} className="text-[8px] font-black text-white/40 hover:text-accent uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded italic transition-colors">Add Page Break</button>
                    <button onClick={clearActiveSegment} className="text-[8px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest border border-red-500/10 px-3 py-1.5 rounded transition-colors">Clear Current</button>
                </div>
            </div>

            {/* Segmented Messages Feed */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-12 scrollbar-thin bg-black/20">
                {activeChat?.segments.map((seg, sIdx) => (
                    <div key={seg.id} className="relative">
                        {sIdx > 0 && <div className="border-t border-dashed border-white/10 my-12 flex justify-center"><span className="bg-black px-4 text-[7px] text-white/20 uppercase tracking-[0.5em] -mt-[5px]">PAGE BREAK // SEALED SEGMENT</span></div>}
                        <div className="space-y-10">
                            {seg.messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`group relative p-4 rounded-2xl border max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-accent/10 border-accent/30' : 'bg-white/[0.03] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'}`}>
                                        <div className="flex justify-between items-center mb-2 gap-4">
                                            <span className={`system-text text-[7px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-accent' : 'text-white/40'}`}>{msg.sourceLayer || msg.role}</span>
                                            {msg.role === 'assistant' && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleVote(msg.id, 1)} title="Good response" className={`text-[10px] transition-all transform hover:scale-120 ${msg.vote === 1 ? 'grayscale-0 brightness-150' : 'grayscale opacity-30 hover:opacity-100'}`}>👍</button>
                                                    <button onClick={() => handleVote(msg.id, -1)} title="Bad response" className={`text-[10px] transition-all transform hover:scale-120 ${msg.vote === -1 ? 'grayscale-0 brightness-150' : 'grayscale opacity-30 hover:opacity-100'}`}>👎</button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[12px] font-medium leading-relaxed text-white/90 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => exportSegment(seg)} className="text-[7px] font-black text-white/20 hover:text-accent uppercase tracking-widest border border-white/5 px-2 py-1 rounded transition-colors bg-white/5">Export Segment 📥</button>
                        </div>
                    </div>
                ))}
                {isTyping && <div className="flex items-center gap-2 opacity-40 animate-pulse ml-4"><div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" /></div>}
            </div>

            {/* Input Surface */}
            <div className="p-6 border-t border-white/10 bg-black/90 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto flex items-end gap-4">
                    <div className="flex-grow relative bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent/40 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Talk to ${assistantName}...`} className="w-full bg-transparent p-4 text-[13px] text-white outline-none resize-none placeholder:text-white/10 uppercase font-bold" rows={1} />
                    </div>
                    <VoiceButton onTranscript={handleSend} isTyping={isTyping} size="md" />
                    <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${input.trim() && !isTyping ? 'bg-accent border-accent text-black shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-105 active:scale-95' : 'border-white/10 text-white/20'}`}>
                        <span className="font-black text-lg">»</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
