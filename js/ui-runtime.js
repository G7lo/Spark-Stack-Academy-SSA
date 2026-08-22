// ============================================
// SPARK STACK ACADEMY
// GLOBAL UI RUNTIME
// Toasts + injected-component styling
// ============================================

(() => {
    if (window.__SSA_UI_RUNTIME__) return;
    window.__SSA_UI_RUNTIME__ = true;

    const STYLE_ID = "ssa-global-ui-runtime";

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #ssa-toast-root {
                position: fixed;
                top: 18px;
                right: 18px;
                z-index: 2147483000;
                display: grid;
                gap: 10px;
                width: min(380px, calc(100vw - 28px));
                pointer-events: none;
            }

            .ssa-toast {
                pointer-events: auto;
                display: grid;
                grid-template-columns: 34px 1fr auto;
                gap: 10px;
                align-items: center;
                padding: 13px 14px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 14px;
                background: rgba(8,28,58,.96);
                color: #fff;
                box-shadow: 0 18px 45px rgba(0,0,0,.25);
                backdrop-filter: blur(14px);
                font: 500 14px/1.4 Inter,system-ui,sans-serif;
                animation: ssaToastIn .22s ease both;
            }

            .ssa-toast.success { border-color: rgba(34,197,94,.35); }
            .ssa-toast.error { border-color: rgba(239,68,68,.40); }
            .ssa-toast.warning { border-color: rgba(245,158,11,.40); }
            .ssa-toast.info { border-color: rgba(41,121,255,.40); }
            .ssa-toast-icon { font-size: 18px; }
            .ssa-toast-close {
                border: 0;
                background: transparent;
                color: rgba(255,255,255,.65);
                cursor: pointer;
                font-size: 18px;
                padding: 2px 4px;
            }
            .ssa-toast-close:hover { color: #fff; }

            .ssa-injected-component,
            [id$="Sidebar"],
            [id$="Topbar"] {
                box-sizing: border-box;
            }

            [id$="Sidebar"] *,
            [id$="Topbar"] * {
                box-sizing: border-box;
            }

            @keyframes ssaToastIn {
                from { opacity: 0; transform: translateY(-8px) translateX(8px); }
                to { opacity: 1; transform: translateY(0) translateX(0); }
            }

            @media (max-width: 640px) {
                #ssa-toast-root { top: 12px; right: 12px; }
                .ssa-toast { border-radius: 12px; }
            }
        `;
        document.head.appendChild(style);
    }

    function root() {
        let el = document.getElementById("ssa-toast-root");
        if (!el) {
            el = document.createElement("div");
            el.id = "ssa-toast-root";
            document.body.appendChild(el);
        }
        return el;
    }

    const icons = {
        success: "✓",
        error: "!",
        warning: "⚠",
        info: "i"
    };

    function toast(message, type = "info", duration = 3800) {
        installStyles();

        const item = document.createElement("div");
        item.className = `ssa-toast ${type}`;
        item.setAttribute("role", type === "error" ? "alert" : "status");

        const icon = document.createElement("div");
        icon.className = "ssa-toast-icon";
        icon.textContent = icons[type] || icons.info;

        const text = document.createElement("div");
        text.textContent = String(message || "Something happened.");

        const close = document.createElement("button");
        close.className = "ssa-toast-close";
        close.type = "button";
        close.setAttribute("aria-label", "Close notification");
        close.textContent = "×";

        const remove = () => {
            item.style.opacity = "0";
            item.style.transform = "translateY(-5px)";
            item.style.transition = "opacity .18s ease, transform .18s ease";
            setTimeout(() => item.remove(), 190);
        };

        close.addEventListener("click", remove);
        item.append(icon, text, close);
        root().appendChild(item);
        setTimeout(remove, duration);
        return item;
    }

    window.showToast = toast;
    window.ssaToast = toast;

    // Browser alerts are blocking and visually inconsistent. Route them into SSA toasts.
    window.alert = message => toast(message, "info");

    // Safe async alternatives for new code. Existing synchronous confirm() calls are
    // intentionally not monkey-patched because changing their return type can break flows.
    window.ssaConfirm = (message, { confirmText = "Continue", cancelText = "Cancel" } = {}) => {
        return new Promise(resolve => {
            installStyles();

            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;z-index:2147482999;background:rgba(2,8,23,.58);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px";

            const modal = document.createElement("div");
            modal.style.cssText = "width:min(420px,100%);background:#fff;color:#0b1730;border-radius:18px;padding:22px;box-shadow:0 25px 70px rgba(0,0,0,.28);font:500 15px/1.5 Inter,system-ui,sans-serif";

            const body = document.createElement("div");
            body.textContent = String(message || "Are you sure?");
            body.style.marginBottom = "18px";

            const actions = document.createElement("div");
            actions.style.cssText = "display:flex;justify-content:flex-end;gap:10px";

            const cancel = document.createElement("button");
            cancel.textContent = cancelText;
            const yes = document.createElement("button");
            yes.textContent = confirmText;

            [cancel, yes].forEach(button => {
                button.style.cssText = "border:0;border-radius:10px;padding:10px 15px;cursor:pointer;font-weight:700";
            });
            yes.style.background = "#2979FF";
            yes.style.color = "#fff";
            cancel.style.background = "#eef2f7";

            const finish = value => {
                overlay.remove();
                resolve(value);
            };

            cancel.onclick = () => finish(false);
            yes.onclick = () => finish(true);
            overlay.onclick = event => { if (event.target === overlay) finish(false); };

            actions.append(cancel, yes);
            modal.append(body, actions);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            yes.focus();
        });
    };

    function markInjected() {
        document.querySelectorAll(
            "[id$='Sidebar'],[id$='Topbar'],.sidebar-container,.topbar-container"
        ).forEach(el => el.classList.add("ssa-injected-component"));
    }

    function boot() {
        installStyles();
        markInjected();

        const observer = new MutationObserver(() => markInjected());
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
