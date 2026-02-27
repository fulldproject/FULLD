import React, { useState, useMemo, useEffect, useRef } from "react";
import { Footer } from "../components/Footer";
import { useAuth } from "../features/auth/AuthContext";
import { useEvents } from "../features/events/EventsContext";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { GROUPS } from "../constants";
import { StatusModeration, EventGeneral, Edition, UserRole, GroupKey } from "../types";
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  FilterIcon,
  SearchIcon,
  CheckIcon,
  MapPinIcon,
  RotateCcwIcon,
  CalendarIcon,
  InfoIcon,
  ExpandIcon,
  CloseIcon
} from "../components/Icons";

import { eventsApi, CategoryRow } from "../features/events/eventsApi";
import { safeId } from "../lib/safeId";
import { compressPoster } from "../lib/imageCompression";
import ErrorBoundary from "../components/ErrorBoundary";
import { useToast } from "../components/ToastContext";
import { ModalShell } from "../components/ui/ModalShell";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { validateEventForm, FormErrors } from "../lib/validation";
import { EventFormFields } from "../features/events/components/EventFormFields";
import { supabase } from "../lib/supabaseClient";
import { CONFIG } from "../lib/config";
import { getPosterUrl } from "../lib/editionUtils";
import { suggestionsApi } from "../features/events/suggestionsApi";
import type { SuggestionRow } from "../types";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type PointType = "EVENT_MAIN" | "PARKING" | "MEETING_POINT" | "CAMPING" | "OTHER";

const UPLOAD_TIMEOUT = 120000;
const SAVE_TIMEOUT = 60000;

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const toNumberOr = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ✅ fetched suggestions are handled by imported SuggestionRow type

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const {
    events,
    editions,
    categories,
    addEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    addEdition,
    updateEdition,
    deleteEdition,
  } = useEvents();

  const location = useLocation();
  const { showToast } = useToast();

  // ✅ view
  const [viewMode, setViewMode] = useState<"EVENTS" | "SUGGESTIONS">("EVENTS");

  // Filtering
  const [activeGroup, setActiveGroup] = useState<string>("ALL");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Editor
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [shouldAutoAddEdition, setShouldAutoAddEdition] = useState(false);

  // ✅ suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const isAdmin = useIsAdmin();

  // Authorization
  if (!user || (!isAdmin && user.role !== UserRole.ORGANIZER)) {
    return <Navigate to="/" replace />;
  }

  // Handle incoming state
  useEffect(() => {
    const state = location.state as { editingEventId?: string; autoAddEdition?: boolean } | null;
    if (state?.editingEventId) {
      setEditingEventId(state.editingEventId);
      if (state.autoAddEdition) setShouldAutoAddEdition(true);
    }
  }, [location.state]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchGroup = activeGroup === "ALL" || e.group_key === activeGroup;
      const matchStatus = activeStatus === "ALL" || e.status_moderation === activeStatus;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        e.name.toLowerCase().includes(q) ||
        (e.city || "").toLowerCase().includes(q) ||
        (e.province || "").toLowerCase().includes(q);
      return matchGroup && matchStatus && matchSearch;
    });
  }, [events, activeGroup, activeStatus, searchTerm]);

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Delete this event and all its editions?")) return;
    await deleteEvent(id);
  };

  const handleUpdateStatus = async (id: string, status: StatusModeration) => {
    try {
      await updateEventStatus(id, status);
    } catch (e: any) {
      showToast(e?.message || "Error updating status", "error");
    }
  };


  const editingEvent = useMemo(
    () => events.find((e) => e.id === editingEventId) || null,
    [events, editingEventId]
  );

  // ✅ fetch suggestions
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await suggestionsApi.fetchSuggestions();
      setSuggestions(data);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Error loading suggestions", "error");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const { execute: approveSuggestion } = useAsyncAction(async (id: string) => {
    await suggestionsApi.approveSuggestion(id);
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "approved" as any } : s)));
  }, {
    successMessage: "Suggestion approved and created!",
    errorMessage: "Error approving suggestion"
  });

  useEffect(() => {
    if (viewMode === "SUGGESTIONS") fetchSuggestions();
  }, [viewMode]);

  const { execute: rejectSuggestion } = useAsyncAction(async (id: string) => {
    await suggestionsApi.rejectSuggestion(id);
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "rejected" as any } : s)));
  }, {
    successMessage: "Suggestion rejected",
    errorMessage: "Error rejecting suggestion"
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans">
        <header className="h-[64px] border-b border-[var(--border)] px-6 flex items-center justify-between sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tighter">
                {isAdmin ? "Global Admin Panel" : "Organizer Hub"}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                {isAdmin ? "System Control" : "Event Management"}
              </p>
            </div>

            {/* ✅ Tabs */}
            <div className="ml-4 flex bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setViewMode("EVENTS")}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${viewMode === "EVENTS" ? "bg-white text-black" : "text-gray-300 hover:bg-white/10"
                  }`}
              >
                Events
              </button>
              <button
                onClick={() => setViewMode("SUGGESTIONS")}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${viewMode === "SUGGESTIONS" ? "bg-white text-black" : "text-gray-300 hover:bg-white/10"
                  }`}
              >
                Suggestions
              </button>
            </div>
          </div>

          {viewMode === "EVENTS" && (
            <button
              onClick={() => setIsCreateMode(true)}
              className="bg-white text-black text-xs font-black px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
            >
              <PlusIcon className="w-4 h-4" /> Create Official Event
            </button>
          )}
        </header>

        {viewMode === "EVENTS" ? (
          <>
            <div className="bg-[#050505] border-b border-white/5 p-4 space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white/30 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <FilterPill label="All Groups" active={activeGroup === "ALL"} onClick={() => setActiveGroup("ALL")} />
                {GROUPS.map((g) => (
                  <FilterPill
                    key={g.key}
                    label={g.label}
                    active={activeGroup === g.key}
                    onClick={() => setActiveGroup(g.key)}
                  />
                ))}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <StatusPill label="All Status" active={activeStatus === "ALL"} onClick={() => setActiveStatus("ALL")} />
                {Object.values(StatusModeration).map((s) => (
                  <StatusPill
                    key={String(s)}
                    label={String(s).toUpperCase()}
                    active={activeStatus === s}
                    onClick={() => setActiveStatus(String(s))}
                    variant={String(s)}
                  />
                ))}
              </div>
            </div>

            <main className="flex-grow p-4 md:p-8 space-y-4 max-w-5xl mx-auto w-full">
              {filteredEvents.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-30">
                  <FilterIcon className="w-16 h-16 mx-auto" />
                  <p className="text-lg font-bold">No events match your criteria</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <EventManageCard
                    key={event.id}
                    event={event}
                    onEdit={() => setEditingEventId(event.id)}
                    onDelete={() => void handleDeleteEvent(event.id)}
                    onUpdateStatus={(status) => void handleUpdateStatus(event.id, status)}
                  />
                ))
              )}
            </main>

            {(editingEvent || isCreateMode) && (
              <EventEditorModal
                event={isCreateMode ? null : editingEvent}
                categories={categories}
                globalEditions={editions}
                onClose={() => {
                  setEditingEventId(null);
                  setIsCreateMode(false);
                  setShouldAutoAddEdition(false);
                }}
                onCreateEvent={async (newEvent, initialEdition) => {
                  return await addEvent(newEvent, initialEdition);
                }}
                onUpdateEvent={async (id, patch) => {
                  await updateEvent(id, patch);
                }}
                onAddEdition={addEdition}
                onUpdateEdition={updateEdition}
                onDeleteEdition={deleteEdition}
                initialShowAddEdition={shouldAutoAddEdition}
              />
            )}
          </>
        ) : (
          <>
            <div className="bg-[#050505] border-b border-white/5 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black tracking-tight">Suggestions Inbox</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Approve / Reject suggestions from map clicks
                </p>
              </div>
              <button
                onClick={fetchSuggestions}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-black transition"
              >
                Refresh
              </button>
            </div>

            <main className="flex-grow p-4 md:p-8 space-y-4 max-w-5xl mx-auto w-full">
              {loadingSuggestions ? (
                <div className="py-20 text-center opacity-40">Loading…</div>
              ) : suggestions.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-30">
                  <FilterIcon className="w-16 h-16 mx-auto" />
                  <p className="text-lg font-bold">No suggestions yet</p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    s={s}
                    onApprove={() => approveSuggestion(s.id)}
                    onReject={() => rejectSuggestion(s.id)}
                  />
                ))
              )}
            </main>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${active
      ? "bg-white text-black border-white"
      : "bg-white/5 text-gray-500 border-white/5 hover:border-white/10"
      }`}
  >
    {label}
  </button>
);

const StatusPill: React.FC<{ label: string; active: boolean; onClick: () => void; variant?: string }> = ({
  label,
  active,
  onClick,
  variant,
}) => {
  const getColor = () => {
    if (!active) return "text-gray-600 border-white/5";
    switch (variant) {
      case StatusModeration.APPROVED:
        return "bg-green-500 text-black border-green-500";
      case StatusModeration.PENDING:
        return "bg-yellow-500 text-black border-yellow-500";
      case StatusModeration.REJECTED:
        return "bg-red-500 text-black border-red-500";
      default:
        return "bg-white text-black border-white";
    }
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${getColor()}`}
    >
      {label}
    </button>
  );
};

const EventManageCard: React.FC<{
  event: EventGeneral;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: StatusModeration) => void;
}> = ({ event, onEdit, onDelete, onUpdateStatus }) => {
  const getStatusStyle = () => {
    switch (event.status_moderation) {
      case StatusModeration.APPROVED:
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case StatusModeration.PENDING:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case StatusModeration.REJECTED:
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-white/5 text-gray-500 border-white/10";
    }
  };

  const groupLabel = GROUPS.find((g) => g.key === event.group_key)?.label || event.group_key;

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden p-4 flex flex-col sm:flex-row gap-4 hover:border-white/20 transition-all">
      <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
        <img
          src={event.image_url || ""}
          alt={event.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.opacity = "0.2";
          }}
        />
      </div>
      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${getStatusStyle()}`}
            >
              {event.status_moderation}
            </span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{groupLabel}</span>
          </div>
          <h3 className="text-base font-bold text-white truncate">{event.name}</h3>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPinIcon className="w-3 h-3" /> {event.city}, {event.province}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
              title="Edit details"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateStatus(StatusModeration.APPROVED)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${event.status_moderation === StatusModeration.APPROVED
                ? "bg-green-500 text-black"
                : "bg-white/5 text-gray-400 hover:text-green-500 hover:bg-green-500/10"
                }`}
              title="Approve"
            >
              <CheckIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Approve</span>
            </button>
            <button
              onClick={() => onUpdateStatus(StatusModeration.ARCHIVED)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${event.status_moderation === StatusModeration.ARCHIVED
                ? "bg-gray-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              title="Archive"
            >
              <RotateCcwIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Archive</span>
            </button>
          </div>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors ml-auto"
            title="Permanent Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Suggestions card
const SuggestionCard: React.FC<{
  s: SuggestionRow;
  onApprove: () => void;
  onReject: () => void;
}> = ({ s, onApprove, onReject }) => {
  const badge =
    s.status === "pending"
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : s.status === "approved"
        ? "bg-green-500/10 text-green-400 border-green-500/20"
        : "bg-red-500/10 text-red-400 border-red-500/20";

  const type = s.suggestion_type || (s.kind === "EDITION" ? "edition" : "event");
  const payload = s.payload;

  // Formatting date label
  let dateLabel = "TBA";
  if (payload.date_mode === "date") {
    dateLabel = payload.date_start || "—";
    if (payload.date_end) dateLabel += ` → ${payload.date_end}`;
  } else if (payload.date_mode === "text") {
    dateLabel = payload.date_text || "TBA";
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-white/20 transition group">
      {/* Thumbnail */}
      <div className="w-20 sm:w-24 aspect-[3/4] bg-white/5 rounded-xl border border-white/10 overflow-hidden flex-shrink-0">
        {s.poster_url ? (
          <img src={s.poster_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <CalendarIcon className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${badge}`}>
                {s.status}
              </span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest ${type === 'event' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                {type}
              </span>
            </div>

            {s.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={onApprove}
                  className="px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black hover:bg-gray-200 transition"
                >
                  Approve
                </button>
                <button
                  onClick={onReject}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black hover:bg-white/20 transition"
                >
                  Reject
                </button>
              </div>
            )}
          </div>

          <h3 className="text-base font-bold truncate mt-2 text-white">
            {payload.title || payload.name || s.suggested_name || "Untitled Suggestion"}
          </h3>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
            <MapPinIcon className="w-3 h-3 text-gray-600" />
            {payload.city || s.municipio || "Unknown Location"}
            {(payload.province || s.provincia) && ` · ${payload.province || s.provincia}`}
          </p>
        </div>

        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
            <CalendarIcon className="w-3 h-3" />
            {dateLabel}
          </div>
          {payload.notes && (
            <div className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 italic truncate max-w-[150px]">
              “{payload.notes}”
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------------
// EVENT EDITOR MODAL (TU MODAL ACTUAL) — sin cambios funcionales (solo lo dejo tal cual)
// ----------------------------------------------------------------------------------

interface EventEditorModalProps {
  event: EventGeneral | null;
  categories: CategoryRow[];
  globalEditions: Edition[];
  onClose: () => void;
  onCreateEvent: (e: EventGeneral, initialEdition?: Partial<Edition>) => Promise<any>;
  onUpdateEvent: (id: string, patch: Partial<EventGeneral>) => Promise<void>;
  onAddEdition: (e: Partial<Edition>) => Promise<string>;
  onUpdateEdition: (id: string, patch: Partial<Edition>) => Promise<void>;
  onDeleteEdition: (id: string) => Promise<void>;
  initialShowAddEdition?: boolean;
}

const EventEditorModal: React.FC<EventEditorModalProps> = ({
  event,
  categories,
  globalEditions,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  onAddEdition,
  onUpdateEdition,
  onDeleteEdition,
  initialShowAddEdition = false,
}) => {
  const isNew = !event;
  const { user } = useAuth();
  const { showToast } = useToast();

  const initialGroup = (event?.group_key || GROUPS[0].key) as GroupKey;

  const [form, setForm] = useState<any>(
    event || {
      name: "",
      group_key: initialGroup,
      category: "",
      lat: 40.4168,
      lng: -3.7038,
      city: "",
      province: "",
      community: "",
      venue: "",
      short_description: "",
      status_moderation: StatusModeration.APPROVED,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      image_url: "",
      point_type: "EVENT_MAIN" as PointType,
    }
  );

  const [isAddingEdition, setIsAddingEdition] = useState(initialShowAddEdition);
  const [editionSaving, setEditionSaving] = useState<string | null>(null);

  const eventEditions = useMemo(() => {
    if (!event) return [];
    return globalEditions.filter(ed => ed.event_id === event.id);
  }, [globalEditions, event?.id]);

  const [newEdition, setNewEdition] = useState<any>({
    id: safeId(),
    title: "",
    description: "",
    date_mode: "date",
    date_text: "",
    date_start: "",
    date_end: "",
    poster_url: "",
  });

  const [pendingEventImage, setPendingEventImage] = useState<File | null>(null);
  const [pendingPoster, setPendingPoster] = useState<File | null>(null);
  const [previewEventImg, setPreviewEventImg] = useState<string>(form.image_url || "");
  const [previewPoster, setPreviewPoster] = useState<string>("");

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const canAddEdition =
    newEdition.title?.trim().length > 0 && (
      newEdition.date_mode === "tbd" ||
      (newEdition.date_mode === "date" && newEdition.date_start) ||
      (newEdition.date_mode === "text" && newEdition.date_text?.trim().length > 0)
    );

  const { execute: saveEvent, isLoading: saving, error: saveError } = useAsyncAction(async () => {
    let finalEventId: string = form.id;

    // 1) CREATE or UPDATE EVENT
    if (isNew) {
      const eventPayload = {
        ...form,
        image_url: null,
        status_moderation: StatusModeration.APPROVED
      };
      const returnedId = await withTimeout(
        onCreateEvent(eventPayload, undefined),
        SAVE_TIMEOUT,
        "Create Event"
      );

      if (!returnedId || typeof returnedId !== "string") {
        throw new Error("Failed to get new Event ID from server.");
      }
      finalEventId = returnedId;
    } else {
      await withTimeout(onUpdateEvent(finalEventId, form as any), SAVE_TIMEOUT, "Update Event");
    }

    // 2) UPLOAD EVENT IMAGE
    if (pendingEventImage) {
      const compressedImage = await compressPoster(pendingEventImage);
      const finalImageUrl = await withTimeout(
        eventsApi.uploadEventImage(compressedImage, finalEventId),
        UPLOAD_TIMEOUT,
        "Image upload"
      );
      await withTimeout(
        onUpdateEvent(finalEventId, { image_url: finalImageUrl }),
        SAVE_TIMEOUT,
        "Update image url"
      );
    }

    // 3) Handle Initial Edition for NEW events
    if (isNew && isAddingEdition && canAddEdition) {
      let finalPosterUrl = "";
      const editionId = safeId();

      if (pendingPoster) {
        const compressedPoster = await compressPoster(pendingPoster);
        const posterPath = `edition-posters/${finalEventId}/${editionId}.webp`;
        finalPosterUrl = await withTimeout(
          eventsApi.uploadFile(compressedPoster, "edition-posters", posterPath),
          UPLOAD_TIMEOUT,
          "Poster upload"
        );
      }

      const initialEdition: Partial<Edition> = {
        event_id: finalEventId,
        title: newEdition.title.trim(),
        description: newEdition.description.trim() || null,
        date_mode: newEdition.date_mode,
        date_start: newEdition.date_mode === "date" ? newEdition.date_start : undefined,
        date_end: newEdition.date_mode === "date" ? newEdition.date_end : undefined,
        date_text: newEdition.date_mode === "text" ? newEdition.date_text : "TBA",
        poster_url: finalPosterUrl || undefined,
      };

      await withTimeout(onAddEdition(initialEdition), SAVE_TIMEOUT, "Add initial edition");
    }

    onClose();
  }, {
    successMessage: isNew ? "Event created successfully!" : "Changes saved!",
    errorMessage: "Failed to save event. Please try again."
  });

  const handleCreateEdition = async () => {
    if (!canAddEdition || !event) return;
    setEditionSaving("NEW");
    try {
      let finalPosterUrl = "";
      const editionId = safeId();
      if (pendingPoster) {
        const compressedPoster = await compressPoster(pendingPoster);
        finalPosterUrl = await eventsApi.uploadFile(
          compressedPoster,
          "edition-posters",
          `edition-posters/${event.id}/${editionId}.webp`
        );
      }

      await onAddEdition({
        event_id: event.id,
        title: newEdition.title.trim(),
        description: newEdition.description.trim() || null,
        date_mode: newEdition.date_mode,
        date_start: newEdition.date_mode === "date" ? newEdition.date_start : undefined,
        date_end: newEdition.date_mode === "date" ? newEdition.date_end : undefined,
        date_text: newEdition.date_mode === "text" ? newEdition.date_text : "TBA",
        poster_url: finalPosterUrl || undefined,
      });

      setNewEdition({
        id: safeId(),
        title: "",
        description: "",
        date_mode: "date",
        date_text: "",
        date_start: "",
        date_end: "",
        poster_url: "",
      });
      setPendingPoster(null);
      setPreviewPoster("");
      setIsAddingEdition(false);
      showToast("Edition added!", "success");
    } catch (e: any) {
      showToast(e.message || "Error adding edition", "error");
    } finally {
      setEditionSaving(null);
    }
  };

  const handleDeleteEdition = async (id: string) => {
    if (!window.confirm("Delete this edition?")) return;
    setEditionSaving(id);
    try {
      await onDeleteEdition(id);
      showToast("Edition deleted", "success");
    } catch (e: any) {
      showToast(e.message || "Error deleting edition", "error");
    } finally {
      setEditionSaving(null);
    }
  };

  useEffect(() => {
    if (attemptedSubmit) {
      const errors = validateEventForm(form, isAddingEdition ? newEdition : undefined);
      setFormErrors(errors);
    }
  }, [form, newEdition, isAddingEdition, attemptedSubmit]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "event" | "poster") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "event") {
      setPendingEventImage(file);
      setPreviewEventImg(URL.createObjectURL(file));
    } else {
      setPendingPoster(file);
      setPreviewPoster(URL.createObjectURL(file));
    }
  };

  const handleSaveAll = async (evt?: any) => {
    if (evt?.preventDefault) evt.preventDefault();
    setAttemptedSubmit(true);

    const errors = validateEventForm(form, isAddingEdition ? newEdition : undefined);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    await saveEvent();
  };

  const footerActions = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={() => handleSaveAll()}
        disabled={saving}
        isLoading={saving}
        icon={!saving && <CheckIcon className="w-4 h-4" />}
      >
        {isNew ? "Create Event" : "Save Changes"}
      </Button>
    </>
  );


  return (
    <>
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title={isNew ? "Create Event" : "Edit Event"}
        subtitle={isNew ? "Add a new event to the platform" : `Editing ${form.name}`}
        footer={footerActions}
      >
        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl p-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {saveError.message}
          </div>
        )}

        <EventFormFields
          formData={form}
          setFormData={setForm}
          formErrors={formErrors}
          categories={categories}
        />

        <section className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Venue (optional)"
              value={form.venue || ""}
              onChange={(e) => setForm((p: any) => ({ ...p, venue: e.target.value }))}
            />

            <Select
              label="Point Type *"
              value={form.point_type}
              onChange={(e) => setForm((p: any) => ({ ...p, point_type: e.target.value as PointType }))}
              options={[
                { label: "Main Event", value: "EVENT_MAIN" },
                { label: "Parking", value: "PARKING" },
                { label: "Meeting Point", value: "MEETING_POINT" },
                { label: "Camping", value: "CAMPING" },
                { label: "Other", value: "OTHER" },
              ]}
            />
          </div>

          {/* COORDINATES */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                Manual Coordinates (Optional)
              </label>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowMapPicker(true)}
                icon={<MapPinIcon className="w-3 h-3" />}
                type="button"
              >
                Pick on Map
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Latitude"
                type="number"
                step="0.000001"
                value={form.lat ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...p, lat: toNumberOr(e.target.value, 40.4168) }))}
                error={formErrors.lat}
              />
              <Input
                placeholder="Longitude"
                type="number"
                step="0.000001"
                value={form.lng ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...p, lng: toNumberOr(e.target.value, -3.7038) }))}
                error={formErrors.lng}
              />
            </div>
          </div>

          {/* EVENT IMAGE UPLOAD */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
              Event Image (Optional)
            </label>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
              <div className="w-24 h-16 bg-black rounded-lg border border-white/10 flex-shrink-0 overflow-hidden">
                {previewEventImg ? (
                  <img src={previewEventImg} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700 bg-white/5">
                    <span className="text-[9px]">NO IMAGE</span>
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="event-image-upload"
                  onChange={(e) => onFileSelect(e, "event")}
                />
                <label
                  htmlFor="event-image-upload"
                  className="inline-block cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                >
                  Choose Image
                </label>

                {pendingEventImage && (
                  <p className="text-[10px] text-yellow-400 font-bold">
                    * Selected: {pendingEventImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* EDITIONS SECTION */}
        <section className="space-y-6 mt-10 mb-6">
          <div className="flex items-center justify-between border-t border-white/5 pt-8">
            <div className="flex items-center gap-3">
              <SectionHeader title="Editions" />
              {!isNew && (
                <span className="px-2 py-0.5 bg-white/10 text-[9px] font-black rounded-full text-gray-400">
                  {eventEditions.length}
                </span>
              )}
            </div>
            {!isAddingEdition && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsAddingEdition(true)}
                type="button"
                icon={<PlusIcon className="w-3 h-3" />}
              >
                Add Edition
              </Button>
            )}
          </div>

          {!isNew && eventEditions.length > 0 && !isAddingEdition && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventEditions.map((ed) => (
                <EditionItem
                  key={ed.id}
                  edition={ed}
                  loading={editionSaving === ed.id}
                  onDelete={() => handleDeleteEdition(ed.id)}
                  onEdit={() => {
                    showToast("Edit mode coming soon - use delete/re-add for now", "info");
                  }}
                />
              ))}
            </div>
          )}

          {isAddingEdition && (
            <div className="bg-[#1A1A1A] border border-blue-500/30 rounded-3xl p-6 space-y-6 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">New Edition</h4>
                  <p className="text-[9px] text-gray-500">Configure dates and poster for this cycle</p>
                </div>
                <button
                  onClick={() => setIsAddingEdition(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"
                >
                  <InfoIcon className="rotate-45 w-4 h-4" /> {/* Fallback if CloseIcon missing */}
                </button>
              </div>

              <div className="space-y-6">
                <Input
                  label="Edition Title *"
                  placeholder="e.g. 15th Anniversary Edition"
                  value={newEdition.title || ""}
                  onChange={(e) => setNewEdition((p: any) => ({ ...p, title: e.target.value }))}
                  error={formErrors.edition_title}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                    Date Configuration <InfoIcon className="w-3 h-3 opacity-30" />
                  </label>
                  <div className="grid grid-cols-3 bg-black/40 border border-white/5 rounded-2xl p-1.5 gap-1">
                    {[
                      { label: "Date", value: "date" },
                      { label: "Text", value: "text" },
                      { label: "TBD", value: "tbd" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setNewEdition((p: any) => ({ ...p, date_mode: m.value }))}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newEdition.date_mode === m.value
                          ? "bg-white text-black shadow-xl"
                          : "text-gray-500 hover:text-white"
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {newEdition.date_mode === "date" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Input
                      label="Start Date *"
                      type="date"
                      value={newEdition.date_start || ""}
                      onChange={(e) => setNewEdition((p: any) => ({ ...p, date_start: e.target.value }))}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={newEdition.date_end || ""}
                      onChange={(e) => setNewEdition((p: any) => ({ ...p, date_end: e.target.value }))}
                    />
                  </div>
                )}

                {newEdition.date_mode === "text" && (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <Input
                      label="Custom Text *"
                      placeholder="e.g. Every weekend in July"
                      value={newEdition.date_text || ""}
                      onChange={(e) => setNewEdition((p: any) => ({ ...p, date_text: e.target.value }))}
                      helperText="Specify the dates in natural language"
                    />
                  </div>
                )}

                {/* POSTER UPLOAD */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                    Edition Poster
                  </label>
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-5 flex gap-6 items-center">
                    <div className="w-16 h-20 bg-black rounded-xl border border-white/10 flex-shrink-0 overflow-hidden shadow-2xl relative group">
                      {previewPoster ? (
                        <img src={previewPoster} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-800 bg-white/5">
                          <PlusIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-grow space-y-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="poster-upload"
                          onChange={(e) => onFileSelect(e, "poster")}
                        />
                        <label
                          htmlFor="poster-upload"
                          className="w-fit cursor-pointer px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          {previewPoster ? "Change Poster" : "Upload Poster"}
                        </label>
                        {pendingPoster && (
                          <div className="flex items-center gap-2 text-[9px] text-blue-400 font-bold">
                            <CheckIcon className="w-3 h-3" /> Ready: {pendingPoster.name}
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-600 leading-tight">
                        Posters should be in 3:4 aspect ratio. We'll automatically compress it for you.
                      </p>
                    </div>
                  </div>
                </div>

                {!isNew && (
                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingEdition(false);
                        setPendingPoster(null);
                        setPreviewPoster("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateEdition}
                      isLoading={editionSaving === "NEW"}
                      disabled={!canAddEdition}
                    >
                      Save Edition Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isNew && eventEditions.length === 0 && !isAddingEdition && (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center group hover:border-white/20 transition-all cursor-pointer" onClick={() => setIsAddingEdition(true)}>
              <CalendarIcon className="w-10 h-10 mx-auto text-gray-700 mb-4 group-hover:text-gray-500 transition-colors" />
              <p className="text-gray-500 font-bold text-sm">No editions found</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Click to create the first one</p>
            </div>
          )}

          {isNew && (
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
              <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-[10px] text-blue-300/80 leading-relaxed">
                When creating a <strong>New Event</strong>, you can optionally configure its first edition now.
                Subsequent editions can be managed after the event is saved.
              </p>
            </div>
          )}
        </section>
      </ModalShell>

      {showMapPicker && (
        <MapPickerModal
          initialLat={toNumberOr(form.lat, 40.4168)}
          initialLng={toNumberOr(form.lng, -3.7038)}
          onClose={() => setShowMapPicker(false)}
          onPick={(lat, lng) => {
            setForm((p: any) => ({ ...p, lat, lng }));
            setShowMapPicker(false);
          }}
        />
      )}
    </>
  );
};

const MapPickerModal: React.FC<{
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  onPick: (lat: number, lng: number) => void;
}> = ({ initialLat, initialLng, onClose, onPick }) => {
  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Pick on Map"
      subtitle="Click on the map to set latitude and longitude"
      footer={
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <MapLibrePicker initialLat={initialLat} initialLng={initialLng} onPick={onPick} />
      <p className="text-[10px] text-gray-500 mt-3">Tip: zoom and click anywhere.</p>
    </ModalShell>
  );
};

const MapLibrePicker: React.FC<{
  initialLat: number;
  initialLng: number;
  onPick: (lat: number, lng: number) => void;
}> = ({ initialLat, initialLng, onPick }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CONFIG.MAPTILER.STYLE_URL(CONFIG.MAPTILER.KEY),
      center: [initialLng, initialLat],
      zoom: 8,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const marker = new maplibregl.Marker({ draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    marker.on("dragend", () => {
      const ll = marker.getLngLat();
      onPickRef.current(ll.lat, ll.lng);
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      onPickRef.current(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      try {
        map.remove();
      } catch { }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialLat, initialLng]);

  return (
    <div className="h-[60vh] rounded-2xl overflow-hidden border border-white/10">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

const EditionItem: React.FC<{
  edition: Edition;
  loading?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ edition, loading, onEdit, onDelete }) => {
  const posterUrl = getPosterUrl(edition.poster_url);

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-3 flex gap-4 items-center group hover:border-white/10 transition-all">
      <div className="w-12 h-16 bg-black rounded-lg border border-white/5 flex-shrink-0 overflow-hidden shadow-lg">
        {posterUrl ? (
          <img src={posterUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <CalendarIcon className="w-4 h-4 text-gray-800" />
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <h5 className="text-[11px] font-black text-white truncate uppercase tracking-tight">
          {edition.title}
        </h5>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded leading-none">
            {edition.date_mode}
          </span>
          <p className="text-[9px] text-gray-400 truncate font-medium">
            {edition.date_mode === 'date' ? edition.date_start : edition.date_text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          disabled={loading}
          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RotateCcwIcon className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <TrashIcon className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-xs font-black uppercase text-blue-400 tracking-tighter border-b border-white/5 pb-2">
    {title}
  </h3>
);
