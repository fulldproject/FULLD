import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatEventDate } from "../../lib/dateUtils";
import { CONFIG } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { EventGeneral, Edition, UserRole, StatusModeration } from "../../types";
import {
  ChevronDownIcon,
  RotateCcwIcon,
  MapIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "../../components/Icons";
import { useAuth } from "../auth/AuthContext";
import { useEvents } from "./EventsContext";
import type { CategoryRow } from "./eventsApi";
import { useLongPress } from "../../hooks/useLongPress";

// For type safety in the component props
interface EventWithPotentialEdition extends EventGeneral {
  activeEdition?: Edition;
}

export interface EventListProps {
  events: EventWithPotentialEdition[];
  onSelectEvent: (event: EventGeneral) => void;
  selectedEventId?: string;
  isLoading?: boolean;

  /** Categories from Supabase (CategoryRow[]) */
  categories: CategoryRow[];

  /** activeCategory is a category.id (UUID) */
  activeCategory: string | null;

  /** Receives category.id (UUID) or null */
  onCategoryChange: (catId: string | null) => void;

  onClearFilters: () => void;
  sortOption: string;
  onSortChange: (sort: string) => void;
  locationEnabled?: boolean;
}

export const SidebarHeader: React.FC<{
  count: number;
  sortOption: string;
  onSortChange: (s: string) => void;
  locationEnabled?: boolean;
  showPastEvents?: boolean;
  onTogglePastEvents?: () => void;
  onSuggestClick: () => void;
}> = ({ count, sortOption, onSortChange, locationEnabled, showPastEvents, onTogglePastEvents, onSuggestClick }) => (
  <div className="flex flex-col gap-3 p-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Explore Events</h2>
          <span className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded font-mono">
            {count}
          </span>
          <button
            onClick={onSuggestClick}
            className="ml-auto p-1.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-all shadow-md active:scale-90 flex items-center gap-1.5 px-2.5"
            title="Sugerir evento"
          >
            <PlusIcon className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sugerir</span>
          </button>
        </div>
        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${locationEnabled
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  : "bg-red-500"
                  }`}
              />
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                Location: {locationEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <button
              onClick={onTogglePastEvents}
              className="flex items-center gap-2 group transition-opacity hover:opacity-80"
            >
              <div className={`w-6 h-3.5 rounded-full relative transition-colors duration-200 ${showPastEvents ? 'bg-blue-600' : 'bg-white/10 border border-white/10'}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-all duration-200 ${showPastEvents ? 'left-3' : 'left-0.5'}`} />
              </div>
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                Show past events
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-1.5">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
          Sort:
        </label>
        <div className="relative group">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-transparent text-xs font-bold text-[var(--text-primary)] pr-6 focus:outline-none cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
          >
            <option value="trending" className="bg-[var(--bg-secondary)]">
              Trending
            </option>
            <option value="upcoming" className="bg-[var(--bg-secondary)]">
              Upcoming
            </option>
            <option value="closest" className="bg-[var(--bg-secondary)]">
              Closest
            </option>
            <option value="recently-added" className="bg-[var(--bg-secondary)]">
              Recently added
            </option>
          </select>
          <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none group-hover:text-[var(--text-primary)] transition-colors" />
        </div>
      </div>
    </div>
  </div>
);

export const SidebarFilters: React.FC<{
  categories: CategoryRow[];
  activeCategory: string | null;
  onCategoryChange: (catId: string | null) => void;
  onClearFilters: () => void;
}> = ({ categories, activeCategory, onCategoryChange, onClearFilters }) => {
  const visibleCats = useMemo(() => {
    return (categories ?? [])
      .filter((c) => (c.is_active ?? true))
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [categories]);

  return (
    <div className="flex items-center gap-2 p-3 border-b border-[var(--border)] bg-[var(--bg-primary)]/50 backdrop-blur-md">
      <div className="flex-grow flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
        {visibleCats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(activeCategory === cat.id ? null : cat.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${activeCategory === cat.id
              ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              }`}
            title={cat.key}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <button
        onClick={onClearFilters}
        className="p-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
        title="Clear all filters"
      >
        <RotateCcwIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface QuickActionsMenuProps {
  x: number;
  y: number;
  event: EventGeneral;
  onClose: () => void;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ x, y, event, onClose }) => {
  const navigate = useNavigate();
  const { updateEventStatus } = useEvents();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleAction = (type: "edit" | "archive" | "add-edition") => {
    onClose();
    if (type === "edit") {
      navigate("/admin", { state: { editingEventId: event.id } });
    } else if (type === "add-edition") {
      navigate("/admin", { state: { editingEventId: event.id, autoAddEdition: true } });
    } else if (type === "archive") {
      if (window.confirm(`Archive "${event.name}"?`)) {
        updateEventStatus(event.id, StatusModeration.ARCHIVED);
      }
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[300] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl py-1.5 w-48 animate-in fade-in zoom-in duration-100 origin-top-left"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => handleAction("edit")}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <EditIcon className="w-4 h-4" /> Edit Event
      </button>

      <button
        onClick={() => handleAction("add-edition")}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <PlusIcon className="w-4 h-4" /> Add Edition
      </button>

      <div className="h-px bg-[var(--border)] my-1" />

      <button
        onClick={() => handleAction("archive")}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
      >
        <TrashIcon className="w-4 h-4" /> Archive Event
      </button>
    </div>
  );
};

export const EventListItem: React.FC<{
  event: EventWithPotentialEdition;
  isSelected: boolean;
  onClick: () => void;
  categoryLabel?: string;
}> = ({ event, isSelected, onClick, categoryLabel }) => {
  const { user } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // ✅ Production: use activeEdition (already computed in Home.tsx)
  const edition = event.activeEdition;

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.ORGANIZER;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isStaff) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const longPressProps = useLongPress({
    onLongPress: (e) => {
      if (!isStaff) return;
      const touch = (e as any).touches ? (e as any).touches[0] : (e as any);
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    },
    onClick: () => onClick(),
  });

  const imgSrc =
    event.image_url && String(event.image_url).trim().length > 0
      ? event.image_url
      : CONFIG.IMAGES.EVENT_PLACEHOLDER;

  return (
    <>
      <button
        {...(isStaff ? longPressProps : { onClick })}
        onContextMenu={handleContextMenu}
        className={`group flex gap-4 p-3 mx-2 rounded-xl transition-all text-left border mb-1.5 touch-none ${isSelected
          ? "bg-[var(--bg-tertiary)] border-[var(--ring)]/30 shadow-lg scale-[1.01]"
          : "bg-transparent border-transparent hover:bg-[var(--bg-tertiary)] hover:border-[var(--border)]"
          }`}
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)] relative">
          <img
            src={imgSrc}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[9px] font-black uppercase text-[var(--primary)] tracking-tighter mb-0.5">
            {categoryLabel || "—"}
          </span>

          <h4 className="text-sm font-bold text-[var(--text-primary)] truncate mb-1" title={event.name}>
            {event.name}
          </h4>

          <p className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" /> {event.city}, {event.province}
          </p>

          <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1.5 flex items-center gap-1.5">
            <span className="text-[var(--text-muted)] font-mono text-[10px]">📅</span>{" "}
            {formatEventDate(edition)}
          </p>
        </div>
      </button>

      {contextMenu && (
        <QuickActionsMenu
          x={contextMenu.x}
          y={contextMenu.y}
          event={event}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};


