import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = "spark-stack-academy";

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

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

function decodePart(value: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value)));
}

async function verifyFirebaseToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid authentication token.");

  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  if (header.alg !== "RS256") throw new Error("Unsupported token algorithm.");

  if (payload.aud !== FIREBASE_PROJECT_ID || payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    throw new Error("Invalid token audience or issuer.");
  }

  if (!payload.sub || payload.exp * 1000 <= Date.now()) throw new Error("Authentication token expired.");

  const certResponse = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!certResponse.ok) throw new Error("Unable to verify authentication token.");
  const certs = await certResponse.json();
  const pem = certs[header.kid];
  if (!pem) throw new Error("Token signing key not found.");

  const binary = atob(pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, ""));
  const certBytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const cert = await crypto.subtle.importKey(
    "spki",
    certBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  ).catch(() => null);

  if (!cert) {
    // The Google endpoint returns X.509 certificates; WebCrypto needs the public key.
    // Keep verification strict rather than accepting an unverified Firebase token.
    throw new Error("Token certificate verification is unavailable in this runtime.");
  }

  const signature = base64UrlDecode(parts[2]);
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, cert, signature, data);
  if (!valid) throw new Error("Invalid authentication signature.");

  return payload;
}

async function founderGuard(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("Authentication required.");
  const firebaseToken = auth.slice(7);
  const token = await verifyFirebaseToken(firebaseToken);

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,role,status,firebase_uid")
    .eq("firebase_uid", token.sub)
    .maybeSingle();

  if (error || !profile || profile.role !== "founder" || profile.status === "suspended") {
    throw new Error("Founder access required.");
  }

  return { token, profile };
}

async function status() {
  const now = new Date().toISOString();
  await admin.from("platform_commands").update({ active: false }).eq("active", true).not("expires_at", "is", null).lt("expires_at", now);
  await admin.from("maintenance_schedules").update({ status: "completed" }).in("status", ["scheduled", "active"]).lt("ends_at", now);

  const { data: commands } = await admin.from("platform_commands").select("*").eq("active", true).order("created_at", { ascending: false });
  const { data: maintenance } = await admin.from("maintenance_schedules").select("*").in("status", ["scheduled", "active"]).order("starts_at", { ascending: true }).limit(1).maybeSingle();
  const { data: logs } = await admin.from("audit_logs").select("action,target_type,target_id,details,created_at").order("created_at", { ascending: false }).limit(12);

  const active = commands || [];
  return {
    studentPortal: !active.some(x => x.command === "suspend_portal" && x.target === "student"),
    instructorPortal: !active.some(x => x.command === "suspend_portal" && x.target === "instructor"),
    emergencyLockdown: active.some(x => x.command === "lockdown" && x.target === "all"),
    maintenance: maintenance || null,
    logs: logs || []
  };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { token, profile } = await founderGuard(req);
    const body = await req.json();
    const action = body.action;

    if (action === "status") return json(await status());

    const actor = profile.id;
    const now = new Date().toISOString();

    if (action === "set_portal") {
      const target = body.target === "instructor" ? "instructor" : "student";
      const active = body.enabled === false;
      const { error } = await admin.from("platform_commands").update({ active: false }).eq("command", "suspend_portal").eq("target", target).eq("active", true);
      if (error) throw error;
      if (active) {
        const { error: insertError } = await admin.from("platform_commands").insert({ command: "suspend_portal", target, active: true, reason: body.reason || "Founder command", created_by: actor, activated_at: now });
        if (insertError) throw insertError;
      }
    } else if (action === "lockdown") {
      await admin.from("platform_commands").update({ active: false }).eq("command", "lockdown").eq("target", "all").eq("active", true);
      if (body.enabled === true) {
        const { error } = await admin.from("platform_commands").insert({ command: "lockdown", target: "all", active: true, reason: body.reason || "Emergency lockdown", created_by: actor, activated_at: now });
        if (error) throw error;
      }
    } else if (action === "schedule_maintenance") {
      const starts = new Date(body.starts_at);
      const ends = new Date(body.ends_at);
      if (!body.starts_at || !body.ends_at || !Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || ends <= starts) throw new Error("Invalid maintenance window.");
      const target = ["student", "instructor", "all"].includes(body.target) ? body.target : "all";
      const { error } = await admin.from("maintenance_schedules").insert({ title: "SSA Platform Maintenance", message: body.message || "Scheduled maintenance.", target, starts_at: starts.toISOString(), ends_at: ends.toISOString(), status: "scheduled", created_by: actor });
      if (error) throw error;
    } else if (action === "cancel_maintenance") {
      const { error } = await admin.from("maintenance_schedules").update({ status: "cancelled" }).in("status", ["scheduled", "active"]);
      if (error) throw error;
    } else {
      throw new Error("Unknown command.");
    }

    await admin.from("audit_logs").insert({ actor_id: actor, action, target_type: body.target || "platform", target_id: body.target || "platform", details: { ...body, token_uid: token.sub } });
    return json(await status());
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Command failed." }, 400);
  }
});
