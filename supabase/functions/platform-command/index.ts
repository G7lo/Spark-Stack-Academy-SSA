import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = "spark-stack-academy";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function founderGuard(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("Authentication required.");
  const { payload } = await jwtVerify(auth.slice(7), FIREBASE_KEYS, { issuer: FIREBASE_ISSUER, audience: FIREBASE_PROJECT_ID });
  if (!payload.sub) throw new Error("Invalid authentication token.");

  const { data: profile, error } = await admin.from("profiles").select("id,role,status,firebase_uid").eq("firebase_uid", payload.sub).maybeSingle();
  if (error || !profile || profile.role !== "founder" || profile.status === "suspended") throw new Error("Founder access required.");
  return { uid: payload.sub, profile };
}

async function status() {
  const now = new Date().toISOString();
  await admin.from("platform_commands").update({ active: false }).eq("active", true).not("expires_at", "is", null).lt("expires_at", now);
  await admin.from("maintenance_schedules").update({ status: "completed" }).in("status", ["scheduled", "active"]).lt("ends_at", now);

  const [{ data: commands }, { data: maintenance }, { data: logs }] = await Promise.all([
    admin.from("platform_commands").select("command,target,active,reason,expires_at").eq("active", true).order("created_at", { ascending: false }),
    admin.from("maintenance_schedules").select("*").in("status", ["scheduled", "active"]).order("starts_at", { ascending: true }).limit(1).maybeSingle(),
    admin.from("audit_logs").select("action,target_type,target_id,details,created_at").order("created_at", { ascending: false }).limit(12)
  ]);

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
    const { uid, profile } = await founderGuard(req);
    const body = await req.json();
    if (body.action === "status") return json(await status());

    const actor = profile.id;
    const now = new Date().toISOString();

    if (body.action === "set_portal") {
      const target = body.target === "instructor" ? "instructor" : "student";
      const enabled = body.enabled === true;
      const { error } = await admin.from("platform_commands").update({ active: false }).eq("command", "suspend_portal").eq("target", target).eq("active", true);
      if (error) throw error;
      if (!enabled) {
        const { error: insertError } = await admin.from("platform_commands").insert({ command: "suspend_portal", target, active: true, reason: body.reason || "Founder command", created_by: actor, activated_at: now });
        if (insertError) throw insertError;
      }
    } else if (body.action === "lockdown") {
      await admin.from("platform_commands").update({ active: false }).eq("command", "lockdown").eq("target", "all").eq("active", true);
      if (body.enabled === true) {
        const { error } = await admin.from("platform_commands").insert({ command: "lockdown", target: "all", active: true, reason: body.reason || "Emergency lockdown", created_by: actor, activated_at: now });
        if (error) throw error;
      }
    } else if (body.action === "schedule_maintenance") {
      const starts = new Date(body.starts_at), ends = new Date(body.ends_at);
      if (!body.starts_at || !body.ends_at || !Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || ends <= starts) throw new Error("Invalid maintenance window.");
      const target = ["student", "instructor", "all"].includes(body.target) ? body.target : "all";
      const { error } = await admin.from("maintenance_schedules").insert({ title: "SSA Platform Maintenance", message: body.message || "Scheduled maintenance.", target, starts_at: starts.toISOString(), ends_at: ends.toISOString(), status: "scheduled", created_by: actor });
      if (error) throw error;
    } else if (body.action === "cancel_maintenance") {
      const { error } = await admin.from("maintenance_schedules").update({ status: "cancelled" }).in("status", ["scheduled", "active"]);
      if (error) throw error;
    } else throw new Error("Unknown command.");

    await admin.from("audit_logs").insert({ actor_id: actor, action: body.action, target_type: body.target || "platform", target_id: body.target || "platform", details: { ...body, firebase_uid: uid } });
    return json(await status());
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Command failed." }, 400);
  }
});
