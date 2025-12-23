// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Navbar, type GroupKey } from "./components/Navbar";
import { RightSidebar } from "./components/RightSidebar";
import { Map } from "./components/Map";
import { LoginModal } from "./components/LoginModal";
import { BottomEventCard } from "./components/BottomEventCard";
import { AdminPanel, type NewEventFormData } from "./components/AdminPanel";
import { CreateEditionModal } from "./components/modals/CreateEditionModal";
import { MobileSheet } from "./components/MobileSheet";

import type { Event, DateMode } from "./data/events";
import {
  fetchEventsWithNextEdition,
  createEventGeneral,
  deleteEventGeneral,
} from "./services/events";

export type User = {
  username: string;
  isVerified: boolean;
};

export default function App() {
  const [activeGroup, setActiveGroup] = useState<GroupKey>("FULLDFIESTA");
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Create flow (pick location)
  const [pickLocationMode, setPickLocationMode] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Edition modal
  const [editionModalOpen, setEditionModalOpen] = useState(false);
  const [eventForEdition, setEventForEdition] = useState<Event | null>(null);

  // Mobile sheet snap: 0=panel pequeño (mapa grande), 1=60/40, 2=panel grande
  const [mobileSnap, setMobileSnap] = useState<0 | 1 | 2>(1);

  // Load events (with next edition)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingEvents(true);
      try {
        const loaded = await fetchEventsWithNextEdition();
        if (!cancelled) setEvents(loaded);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => e.group === activeGroup);
  }, [events, activeGroup]);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedEvent(null);
  };

  // Start create flow
  const startAddEventFlow = () => {
    setSelectedEvent(null);
    setPickedCoords(null);
    setPickLocationMode(true);
    setIsAdminPanelOpen(false);
  };

  const cancelPickMode = () => {
    setPickLocationMode(false);
    setPickedCoords(null);
  };

  // Create event
  const handleCreateEvent = async (data: NewEventFormData) => {
    const tipoDB = "FIJO" as const;

    const row = await createEventGeneral({
      nombre: data.name,
      grupo: data.group,
      categoria: "fiesta",
      tipo: tipoDB,
      lng: data.lon,
      lat: data.lat,
      municipio: data.city || null,
      provincia: null,
      comunidad: null,
    } as any);

    const date_mode: DateMode = data.date_mode;
    const date_text =
      data.date_mode === "none"
        ? null
        : data.date_text?.trim()
          ? data.date_text.trim()
          : null;

    const newEv: Event = {
      id: row.id,
      name: row.nombre,
      group: row.grupo,
      lat: data.lat,
      lon: data.lon,
      city: row.municipio ?? data.city ?? undefined,
      venue: data.venue ?? undefined,
      date_mode,
      date_text,
    };

    setEvents((prev) => [newEv, ...prev]);
    setIsAdminPanelOpen(false);
    setPickedCoords(null);
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEventGeneral(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent((prev) => (prev?.id === id ? null : prev));
  };

  // Edition modal open
  const handleOpenAddEdition = () => {
    if (!selectedEvent) return;
    setEventForEdition(selectedEvent);
    setEditionModalOpen(true);
  };

  const handleEditionSaved = (updated: {
    eventId: string;
    date_mode: DateMode;
    date_text: string | null;
  }) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === updated.eventId
          ? { ...ev, date_mode: updated.date_mode, date_text: updated.date_text }
          : ev
      )
    );

    setSelectedEvent((prev) =>
      prev && prev.id === updated.eventId
        ? { ...prev, date_mode: updated.date_mode, date_text: updated.date_text }
        : prev
    );
  };

  // Tell Map to resize when mobile snap changes
  useEffect(() => {
    window.dispatchEvent(new Event("fulld:layout"));
  }, [mobileSnap]);

  return (
    <div className="w-screen h-screen flex flex-col bg-black overflow-hidden">
      <Navbar
        activeGroup={activeGroup}
        onChangeGroup={(g) => {
          setActiveGroup(g);
          setSelectedEvent(null);
        }}
        user={user}
        onUserClick={() => {
          if (!user) setIsLoginOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* DESKTOP */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 relative">
          <Map
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onMarkerClick={(ev) => setSelectedEvent(ev)}
            activeGroup={activeGroup}
            pickLocationMode={pickLocationMode}
            pickedCoords={pickedCoords}
            onPickLocation={(coords) => {
              setPickedCoords(coords);
              setPickLocationMode(false);
              setIsAdminPanelOpen(true);
            }}
            onCancelPickLocation={cancelPickMode}
          />
        </div>

        <RightSidebar
          activeGroup={activeGroup}
          events={filteredEvents}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
        />
      </div>

      {/* MÓVIL: panel arriba (sheet) + mapa abajo */}
      <div className="lg:hidden flex-1 overflow-hidden relative">
        {/* PANEL ARRIBA */}
        <MobileSheet
          snap={mobileSnap}
          onSnapChange={setMobileSnap}
          title={`${activeGroup} · ${filteredEvents.length} eventos`}
        >
          <div className="px-4 pb-4">
            <div className="text-white/70 text-xs mb-2">Trending (próximo paso)</div>

            <div className="space-y-2">
              {filteredEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left px-3 py-3 rounded-xl border border-white/10 hover:bg-white/5"
                >
                  <div className="text-sm font-semibold text-white">{ev.name}</div>
                  <div className="text-xs text-white/60">
                    {(ev.city ?? "Sin ciudad")} ·{" "}
                    {ev.date_mode === "none" || !ev.date_text
                      ? "Por confirmar"
                      : ev.date_mode === "approx"
                        ? `Aprox: ${ev.date_text}`
                        : ev.date_text}
                  </div>
                </button>
              ))}

              {filteredEvents.length === 0 && (
                <div className="text-white/60 text-sm">No hay eventos.</div>
              )}
            </div>
          </div>
        </MobileSheet>

        {/* MAPA ABAJO: ocupa el espacio restante */}
        <div className="absolute left-0 right-0 bottom-0 top-0 z-0">
          <Map
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onMarkerClick={(ev) => setSelectedEvent(ev)}
            activeGroup={activeGroup}
            pickLocationMode={pickLocationMode}
            pickedCoords={pickedCoords}
            onPickLocation={(coords) => {
              setPickedCoords(coords);
              setPickLocationMode(false);
              setIsAdminPanelOpen(true);
            }}
            onCancelPickLocation={cancelPickMode}
          />
        </div>
      </div>

      <BottomEventCard
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        canDelete={!!user}
        onDelete={handleDeleteEvent}
        onAddEdition={!!user ? handleOpenAddEdition : undefined}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {user && !pickLocationMode && (
        <button
          onClick={startAddEventFlow}
          className="fixed bottom-4 right-4 bg-white text-black px-4 py-2 rounded-full shadow-lg hover:bg-zinc-100 z-40 font-semibold"
        >
          + Add event
        </button>
      )}

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => {
          setIsAdminPanelOpen(false);
          setPickedCoords(null);
        }}
        pickedCoords={pickedCoords}
        onChangePoint={() => {
          setIsAdminPanelOpen(false);
          setPickLocationMode(true);
        }}
        onCreateEvent={async (data) => {
          try {
            await handleCreateEvent(data);
          } catch (e: any) {
            alert(`Error creating event: ${e?.message ?? "unknown"}`);
            console.error(e);
          }
        }}
      />

      <CreateEditionModal
        open={editionModalOpen}
        event={eventForEdition}
        onClose={() => {
          setEditionModalOpen(false);
          setEventForEdition(null);
        }}
        onSaved={(u) => {
          handleEditionSaved(u);
          setEditionModalOpen(false);
          setEventForEdition(null);
        }}
      />

      {loadingEvents && (
        <div className="fixed bottom-4 left-4 text-white/70 text-sm">Loading events...</div>
      )}
    </div>
  );
}
