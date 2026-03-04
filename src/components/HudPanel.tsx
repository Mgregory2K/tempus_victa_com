// src/components/HudPanel.tsx
import React from 'react';

interface HudPanelProps {
  title: string;
  value: string;
  subValue?: string;
  accentColor?: 'accent' | 'neon-green';
}

const HudPanel: React.FC<HudPanelProps> = ({ title, value, subValue, accentColor = 'accent' }) => {
  const accentClass = accentColor === 'accent' ? 'border-accent' : 'border-neon-green';
  const textClass = accentColor === 'accent' ? 'text-accent' : 'text-neon-green';

  return (
    <div className={`bg-black/40 backdrop-blur-sm p-4 rounded-lg border ${accentClass}/20 relative group shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
      <div className="bracket-tl" />
      <div className="bracket-br" />
      <h2 className="text-xs text-white/40 font-black uppercase tracking-widest">{title}</h2>
      <p className="text-2xl font-black text-white italic mt-1">{value}</p>
      {subValue && <p className={`text-xs font-black ${textClass} mt-1`}>{subValue}</p>}
    </div>
  );
};

export default HudPanel;
