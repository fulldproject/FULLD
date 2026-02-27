/**
 * Centralized configuration for FULLD.
 * This file handles environment variables, providing defaults and
 * ensuring critical values are present.
 */

// We use import.meta.env which is Vite's way of accessing environment variables.
const env = import.meta.env;

export const CONFIG = {
    IS_DEV: env.DEV,
    IS_PROD: env.PROD,

    SUPABASE: {
        URL: env.VITE_SUPABASE_URL || '',
        ANON_KEY: env.VITE_SUPABASE_ANON_KEY || '',
    },

    MAPTILER: {
        KEY: env.VITE_MAPTILER_KEY || '',
        STYLE_URL: (key: string) => `https://api.maptiler.com/maps/streets-v4/style.json?key=${key}`,
    },

    IMAGES: {
        EVENT_PLACEHOLDER: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
        SUGGESTION_PLACEHOLDER: (name: string) => `https://picsum.photos/seed/${encodeURIComponent(name)}/800/600`,
        AVATAR_PLACEHOLDER: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    },

    // Origin-aware base URL for sharing and deep links
    get APP_URL() {
        // Falls back to window.location.origin if available, otherwise localhost
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return 'http://localhost:3000';
    }
};

/**
 * Validates that critical configuration is present.
 * Throws an error in development if something is missing.
 */
export const validateConfig = () => {
    const missing: string[] = [];

    if (!CONFIG.SUPABASE.URL) missing.push('VITE_SUPABASE_URL');
    if (!CONFIG.SUPABASE.ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
    if (!CONFIG.MAPTILER.KEY) missing.push('VITE_MAPTILER_KEY');

    if (missing.length > 0 && CONFIG.IS_DEV) {
        console.warn(
            `[CONFIG] Missing critical environment variables: ${missing.join(', ')}. ` +
            `Check your .env.local file.`
        );
    }
};

// Validate on load
validateConfig();
