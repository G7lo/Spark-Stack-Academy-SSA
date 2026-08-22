import { auth } from "./firebase.js";
import { supabase } from "./supabase.js";

async function getAuthorizedUser() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("You must be signed in.");
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, firebase_uid, role, status")
        .eq("firebase_uid", user.uid)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!profile) {
        throw new Error("Your account profile could not be found.");
    }

    if (profile.status && profile.status !== "active") {
        throw new Error("Your account is not active.");
    }

    if (!["admin", "founder"].includes(profile.role)) {
        throw new Error("Administrator access required.");
    }

    return {
        firebaseUser: user,
        profile
    };
}

export async function issueCommand({
    command,
    target,
    reason = "",
    expiresAt = null
}) {
    const { profile } = await getAuthorizedUser();

    const { data, error } = await supabase
        .from("platform_commands")
        .insert({
            command,
            target,
            active: true,
            reason,
            created_by: profile.id,
            activated_at: new Date().toISOString(),
            expires_at: expiresAt
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    await supabase
        .from("audit_logs")
        .insert({
            actor_id: profile.id,
            action: `platform_command:${command}`,
            target_type: target,
            target_id: target,
            details: {
                reason,
                expires_at: expiresAt
            }
        });

    return data;
}

export async function deactivateCommands(target) {
    const { profile } = await getAuthorizedUser();

    const { error } = await supabase
        .from("platform_commands")
        .update({
            active: false
        })
        .eq("target", target)
        .eq("active", true);

    if (error) {
        throw error;
    }

    await supabase
        .from("audit_logs")
        .insert({
            actor_id: profile.id,
            action: "platform_command:deactivate",
            target_type: target,
            target_id: target,
            details: {
                restored: true
            }
        });
}

export async function getActiveCommands() {
    const { data, error } = await supabase
        .from("platform_commands")
        .select("*")
        .eq("active", true)
        .order("created_at", {
            ascending: false
        });

    if (error) {
        throw error;
    }

    return data || [];
}
