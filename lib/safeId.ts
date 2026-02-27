/**
 * Generates a unique ID.
 * Uses crypto.randomUUID() if available (secure contexts),
 * otherwise falls back to a timestamp + random string combination.
 */
export function safeId(prefix = "tmp"): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }

    // Fallback for non-secure contexts (UUID v4 polyfill)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
