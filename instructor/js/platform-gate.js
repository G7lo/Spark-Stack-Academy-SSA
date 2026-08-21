import { db } from "../../js/firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const stateRef = doc(db, "system", "platformState");

let stopped = false;

function showSuspended(message, title = "Instructor Portal Offline") {
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
                <div style="font-size:13px;color:rgba(255,255,255,.45)">Please check back shortly.</div>
            </div>
        </div>`;
    document.documentElement.innerHTML = lock.innerHTML;
    stopped = true;
}

onSnapshot(stateRef, snapshot => {
    if (stopped) return;

    const state = snapshot.exists() ? snapshot.data() : {};
    const instructorEnabled = state.instructorPortal?.enabled !== false;
    const lockdown = state.emergencyLockdown?.active === true;
    const maintenance = state.maintenance || {};
    const now = Date.now();
    const start = maintenance.startsAt?.toMillis?.() ?? 0;
    const end = maintenance.endsAt?.toMillis?.() ?? 0;
    const scheduled = maintenance.active === true && (!start || now >= start) && (!end || now < end);
    const targetsInstructor = ["instructor", "all"].includes(maintenance.target);

    if (lockdown || !instructorEnabled || (scheduled && targetsInstructor)) {
        showSuspended(
            maintenance.message || (lockdown ? "The platform is temporarily locked by the Founder." : "The instructor portal is temporarily unavailable."),
            lockdown ? "Platform Emergency Lockdown" : "Instructor Portal Offline"
        );
    }
}, error => {
    console.error("SSA platform gate error:", error);
});