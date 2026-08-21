import { db } from "../../js/firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const stateRef = doc(db, "systemConfig", "platform");
let stopped = false;

function showSuspended(message, title = "Instructor Portal Offline") {
    if (stopped) return;
    stopped = true;
    document.documentElement.innerHTML = `
      <head><title>${title} | Spark Stack Academy</title></head>
      <body style="margin:0">
        <div style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#071426;color:#fff;font-family:Inter,system-ui,sans-serif;text-align:center">
          <div style="max-width:620px;width:100%;padding:48px 28px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:rgba(255,255,255,.05);box-shadow:0 24px 80px rgba(0,0,0,.35)">
            <div style="font-size:48px;margin-bottom:16px">🛠️</div>
            <div style="font-size:12px;font-weight:800;letter-spacing:.18em;opacity:.65;margin-bottom:12px">SPARK STACK ACADEMY</div>
            <h1 style="margin:0 0 12px;font-size:32px">${title}</h1>
            <p style="margin:0 auto 24px;max-width:500px;line-height:1.7;color:rgba(255,255,255,.7)">${message || "The instructor portal is temporarily unavailable."}</p>
            <div style="font-size:13px;color:rgba(255,255,255,.45)">Please check back shortly.</div>
          </div>
        </div>
      </body>`;
}

onSnapshot(stateRef, snapshot => {
    if (stopped) return;
    const state = snapshot.exists() ? snapshot.data() : {};
    const enabled = state.instructorPortal?.enabled !== false;
    const lockdown = state.emergencyLockdown === true;
    const maintenance = state.maintenance || {};
    const now = Date.now();
    const start = maintenance.startAt?.toMillis?.() ?? new Date(maintenance.startAt || 0).getTime();
    const end = maintenance.endAt?.toMillis?.() ?? new Date(maintenance.endAt || 0).getTime();
    const target = ["instructor", "all"].includes(maintenance.target);
    const scheduled = target && maintenance.active !== false && start > 0 && now >= start && (!end || now < end);

    if (lockdown || !enabled || scheduled) {
        showSuspended(
            maintenance.message || (lockdown ? "The platform is temporarily locked by the Founder." : "The instructor portal is temporarily unavailable."),
            lockdown ? "Platform Emergency Lockdown" : "Instructor Portal Offline"
        );
    }
});