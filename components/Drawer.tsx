import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CloseIcon,
  HomeIcon,
  UserIcon,
  ShieldIcon,
  InfoIcon,
  FileTextIcon,
  LockIcon,
  CheckIcon,
  CalendarIcon,
  RotateCcwIcon,
} from "./Icons";
import { useAuth } from "../features/auth/AuthContext";
import { GROUPS } from "../constants";
import type { GroupKey } from "../types";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { UserRole } from "../types";
import { useEvents } from "../features/events/EventsContext";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroup: GroupKey;

  /** category.id (UUID) o null */
  activeCategory: string | null;

  /** recibe category.id (UUID) o null */
  onCategoryChange: (categoryId: string | null) => void;

  onOpenModeSelector: () => void;
}

export const DrawerSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="py-4 border-b border-white/5">
    <h3 className="px-6 mb-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">
      {title}
    </h3>
    <div className="flex flex-col">{children}</div>
  </div>
);

export const DrawerLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white"
  >
    <span className="text-gray-500">{icon}</span>
    {label}
  </Link>
);

export const DrawerCategoryItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-2.5 transition-colors text-sm font-medium ${isActive
      ? "bg-white/10 text-white border-l-2 border-white"
      : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
  >
    {label}
  </button>
);

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  activeGroup,
  activeCategory,
  onCategoryChange,
  onOpenModeSelector,
}) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { categories } = useEvents();

  // Esc + lock scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = prev;
      };
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const activeGroupConfig = GROUPS.find((g) => g.key === activeGroup);

  // ✅ categorías desde Supabase filtradas por group_key (modo)
  const currentCategories = useMemo(() => {
    return (categories ?? [])
      .filter((c) => (c.is_active ?? true))
      .filter((c) => c.group_key === activeGroup)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [categories, activeGroup]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Side Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-[#000] border-r border-white/10 z-[101] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Drawer"
      >
        {/* Header */}
        <div className="h-[56px] flex items-center justify-between px-6 border-b border-white/5">
          <span className="text-xl font-black tracking-tighter text-white">FULLD</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close drawer"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto no-scrollbar">
          <DrawerSection title="Active Mode">
            <div className="px-6 py-3 flex items-center justify-between bg-white/[0.02] border-y border-white/5 my-1">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">
                  Current Group
                </p>
                <span className="text-sm font-black text-white uppercase tracking-tighter">
                  {activeGroupConfig?.label || activeGroup}
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenModeSelector();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <RotateCcwIcon className="w-3 h-3" />
                Change
              </button>
            </div>
          </DrawerSection>

          <DrawerSection title="Categories">
            <DrawerCategoryItem
              label="All"
              isActive={activeCategory === null}
              onClick={() => {
                onCategoryChange(null);
                onClose();
              }}
            />

            {currentCategories.map((cat) => (
              <DrawerCategoryItem
                key={cat.id}
                label={cat.label}
                isActive={activeCategory === cat.id}
                onClick={() => {
                  onCategoryChange(activeCategory === cat.id ? null : cat.id);
                  onClose();
                }}
              />
            ))}
          </DrawerSection>

          <DrawerSection title="Navigation">
            <DrawerLink to="/" icon={<HomeIcon className="w-4 h-4" />} label="Home" onClick={onClose} />
            <DrawerLink
              to="/profile"
              icon={<UserIcon className="w-4 h-4" />}
              label="Profile"
              onClick={onClose}
            />

            {user?.role === UserRole.PARTICIPANT && (
              <DrawerLink
                to="/my-plans"
                icon={<CalendarIcon className="w-4 h-4" />}
                label="My Plans"
                onClick={onClose}
              />
            )}

            {isAdmin && (
              <DrawerLink
                to="/moderation"
                icon={<CheckIcon className="w-4 h-4" />}
                label="Moderation Inbox"
                onClick={onClose}
              />
            )}

            {(isAdmin || user?.role === UserRole.ORGANIZER) && (
              <DrawerLink
                to="/admin"
                icon={<LockIcon className="w-4 h-4" />}
                label="Admin Panel"
                onClick={onClose}
              />
            )}
          </DrawerSection>

          <DrawerSection title="Legal">
            <DrawerLink to="/privacy" icon={<ShieldIcon className="w-4 h-4" />} label="Privacy Policy" onClick={onClose} />
            <DrawerLink to="/cookies" icon={<InfoIcon className="w-4 h-4" />} label="Cookies Policy" onClick={onClose} />
            <DrawerLink to="/terms" icon={<FileTextIcon className="w-4 h-4" />} label="Terms & Conditions" onClick={onClose} />
          </DrawerSection>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#050505]">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">FULLD PLATFORM</p>
          <p className="text-[9px] text-gray-700 mt-1">Version 1.0.4-beta • Built for creators</p>
        </div>
      </aside>
    </>
  );
};
