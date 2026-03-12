"use client";

import React from 'react';

/**
 * STARSHIP TELEMETRY CHARTING SUITE
 * Visual language: Cyber-deck / Mission Control / Minimalist High-Density
 */

export const MiniBarChart = ({ data, color = "var(--accent)" }: { data: number[], color?: string }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-0.5 h-8 w-full">
            {data.map((v, i) => (
                <div
                    key={i}
                    className="flex-grow transition-all duration-500"
                    style={{
                        height: `${(v / max) * 100}%`,
                        backgroundColor: color,
                        opacity: 0.3 + (v / max) * 0.7
                    }}
                />
            ))}
        </div>
    );
};

export const SparkLine = ({ data, color = "var(--accent)" }: { data: number[], color?: string }) => {
    if (data.length < 2) return <div className="h-8 w-full border-b border-white/5" />;
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                className="drop-shadow-[0_0_5px_var(--accent)]"
            />
        </svg>
    );
};

export const HeatMap = ({ data }: { data: number[] }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="grid grid-cols-12 gap-1 w-full">
            {data.map((v, i) => (
                <div
                    key={i}
                    className="aspect-square relative group"
                    style={{
                        backgroundColor: `rgba(0, 212, 255, ${v / max})`,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black border border-accent p-1 text-[6px] z-50 whitespace-nowrap">
                        HR {i}: {v} EVENTS
                    </div>
                </div>
            ))}
        </div>
    );
};

export const StatusIndicator = ({ value, label, status = "NOMINAL" }: { value: string | number, label: string, status?: "NOMINAL" | "DEGRADED" | "ATTENTION" }) => {
    const colors = {
        NOMINAL: "text-neon-green",
        DEGRADED: "text-yellow-500",
        ATTENTION: "text-red-500"
    };
    return (
        <div className="flex flex-col border-r border-white/10 px-4 last:border-none">
            <span className={`text-[10px] font-black italic ${colors[status]}`}>{status}</span>
            <span className="text-lg font-black text-white leading-none">{value}</span>
            <span className="text-[6px] text-white/30 uppercase tracking-widest font-bold">{label}</span>
        </div>
    );
};
