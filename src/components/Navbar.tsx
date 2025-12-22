// src/components/Navbar.tsx
import React, { useState } from "react";
import type { User } from "../layout/Layout";
import type { GroupKey as GroupKeyBase } from "../types/groups";

// ✅ mantenemos el export para que NO se rompan imports antiguos
export type GroupKey = GroupKeyBase;

interface NavbarProps {
    activeGroup: GroupKey;
    onChangeGroup: (g: GroupKey) => void;
    user: User | null;
    onUserClick: () => void;
    onLogout: () => void;
}

const GROUPS: { key: GroupKey; label: string }[] = [
    { key: "FULLDFIESTA", label: "FULLDFIESTA" },
    { key: "FULLDMOTOR", label: "FULLDMOTOR" },
    { key: "FULLDFREESTYLE", label: "FULLDFREESTYLE" },
];

export const Navbar: React.FC<NavbarProps> = ({
    activeGroup,
    onChangeGroup,
    user,
    onUserClick,
    onLogout,
}) => {
    const isVerified = user?.isVerified ?? false;
    const username = user?.username ?? null;
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleUserSectionClick = () => {
        if (!user) onUserClick();
        else setIsUserMenuOpen(!isUserMenuOpen);
    };

    return (
        <header className="w-full h-14 bg-black text-white flex items-center px-4 shadow-lg relative z-50">
            <div className="flex items-center gap-4">
                <button
                    className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10 transition"
                    aria-label="Abrir menú"
                >
                    <div className="flex flex-col gap-[3px]">
                        <span className="w-5 h-[2px] bg-white rounded" />
                        <span className="w-5 h-[2px] bg-white rounded" />
                        <span className="w-5 h-[2px] bg-white rounded" />
                    </div>
                </button>

                <span className="text-lg font-semibold tracking-wider select-none">
                    FULLD
                </span>

                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-70">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar"
                        className="pl-8 pr-3 py-1.5 w-56 rounded-full bg-white/10 text-sm placeholder:text-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition"
                    />
                </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {GROUPS.map((g) => (
                        <button
                            key={g.key}
                            onClick={() => onChangeGroup(g.key)}
                            className={[
                                "px-3 py-1 text-[11px] rounded-full transition whitespace-nowrap",
                                activeGroup === g.key
                                    ? "bg-white text-black font-semibold"
                                    : "bg-white/10 hover:bg-white/20 text-gray-200",
                            ].join(" ")}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>

                <button
                    className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                    aria-label="Notificaciones"
                >
                    ▢
                </button>

                <div className="relative">
                    <button
                        onClick={handleUserSectionClick}
                        className="flex items-center gap-2 group outline-none"
                        aria-label="Usuario"
                    >
                        <div
                            className={[
                                "w-9 h-9 rounded-full flex items-center justify-center transition overflow-hidden",
                                user
                                    ? "bg-blue-600 text-white font-bold"
                                    : "bg-white/20 text-white group-hover:bg-white/30",
                                isVerified && user ? "ring-2 ring-yellow-300" : "",
                            ].join(" ")}
                        >
                            {user ? <span className="uppercase">{username?.charAt(0)}</span> : "👤"}
                        </div>
                    </button>

                    {isUserMenuOpen && user && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 text-white rounded-lg shadow-xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={() => {
                                    console.log("Ver perfil");
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition"
                            >
                                Ver perfil
                            </button>
                            <div className="h-[1px] bg-white/10 my-1" />
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-red-400 transition"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
