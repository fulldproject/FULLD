/**
 * Retrieves a required environment variable.
 * Throws an error if the variable is missing or empty.
 * @param name The name of the environment variable (e.g., "VITE_SUPABASE_URL")
 * @returns The value of the environment variable
 */
export function getRequiredEnv(name: string): string {
    const value = import.meta.env[name];
    if (!value || value.trim() === "") {
        throw new Error(
            `Missing required environment variable: ${name}. Please add it to your .env or .env.local file.`
        );
    }
    return value;
}
