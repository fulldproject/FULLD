import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../../types';
import {
    HomeIcon,
    MapPinIcon,
    UserIcon,
    CheckIcon,
    LockIcon,
    RotateCcwIcon,
    SearchIcon,
    PlusIcon
} from '../../../components/Icons';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-bold ${active
            ? "bg-white text-black shadow-lg shadow-white/10"
            : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
    >
        <span className={active ? "text-black" : "text-gray-500"}>{icon}</span>
        {label}
    </Link>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { user, signOut } = useAuth();
    const location = useLocation();

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.ORGANIZER)) {
        return (
            <div className="h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                    <LockIcon className="w-12 h-12 mx-auto text-gray-600" />
                    <h1 className="text-xl font-black">Access Denied</h1>
                    <Link to="/" className="text-sm text-gray-500 hover:text-white">Return to Home</Link>
                </div>
            </div>
        );
    }

    const navs = [
        { to: "/admin", icon: <HomeIcon className="w-4 h-4" />, label: "Dashboard", exact: true },
        { to: "/admin/events", icon: <MapPinIcon className="w-4 h-4" />, label: "Events Manager" },
        { to: "/admin/suggestions", icon: <CheckIcon className="w-4 h-4" />, label: "Inbox" },
        { to: "/admin-legacy", icon: <PlusIcon className="w-4 h-4" />, label: "Create Event (legacy)" },
        ...(user.role === UserRole.ADMIN ? [
            { to: "/admin/users", icon: <UserIcon className="w-4 h-4" />, label: "Users" }
        ] : [])
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black flex-shrink-0 flex flex-col fixed top-0 bottom-0 left-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <Link to="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition-opacity">
                        FULLD <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-widest ml-1">Admin</span>
                    </Link>
                </div>

                <nav className="flex-grow p-4 space-y-1">
                    {navs.map((nav) => (
                        <NavItem
                            key={nav.to}
                            to={nav.to}
                            icon={nav.icon}
                            label={nav.label}
                            active={nav.exact ? location.pathname === nav.to : location.pathname.startsWith(nav.to)}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                            {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{user.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full mt-2 text-[10px] text-gray-600 hover:text-red-500 font-bold uppercase tracking-widest py-2"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow ml-64 p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};
