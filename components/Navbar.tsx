import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MenuIcon,
  BellIcon,
  AppsIcon,
  UserIcon,
  SearchIcon,
  ChevronDownIcon,
  PlusIcon,
} from "./Icons";
import { useAuth } from "../features/auth/AuthContext";
import { AuthModal } from "../features/auth/AuthModal";
import { APP_NAVBAR_HEIGHT, GROUPS } from "../constants";
import type { GroupKey } from "../types";

interface NavbarProps {
  activeGroup: GroupKey;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onMenuClick?: () => void;
  onOpenModeSelector: () => void;
  onSuggestClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeGroup,
  searchTerm,
  onSearchChange,
  onMenuClick,
  onOpenModeSelector,
  onSuggestClick,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeGroupConfig = GROUPS.find((g) => g.key === activeGroup);
  const displayModeName = activeGroupConfig?.label || String(activeGroup);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      alert("No se pudo cerrar sesión. Mira la consola para detalles.");
      setIsUserMenuOpen(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const avatarSrc =
    user?.avatarUrl && String(user.avatarUrl).trim().length > 0
      ? user.avatarUrl
      : "https://placehold.co/64x64/png?text=U";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center px-3 sm:px-4 transition-all duration-300"
      style={{ height: APP_NAVBAR_HEIGHT }}
    >
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <button
          onClick={() => onMenuClick?.()}
          className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <Link to="/" className="text-lg sm:text-xl font-black tracking-tighter text-[var(--text-primary)] hover:scale-105 transition-transform">
          FULLD
        </Link>
      </div>

      {/* Center */}
      <div className="flex-grow flex items-center justify-start ml-2 md:ml-8 gap-2 md:gap-3 overflow-hidden">
        <div className="relative max-w-[140px] md:max-w-xs w-full group">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[var(--bg-tertiary)] border border-transparent rounded-full pl-9 pr-3 py-1.5 w-full focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] text-xs transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Categories button only on MD+ screens */}
        <button
          onClick={onOpenModeSelector}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:border-[var(--ring)] transition-all group flex-shrink-0"
          aria-label="Open mode selector"
        >
          <span className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest group-hover:text-[var(--text-primary)] transition-colors">
            Categories
          </span>
          <ChevronDownIcon className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
        </button>

        {/* Mode pill only on SM+ screens */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex-shrink-0">
          <span className="text-[10px] font-black uppercase text-[var(--primary)] tracking-widest">
            {displayModeName}
          </span>
          <button
            onClick={onOpenModeSelector}
            className="text-[9px] font-bold text-[var(--primary)]/70 hover:text-[var(--primary)] underline underline-offset-2 ml-1"
          >
            Change
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2 ml-1 flex-shrink-0">
        <button
          onClick={onSuggestClick}
          className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[var(--primary)]/20 active:scale-95 flex-shrink-0 mr-1"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Sugerir
        </button>

        <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden lg:block">
          <BellIcon className="w-5 h-5" />
        </button>

        <div className="relative" ref={userMenuRef}>
          {isAuthenticated ? (
            <button
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] hover:border-[var(--ring)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              aria-label="Open user menu"
            >
              <img src={avatarSrc} alt="User avatar" className="w-full h-full object-cover" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Open auth"
            >
              <UserIcon className="w-6 h-6" />
            </button>
          )}

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 transform origin-top-right z-[60]">
              <div className="px-4 py-3 border-b border-[var(--border)] mb-1 bg-[var(--bg-tertiary)]/50">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                  User Type
                </p>
                <p className="text-xs font-black text-[var(--primary)] uppercase tracking-tighter">
                  {user?.role ?? "UNKNOWN"}
                </p>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsUserMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                View Profile
              </Link>

              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Admin Panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${loggingOut
                  ? "text-[var(--text-muted)] cursor-not-allowed"
                  : "text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  }`}
              >
                {loggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
