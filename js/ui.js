// ============================================
// SSA SHARED UI UTILITIES
// Toasts, friendly errors, lightweight feedback
// ============================================

const TOAST_ROOT_ID = "ssa-toast-root";

function root() {
  let el = document.getElementById(TOAST_ROOT_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = TOAST_ROOT_ID;
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
  Object.assign(el.style, {
    position: "fixed",
    top: "18px",
    right: "18px",
    zIndex: "99999",
    display: "grid",
    gap: "10px",
    width: "min(380px, calc(100vw - 36px))",
    pointerEvents: "none"
  });
  document.body.appendChild(el);
  return el;
}

const tones = {
  success: { icon: "✓", accent: "#22c55e" },
  error: { icon: "!", accent: "#ef4444" },
  warning: { icon: "!", accent: "#f59e0b" },
  info: { icon: "i", accent: "#3b82f6" }
};

export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const message = error?.message || String(error || "");
  const rules = [
    [/permission|row[- ]level security|not authorized/i, "You don't have permission to do that."],
    [/network|failed to fetch|fetch failed/i, "Connection problem. Check your internet and try again."],
    [/authentication|required|session expired|unauthorized/i, "Your session has expired. Please sign in again."],
    [/invalid.*maintenance|valid start|end time/i, "Please choose a valid time window."],
    [/duplicate|already exists/i, "That record already exists."],
    [/not found/i, "We couldn't find what you requested."],
    [/email.*already|auth/email-already-in-use/i, "That email is already registered."],
    [/wrong-password|invalid-credential/i, "The email or password is incorrect."]
  ];
  return rules.find(([pattern]) => pattern.test(message))?.[1] || message || fallback;
}

export function toast(message, type = "info", options = {}) {
  const host = root();
  const tone = tones[type] || tones.info;
  const item = document.createElement("div");
  item.role = "status";
  Object.assign(item.style, {
    pointerEvents: "auto",
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "13px 15px",
    borderRadius: "15px",
    color: "#eaf1ff",
    background: "rgba(10,18,35,.94)",
    border: `1px solid ${tone.accent}55`,
    boxShadow: "0 18px 45px rgba(0,0,0,.28)",
    backdropFilter: "blur(16px)",
    font: "500 14px/1.45 Inter,system-ui,sans-serif",
    transform: "translateY(-8px)",
    opacity: "0",
    transition: "opacity .18s ease, transform .18s ease"
  });
  item.innerHTML = `<span style="width:24px;height:24px;display:grid;place-items:center;border-radius:8px;background:${tone.accent}22;color:${tone.accent};font-weight:800;flex:0 0 auto">${tone.icon}</span><span style="flex:1">${String(message).replace(/[<>]/g, "")}</span>`;
  host.appendChild(item);
  requestAnimationFrame(() => {
    item.style.opacity = "1";
    item.style.transform = "translateY(0)";
  });
  const duration = options.duration ?? (type === "error" ? 5000 : 3500);
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(-8px)";
    setTimeout(() => item.remove(), 220);
  }, duration);
  return item;
}

export function showError(error, fallback) {
  return toast(friendlyError(error, fallback), "error");
}

export function confirmToast(message) {
  return toast(message, "success");
}
