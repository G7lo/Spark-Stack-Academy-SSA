import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
    "https://nlnwllpisbqgbeluhdbr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_HrkX5wTWYSLovF2cdhBD-A_4pvyTAQV";

/*
 * SUPABASE IS BACKEND ONLY.
 *
 * Firebase Authentication is the sole identity provider.
 */
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);
