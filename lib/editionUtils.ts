import { Edition } from "../types";
import { supabase } from "./supabaseClient";

/**
 * Resolves the public URL for an edition poster.
 * If the poster_url is already a full URL, it returns it.
 * If it's a storage path, it builds the public URL using Supabase.
 */
export function getPosterUrl(poster_url?: string): string | undefined {
    if (!poster_url) return undefined;

    if (poster_url.startsWith("http://") || poster_url.startsWith("https://")) {
        return poster_url;
    }

    const { data } = supabase.storage.from("edition-posters").getPublicUrl(poster_url);
    return data.publicUrl;
}

/**
 * Logic to determine the "ACTIVE" edition:
 * 1. Prefer future editions only when date_mode === 'date' and date_start >= today.
 * 2. Choose the nearest upcoming among those.
 * 3. Fallback to the latest created_at edition if no future 'date' edition exists.
 */
export function getActiveEdition(editions: Edition[]): Edition | undefined {
    if (!editions || editions.length === 0) return undefined;

    const today = new Date().toISOString().split("T")[0];

    // 1. Filtrar ediciones con fecha futura (date_mode === 'date')
    const futureDateEditions = editions.filter(ed =>
        ed.date_mode === 'date' &&
        ed.date_start &&
        ed.date_start >= today
    );

    if (futureDateEditions.length > 0) {
        // Ordenar por fecha de inicio (la más cercana primero)
        return [...futureDateEditions].sort((a, b) =>
            (a.date_start || "").localeCompare(b.date_start || "")
        )[0];
    }

    // 2. Fallback: la más reciente creada_at (independientemente del modo)
    return [...editions].sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
    )[0];
}

export type EditionStatus = 'upcoming' | 'live' | 'past' | 'tba';

/**
 * Centralized logic to determine the status of an edition.
 * - tba: date_mode !== 'date'
 * - upcoming: today < date_start
 * - live: today between date_start and date_end (inclusive)
 * - past: today > date_end
 * 
 * Compares YYYY-MM-DD strings to avoid timezone shifts.
 */
export function getEditionStatus(edition?: Edition): EditionStatus {
    if (!edition || edition.date_mode !== 'date' || !edition.date_start) {
        return 'tba';
    }

    const today = new Date().toISOString().split("T")[0];
    const { date_start, date_end } = edition;

    if (today < date_start) {
        return 'upcoming';
    }

    if (date_end && today > date_end) {
        return 'past';
    }

    return 'live';
}



