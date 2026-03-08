// src/components/ProjectBoard.tsx
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
    projectId?: string;
    snoozeUntil?: string;
    completed_at?: string;
}

interface ProjectBoardProps {
    externalTasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function ProjectBoard({ externalTasks, setTasks }: ProjectBoardProps) {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [hoveredColumn, setHoveredColumn] = useState<Task['status'] | null>(null);

    const columns: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'];

    const moveTask = (taskId: string, newStatus: Task['status']) => {
        const task = externalTasks.find(t => t.id === taskId);
        if (!task) return;

        const oldStatus = task.status;
        if (oldStatus === newStatus) return;

        const ts = new Date().toISOString();

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: newStatus,
                    completed_at: newStatus === 'DONE' ? ts : t.completed_at
                };
            }
            return t;
        }));

        if (newStatus === 'DONE') {
            twinPlusKernel.observe(createEvent('TASK_COMPLETED', {
                taskId,
                title: task.title,
                source: task.source,
                completed_at: ts
            }, 'PROJECTS'));
        } else {
            twinPlusKernel.observe(createEvent('ACTION_CREATED', {
                action: 'MOVE_TASK',
                taskId,
                from: oldStatus,
                to: newStatus
            }, 'PROJECTS'));
        }
    };

    // --- Native Drag & Drop Logic ---
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";
        // Optional: Custom drag image or opacity logic
    };

    const handleDragOver = (e: React.DragEvent, status: Task['status']) => {
        e.preventDefault();
        if (hoveredColumn !== status) setHoveredColumn(status);
    };

    const handleDrop = (e: React.DragEvent, status: Task['status']) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId") || draggedTaskId;
        if (taskId) {
            moveTask(taskId, status);
        }
        setDraggedTaskId(null);
        setHoveredColumn(null);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if we actually left the column area
        setHoveredColumn(null);
    };

    const renderColumn = (status: Task['status']) => (
        <div
            key={status}
            className={`flex flex-col gap-4 min-w-[320px] flex-1 transition-all duration-300 p-2 rounded-lg ${
                hoveredColumn === status ? 'bg-accent/5 border-x border-accent/20' : 'border-x border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            onDragLeave={handleDragLeave}
        >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 px-2">
                <div className="flex items-center gap-3">
                    <span className="system-text text-[11px] font-black text-white/60 tracking-widest uppercase">{status.replace('_', ' ')}</span>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-black text-accent">{externalTasks.filter(t => t.status === status).length}</span>
                </div>
            </div>

            <div className="space-y-4 min-h-[600px]">
                {externalTasks.filter(t => t.status === status).map(task => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`hud-panel p-5 bg-black/60 border-white/10 relative group hover:border-accent/50 transition-all cursor-grab active:cursor-grabbing ${
                            draggedTaskId === task.id ? 'opacity-30 scale-95' : 'opacity-100'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent animate-pulse" />
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm tracking-tighter uppercase ${
                                    task.priority === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    task.priority === 'MED' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                    {task.priority}
                                </span>
                            </div>

                            {/* Larger Tactical Arrows */}
                            <div className="flex gap-1">
                                {columns.indexOf(status) > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveTask(task.id, columns[columns.indexOf(status) - 1]); }}
                                        className="h-8 w-8 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:bg-accent hover:text-black hover:border-accent transition-all rounded"
                                        title="Move Left"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                )}
                                {columns.indexOf(status) < columns.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveTask(task.id, columns[columns.indexOf(status) + 1]); }}
                                        className="h-8 w-8 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:bg-accent hover:text-black hover:border-accent transition-all rounded"
                                        title="Move Right"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-md font-black italic text-white/95 leading-tight mb-5 uppercase tracking-wide group-hover:text-accent transition-colors">
                            {task.title}
                        </p>

                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{task.source}</span>
                            <span className="text-[8px] font-black text-white/20 tracking-tighter">ID: {task.id.slice(-6)}</span>
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
                    <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">Project Board</h1>
                    <p className="system-text text-[10px] text-accent font-black tracking-[0.4em] mt-2 uppercase">Neural Objectives // Sovereignty In Motion</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right mr-6 hidden md:block">
                        <span className="text-[8px] text-white/20 font-black uppercase block">Active Capacity</span>
                        <div className="h-1.5 w-32 bg-white/5 mt-1 overflow-hidden rounded-full">
                            <div className="h-full bg-accent shadow-[0_0_10px_var(--accent)]" style={{ width: `${Math.min(100, (externalTasks.filter(t => t.status !== 'DONE').length / 20) * 100)}%` }} />
                        </div>
                    </div>
                    <button className="bg-accent/10 border-2 border-accent/40 px-6 py-2 text-[10px] font-black text-accent uppercase hover:bg-accent hover:text-black transition-all shadow-[0_0_20px_rgba(0,212,255,0.1)]">+ Initialize Objective</button>
                </div>
            </header>

            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-thin h-full items-start px-2">
                {columns.map(renderColumn)}
            </div>
        </div>
    );
}
