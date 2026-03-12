"use client";

import React from 'react';
import { HolodeckProfile } from '@/types/holodeck';

interface ParticipantPopupProps {
  profile: HolodeckProfile;
  onClose: () => void;
  position: { x: number, y: number };
}

export default function ParticipantPopup({ profile, onClose, position }: ParticipantPopupProps) {
  return (
    <div
      className="fixed z-[100] w-64 bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl p-4 transition-all animate-in fade-in zoom-in duration-200"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-accent text-[12px] font-black uppercase tracking-widest">{profile.display_name}</h3>
          <p className="text-[8px] text-white/40 font-bold uppercase">{profile.entity_type.replace(/_/g, ' ')}</p>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white text-sm">×</button>
      </div>

      <div className="space-y-2">
        {profile.preview_bullets.map((bullet, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-accent text-[10px]">•</span>
            <p className="text-[10px] text-white/80 leading-tight italic">{bullet}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center">
        <span className="text-[7px] text-white/20 uppercase font-black">Confidence</span>
        <span className="text-[8px] text-accent font-black">{(profile.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
