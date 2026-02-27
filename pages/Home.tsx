// src/pages/Home.tsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { MapShell } from "../components/MapShell";
import { Sidebar } from "../features/events/Sidebar";
import { BottomEventCard } from "../features/events/BottomEventCard";
import { Navbar } from "../components/Navbar";
import { MobileSheet } from "../components/MobileSheet";
import { Drawer } from "../components/Drawer";
import { SuggestModal } from "../features/events/SuggestModal";
import { ModeSelectorModal } from "../features/events/ModeSelectorModal";
import { useEvents } from "../features/events/EventsContext";
import { getActiveEdition, getEditionStatus } from "../lib/editionUtils";
import {
  SidebarHeader,
  SidebarFilters,
  EventListItem,
} from "../features/events/EventList";
import { EmptyState } from "../components/ui/EmptyState";
import { ListItemSkeleton } from "../components/ui/CardSkeleton";
import { MapIcon } from "../components/Icons";
import type { EventGeneral, Edition, GroupKey } from "../types";
import { StatusModeration, UserRole } from "../types";
import { GROUPS, DEFAULT_COORDS } from "../constants";
import { distanceKm } from "../lib/helpers";
import { useAuth } from "../features/auth/AuthContext";
import { PlusIcon } from "../components/Icons";
import { usePersistedState } from "../hooks/usePersistedState";

/**
 * Event que el mapa puede usar para pintar:
 * - activeEdition: edición elegida para mostrar (si existe)
 * - hasActiveEdition: true si existe una edición vigente/no pasada
 */
export interface EventWithEdition extends EventGeneral {
  activeEdition?: Edition;
  hasActiveEdition?: boolean;
}

const toIsoDay = (d: Date) => d.toISOString().slice(0, 10);

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { events, editions, categories } = useEvents();

  // Responsive
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const snapPoints = useMemo(
    () => [80, window.innerHeight * 0.45, window.innerHeight - 80],
    []
  );

  // Persisted UI state
  const [activeGroup, setActiveGroup] = usePersistedState<GroupKey>(
    "fulld_active_mode",
    GROUPS[0].key
  );
  const [searchTerm, setSearchTerm] = usePersistedState<string>(
    "fulld_search_term",
    ""
  );
  const [activeCategory, setActiveCategory] = usePersistedState<string | null>(
    "fulld_active_category",
    null
  );
  const [sortOption, setSortOption] = usePersistedState<string>(
    "fulld_sort_option",
    "trending"
  );
  const [mobileSnapY, setMobileSnapY] = usePersistedState<number>(
    "fulld_mobile_snap_y",
    snapPoints[1]
  );
  const [selectedEventId, setSelectedEventId] = usePersistedState<string | null>(
    "fulld_selected_event_id",
    null
  );
  const [showPastEvents, setShowPastEvents] = usePersistedState<boolean>(
    "fulld_show_past_events",
    false
  );

  // Transient UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  // Picking location
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Geolocation
  useEffect(() => {
    // Guard: Geolocation requires secure context (HTTPS) or localhost
    const isSecure = window.isSecureContext;
    if (!("geolocation" in navigator) || !isSecure) {
      setUserLocation(DEFAULT_COORDS);
      setLocationEnabled(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationEnabled(true);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        setUserLocation(DEFAULT_COORDS);
        setLocationEnabled(false);
      }
    );
  }, []);

  // ESC close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelectedEventId(null);
      setIsSuggestModalOpen(false);
      setIsModeSelectorOpen(false);
      setIsPickingLocation(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedEventId]);

  // Fake loading on filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, [activeGroup, searchTerm, activeCategory, sortOption]);

  /**
   * ✅ Categories chips (solo del grupo activo)
   */
  const currentCategories = useMemo(() => {
    return (categories ?? [])
      .filter((c) => (c.is_active ?? true))
      .filter((c) => c.group_key === activeGroup)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [categories, activeGroup]);

  /**
   * ✅ categoryId -> label
   */
  const categoryLabelById = useMemo(() => {
    const m = new Map<string, string>();
    (categories ?? []).forEach((c) => m.set(c.id, c.label));
    return m;
  }, [categories]);

  const getCategoryLabel = useCallback(
    (categoryId: string) => categoryLabelById.get(categoryId) ?? "—",
    [categoryLabelById]
  );

  /**
   * ✅ Regla “edición activa” (vigente / no pasada):
   * - Si hay date_end => activa si date_end >= hoy
   * - Si no hay date_end => activa si date_start >= hoy
   * - Si no hay date_start => NO activa
   */
  const today = useMemo(() => toIsoDay(new Date()), []);
  /**
   * ✅ View: events + best edition + hasActiveEdition
   */
  const eventsView: EventWithEdition[] = useMemo(() => {
    const eds = editions ?? [];
    const byEvent = new Map<string, Edition[]>();
    for (const ed of eds) {
      const arr = byEvent.get(ed.event_id) ?? [];
      arr.push(ed);
      byEvent.set(ed.event_id, arr);
    }

    return (events ?? []).map((event) => {
      const eventEditions = byEvent.get(event.id) ?? [];
      const best = getActiveEdition(eventEditions);

      // hasActiveEdition uses the centralized status logic
      const hasActiveEdition = eventEditions.some((e) => {
        const status = getEditionStatus(e);
        return status === 'upcoming' || status === 'live';
      });

      return { ...event, activeEdition: best, hasActiveEdition };
    });
  }, [events, editions, today]);

  /**
   * ✅ Filtrado principal (Mapa + Lista)
   * - Opción A: mostramos TODOS (con y sin edición), pero:
   *   - Siempre filtrados por group, category, search
   *   - Moderación:
   *       - Usuarios normales: solo APPROVED
   *       - Admin: ve todo (útil para revisar)
   */
  const filteredEvents: EventWithEdition[] = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const isAdmin = user?.role === UserRole.ADMIN;

    let result = eventsView.filter((e) => {
      const matchGroup = e.group_key === activeGroup;
      const matchCategory = !activeCategory || e.category === activeCategory;

      const label = categoryLabelById.get(e.category) ?? "";

      const matchSearch =
        query.length === 0 ||
        e.name.toLowerCase().includes(query) ||
        (e.city ?? "").toLowerCase().includes(query) ||
        (e.province ?? "").toLowerCase().includes(query) ||
        label.toLowerCase().includes(query) ||
        (e.activeEdition?.date_text?.toLowerCase().includes(query) || false);

      const moderationOk = isAdmin ? true : e.status_moderation === StatusModeration.APPROVED;

      const status = e.activeEdition ? getEditionStatus(e.activeEdition) : 'tba';
      const isPast = status === 'past';
      const matchHistory = showPastEvents || !isPast;

      return moderationOk && matchGroup && matchCategory && matchSearch && matchHistory;
    });

    // Sorting
    if (sortOption === "upcoming") {
      result = [...result].sort((a, b) => {
        const aActive = !!a.hasActiveEdition;
        const bActive = !!b.hasActiveEdition;
        if (aActive !== bActive) return Number(bActive) - Number(aActive);

        const da = a.activeEdition?.date_start ?? "9999-12-31";
        const db = b.activeEdition?.date_start ?? "9999-12-31";
        return da.localeCompare(db);
      });
    } else if (sortOption === "recently-added") {
      result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sortOption === "closest" && userLocation) {
      result = [...result].sort((a, b) => {
        const distA = distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else {
      // "trending": activos primero
      result = [...result].sort(
        (a, b) => Number(!!b.hasActiveEdition) - Number(!!a.hasActiveEdition)
      );
    }

    return result;
  }, [
    eventsView,
    activeGroup,
    activeCategory,
    sortOption,
    searchTerm,
    userLocation,
    categoryLabelById,
    user?.role,
  ]);

  // Reset category when group changes
  useEffect(() => {
    setActiveCategory(null);
  }, [activeGroup, setActiveCategory]);

  // Si el seleccionado deja de existir en el filtro, lo quitamos
  useEffect(() => {
    if (!selectedEventId) return;
    const stillThere = filteredEvents.some((e) => e.id === selectedEventId);
    if (!stillThere) setSelectedEventId(null);
  }, [filteredEvents, selectedEventId, setSelectedEventId]);

  const handleClearFilters = () => {
    setActiveCategory(null);
    setSearchTerm("");
    setSortOption("trending");
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isPickingLocation) return;
    setPickedLocation({ lat, lng });
  };

  // ✅ Evento seleccionado (del array filtrado, enriquecido con activeEdition/hasActiveEdition)
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return filteredEvents.find((e) => e.id === selectedEventId) || null;
  }, [filteredEvents, selectedEventId]);

  const handleSelectEvent = (event: EventGeneral) => {
    setSelectedEventId(event.id);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-primary)]">
      <Navbar
        activeGroup={activeGroup}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setIsDrawerOpen(true)}
        onOpenModeSelector={() => setIsModeSelectorOpen(true)}
        onSuggestClick={() => setIsSuggestModalOpen(true)}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeGroup={activeGroup}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onOpenModeSelector={() => setIsModeSelectorOpen(true)}
      />

      <SuggestModal
        isOpen={isSuggestModalOpen}
        onClose={() => {
          setIsSuggestModalOpen(false);
          setIsPickingLocation(false);
          setPickedLocation(null);
        }}
        userId={user?.id || "anonymous"}
        onStartPicking={() => setIsPickingLocation(true)}
        onStopPicking={() => setIsPickingLocation(false)}
        onClearPicked={() => setPickedLocation(null)}
        isPickingMode={isPickingLocation}
        pickedCoords={pickedLocation}
      />

      <ModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        activeMode={activeGroup}
        onSelectMode={setActiveGroup}
      />

      <div className="flex relative w-full flex-1 min-h-0 overflow-hidden pt-[56px]">
        <main className="flex-1 relative z-0 min-h-0">
          <MapShell
            events={filteredEvents}
            selectedEventId={selectedEventId || undefined}
            // ✅ NUEVO: click devuelve id SIEMPRE (gris o azul)
            onMarkerClickId={(id) => setSelectedEventId(id)}
            onMapClick={handleMapClick}
            temporaryPin={pickedLocation}
            activeGroup={activeGroup}
            showPastEvents={showPastEvents}
            onSuggestLocation={(coords) => {
              setPickedLocation(coords);
              setIsSuggestModalOpen(true);
            }}
          />

          {isMobile &&
            !selectedEvent &&
            !isPickingLocation && (
              <div className="absolute bottom-24 right-4 z-[60]">
                <button
                  onClick={() => setIsSuggestModalOpen(true)}
                  className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform flex-shrink-0"
                  title="Sugerir"
                >
                  <PlusIcon className="w-6 h-6" />
                </button>
              </div>
            )}

          {selectedEvent && !isPickingLocation && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[50] w-full max-w-[95%] md:max-w-fit px-4 pointer-events-none">
              <BottomEventCard event={selectedEvent} onClose={() => setSelectedEventId(null)} />
            </div>
          )}
        </main>

        {!isMobile && !isPickingLocation && (
          <div className="flex-shrink-0 z-10">
            <Sidebar
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              selectedEventId={selectedEventId || undefined}
              isLoading={isLoading}
              categories={currentCategories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onClearFilters={handleClearFilters}
              sortOption={sortOption}
              onSortChange={setSortOption}
              locationEnabled={locationEnabled}
              onSuggestClick={() => setIsSuggestModalOpen(true)}
              showPastEvents={showPastEvents}
              onTogglePastEvents={() => setShowPastEvents(!showPastEvents)}
            />
          </div>
        )}

        {isMobile && !selectedEvent && !isPickingLocation && (
          <MobileSheet snapPoints={snapPoints} currentSnap={mobileSnapY} onSnapChange={setMobileSnapY}>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0">
                <SidebarHeader
                  count={filteredEvents.length}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  locationEnabled={locationEnabled}
                  showPastEvents={showPastEvents}
                  onTogglePastEvents={() => setShowPastEvents(!showPastEvents)}
                  onSuggestClick={() => setIsSuggestModalOpen(true)}
                />
                <SidebarFilters
                  categories={currentCategories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  onClearFilters={handleClearFilters}
                />
              </div>

              <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth bg-[#050505]/50 px-2 pb-24">
                {isLoading ? (
                  <div className="space-y-2 p-2">
                    {[...Array(6)].map((_, i) => <ListItemSkeleton key={i} />)}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <EmptyState
                    icon={<MapIcon />}
                    title="No results found"
                    description="Try adjusting filters or search term."
                    action={
                      <button onClick={handleClearFilters} className="px-6 py-2 bg-white text-black font-bold text-xs rounded-full">
                        Clear Filters
                      </button>
                    }
                  />
                ) : (
                  <div className="py-3 flex flex-col">
                    {filteredEvents.map((event) => (
                      <EventListItem
                        key={event.id}
                        event={event}
                        isSelected={selectedEventId === event.id}
                        onClick={() => handleSelectEvent(event)}
                        categoryLabel={getCategoryLabel(event.category)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </MobileSheet>
        )}
      </div>
    </div>
  );
};
