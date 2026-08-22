import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { getClerkToken } from "./clerk-client.js";

const SUPABASE_URL = "https://nlnwllpisbqgbeluhdbr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HrkX5wTWYSLovF2cdhBD-A_4pvyTAQV";

// Supabase remains the backend. Clerk supplies the authenticated user JWT.
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        accessToken: async () => getClerkToken()
    }
);
