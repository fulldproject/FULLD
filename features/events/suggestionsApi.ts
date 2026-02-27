import { supabase } from "../../lib/supabaseClient";
import { SuggestionRow, SuggestionType, SuggestionPayload, StatusModeration, EventGeneral, Edition } from "../../types";
import { compressPoster } from "../../lib/imageCompression";
import { eventsApi } from "./eventsApi";

export const suggestionsApi = {
    /**
     * Creates a new suggestion.
     * Flow: Insert row -> compress & upload poster if exists -> update row with poster_url
     */
    async createSuggestion({
        suggestionType,
        eventId,
        payload,
        posterFile
    }: {
        suggestionType: SuggestionType;
        eventId?: string;
        payload: SuggestionPayload;
        posterFile?: File;
    }): Promise<SuggestionRow> {
        const { data: user } = await supabase.auth.getUser();

        // 1. Insert initial suggestion row
        const { data: suggestion, error: insertError } = await supabase
            .from("suggestions")
            .insert({
                suggestion_type: suggestionType,
                event_id: eventId || null,
                payload: payload,
                status: "pending",
                created_by: user.user?.id || null,
                // Legacy compatibility
                kind: suggestionType === "event" ? "EVENT" : "EDITION",
                lat: payload.lat || null,
                lng: payload.lng || null,
                municipio: payload.city || null,
                provincia: payload.province || null
            })
            .select("*")
            .single();

        if (insertError) throw insertError;

        let finalPosterUrl = null;

        // 2. Handle poster upload if provided
        if (posterFile && suggestion) {
            try {
                const compressed = await compressPoster(posterFile);
                const fileName = `${suggestion.id}.webp`;
                const filePath = `suggestions/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("suggestion-images")
                    .upload(filePath, compressed, {
                        contentType: "image/webp",
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("suggestion-images")
                    .getPublicUrl(filePath);

                finalPosterUrl = urlData.publicUrl;

                // Update row with poster_url
                const { error: updateError } = await supabase
                    .from("suggestions")
                    .update({ poster_url: finalPosterUrl })
                    .eq("id", suggestion.id);

                if (updateError) throw updateError;
                suggestion.poster_url = finalPosterUrl;
            } catch (uploadErr) {
                console.error("Error uploading suggestion poster:", uploadErr);
                // We don't fail the whole suggestion if upload fails, but it's not ideal
            }
        }

        return suggestion as SuggestionRow;
    },

    async fetchSuggestions(status: string = "pending"): Promise<SuggestionRow[]> {
        const { data, error } = await supabase
            .from("suggestions")
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Fallback mapping for legacy suggestions
        return (data || []).map((row: any) => {
            if (!row.suggestion_type) {
                row.suggestion_type = row.kind === "EDITION" ? "edition" : "event";
            }
            if (!row.payload || Object.keys(row.payload).length === 0) {
                row.payload = {
                    title: row.suggested_name || "Untitled Suggestion",
                    description: row.notes || "",
                    date_mode: (row.date_mode as any) || "text",
                    date_start: row.date_start,
                    date_end: row.date_end,
                    date_text: row.date_text || "TBA",
                    lat: row.lat,
                    lng: row.lng,
                    city: row.municipio,
                    province: row.provincia
                };
            }
            return row as SuggestionRow;
        });
    },

    async approveSuggestion(id: string): Promise<void> {
        const { data: s, error: fetchErr } = await supabase
            .from("suggestions")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchErr || !s) throw fetchErr || new Error("Suggestion not found");
        const row = s as any;

        // Ensure types/payload are present (mapping for legacy if needed)
        const type = row.suggestion_type || (row.kind === "EDITION" ? "edition" : "event");
        const payload: SuggestionPayload = (row.payload && Object.keys(row.payload).length > 0)
            ? row.payload
            : {
                title: row.suggested_name || "Untitled",
                date_mode: row.date_mode || "text",
                date_start: row.date_start,
                date_end: row.date_end,
                date_text: row.date_text || "TBA",
                lat: row.lat,
                lng: row.lng,
                city: row.municipio,
                province: row.provincia
            };

        if (type === "event") {
            // 1. Create Event
            const newEvent: EventGeneral = {
                id: "", // Let API handle UUID
                name: payload.name || payload.title,
                group_key: payload.group_key || "OTHER",
                category: payload.category || "",
                lat: payload.lat || 0,
                lng: payload.lng || 0,
                city: payload.city || "",
                province: payload.province || "",
                community: payload.community || payload.province || "",
                short_description: payload.description || "",
                status_moderation: StatusModeration.APPROVED,
                created_by: row.created_by || "",
                created_at: new Date().toISOString()
            };

            const eventId = await eventsApi.createEvent(newEvent);

            // 2. Create Initial Edition if dates provided
            if (payload.date_mode) {
                await eventsApi.createEdition({
                    event_id: eventId,
                    title: payload.title,
                    description: payload.description,
                    date_mode: payload.date_mode,
                    date_start: payload.date_start,
                    date_end: payload.date_end,
                    date_text: payload.date_text,
                    poster_url: row.poster_url || undefined,
                    created_by: row.created_by
                });
            }
        } else {
            // Create Edition for existing event
            const targetEventId = row.event_id || payload.event_id;
            if (!targetEventId) throw new Error("Missing event_id for edition suggestion");

            await eventsApi.createEdition({
                event_id: targetEventId,
                title: payload.title,
                description: payload.description,
                date_mode: payload.date_mode,
                date_start: payload.date_start,
                date_end: payload.date_end,
                date_text: payload.date_text,
                poster_url: row.poster_url || undefined,
                created_by: row.created_by
            });
        }

        // 3. Update status
        const { error: updateErr } = await supabase
            .from("suggestions")
            .update({ status: "approved" })
            .eq("id", id);

        if (updateErr) throw updateErr;
    },

    async rejectSuggestion(id: string): Promise<void> {
        const { error } = await supabase
            .from("suggestions")
            .update({ status: "rejected" })
            .eq("id", id);

        if (error) throw error;
    }
};
