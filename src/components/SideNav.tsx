// src/components/SideNav.tsx
"use client";

import React from 'react';
import { useSession, signIn } from "next-auth/react";

const NavItem = ({ name, isLinked, onClick }: { name: string, isLinked?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`flex items-center p-3 my-2 bg-gray-800/50 rounded-lg border-l-4 transition-all duration-300 ${
            isLinked
                ? 'border-accent text-white'
                : onClick
                ? 'cursor-pointer border-gray-700/50 text-gray-400 hover:border-accent hover:text-white'
                : 'border-gray-700/50 text-gray-400 opacity-50'
        }`}
    >
        <div className={`h-8 w-8 rounded-md mr-3 transition-colors flex items-center justify-center ${isLinked ? 'bg-gray-700' : 'bg-gray-700'}`}>
             <div className={`h-2 w-2 rounded-full transition-colors ${isLinked ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>
        <span className="text-sm font-semibold">{name}</span>
    </div>
);

export default function SideNav() {
    const { data: session } = useSession();

    return (
        <nav className="w-64 p-4 border-r border-white/10 bg-black/30 hidden lg:block">
            <h2 className="text-lg font-semibold my-4">Linked Services</h2>
            <div className="space-y-2">
                <NavItem
                    name="Google"
                    isLinked={!!session}
                    onClick={!session ? () => signIn('google') : undefined}
                />
                <NavItem name="Wrike" />
                <NavItem name="Notion" />
                <NavItem name="ChatGPT" />
            </div>
        </nav>
    );
}
