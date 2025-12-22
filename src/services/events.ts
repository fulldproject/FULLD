// src/services/events.ts
import { supabase } from "../lib/supabaseClient";
import type { GroupKey } from "../components/Navbar";
import type { MapEvent, DateMode } from "../data/events";
import type { EdicionRow, EdicionInsert, DateModeDB, EventoGeneralInsert, EventoGeneralRow } from "../types/db.ts";

/**
 * Row returned by view eventos_con_proxima_edicion
 */
type EventWithEditionRow = {
    evento_id: string;
    nombre: string;
    grupo: GroupKey;
    municipio: string | null;
    lat: number | string | null;
    lon: number | string | null;

    // Next edition columns
    edicion_id: string | null;
    date_mode: DateModeDB | null;
    date_start: string | null;
    date_end: string | null;
    date_text: string | null;
};

/**
 * Safe number conversion
 */
function toNumberOrNull(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

/**
 * Normalize event type to match DB enum evento_tipo (FIJO | ITINERANTE)
 */
function normalizeEventoTipo(tipo: unknown): "FIJO" | "ITINERANTE" {
    const t = String(tipo ?? "").trim().toUpperCase();

    // accept common variants
    if (t === "FIJO" || t === "FIXED") return "FIJO";
    if (t === "ITINERANTE" || t === "ITINERANT") return "ITINERANTE";

    // fallback
    return "FIJO";
}

/**
 * Load events for the map from PostGIS VIEW
 * (uses eventos_con_proxima_edicion)
 */
export async function listEventsForMap(activeGroup?: GroupKey): Promise<MapEvent[]> {
    return fetchEventsWithNextEdition(activeGroup);
}

/**
 * Loads events including their next edition info
 */
export async function fetchEventsWithNextEdition(group?: GroupKey): Promise<MapEvent[]> {
    let query = supabase.from("eventos_con_proxima_edicion").select("*");

    if (group) {
        query = query.eq("grupo", group);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to load events from eventos_con_proxima_edicion: ${error.message}`);
    }

    const rows = (data ?? []) as EventWithEditionRow[];

    return rows
        .map((r) => {
            const lat = toNumberOrNull(r.lat);
            const lon = toNumberOrNull(r.lon);

            // Guard: invalid coords
            if (lat === null || lon === null) return null;
            if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

            // Map Date Mode -> UI DateMode
            let date_mode: DateMode = "none";
            let date_text: string | null = null;

            if (r.edicion_id && r.date_mode && r.date_mode !== "NONE") {
                if (r.date_mode === "TEXT") {
                    date_mode = "approx";
                    date_text = r.date_text || null;
                } else if (r.date_mode === "DATE") {
                    date_mode = "exact";
                    if (r.date_start) {
                        date_text = r.date_end ? `${r.date_start} → ${r.date_end}` : r.date_start;
                    }
                }
            }

            const ev: MapEvent = {
                id: r.evento_id,
                name: r.nombre,
                group: r.grupo,
                city: r.municipio,
                venue: null,
                lat,
                lon,
                date_mode,
                date_text,
            };

            return ev;
        })
        .filter((e): e is MapEvent => e !== null);
}

/**
 * Creates a new edition for an event.
 */
export async function createEdition(input: EdicionInsert): Promise<EdicionRow> {
    if (!input.evento_id) throw new Error("Evento ID is required.");

    const { data, error } = await supabase.from("ediciones").insert(input).select().single();

    if (error) throw new Error(`Failed to create edition: ${error.message}`);
    if (!data) throw new Error("Edition created but no data returned.");

    return data as EdicionRow;
}

/**
 * Creates a new general event (RPC wrapper)
 */
export async function createEventGeneral(input: EventoGeneralInsert): Promise<EventoGeneralRow> {
    const nombre = input.nombre.trim();
    const categoria = input.categoria.trim();
    const grupo = input.grupo;
    const tipo = normalizeEventoTipo(input.tipo);

    if (!nombre) throw new Error("Event name is required.");
    if (!categoria) throw new Error("Category is required.");
    if (!Number.isFinite(input.lng) || !Number.isFinite(input.lat)) {
        throw new Error("Valid coordinates (lng, lat) are required.");
    }

    const { data, error } = await supabase.rpc("create_event_general", {
        p_nombre: nombre,
        p_grupo: grupo,
        p_categoria: categoria,
        p_tipo: tipo, // ✅ FIJO | ITINERANTE
        p_lng: input.lng,
        p_lat: input.lat,
        p_municipio: input.municipio || null,
        p_provincia: input.provincia || null,
        p_comunidad: input.comunidad || null,
    });

    if (error) {
        throw new Error(`Failed to create event via RPC (create_event_general): ${error.message}`);
    }
    if (!data) throw new Error("Event created via RPC but no data returned.");

    if (Array.isArray(data)) {
        if (data.length === 0) throw new Error("RPC returned empty array.");
        return data[0] as EventoGeneralRow;
    }

    return data as EventoGeneralRow;
}

/**
 * Deletes an event by ID.
 */
export async function deleteEventGeneral(id: string): Promise<void> {
    if (!id) throw new Error("Event ID is required for deletion.");

    const { error } = await supabase.from("eventos_generales").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete event ${id}: ${error.message}`);
}
