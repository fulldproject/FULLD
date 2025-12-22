// src/data/events.ts
import type { GroupKey } from "../components/Navbar";

// ✅ Date modes as a strict union
export type DateMode = "none" | "approx" | "exact";

// ✅ Strongly-typed constants (prevents "string is not assignable" issues)
export const DATE_MODE_NONE: DateMode = "none";
export const DATE_MODE_APPROX: DateMode = "approx";
export const DATE_MODE_EXACT: DateMode = "exact";

export interface MapEvent {
    id: string;
    name: string;
    group: GroupKey;

    lat: number;
    lon: number;

    city?: string | null;
    venue?: string | null;

    date_mode?: DateMode | null;
    date_text?: string | null;

    status?: string | null;
    event_type?: string | null;
}

// Keep compatibility with the rest of the app
export type Event = MapEvent;

// Optional local mocks
export const EVENTS: Event[] = [];
