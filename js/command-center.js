import { supabase } from "./supabase.js";

export async function issueCommand({
    command,
    target,
    reason = "",
    expiresAt = null
}) {
    const {
        data: {
            user
        },
        error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be signed in.");
    }

    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("id, role, status")
            .eq("id", user.id)
            .maybeSingle();

    if (profileError) {
        throw profileError;
    }

    if (!profile || !["admin", "founder"].includes(profile.role)) {
        throw new Error("Administrator access required.");
    }

    const { data, error } = await supabase
        .from("platform_commands")
        .insert({
            command,
            target,
            active: true,
            reason,
            created_by: user.id,
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
            actor_id: user.id,
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
    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be signed in.");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || !["admin", "founder"].includes(profile.role)) {
        throw new Error("Administrator access required.");
    }

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
            actor_id: user.id,
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