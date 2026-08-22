import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLERK_ISSUER = (Deno.env.get("CLERK_ISSUER") || "").replace(/\/$/, "");

if (!CLERK_ISSUER) throw new Error("CLERK_ISSUER is not configured.");

const CLERK_KEYS = createRemoteJWKSet(
    new URL(`${CLERK_ISSUER}/.well-known/jwks.json`)
);

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, "Content-Type": "application/json" }
    });
}

function makeUsername(fullName: string, clerkUserId: string) {
    const base = (fullName || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 18) || "user";

    const suffix = clerkUserId
        .replace(/[^a-z0-9]/gi, "")
        .slice(-6)
        .toLowerCase();

    return `${base}_${suffix}`;
}

async function verifyClerkToken(req: Request) {
    const header = req.headers.get("Authorization") || "";
    if (!header.startsWith("Bearer ")) throw new Error("Authentication required.");

    const { payload } = await jwtVerify(header.slice(7), CLERK_KEYS, {
        issuer: CLERK_ISSUER
    });

    if (!payload.sub) throw new Error("Invalid Clerk authentication token.");
    return String(payload.sub);
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

    try {
        const clerkUserId = await verifyClerkToken(req);
        const body = await req.json();

        if (!body.clerkUserId || body.clerkUserId !== clerkUserId) {
            return json({ error: "Clerk identity mismatch." }, 403);
        }

        const requestedRole = body.role === "instructor" ? "instructor" : "student";
        const role = requestedRole;
        const status = role === "instructor" ? "pending" : "active";
        const email = String(body.email || "").trim() || null;
        const fullName = String(body.fullName || "").trim() || "Student";
        const avatarUrl = String(body.avatarUrl || "").trim() || null;
        const bio = String(body.bio || "").trim() || null;
        const expertise = String(body.expertise || "").trim() || null;
        const username = makeUsername(fullName, clerkUserId);

        const { data: existing, error: findError } = await admin
            .from("profiles")
            .select("id,status,username,role")
            .eq("clerk_user_id", clerkUserId)
            .maybeSingle();

        if (findError) throw findError;

        let profileId = existing?.id;
        let finalRole = existing?.role || role;
        let finalStatus = existing?.status || status;

        if (profileId) {
            const { error } = await admin
                .from("profiles")
                .update({
                    email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    username: existing.username || username,
                    updated_at: new Date().toISOString()
                })
                .eq("id", profileId);

            if (error) throw error;
        } else {
            const { data, error } = await admin
                .from("profiles")
                .insert({
                    clerk_user_id: clerkUserId,
                    email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    username,
                    role: finalRole,
                    status: finalStatus
                })
                .select("id")
                .single();

            if (error) throw error;
            profileId = data.id;
        }

        if (finalRole === "student") {
            const { error } = await admin
                .from("students")
                .upsert({
                    id: profileId,
                    xp: 0,
                    level: 1,
                    verified: false,
                    premium: false
                }, { onConflict: "id" });
            if (error) throw error;
        } else {
            const { error } = await admin
                .from("instructors")
                .upsert({
                    id: profileId,
                    verified: false
                }, { onConflict: "id" });
            if (error) throw error;

            // Keep instructor profile details server-side without trusting client authorization.
            const { error: metadataError } = await admin
                .from("profiles")
                .update({
                    status: finalStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", profileId);
            if (metadataError) throw metadataError;
        }

        return json({
            success: true,
            profileId,
            role: finalRole,
            status: finalStatus,
            username: existing?.username || username,
            bio,
            expertise
        });
    } catch (error) {
        console.error("Provision account error:", error);
        return json({
            error: error instanceof Error ? error.message : "Account provisioning failed."
        }, 400);
    }
});
