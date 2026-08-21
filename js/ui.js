// ============================================================
// SPARK STACK ACADEMY — SHARED UI ENGINE
// Toasts, friendly errors, and lightweight loading helpers.
// ============================================================

const TOAST_ROOT_ID = "ssaToastRoot";

function root() {
  let el = document.getElementById(TOAST_ROOT_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = TOAST_ROOT_ID;
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;width:min(360px,calc(100vw - 36px));pointer-events:none;";
    document.body.appendChild(el);
  }
  return el;
}

const FRIENDLY_ERRORS = [
  [/network|fetch|failed to fetch/i, "Connection hiccup. Check your internet and try again."],
  [/permission|not authorized|access denied/i, "You don't have permission to do that."],
  [/authentication|required|session expired|unauthorized/i, "Your session has expired. Please sign in again."],
  [/duplicate|already exists/i, "That record already exists."],
  [/timeout|timed out/i, "That took too long. Please try again."],
];

export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const message = String(error?.message || error || "");
  const match = FRIENDLY_ERRORS.find(([pattern]) => pattern.test(message));
  return match?.[1] || (message && message.length < 140 ? message : fallback);
}

export function toast(message, type = "info", duration = 3600) {
  const el = document.createElement("div");
  const tone = {
    success: "#16a34a",
    error: "#dc2626",
    warning: "#d97706",
    info: "#2563eb"
  }[type] || "#2563eb";

  el.style.cssText = `pointer-events:auto;padding:13px 16px;border-radius:14px;background:rgba(12,20,38,.96);color:#fff;border:1px solid rgba(255,255,255,.1);box-shadow:0 14px 40px rgba(0,0,0,.22);font:600 13px/1.4 Inter,system-ui,sans-serif;border-left:4px solid ${tone};transform:translateY(12px);opacity:0;transition:all .22s ease;`;
  el.textContent = message;
  root().appendChild(el);
  requestAnimationFrame(() => { el.style.transform = "translateY(0)"; el.style.opacity = "1"; });

  const close = () => {
    el.style.transform = "translateY(8px)";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 220);
  };
  el.addEventListener("click", close);
  setTimeout(close, duration);
  return el;
}

export function notifyError(error, fallback) {
  return toast(friendlyError(error, fallback), "error");
}

export function notifySuccess(message) {
  return toast(message, "success");
}

// Optional compatibility layer for legacy pages: replace browser alerts with SSA toasts.
export function installAlertBridge() {
  if (window.__ssaAlertBridgeInstalled) return;
  window.__ssaAlertBridgeInstalled = true;
  window.alert = message => toast(String(message || "Notice"), "info");
}
