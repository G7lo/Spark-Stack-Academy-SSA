import { supabase } from "./supabase.js";
import { getClerk } from "./clerk-client.js";

const SUPABASE_URL = "https://nlnwllpisbqgbeluhdbr.supabase.co";

export async function getSessionUser() {
    const clerk = await getClerk();
    return clerk.user || null;
}

export async function provisionAccount({ role = "student", bio = "", expertise = "" } = {}) {
    const clerk = await getClerk();
    if (!clerk.user || !clerk.session) throw new Error("You must be signed in.");

    const token = await clerk.session.getToken();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/provision-account`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            clerkUserId: clerk.user.id,
            email: clerk.user.primaryEmailAddress?.emailAddress || "",
            fullName: clerk.user.fullName || "Student",
            avatarUrl: clerk.user.imageUrl || "",
            role,
            bio,
            expertise
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
        throw new Error(payload.error || "We couldn't finish setting up your account.");
    }
    return payload;
}

export async function getCurrentProfile() {
    const user = await getSessionUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("id,auth_uid,clerk_user_id,email,full_name,username,role,avatar_url,status,verified,badge_type,badge_label")
        .eq("clerk_user_id", user.id)
        .maybeSingle();

    if (error) throw error;
    return data || null;
}

export async function signOut() {
    const clerk = await getClerk();
    await clerk.signOut();
}
