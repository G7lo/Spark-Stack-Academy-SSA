// Spark Stack Academy — Supabase Login
import { supabase } from "./supabase.js";
import { getCurrentProfile } from "./supabase-auth.js";

const form = document.getElementById("loginForm");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");
const toastContainer = document.getElementById("toastContainer");

const DASHBOARDS = {
    founder: "founder/dashboard.html",
    admin: "admin/dashboard.html",
    instructor: "instructor/dashboard.html",
    student: "student/dashboard.html"
};

function toast(message, type = "success") {
    if (!toastContainer) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function loading(message) {
    loader?.classList.add("active");
    if (loaderText) loaderText.textContent = message;
}

async function redirectAfterLogin() {
    loading("Preparing your Spark Stack Academy account...");
    const profile = await getCurrentProfile();
    if (!profile || profile.status !== "active") {
        throw new Error("Your account profile is unavailable.");
    }
    toast("Welcome back 👋");
    setTimeout(() => window.location.replace(DASHBOARDS[profile.role] || DASHBOARDS.student), 500);
}

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.querySelector("[name='email'], #email")?.value.trim();
    const password = form.querySelector("[name='password'], #password")?.value;

    if (!email || !password) {
        toast("Enter your email and password.", "error");
        return;
    }

    try {
        loading("Signing you in securely...");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await redirectAfterLogin();
    } catch (error) {
        console.error("Supabase login error:", error);
        loader?.classList.remove("active");
        toast(error.message || "Login failed.", "error");
    }
});

supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session && !window.__SSA_LOGIN_REDIRECTED) {
        window.__SSA_LOGIN_REDIRECTED = true;
        try { await redirectAfterLogin(); } catch (error) { console.error(error); }
    }
});
