// src/components/Winboard.tsx
"use client";

import React, { useState } from 'react';
import { twinPlusKernel } from '@/core/twin_plus/twin_plus_kernel';
import { createEvent } from '@/core/twin_plus/twin_event';

interface Task {
    id: string;
    title: string;
    priority: 'HIGH' | 'MED' | 'LOW';
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
    source: string;
}

export default function Winboard() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Refactor Doctrine Engine for Volume IV', priority: 'HIGH', status: 'IN_PROGRESS', source: 'Internal' },
        { id: '2', title: 'Implement Trust Mathematics Decay', priority: 'HIGH', status: 'TODO', source: 'Manual' },
        { id: '3', title: 'Setup local-first SQLite/Drift backup', priority: 'MED', status: 'BACKLOG', source: 'Wrike' },
        { id: '4', title: 'HUD Aesthetic Polish (Glow FX)', priority: 'LOW', status: 'DONE', source: 'User' },
    ]);

    const columns: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'];

    const moveTask = (taskId: string, newStatus: Task['status']) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const oldStatus = task.status;
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        // Emit Twin+ Event
        if (newStatus === 'DONE') {
            twinPlusKernel.observe(createEvent('TASK_COMPLETED', {
                taskId,
                title: task.title,
                source: task.source
            }, 'WINBOARD'));
        } else {
            twinPlusKernel.observe(createEvent('ACTION_CREATED', {
                action: 'MOVE_TASK',
                taskId,
                from: oldStatus,
                to: newStatus
            }, 'WINBOARD'));
        }
    };

    const renderColumn = (status: Task['status']) => (
        <div key={status} className="flex flex-col gap-4 min-w-[280px] flex-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 px-2">
                <div className="flex items-center gap-3">
                    <span className="system-text text-[10px] font-black text-white/40">{status.replace('_', ' ')}</span>
                    <span className="text-[8px] bg-white/5 px-1.5 rounded text-white/20">{tasks.filter(t => t.status === status).length}</span>
                </div>
            </div>
            <div className="space-y-3 min-h-[500px]">
                {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="hud-panel p-4 bg-black/40 border-white/5 relative group hover:border-accent/30 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[7px] font-black px-1 rounded-sm ${
                                task.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                task.priority === 'MED' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                                {task.priority}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {columns.indexOf(status) > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveTask(task.id, columns[columns.indexOf(status) - 1]); }}
                                        className="text-[10px] text-white/20 hover:text-accent"
                                    >
                                        ←
                                    </button>
                                )}
                                {columns.indexOf(status) < columns.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveTask(task.id, columns[columns.indexOf(status) + 1]); }}
                                        className="text-[10px] text-white/20 hover:text-accent"
                                    >
                                        →
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm font-bold italic text-white/90 leading-tight mb-4">{task.title}</p>
                        <div className="flex justify-between items-center opacity-40">
                            <span className="text-[7px] text-white font-bold uppercase">{task.source}</span>
                            <span className="text-[7px] font-black">#TV-{task.id.padStart(4, '0')}</span>
                        </div>

                        <div className="bracket-tl opacity-20" />
                        <div className="bracket-br opacity-20" />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-8 animate-slide-up pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tight">Winboard</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-widest mt-1">Strategic Execution // Sovereign Control</p>
                </div>
                <div className="flex gap-4">
                    <button className="glass px-4 py-2 text-[9px] font-black text-white/40 uppercase hover:text-white transition-all">+ New Objective</button>
                </div>
            </header>

            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin h-full items-start">
                {columns.map(renderColumn)}
            </div>
        </div>
    );
}
