import { supabase } from "./supabase.js";

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
        .select("id,auth_uid,email,full_name,role,status,avatar_url")
        .eq("auth_uid", user.id)
        .maybeSingle();

    if (error) throw error;
    return data || null;
}

export async function provisionAccount({ role = "student", bio = "", expertise = "" } = {}) {
    const user = await getSessionUser();
    if (!user) throw new Error("You must be signed in.");

    const { data, error } = await supabase.functions.invoke("provision-account", {
        body: { role, bio, expertise }
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Account setup failed.");
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
