/**
 * Utility for handling async operations safely.
 * Standardizes error handling and logging.
 */

export interface SafeResult<T> {
    data: T | null;
    error: Error | null;
}

/**
 * Wraps a promise in a try/catch block and returns a standardized result object.
 * Useful for Supabase queries or other async operations where you don't want to throw immediately.
 */
export async function safeAsync<T>(promise: Promise<T>): Promise<SafeResult<T>> {
    try {
        const data = await promise;
        return { data, error: null };
    } catch (error: any) {
        // In production, you might want to send this to Sentry/LogRocket
        if (import.meta.env.DEV) {
            console.error("SafeAsync caught error:", error);
        }
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * A helper specifically for Supabase responses which might naturally contain { data, error }.
 * This normalizes the "throw on error" pattern often used in this codebase.
 */
export async function safeSupabaseQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
    try {
        const { data, error } = await queryFn();
        if (error) throw error;
        // If data is null but no error, we cast it to T (or let the caller handle nulls if T includes null)
        return data as T;
    } catch (err: any) {
        if (import.meta.env.DEV) {
            console.error("Supabase Query Error:", err);
        }
        throw err; // Re-throw to be caught by the UI/Hook layer
    }
}
