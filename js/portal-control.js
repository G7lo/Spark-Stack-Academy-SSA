import { db } from "./firebase.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let blocker = null;

function getBlocker() {
    if (blocker) return blocker;

    blocker = document.createElement("div");

    blocker.id = "ssaPortalBlocker";

    blocker.innerHTML = `
        <div class="ssa-control-card">
            <div class="ssa-control-icon">⚡</div>
            <div class="ssa-control-eyebrow">SPARK STACK ACADEMY</div>
            <h1 id="ssaControlTitle">Portal Temporarily Unavailable</h1>
            <p id="ssaControlMessage">
                This portal is temporarily unavailable.
                Please check back shortly.
            </p>
            <div class="ssa-control-status">
                <span></span>
                System Control Active
            </div>
        </div>
    `;

    Object.assign(blocker.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483647",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(248,250,252,.98)",
        fontFamily: "Inter, Poppins, system-ui, sans-serif"
    });

    const style = document.createElement("style");

    style.textContent = `
        #ssaPortalBlocker .ssa-control-card {
            width: min(460px, 100%);
            padding: 42px 32px;
            text-align: center;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 24px;
            box-shadow: 0 24px 70px rgba(15,23,42,.14);
        }

        #ssaPortalBlocker .ssa-control-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 18px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            background: #eef4ff;
            font-size: 28px;
        }

        #ssaPortalBlocker .ssa-control-eyebrow {
            margin-bottom: 8px;
            color: #2563eb;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .14em;
        }

        #ssaPortalBlocker h1 {
            margin: 0 0 12px;
            color: #0f172a;
            font-size: 25px;
            font-weight: 800;
        }

        #ssaPortalBlocker p {
            margin: 0 auto 22px;
            max-width: 360px;
            color: #64748b;
            line-height: 1.6;
        }

        #ssaPortalBlocker .ssa-control-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 13px;
            border-radius: 999px;
            background: #f8fafc;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
        }

        #ssaPortalBlocker .ssa-control-status span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ef4444;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(blocker);

    return blocker;
}

function showBlock(title, message) {
    const el = getBlocker();

    document.getElementById("ssaControlTitle").textContent = title;
    document.getElementById("ssaControlMessage").textContent = message;

    el.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function hideBlock() {
    if (!blocker) return;

    blocker.style.display = "none";
    document.body.style.overflow = "";
}

export function watchPortalControl(portal = "student") {
    const controlRef = doc(db, "platform_controls", "global");

    return onSnapshot(
        controlRef,
        snapshot => {
            if (!snapshot.exists()) {
                hideBlock();
                return;
            }

            const data = snapshot.data();

            const lockdown = data.lockdown === true;

            const suspended =
                data[portal]?.suspended === true;

            const maintenance = data.maintenance || {};

            let maintenanceActive = false;

            if (maintenance.scheduled) {
                const now = Date.now();
                const start = new Date(maintenance.start).getTime();
                const end = new Date(maintenance.end).getTime();

                const applies =
                    maintenance.target === portal ||
                    maintenance.target === "all";

                maintenanceActive =
                    applies &&
                    Number.isFinite(start) &&
                    Number.isFinite(end) &&
                    now >= start &&
                    now < end;
            }

            if (lockdown) {
                showBlock(
                    "Emergency Lockdown",
                    "Spark Stack Academy has temporarily restricted portal access for security reasons. Please check back shortly."
                );
                return;
            }

            if (suspended) {
                showBlock(
                    portal === "student"
                        ? "Student Portal Suspended"
                        : "Instructor Portal Suspended",
                    "This portal has been temporarily suspended by Spark Stack Academy administration."
                );
                return;
            }

            if (maintenanceActive) {
                showBlock(
                    "Scheduled Maintenance",
                    maintenance.message ||
                    "This portal is temporarily offline for scheduled maintenance. Please check back shortly."
                );
                return;
            }

            hideBlock();
        },
        error => {
            console.error(
                "SSA platform control listener failed:",
                error
            );
        }
    );
}
