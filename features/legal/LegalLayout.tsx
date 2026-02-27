import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar'; // Assuming Navbar exists

interface LegalLayoutProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans selection:bg-white/20">
            {/* Optional: Include Navbar if needed, or just a simple header */}
            <header className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-black tracking-tighter text-white hover:opacity-80 transition-opacity">
                        FULLD
                    </Link>
                    <Link to="/" className="text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white transition-colors">
                        Close ✕
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
                <div className="mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">{title}</h1>
                    <p className="text-sm font-mono text-[#666] uppercase tracking-wider">
                        Last Updated: <span className="text-[#888]">{lastUpdated}</span>
                    </p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-[#A0A0A0] space-y-12">
                    {children}
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 text-center text-[#444] text-xs font-mono uppercase tracking-widest">
                &copy; {new Date().getFullYear()} FULLD. All rights reserved.
            </footer>
        </div>
    );
};
