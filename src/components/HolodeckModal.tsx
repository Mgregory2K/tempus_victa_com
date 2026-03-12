"use client";

import React, { useState, useEffect } from 'react';
import { HolodeckMode, HolodeckModerator } from '@/types/holodeck';
import MatrixRain from './MatrixRain';

interface HolodeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoke: (config: HolodeckConfig) => void;
}

export interface HolodeckConfig {
  topic: string;
  members: string[];
  moderator: string;
  mode: string;
  roundLimit?: number;
}

export default function HolodeckModal({ isOpen, onClose, onInvoke }: HolodeckModalProps) {
  const [topic, setTopic] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [moderator, setModerator] = useState("j5");
  const [mode, setMode] = useState("freeform_discussion");
  const [roundLimit, setRoundLimit] = useState<number | undefined>(undefined);

  const [availableModes, setAvailableModes] = useState<HolodeckMode[]>([]);
  const [availableModerators, setAvailableModerators] = useState<HolodeckModerator[]>([]);

  useEffect(() => {
    // In a real app, these might be fetched from an API
    // For now, we'll use the seeds we created or hardcode defaults
    const modes = [
      { id: "freeform_discussion", name: "Freeform Discussion", description: "Loose, exploratory, user-driven discussion." },
      { id: "decision_support", name: "Decision Support", description: "Practical, outcome-oriented." },
      { id: "debate", name: "Debate", description: "Direct conflict." },
      { id: "writing_workshop", name: "Writing Workshop", description: "Critique and technical feedback." },
      { id: "philosophical_inquiry", name: "Philosophical Inquiry", description: "Deeper reflection." },
      { id: "scenario_stress_test", name: "Scenario Stress Test", description: "Testing ideas under pressure." }
    ];
    const moderators = [
      { id: "j5", name: "J5", description: "Default moderator AI." },
      { id: "socrates", name: "Socrates", description: "Probing, dialectical." },
      { id: "christopher_hitchens", name: "Christopher Hitchens", description: "Combative, articulate." },
      { id: "william_f_buckley_jr", name: "William F. Buckley Jr.", description: "Formal, erudite." }
    ];
    setAvailableModes(modes);
    setAvailableModerators(moderators);
  }, []);

  if (!isOpen) return null;

  const addMember = () => {
    if (memberInput.trim() && !members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()]);
      setMemberInput("");
    }
  };

  const removeMember = (m: string) => {
    setMembers(members.filter(member => member !== m));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MatrixRain opacity={0.2} />
      </div>

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/20 rounded-xl shadow-[0_0_50px_rgba(0,255,0,0.1)] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-accent text-xl font-black uppercase tracking-widest">Invoke Holodeck</h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Simulation Protocol v3.1</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl font-light">×</button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Topic */}
          <div className="space-y-2">
            <label className="text-[10px] text-accent font-black uppercase tracking-widest">Topic / Central Question</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g. The future of writing in the age of AI..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-accent/40 outline-none resize-none h-20 uppercase font-bold"
            />
          </div>

          {/* Members (Tokenized Chips) */}
          <div className="space-y-2">
            <label className="text-[10px] text-accent font-black uppercase tracking-widest">Participants (Members)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {members.map(m => (
                <div key={m} className="bg-accent/10 border border-accent/30 rounded px-2 py-1 flex items-center gap-2 group">
                  <span className="text-[10px] font-black uppercase text-accent">{m}</span>
                  <button onClick={() => removeMember(m)} className="text-accent/40 hover:text-accent font-bold">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                placeholder="Enter member name..."
                className="flex-grow bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-accent/40 outline-none uppercase font-bold"
              />
              <button onClick={addMember} className="bg-accent/10 border border-accent/20 px-4 text-accent text-[10px] font-black uppercase hover:bg-accent hover:text-black transition-all rounded">Add</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Moderator */}
            <div className="space-y-2">
              <label className="text-[10px] text-accent font-black uppercase tracking-widest">Moderator</label>
              <select
                value={moderator}
                onChange={(e) => setModerator(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white text-[11px] font-black uppercase p-2.5 outline-none rounded cursor-pointer hover:border-accent/40 transition-colors"
              >
                {availableModerators.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <label className="text-[10px] text-accent font-black uppercase tracking-widest">Simulation Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white text-[11px] font-black uppercase p-2.5 outline-none rounded cursor-pointer hover:border-accent/40 transition-colors"
              >
                {availableModes.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Round Limit */}
          <div className="space-y-2">
            <label className="text-[10px] text-accent font-black uppercase tracking-widest">Round Limit (Optional)</label>
            <input
              type="number"
              value={roundLimit || ""}
              onChange={(e) => setRoundLimit(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Infinite"
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-accent/40 outline-none uppercase font-bold"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors tracking-widest">Cancel</button>
          <button
            onClick={() => onInvoke({ topic, members, moderator, mode, roundLimit })}
            disabled={!topic || members.length === 0}
            className={`px-10 py-3 rounded-lg text-[12px] font-black uppercase tracking-[0.2em] transition-all ${(!topic || members.length === 0) ? 'bg-white/5 text-white/10' : 'bg-accent text-black shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-105 active:scale-95'}`}
          >
            Invoke Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
