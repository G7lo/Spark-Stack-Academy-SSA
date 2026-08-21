import { supabase } from "../../js/supabase.js";

let locked = false;

function renderLock(data) {
    if (locked) return;
    locked = true;

    const title = data.command === "lockdown"
        ? "Platform Emergency Lockdown"
        : "Student Portal Temporarily Offline";

    const message = data.reason ||
        "The student portal is temporarily unavailable while Spark Stack Academy performs maintenance.";

    const expected = data.expires_at
        ? `<div class="ssa-lock-time">Expected return: ${new Date(data.expires_at).toLocaleString()}</div>`
        : `<div class="ssa-lock-time">Please check back shortly.</div>`;

    document.documentElement.innerHTML = `
      <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>SSA Maintenance</title></head>
      <body>
        <main class="ssa-lock">
          <section class="ssa-lock-card">
            <div class="ssa-lock-icon">🛠️</div>
            <div class="ssa-lock-brand">SPARK STACK ACADEMY</div>
            <h1>${title}</h1>
            <p>${message}</p>
            ${expected}
            <button onclick="location.reload()">Check Again</button>
          </section>
        </main>
        <style>
          *{box-sizing:border-box}body{margin:0;background:#061329;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif}.ssa-lock{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#12305c,#061329 55%)}.ssa-lock-card{width:min(620px,100%);padding:48px 30px;text-align:center;border:1px solid rgba(255,255,255,.12);border-radius:30px;background:rgba(255,255,255,.055);box-shadow:0 30px 100px rgba(0,0,0,.45);backdrop-filter:blur(18px)}.ssa-lock-icon{font-size:52px;margin-bottom:14px}.ssa-lock-brand{font-size:11px;font-weight:800;letter-spacing:.2em;color:#8fa6c7;margin-bottom:14px}.ssa-lock-card h1{font-size:clamp(26px,5vw,38px);margin:0 0 14px}.ssa-lock-card p{max-width:500px;margin:0 auto;color:#aebdd1;line-height:1.75}.ssa-lock-time{margin:22px auto;color:#dce6f5;font-size:13px}.ssa-lock-card button{border:0;border-radius:12px;padding:12px 20px;background:#fff;color:#071426;font-weight:800;cursor:pointer}
        </style>
      </body>`;
}

async function checkPlatform() {
    if (locked) return;

    const { data, error } = await supabase
        .from("platform_commands")
        .select("command,target,active,reason,expires_at,created_at")
        .in("target", ["student", "all"])
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn("SSA student platform gate unavailable:", error.message);
        return;
    }

    if (!data) return;
    if (data.expires_at && new Date(data.expires_at) <= new Date()) return;

    renderLock(data);
}

checkPlatform();
setInterval(checkPlatform, 30000);
