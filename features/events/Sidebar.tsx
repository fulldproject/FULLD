import React, { useMemo } from "react";
import {
  SidebarHeader,
  SidebarFilters,
  EventListItem,
} from "./EventList";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListItemSkeleton } from "../../components/ui/CardSkeleton";
import { MapIcon, PlusIcon } from "../../components/Icons";
import { useAuth } from "../auth/AuthContext";
import { UserRole } from "../../types";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import type { EventListProps } from "./EventList";

interface ExtendedSidebarProps extends EventListProps {
  onSuggestClick: () => void;
  showPastEvents?: boolean;
  onTogglePastEvents?: () => void;
}

export const Sidebar: React.FC<ExtendedSidebarProps> = (props) => {
  const {
    events,
    onSelectEvent,
    selectedEventId,
    isLoading = false,
    categories,
    activeCategory,
    onCategoryChange,
    onClearFilters,
    sortOption,
    onSortChange,
    onSuggestClick,
    locationEnabled,
    onTogglePastEvents,
    showPastEvents,
  } = props;

  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;

  const isAdmin = useIsAdmin();
  const isExplorerOrParticipant =
    role === UserRole.EXPLORER || role === UserRole.PARTICIPANT;

  const isOrganizerOrAdmin =
    role === UserRole.ORGANIZER || isAdmin;

  const safeEvents = Array.isArray(events) ? events : [];
  const safeClear = onClearFilters ?? (() => { });

  // ✅ Map category_id -> label (para mostrar bonito en la lista)
  const categoryLabelById = useMemo(() => {
    const m = new Map<string, string>();
    (categories ?? []).forEach((c: any) => {
      if (c?.id) m.set(c.id, c.label ?? c.key ?? "");
    });
    return m;
  }, [categories]);

  return (
    <div className="w-full md:w-80 lg:w-96 bg-[#050505] border-l border-white/10 h-full flex flex-col shadow-2xl overflow-hidden relative">
      {/* Sticky Top Section */}
      <div className="flex-shrink-0 z-20">
        <SidebarHeader
          count={safeEvents.length}
          sortOption={sortOption}
          onSortChange={onSortChange}
          locationEnabled={locationEnabled}
          showPastEvents={showPastEvents}
          onTogglePastEvents={onTogglePastEvents}
          onSuggestClick={onSuggestClick}
        />

        <SidebarFilters
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          onClearFilters={safeClear}
        />
      </div>

      {/* Scrollable List Section */}
      <div className="flex-grow overflow-y-auto no-scrollbar bg-[#050505] scroll-smooth">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => <ListItemSkeleton key={i} />)}
          </div>
        ) : safeEvents.length === 0 ? (
          <EmptyState
            icon={<MapIcon />}
            title="No events found"
            description="Try adjusting your filters to see more events."
            action={
              <button
                onClick={safeClear}
                className="px-6 py-2 bg-white text-black font-bold text-xs rounded-full hover:opacity-80 transition-opacity shadow-lg"
              >
                Clear Filters
              </button>
            }
          />
        ) : (
          <div className="py-3 flex flex-col">
            {safeEvents.map((event) => {
              const categoryId = (event as any).category; // tu EventGeneral guarda category_id aquí
              const categoryLabel = categoryLabelById.get(categoryId) ?? "—";

              return (
                <EventListItem
                  key={event.id}
                  event={event}
                  isSelected={selectedEventId === event.id}
                  onClick={() => onSelectEvent(event)}
                  categoryLabel={categoryLabel}
                />
              );
            })}

            {/* Bottom padding for list end */}
            <div className="h-24 flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Conditional Bottom Buttons */}
      <div className="absolute bottom-6 left-0 right-0 px-6 z-30 space-y-3">
        <button
          onClick={onSuggestClick}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-blue-500 transition-all active:scale-95 group"
        >
          <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Sugerir evento
        </button>

        {isOrganizerOrAdmin && (
          <button
            onClick={() => navigate("/admin-legacy")}
            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-gray-200 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Create Official Event
          </button>
        )}
      </div>
    </div>
  );
};
