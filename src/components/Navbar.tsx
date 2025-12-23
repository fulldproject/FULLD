// src/components/Navbar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const catMenuRef = useRef<HTMLDivElement | null>(null);

    const title = useMemo(() => "FULLD", []);

    const closeAll = () => {
        setIsUserMenuOpen(false);
        setIsCategoryMenuOpen(false);
    };

    const handleUserSectionClick = () => {
        if (!user) onUserClick();
        else {
            setIsCategoryMenuOpen(false);
            setIsUserMenuOpen((v) => !v);
        }
    };

    const toggleCategories = () => {
        setIsUserMenuOpen(false);
        setIsCategoryMenuOpen((v) => !v);
    };

    const handleSelectGroup = (key: GroupKey) => {
        onChangeGroup(key);
        setIsCategoryMenuOpen(false);
    };

    // Close menus on outside click + Escape
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (userMenuRef.current && userMenuRef.current.contains(t)) return;
            if (catMenuRef.current && catMenuRef.current.contains(t)) return;
            closeAll();
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeAll();
        };

        window.addEventListener("mousedown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    return (
        <header className="w-full h-14 bg-black text-white flex items-center px-3 sm:px-4 shadow-lg relative z-50 shrink-0 select-none overflow-hidden">
            {/* LEFT */}
            <div className="flex items-center gap-3 shrink-0">
                <button
                    className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10 transition shrink-0"
                    aria-label="Abrir menú"
                    onClick={() => {
                        // futuro: abrir sidebar/hamburger real
                        closeAll();
                    }}
                >
                    <div className="flex flex-col gap-[3px]">
                        <span className="w-5 h-[2px] bg-white rounded" />
                        <span className="w-5 h-[2px] bg-white rounded" />
                        <span className="w-5 h-[2px] bg-white rounded" />
                    </div>
                </button>

                <span className="text-lg font-semibold tracking-wider shrink-0">
                    {title}
                </span>

                {/* Search: visible from md, but constrained so it NEVER overflows */}
                <div className="relative hidden md:block min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-70">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar"
                        className="pl-8 pr-3 py-1.5 w-40 lg:w-56 xl:w-72 max-w-[40vw] rounded-full bg-white/10 text-sm placeholder:text-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition"
                    />
                </div>
            </div>

            {/* CENTER: Pills container (md+) — bounded + scrollable INSIDE */}
            <div className="hidden md:flex flex-1 min-w-0 px-2 justify-center">
                <div
                    className="
            flex items-center gap-2
            max-w-full
            overflow-x-auto overflow-y-hidden
            whitespace-nowrap
            [scrollbar-width:none]
          "
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    {/* hide scrollbar (webkit) */}
                    <style>{`
            .no-scrollbar::-webkit-scrollbar{display:none;}
          `}</style>

                    <div className="no-scrollbar flex items-center gap-2">
                        {GROUPS.map((g) => (
                            <button
                                key={g.key}
                                onClick={() => onChangeGroup(g.key)}
                                className={[
                                    "px-3 py-1 text-[11px] rounded-full transition whitespace-nowrap shrink-0",
                                    activeGroup === g.key
                                        ? "bg-white text-black font-semibold"
                                        : "bg-white/10 hover:bg-white/20 text-gray-200",
                                ].join(" ")}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Mobile Search Icon */}
                <button
                    className="md:hidden w-9 h-9 rounded-md hover:bg-white/10 flex items-center justify-center transition"
                    aria-label="Buscar"
                    onClick={() => closeAll()}
                >
                    <span className="opacity-70 text-sm">🔍</span>
                </button>

                {/* Mobile Categories Button + Dropdown */}
                <div className="relative md:hidden" ref={catMenuRef}>
                    <button
                        onClick={toggleCategories}
                        className={[
                            "px-3 py-1.5 text-xs rounded-full transition whitespace-nowrap border",
                            isCategoryMenuOpen
                                ? "bg-white text-black border-white font-semibold"
                                : "bg-transparent text-gray-200 border-white/20 hover:bg-white/10",
                        ].join(" ")}
                    >
                        Categories
                    </button>

                    {isCategoryMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-52 bg-zinc-900 border border-white/10 text-white rounded-lg shadow-xl py-1 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                            {GROUPS.map((g) => (
                                <button
                                    key={g.key}
                                    onClick={() => handleSelectGroup(g.key)}
                                    className={[
                                        "w-full text-left px-4 py-3 text-sm transition",
                                        activeGroup === g.key
                                            ? "bg-white/10 text-white font-semibold"
                                            : "text-gray-300 hover:bg-white/5",
                                    ].join(" ")}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <button
                    className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0"
                    aria-label="Notificaciones"
                    onClick={() => closeAll()}
                >
                    ▢
                </button>

                {/* User */}
                <div className="relative shrink-0" ref={userMenuRef}>
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
                            {user ? (
                                <span className="uppercase">{username?.charAt(0)}</span>
                            ) : (
                                "👤"
                            )}
                        </div>
                    </button>

                    {isUserMenuOpen && user && (
                        <div className="absolute right-0 top-full mt-3 w-48 bg-zinc-900 border border-white/10 text-white rounded-lg shadow-xl py-1 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={() => setIsUserMenuOpen(false)}
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
