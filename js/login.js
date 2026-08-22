// Spark Stack Academy — Supabase Auth Login
import { supabase } from "./supabase.js";
import { getCurrentProfile } from "./supabase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const loginBtn = document.getElementById("loginBtn");
const googleLoginBtn = document.getElementById("googleLogin");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");
const toastContainer = document.getElementById("toastContainer");
const forgotPasswordBtn = document.getElementById("forgotPassword");
const resetModal = document.getElementById("resetModal");
const resetEmail = document.getElementById("resetEmail");
const sendResetBtn = document.getElementById("sendReset");
const cancelResetBtn = document.getElementById("cancelReset");

const DASHBOARDS = {
    founder: "founder/dashboard.html",
    admin: "admin/dashboard.html",
    instructor: "instructor/dashboard.html",
    student: "student/dashboard.html"
};

function showLoader(message = "Signing you in...") {
    loader?.classList.add("active");
    if (loaderText) loaderText.textContent = message;
}

function hideLoader() {
    loader?.classList.remove("active");
}

function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const strong = document.createElement("strong");
    strong.textContent = message;
    toast.appendChild(strong);
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(40px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function setBusy(busy) {
    if (loginBtn) loginBtn.disabled = busy;
    if (googleLoginBtn) googleLoginBtn.disabled = busy;
}

async function routeAfterLogin() {
    const profile = await getCurrentProfile();
    if (!profile) throw new Error("Your account profile is still being prepared. Please try again in a moment.");
    if (profile.status && profile.status !== "active") throw new Error("Your account is currently unavailable.");
    window.location.replace(DASHBOARDS[profile.role] || DASHBOARDS.student);
}

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) return showToast("Enter your email and password.", "warning");

    try {
        setBusy(true);
        showLoader("Signing you in...");

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showToast("Welcome back 👋", "success");
        await new Promise(resolve => setTimeout(resolve, 500));
        await routeAfterLogin();
    } catch (error) {
        console.error("Supabase login error:", error);
        hideLoader();
        setBusy(false);
        showToast("We couldn't sign you in. Check your email and password and try again.", "error");
    }
});

forgotPasswordBtn?.addEventListener("click", () => {
    if (resetModal) resetModal.classList.add("active");
    if (resetEmail && emailInput?.value) resetEmail.value = emailInput.value.trim();
    resetEmail?.focus();
});

cancelResetBtn?.addEventListener("click", () => resetModal?.classList.remove("active"));

sendResetBtn?.addEventListener("click", async () => {
    const email = resetEmail?.value.trim() || "";
    if (!email) return showToast("Enter your email address.", "warning");

    try {
        sendResetBtn.disabled = true;
        const redirectTo = `${window.location.origin}/reset-password.html`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        resetModal?.classList.remove("active");
        showToast("If that account exists, a password reset email is on its way.", "success");
    } catch (error) {
        console.error("Password reset error:", error);
        showToast(error.message || "Password reset failed.", "error");
    } finally {
        sendResetBtn.disabled = false;
    }
});

googleLoginBtn?.addEventListener("click", async () => {
    try {
        setBusy(true);
        showLoader("Opening Google sign-in...");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/login.html` }
        });
        if (error) throw error;
    } catch (error) {
        console.error("Google login error:", error);
        hideLoader();
        setBusy(false);
        showToast("Google sign-in isn't configured yet. Use email and password for now.", "warning");
    }
});

document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
        const target = document.getElementById(toggle.dataset.target);
        if (!target) return;
        const visible = target.type === "text";
        target.type = visible ? "password" : "text";
        toggle.classList.toggle("fa-eye", visible);
        toggle.classList.toggle("fa-eye-slash", !visible);
    });
});

supabase.auth.getSession().then(async ({ data }) => {
    if (data?.session) {
        try { await routeAfterLogin(); } catch { await supabase.auth.signOut(); }
    }
});

console.log("🔥 SSA Supabase Auth Login Loaded");
