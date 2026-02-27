import { supabase } from "../../lib/supabaseClient";
import { EventGeneral, Edition, StatusModeration, CategoryKey } from "../../types";
import { GROUPS } from "../../constants";
import { EventDbSchema, EditionDbSchema } from "../../lib/validation";

export type CategoryRow = {
    id: string;
    group_key: string;
    key: string;
    label: string;
    sort_order: number | null;
    is_active: boolean | null;
};

const VISIBLE_GROUP_KEYS = GROUPS.map((g) => g.key);

/**
 * Maps a database event row to the UI-friendly EventGeneral type.
 * Now uses Zod for safe parsing as requested.
 */
export function mapDbEventToUi(row: any): EventGeneral | null {
    const result = EventDbSchema.safeParse(row);

    if (!result.success) {
        console.warn(`[API] Invalid event row skipped: ${row.id || 'unknown'}`, result.error.format());
        return null;
    }

    const data = result.data;

    return {
        id: data.id,
        name: data.name ?? "",
        slug: data.slug ?? "",
        group_key: data.group_key ?? "",
        category: data.category_id ?? "",
        lat: data.lat ?? 0,
        lng: data.lng ?? 0,
        city: data.city ?? "",
        province: data.province ?? "",
        community: data.community ?? "",
        venue: data.venue ?? "",
        short_description: data.short_description ?? "",
        status_moderation: (data.status_moderation ?? "pending") as StatusModeration,
        created_by: data.created_by ?? "",
        created_at: data.created_at ?? new Date().toISOString(),
        image_url: data.image_url ?? undefined,
        event_type: data.event_type ?? "FIJO",
    } as any;
}

/**
 * Maps a UI EventGeneral object to a payload suitable for Supabase insertion/update.
 */
export function mapUiEventToDbPayload(e: EventGeneral) {
    const payload: any = {
        name: e.name,
        slug: (e as any).slug ?? null,
        group_key: e.group_key,
        category_id: e.category || null,
        event_type: (e as any).event_type ?? "FIJO",
        location: `POINT(${e.lng} ${e.lat})`,
        city: e.city || null,
        province: e.province || null,
        community: e.community || null,
        venue: (e as any).venue || null,
        short_description: e.short_description || null,
        image_url: e.image_url || null,
        status_moderation: e.status_moderation ?? "pending",
    };

    if (e.id && !e.id.startsWith('temp_')) {
        payload.id = e.id;
    }

    return payload;
}

/**
 * Event API operations.
 */
export const eventsApi = {
    async fetchCategories(): Promise<CategoryRow[]> {
        const { data, error } = await supabase
            .from("categories")
            .select("id,group_key,key,label,sort_order,is_active")
            .in("group_key", VISIBLE_GROUP_KEYS)
            .order("group_key", { ascending: true })
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return (data ?? []) as CategoryRow[];
    },

    async fetchEvents(): Promise<EventGeneral[]> {
        const { data, error } = await supabase
            .from("events_with_coords")
            .select("id,name,slug,group_key,category_id,event_type,city,province,community,venue,short_description,image_url,status_moderation,created_by,created_at,updated_at,lat,lng")
            .in("group_key", VISIBLE_GROUP_KEYS)
            .limit(5000);

        if (error) throw error;

        return (data ?? [])
            .map(mapDbEventToUi)
            .filter((e): e is EventGeneral => e !== null);
    },

    async fetchEditions(eventIds: string[]): Promise<Edition[]> {
        if (eventIds.length === 0) return [];

        const { data, error } = await supabase
            .from("editions")
            .select("id,event_id,title,description,date_mode,date_start,date_end,date_text,poster_url,created_by,created_at,updated_at")
            .in("event_id", eventIds)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data ?? []).map((r: any) => {
            const result = EditionDbSchema.safeParse(r);
            if (!result.success) {
                console.warn(`[API] Invalid edition row skipped: ${r.id}`, result.error.format());
                return null;
            }
            const d = result.data;
            const ed: Edition = {
                id: d.id,
                event_id: d.event_id,
                title: d.title ?? "",
                description: d.description ?? "",
                date_mode: d.date_mode as "date" | "text" | "tbd",
                date_start: d.date_start ?? undefined,
                date_end: d.date_end ?? undefined,
                date_text: d.date_text ?? "TBA",
                poster_url: d.poster_url ?? undefined,
                created_by: d.created_by ?? undefined,
                created_at: d.created_at ?? undefined,
            };
            return ed;
        }).filter((ed): ed is Edition => ed !== null);
    },

    /**
     * Optimized fetch for Map/Sidebar: Only fetch relevant editions (active or recent).
     * This avoids downloading thousands of past editions for a global view.
     */
    async fetchActiveEditions(eventIds: string[]): Promise<Edition[]> {
        if (eventIds.length === 0) return [];

        const today = new Date().toISOString().split("T")[0];

        // Fetch editions that are either:
        // 1. Future/current date-based editions
        // 2. OR very recent editions (to handle fallbacks)
        const { data, error } = await supabase
            .from("editions")
            .select("id,event_id,title,description,date_mode,date_start,date_end,date_text,poster_url,created_by,created_at,updated_at")
            .in("event_id", eventIds)
            .or(`date_start.gte.${today},date_mode.neq.date`) // Simplified: get all non-date mode + future date mode
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data ?? []).map((r: any) => {
            const result = EditionDbSchema.safeParse(r);
            if (!result.success) return null;
            const d = result.data;
            return {
                id: d.id,
                event_id: d.event_id,
                title: d.title ?? "",
                description: d.description ?? "",
                date_mode: d.date_mode as "date" | "text" | "tbd",
                date_start: d.date_start ?? undefined,
                date_end: d.date_end ?? undefined,
                date_text: d.date_text ?? "TBA",
                poster_url: d.poster_url ?? undefined,
                created_by: d.created_by ?? undefined,
                created_at: d.created_at ?? undefined,
            } as Edition;
        }).filter((ed): ed is Edition => ed !== null);
    },

    async createEvent(event: EventGeneral, initialEdition?: Partial<Edition>): Promise<string> {
        if (!VISIBLE_GROUP_KEYS.includes(event.group_key)) {
            throw new Error(`Invalid group key: ${event.group_key}`);
        }

        const payload = mapUiEventToDbPayload(event);
        delete payload.id; // Force DB to generate UUID

        const { data: inserted, error: insErr } = await supabase
            .from("events")
            .insert(payload)
            .select("id")
            .single();

        if (insErr) {
            if (insErr.code === '42501') {
                throw new Error("Permission denied: You do not have permission to create events.");
            }
            throw insErr;
        }

        const eventId = inserted?.id;
        if (!eventId) throw new Error("Event created but no id returned.");

        if (initialEdition) {
            await this.createEdition({ ...initialEdition, event_id: eventId });
        }

        return eventId;
    },

    async createEdition(edition: Partial<Edition>): Promise<string> {
        const payload = {
            event_id: edition.event_id,
            title: edition.title ?? null,
            description: edition.description ?? null,
            date_mode: edition.date_mode ?? "text",
            date_start: edition.date_start ?? null,
            date_end: edition.date_end ?? null,
            date_text: edition.date_text ?? "TBA",
            poster_url: edition.poster_url ?? null,
        };

        const { data, error } = await supabase
            .from("editions")
            .insert(payload)
            .select("id")
            .single();

        if (error) throw error;
        return data.id;
    },

    async updateEdition(id: string, updates: Partial<Edition>): Promise<void> {
        const patch: any = {};
        if (updates.title !== undefined) patch.title = updates.title;
        if (updates.description !== undefined) patch.description = updates.description;
        if (updates.date_mode !== undefined) patch.date_mode = updates.date_mode;
        if (updates.date_start !== undefined) patch.date_start = updates.date_start || null;
        if (updates.date_end !== undefined) patch.date_end = updates.date_end || null;
        if (updates.date_text !== undefined) patch.date_text = updates.date_text || "TBA";
        if (updates.poster_url !== undefined) patch.poster_url = updates.poster_url || null;

        const { error } = await supabase
            .from("editions")
            .update(patch)
            .eq("id", id);

        if (error) throw error;
    },

    async deleteEdition(id: string): Promise<void> {
        const { error } = await supabase
            .from("editions")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    async updateEvent(id: string, updates: Partial<EventGeneral>): Promise<void> {
        const patch: any = {};
        if (updates.name !== undefined) patch.name = updates.name;
        if (updates.group_key !== undefined) patch.group_key = updates.group_key;
        if (updates.category !== undefined) patch.category_id = updates.category || null;
        if (updates.city !== undefined) patch.city = updates.city || null;
        if (updates.province !== undefined) patch.province = updates.province || null;
        if (updates.community !== undefined) patch.community = updates.community || null;
        if (updates.short_description !== undefined) patch.short_description = updates.short_description || null;
        if (updates.status_moderation !== undefined) patch.status_moderation = updates.status_moderation;
        if (updates.image_url !== undefined) patch.image_url = updates.image_url || null;

        if (updates.lat !== undefined || updates.lng !== undefined) {
            patch.location = `POINT(${updates.lng} ${updates.lat})`;
        }

        const { error } = await supabase.from("events").update(patch).eq("id", id);
        if (error) throw error;
    },

    async deleteEvent(id: string): Promise<void> {
        const { error: edErr } = await supabase.from("editions").delete().eq("event_id", id);
        if (edErr) throw edErr;

        const { error: evErr } = await supabase.from("events").delete().eq("id", id);
        if (evErr) throw evErr;
    },

    async updateEditionsForEvent(eventId: string, eventEditions: Edition[]): Promise<void> {
        const { error: delErr } = await supabase.from("editions").delete().eq("event_id", eventId);
        if (delErr) {
            if (delErr.code === '42501') throw new Error("Permission denied: Cannot delete/update these editions.");
            throw delErr;
        }

        if (eventEditions.length > 0) {
            const payload = eventEditions.map((ed) => ({
                event_id: eventId,
                title: ed.title ?? null,
                description: ed.description ?? null,
                date_mode: ed.date_mode,
                date_start: ed.date_start ?? null,
                date_end: ed.date_end ?? null,
                date_text: ed.date_text ?? "TBA",
                poster_url: ed.poster_url ?? null,
            }));

            const { error: insErr } = await supabase.from("editions").insert(payload);
            if (insErr) throw insErr;
        }
    },

    async uploadFile(file: File, bucket: string, path: string): Promise<string> {
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    },

    async uploadEventImage(file: File, folder: string): Promise<string> {
        const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        return this.uploadFile(file, "event-images", path);
    }
};
