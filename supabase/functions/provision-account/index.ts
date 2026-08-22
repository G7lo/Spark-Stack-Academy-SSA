import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = "spark-stack-academy";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_KEYS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
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

function makeUsername(fullName: string, firebaseUid: string) {
    const base = (fullName || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 18) || "user";

    const suffix = firebaseUid
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 6)
        .toLowerCase();

    return `${base}_${suffix}`;
}

async function verifyFirebaseToken(req: Request) {
    const header = req.headers.get("Authorization") || "";
    if (!header.startsWith("Bearer ")) throw new Error("Authentication required.");

    const { payload } = await jwtVerify(header.slice(7), FIREBASE_KEYS, {
        issuer: FIREBASE_ISSUER,
        audience: FIREBASE_PROJECT_ID
    });

    if (!payload.sub) throw new Error("Invalid Firebase authentication token.");
    return payload.sub;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

    try {
        const firebaseUid = await verifyFirebaseToken(req);
        const body = await req.json();

        if (!body.firebaseUid || body.firebaseUid !== firebaseUid) {
            return json({ error: "Firebase identity mismatch." }, 403);
        }

        const role = body.role === "instructor" ? "instructor" : "student";
        const email = String(body.email || "").trim() || null;
        const fullName = String(body.fullName || "").trim() || null;
        const avatarUrl = String(body.avatarUrl || "").trim() || null;
        const username = makeUsername(fullName || "user", firebaseUid);

        const { data: existing, error: findError } = await admin
            .from("profiles")
            .select("id,status,username")
            .eq("firebase_uid", firebaseUid)
            .maybeSingle();

        if (findError) throw findError;

        let profileId = existing?.id;

        if (profileId) {
            const { error } = await admin
                .from("profiles")
                .update({
                    email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    username: existing.username || username,
                    role,
                    status: existing.status || "active",
                    updated_at: new Date().toISOString()
                })
                .eq("id", profileId);

            if (error) throw error;
        } else {
            const { data, error } = await admin
                .from("profiles")
                .insert({
                    firebase_uid: firebaseUid,
                    email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    username,
                    role,
                    status: "active"
                })
                .select("id")
                .single();

            if (error) throw error;
            profileId = data.id;
        }

        if (role === "student") {
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
        }

        return json({ success: true, profileId, role, username: existing?.username || username });
    } catch (error) {
        console.error("Provision account error:", error);
        return json({
            error: error instanceof Error ? error.message : "Account provisioning failed."
        }, 400);
    }
});
