import { z } from "zod";

const envSchema = z.object({
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

export const validateEnv = () => {
    const env = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    try {
        envSchema.parse(env);
        console.debug("Current environment is valid.");
    } catch (error) {
        console.error("Invalid environment variables:", error);
        // In production, you might want to throw or show a critical error
        // throw new Error("Invalid environment variables");
    }
};

export const ENV = envSchema.parse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
