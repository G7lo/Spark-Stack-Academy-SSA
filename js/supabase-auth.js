import { supabase } from "./supabase.js";

export const auth = supabase.auth;

export async function getSessionUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
}

export async function getCurrentProfile() {
    const user = await getSessionUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("id,auth_uid,email,full_name,username,role,avatar_url,status,verified,badge_type,badge_label")
        .eq("auth_uid", user.id)
        .maybeSingle();

    if (error) throw error;
    return data || null;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
