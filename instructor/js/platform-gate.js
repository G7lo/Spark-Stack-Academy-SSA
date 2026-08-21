import { supabase } from "../../js/supabase.js";

let stopped = false;

function showSuspended(message, title = "Instructor Portal Offline", endsAt = null) {
    if (document.getElementById("ssa-platform-lock")) return;
    const lock = document.createElement("div");
    lock.id = "ssa-platform-lock";
    lock.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#071426;color:#fff;font-family:Inter,system-ui,sans-serif;text-align:center">
        <div style="max-width:620px;width:100%;padding:48px 28px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:rgba(255,255,255,.05);box-shadow:0 24px 80px rgba(0,0,0,.35)">
          <div style="font-size:48px;margin-bottom:16px">🛠️</div>
          <div style="font-size:12px;font-weight:800;letter-spacing:.18em;opacity:.65;margin-bottom:12px">SPARK STACK ACADEMY</div>
          <h1 style="margin:0 0 12px;font-size:32px">${title}</h1>
          <p style="margin:0 auto 24px;max-width:500px;line-height:1.7;color:rgba(255,255,255,.7)">${message || "The instructor portal is temporarily unavailable."}</p>
          ${endsAt ? `<div style="font-size:13px;color:rgba(255,255,255,.55)">Expected return: ${new Date(endsAt).toLocaleString()}</div>` : `<div style="font-size:13px;color:rgba(255,255,255,.45)">Please check back shortly.</div>`}
        </div>
      </div>`;
    document.documentElement.innerHTML = lock.innerHTML;
    stopped = true;
}

async function checkPlatform() {
    if (stopped) return;

    const { data, error } = await supabase
        .from("platform_commands")
        .select("command,target,active,reason,expires_at,created_at")
        .in("target", ["instructor", "all"])
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("SSA platform gate error:", error);
        return;
    }

    if (!data) return;
    if (data.expires_at && new Date(data.expires_at) <= new Date()) return;

    showSuspended(
        data.reason || "The instructor portal is temporarily unavailable.",
        data.command === "lockdown" ? "Platform Emergency Lockdown" : "Instructor Portal Offline",
        data.expires_at
    );
}

checkPlatform();
setInterval(checkPlatform, 30000);
