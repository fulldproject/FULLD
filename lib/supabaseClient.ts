import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "./config";

export const supabase = createClient(
    CONFIG.SUPABASE.URL,
    CONFIG.SUPABASE.ANON_KEY
);
