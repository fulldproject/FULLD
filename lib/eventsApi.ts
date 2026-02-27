import { supabase } from "./supabaseClient";

/**
 * NOTA:
 * - eventos_generales tiene "ubicacion" (geography). Para el frontend usamos lat/lng.
 * - Si tienes una VIEW tipo eventos_generales_con_coords, úsala (mejor).
 */

export type DbEventRow = {
    id: string;
    nombre: string;
    grupo: string;
    categoria: string;
    municipio: string | null;
    provincia: string | null;
    comunidad: string | null;
    // Si usas VIEW con coords:
    latitud?: number | null;
    longitud?: number | null;

    // si no usas view, esto existirá:
    ubicacion?: unknown;

    estado_moderacion?: string | null;
    creado_por?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export type DbEditionRow = {
    id: string;
    evento_id: string;
    date_mode: "date" | "text";
    date_start: string | null;
    date_end: string | null;
    date_text: string | null;
    cartel_url: string | null;
    descripcion: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

function pickLatLngFromView(row: DbEventRow) {
    const lat = typeof row.latitud === "number" ? row.latitud : null;
    const lng = typeof row.longitud === "number" ? row.longitud : null;
    return { lat, lng };
}

/**
 * 🔥 RECOMENDADO:
 * Usa la VIEW `eventos_generales_con_coords` (latitud/longitud ya vienen listos)
 */
export async function fetchEventsFromSupabase(params: {
    group?: string;          // ej: "FIESTA"
    category?: string;       // ej: "Festivals"
    search?: string;         // texto libre
    limit?: number;
}) {
    const { group, category, search, limit = 500 } = params;

    // Cambia aquí si tu view se llama distinto
    let q = supabase
        .from("eventos_generales_con_coords")
        .select("id,nombre,grupo,categoria,municipio,provincia,comunidad,latitud,longitud,estado_moderacion,created_at,updated_at")
        .limit(limit);

    if (group) q = q.eq("grupo", group);
    if (category) q = q.eq("categoria", category);

    if (search && search.trim()) {
        // Búsqueda simple por nombre/municipio/provincia
        const s = search.trim();
        q = q.or(`nombre.ilike.%${s}%,municipio.ilike.%${s}%,provincia.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error) throw error;

    return (data ?? []).map((row: DbEventRow) => {
        const { lat, lng } = pickLatLngFromView(row);
        return {
            id: row.id,
            name: row.nombre,
            group: row.grupo,
            category: row.categoria,
            city: row.municipio ?? "",
            province: row.provincia ?? "",
            community: row.comunidad ?? "",
            lat: lat ?? 0,
            lng: lng ?? 0,
            status: row.estado_moderacion ?? "pending",
        };
    });
}

export async function fetchEditionsForEvent(eventId: string) {
    const { data, error } = await supabase
        .from("ediciones")
        .select("id,evento_id,date_mode,date_start,date_end,date_text,cartel_url,descripcion,created_at,updated_at")
        .eq("evento_id", eventId)
        .order("date_start", { ascending: false });

    if (error) throw error;
    return data ?? [];
}
