import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { eventsApi, CategoryRow } from "./eventsApi";
import { EventGeneral, Edition, StatusModeration, GroupKey } from "../../types";
import { GROUPS } from "../../constants";

interface EventsContextType {
  events: EventGeneral[];
  editions: Edition[];
  categories: CategoryRow[];

  activeGroupKey: GroupKey;
  activeCategoryId: string | null;
  setActiveGroupKey: (g: GroupKey) => void;
  setActiveCategoryId: (id: string | null) => void;

  filteredEvents: EventGeneral[];
  getCategoriesForGroup: (groupKey: GroupKey) => CategoryRow[];

  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;

  addEvent: (event: EventGeneral, initialEdition?: Partial<Edition>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<EventGeneral>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateEventStatus: (id: string, status: StatusModeration) => Promise<void>;

  addEdition: (edition: Partial<Edition>) => Promise<string>;
  updateEdition: (id: string, updates: Partial<Edition>) => Promise<void>;
  deleteEdition: (id: string) => Promise<void>;

  updateEditionsForEvent: (eventId: string, eventEditions: Edition[]) => Promise<void>;
  updateEditions: (eventEditions: Edition[]) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventGeneral[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const [activeGroupKey, setActiveGroupKey] = useState<GroupKey>(GROUPS[0].key);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const [catRows, eventRows] = await Promise.all([
        eventsApi.fetchCategories(),
        eventsApi.fetchEvents()
      ]);

      setCategories(catRows);
      setEvents(eventRows);

      const eventIds = eventRows.map((x) => x.id).filter(Boolean);
      // ✅ Use optimized Fetch for Map/Sidebar
      const editionRows = await eventsApi.fetchActiveEditions(eventIds);
      setEditions(editionRows);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
      setEvents([]);
      setEditions([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const okGroup = !activeGroupKey ? true : e.group_key === activeGroupKey;
      const okCat = !activeCategoryId ? true : e.category === activeCategoryId;
      return okGroup && okCat;
    });
  }, [events, activeGroupKey, activeCategoryId]);

  const getCategoriesForGroup = (groupKey: GroupKey) => {
    return (categories ?? [])
      .filter((c) => (c.is_active ?? true))
      .filter((c) => !groupKey || c.group_key === groupKey)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  };

  // --- CRUD EVENT ---
  const addEvent = async (event: EventGeneral, initialEdition?: Partial<Edition>) => {
    setLoading(true);
    setError(null);
    try {
      const eventId = await eventsApi.createEvent(event, initialEdition);
      await refresh();
      return eventId;
    } catch (e: any) {
      setError(e?.message ?? "Failed to create event");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<EventGeneral>) => {
    setLoading(true);
    setError(null);
    try {
      await eventsApi.updateEvent(id, updates);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update event");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await eventsApi.deleteEvent(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete event");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateEventStatus = async (id: string, status: StatusModeration) => {
    const originalEvents = [...events];
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status_moderation: status } : e));

    try {
      await eventsApi.updateEvent(id, { status_moderation: status });
    } catch (e: any) {
      // Rollback
      setEvents(originalEvents);
      setError(e?.message ?? "Failed to update status");
      throw e;
    }
  };

  // --- CRUD EDITIONS Granular ---
  const addEdition = async (edition: Partial<Edition>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await eventsApi.createEdition(edition);
      await refresh();
      return id;
    } catch (e: any) {
      setError(e?.message ?? "Failed to add edition");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateEdition = async (id: string, updates: Partial<Edition>) => {
    setLoading(true);
    setError(null);
    try {
      await eventsApi.updateEdition(id, updates);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update edition");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteEdition = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await eventsApi.deleteEdition(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete edition");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      events,
      editions,
      categories,
      activeGroupKey,
      activeCategoryId,
      setActiveGroupKey,
      setActiveCategoryId,
      filteredEvents,
      getCategoriesForGroup,
      loading,
      error,
      refresh,
      addEvent,
      updateEvent,
      deleteEvent,
      updateEventStatus,
      // Granular CRUD
      addEdition,
      updateEdition,
      deleteEdition,
      // Legacy compatibility
      updateEditionsForEvent: async (eventId: string, eventEditions: Edition[]) => {
        await eventsApi.updateEditionsForEvent(eventId, eventEditions);
        await refresh();
      },
      updateEditions: async (eds: Edition[]) => {
        if (eds.length === 0) return;
        const firstId = eds[0]?.event_id;
        if (firstId) await eventsApi.updateEditionsForEvent(firstId, eds);
        await refresh();
      },
    }),
    [events, editions, categories, activeGroupKey, activeCategoryId, filteredEvents, loading, error]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
};
