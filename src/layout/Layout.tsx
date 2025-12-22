// src/layout/Layout.tsx
import { useEffect, useState } from "react";
import { Navbar, type GroupKey } from "../components/Navbar";
import { RightSidebar } from "../components/RightSidebar";
import { Map } from "../components/Map";
import { LoginModal } from "../components/LoginModal";
import { BottomEventCard } from "../components/BottomEventCard";
import { CreateEventModal } from "../components/modals/CreateEventModal";
import { listEventsForMap } from "../services/events";

// Initial mock data is replaced by DB data
import { EVENTS } from "../data/events";
import type { MapEvent } from "../data/events";

export type User = {
    username: string;
    isVerified: boolean;
};

export const Layout: React.FC = () => {
    const [activeGroup, setActiveGroup] = useState<GroupKey>("FULLDFIESTA");
    const [user, setUser] = useState<User | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // State for events
    const [allEvents, setAllEvents] = useState<MapEvent[]>([]);

    useEffect(() => {
        // Fetch events when activeGroup changes
        listEventsForMap(activeGroup)
            .then((events) => setAllEvents(events))
            .catch((err) => console.error("Failed to load map events:", err));
    }, [activeGroup]);

    const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);

    // Create Event Flow State
    const [pickLocationMode, setPickLocationMode] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creationCoords, setCreationCoords] = useState<{ lat: number; lng: number } | null>(null);

    const filteredEvents: MapEvent[] = allEvents.filter(
        (ev) => ev.group === activeGroup
    );

    const handleUserClick = () => {
        if (!user) {
            setIsLoginOpen(true);
        } else {
            console.log("Abrir menú de usuario", user);
        }
    };

    const handleLoginSuccess = (u: User) => {
        setUser(u);
        setIsLoginOpen(false);
    };

    // --- Create Event Handlers ---

    const handleStartCreateEvent = () => {
        if (!user) {
            alert("Debes iniciar sesión para crear eventos.");
            setIsLoginOpen(true);
            return;
        }
        setPickLocationMode(true);
        // Deselect any event so map is clear
        setSelectedEvent(null);
    };

    const handleLocationPicked = (coords: { lat: number; lon: number }) => {
        setCreationCoords({ lat: coords.lat, lng: coords.lon });
        setPickLocationMode(false);
        setCreateModalOpen(true);
    };

    const handleEventCreated = (newEvent: MapEvent) => {
        setAllEvents((prev) => [...prev, newEvent]);
        setCreateModalOpen(false);
        setCreationCoords(null);
        // Optionally select the new event
        setSelectedEvent(newEvent);
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-black relative">
            <Navbar
                activeGroup={activeGroup}
                onChangeGroup={(group) => {
                    setActiveGroup(group);
                    setSelectedEvent(null);
                }}
                user={user}
                onUserClick={handleUserClick}
                onLogout={() => setUser(null)}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <Map
                    events={filteredEvents}
                    selectedEvent={selectedEvent}
                    onMarkerClick={(ev) => setSelectedEvent(ev)}
                    activeGroup={activeGroup}
                    // Picking config
                    pickLocationMode={pickLocationMode}
                    onPickLocation={handleLocationPicked}
                    onCancelPickLocation={() => setPickLocationMode(false)}
                />

                <RightSidebar
                    activeGroup={activeGroup}
                    events={filteredEvents}
                    onSelectEvent={(ev) => setSelectedEvent(ev)}
                />

                {/* FAB: Create Event (Only visible if logged in? Or always visible and prompts login?) */}
                {!pickLocationMode && (
                    <button
                        onClick={handleStartCreateEvent}
                        className="absolute bottom-6 right-6 z-30 w-14 h-14 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition active:scale-95 text-2xl"
                        title="Crear evento"
                    >
                        +
                    </button>
                )}
            </div>

            {/* Tarjeta inferior del evento seleccionado */}
            <BottomEventCard
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />

            <CreateEventModal
                open={createModalOpen}
                coords={creationCoords}
                defaultGroup={activeGroup}
                onClose={() => {
                    setCreateModalOpen(false);
                    setCreationCoords(null);
                }}
                onCreated={handleEventCreated}
            />
        </div>
    );
};
