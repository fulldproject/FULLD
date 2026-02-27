import { z } from 'zod';
import { GroupKey, EventGeneral, Edition } from '../types';

export interface FormErrors {
    [key: string]: string;
}

/**
 * Zod Schemas for Database Rows
 * Uses .nullable().optional() for maximum robustness as requested.
 */
export const EventDbSchema = z.object({
    id: z.string(),
    name: z.string().nullable().optional().default("Unnamed Event"),
    slug: z.string().nullable().optional(),
    group_key: z.string().nullable().optional().default("OTHER"),
    category_id: z.string().nullable().optional(),
    event_type: z.string().nullable().optional().default("FIJO"),
    city: z.string().nullable().optional(),
    province: z.string().nullable().optional(),
    community: z.string().nullable().optional(),
    venue: z.string().nullable().optional(),
    short_description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    status_moderation: z.string().nullable().optional().default("pending"),
    created_by: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    lat: z.number().nullable().optional().default(0),
    lng: z.number().nullable().optional().default(0),
});

export const EditionDbSchema = z.object({
    id: z.string(),
    event_id: z.string(),
    title: z.string().nullable().optional().default(""),
    description: z.string().nullable().optional(),
    date_mode: z.enum(["date", "text", "tbd"]).nullable().optional().default("text"),
    date_start: z.string().nullable().optional(),
    date_end: z.string().nullable().optional(),
    date_text: z.string().nullable().optional().default("TBA"),
    poster_url: z.string().nullable().optional(),
    created_by: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
});

export const validateEventForm = (
    values: any,
    edition?: any
): FormErrors => {
    const errors: FormErrors = {};

    // Basic Event Info
    if (!values.name?.trim()) {
        errors.name = 'Event name is required';
    }
    if (!values.group_key) {
        errors.group_key = 'Group is required';
    }
    if (!values.category) {
        errors.category = 'Category is required';
    }
    if (!values.city?.trim()) {
        errors.city = 'City is required';
    }
    if (!values.province?.trim()) {
        errors.province = 'Province is required';
    }

    // Coordinates
    if (values.lat === undefined || values.lat === null || isNaN(values.lat)) {
        errors.lat = 'Latitude is required';
    } else if (values.lat < -90 || values.lat > 90) {
        errors.lat = 'Invalid latitude (-90 to 90)';
    }

    if (values.lng === undefined || values.lng === null || isNaN(values.lng)) {
        errors.lng = 'Longitude is required';
    } else if (values.lng < -180 || values.lng > 180) {
        errors.lng = 'Invalid longitude (-180 to 180)';
    }

    // Edition / Date Logic
    if (edition) {
        const { title, date_mode, date_start, date_end, date_text } = edition;

        if (!title?.trim()) {
            errors.edition_title = 'Edition title is required';
        }

        if (date_mode === 'date') {
            if (!date_start) {
                errors.date_start = 'Start date is required in date mode';
            }
            if (date_start && date_end) {
                if (new Date(date_end) < new Date(date_start)) {
                    errors.date_end = 'End date cannot be before start date';
                }
            }
        } else if (date_mode === 'text') {
            if (!date_text?.trim() || date_text.trim().length < 3) {
                errors.date_text = 'Date label must be at least 3 characters';
            }
        }
    }

    return errors;
};
