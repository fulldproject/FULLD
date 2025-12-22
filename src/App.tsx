// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Navbar, type GroupKey } from "./components/Navbar";
import { RightSidebar } from "./components/RightSidebar";
import { Map } from "./components/Map";
import { LoginModal } from "./components/LoginModal";
import { BottomEventCard } from "./components/BottomEventCard";
import { AdminPanel, type NewEventFormData } from "./components/AdminPanel";
import { CreateEditionModal } from "./components/modals/CreateEditionModal";

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

  // Create event (RPC wrapper)
  const handleCreateEvent = async (data: NewEventFormData) => {
    // ✅ DB enum evento_tipo = FIJO | ITINERANTE
    // Ahora mismo tu UI crea eventos “fijos”
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

    // Guardamos en UI lo de fecha como “preview” (aunque la DB lo gestione en ediciones)
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

  // Edition modal saved -> update local state
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

  return (
    <div className="w-screen h-screen flex flex-col bg-black">
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

      <div className="flex flex-1 overflow-hidden">
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

        <RightSidebar
          activeGroup={activeGroup}
          events={filteredEvents}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
        />
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

      {/* FAB Add Event */}
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
        <div className="fixed bottom-4 left-4 text-white/70 text-sm">
          Loading events...
        </div>
      )}
    </div>
  );
}
