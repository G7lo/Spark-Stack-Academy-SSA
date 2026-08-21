import { supabase } from "./supabase.js";

const PUBLIC_PATHS = [
    "maintenance.html",
    "login.html",
    "signup.html",
    "index.html"
];

let gateShown = false;

function isPublicPage() {
    const name =
        location.pathname.split("/").pop() || "index.html";

    return PUBLIC_PATHS.includes(name);
}

function getTarget() {
    const path = location.pathname.toLowerCase();

    if (path.includes("/student/")) return "student";
    if (path.includes("/instructor/")) return "instructor";

    return null;
}

function showGate({
    title,
    message,
    endsAt,
    command
}) {
    if (gateShown) return;

    gateShown = true;

    const existing =
        document.getElementById("ssa-platform-gate");

    if (existing) return;

    const el = document.createElement("div");

    el.id = "ssa-platform-gate";

    const expectedReturn = endsAt
        ? new Date(endsAt).toLocaleString()
        : null;

    el.innerHTML = `
        <style>
            #ssa-platform-gate {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                display: grid;
                place-items: center;
                padding: 24px;
                background:
                    radial-gradient(
                        circle at top,
                        rgba(41,121,255,.16),
                        transparent 45%
                    ),
                    #061329;
                color: #fff;
                font-family:
                    Inter,
                    system-ui,
                    -apple-system,
                    sans-serif;
            }

            #ssa-platform-gate .box {
                width: min(560px, 100%);
                padding: 42px;
                text-align: center;
                border-radius: 28px;
                border: 1px solid rgba(255,255,255,.1);
                background:
                    linear-gradient(
                        145deg,
                        #0b2144,
                        #07162e
                    );
                box-shadow:
                    0 30px 100px rgba(0,0,0,.5);
            }

            #ssa-platform-gate .icon {
                width: 72px;
                height: 72px;
                margin: 0 auto 20px;
                display: grid;
                place-items: center;
                border-radius: 22px;
                background: rgba(41,121,255,.12);
                font-size: 38px;
            }

            #ssa-platform-gate h1 {
                margin: 0 0 12px;
                font-size: 30px;
                letter-spacing: -.5px;
            }

            #ssa-platform-gate p {
                margin: 10px 0;
                color: #a9b8ce;
                line-height: 1.7;
            }

            #ssa-platform-gate .time {
                margin-top: 22px;
                padding: 14px;
                border-radius: 14px;
                background: rgba(255,255,255,.06);
                color: #d9e3f2;
                font-size: 13px;
            }

            #ssa-platform-gate .command {
                margin-top: 14px;
                color: #6ea8ff;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
            }
        </style>

        <div class="box">

            <div class="icon">⚡</div>

            <h1>${escapeHtml(title)}</h1>

            <p>
                ${escapeHtml(message)}
            </p>

            ${
                expectedReturn
                    ? `
                        <div class="time">
                            Expected return:<br>
                            <strong>${escapeHtml(expectedReturn)}</strong>
                        </div>
                    `
                    : ""
            }

            ${
                command
                    ? `
                        <div class="command">
                            SSA • ${escapeHtml(command)}
                        </div>
                    `
                    : ""
            }

        </div>
    `;

    document.body.appendChild(el);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function checkPlatform() {

    if (isPublicPage()) return;

    const target = getTarget();

    if (!target) return;

    try {

        const { data, error } = await supabase
            .from("platform_commands")
            .select(`
                command,
                target,
                active,
                reason,
                expires_at,
                created_at
            `)
            .eq("target", target)
            .eq("active", true)
            .order("created_at", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.warn(
                "SSA platform gate unavailable:",
                error.message
            );
            return;
        }

        if (!data) return;

        const expired =
            data.expires_at &&
            new Date(data.expires_at) <= new Date();

        if (expired) return;

        showGate({
            title:
                data.command === "maintenance"
                    ? "Platform maintenance"
                    : "Platform temporarily unavailable",

            message:
                data.reason ||
                `The ${target} portal is temporarily unavailable.`,

            endsAt: data.expires_at,

            command: data.command
        });

    } catch (error) {

        console.warn(
            "SSA platform gate error:",
            error
        );
    }
}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        checkPlatform,
        { once: true }
    );

} else {

    checkPlatform();

}