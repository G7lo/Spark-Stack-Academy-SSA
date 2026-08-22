// Spark Stack Academy — Supabase Auth Signup
import { supabase } from "./supabase.js";
import { provisionAccount, getCurrentProfile } from "./supabase-auth.js";

const form = document.getElementById("signupForm");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");
const toastContainer = document.getElementById("toastContainer");
const signupBtn = document.getElementById("signupBtn");

function toast(message, type = "success") {
    if (!toastContainer) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function setLoading(active, message = "Creating your secure account...") {
    loader?.classList.toggle("active", active);
    if (loaderText) loaderText.textContent = message;
    if (signupBtn) signupBtn.disabled = active;
}

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value || "";
    const role = document.getElementById("role")?.value || "student";

    if (!name || !email || !password) {
        toast("Please complete all required fields.", "error");
        return;
    }

    if (password.length < 8) {
        toast("Password must be at least 8 characters.", "error");
        return;
    }

    if (password !== confirmPassword) {
        toast("Passwords do not match.", "error");
        return;
    }

    setLoading(true);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: role === "instructor" ? "instructor" : "student"
                }
            }
        });

        if (error) throw error;

        // If email confirmation is enabled, Supabase returns a user but no session.
        if (!data.session) {
            setLoading(false);
            toast("Account created! Check your email to verify your account.", "success");
            form.reset();
            return;
        }

        setLoading(true, "Setting up your Spark Stack Academy profile...");
        await provisionAccount({ role });
        const profile = await getCurrentProfile();

        if (!profile) {
            throw new Error("Account created, but your profile could not be initialized.");
        }

        toast("Account created successfully! 🎉", "success");
        setTimeout(() => window.location.replace("student/dashboard.html"), 900);
    } catch (error) {
        console.error("Supabase signup error:", error);
        setLoading(false);
        toast(error?.message || "Signup failed. Please try again.", "error");
    }
});

console.log("🚀 SSA Supabase Signup Loaded");
