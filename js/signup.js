// Spark Stack Academy — Supabase Auth Signup
import { supabase } from "./supabase.js";

const signupForm = document.getElementById("signupForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const roleSelect = document.getElementById("role");
const bioInput = document.getElementById("bio");
const expertiseInput = document.getElementById("expertise");
const termsCheckbox = document.getElementById("terms");
const signupBtn = document.getElementById("signupBtn");
const googleSignupBtn = document.getElementById("googleSignup");
const toastContainer = document.getElementById("toastContainer");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");

function showLoader(message = "Creating your account...") {
    loader?.classList.add("active");
    if (loaderText) loaderText.textContent = message;
}

function hideLoader() { loader?.classList.remove("active"); }

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

function busy(value) {
    if (signupBtn) signupBtn.disabled = value;
    if (googleSignupBtn) googleSignupBtn.disabled = value;
}

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function strongPassword(value) { return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value); }

signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";
    const role = roleSelect?.value || "student";
    const bio = bioInput?.value.trim() || "";
    const expertise = expertiseInput?.value.trim() || "";

    if (!fullName) return showToast("Enter your full name.", "warning");
    if (!validEmail(email)) return showToast("Enter a valid email address.", "warning");
    if (!strongPassword(password)) return showToast("Use 8+ characters with uppercase, lowercase and a number.", "warning");
    if (password !== confirmPassword) return showToast("Passwords do not match.", "warning");
    if (!role) return showToast("Select your account type.", "warning");
    if (termsCheckbox && !termsCheckbox.checked) return showToast("Please accept the Terms & Conditions and Privacy Policy.", "warning");

    try {
        busy(true);
        showLoader("Creating your secure account...");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    name: fullName,
                    role,
                    bio: role === "instructor" ? bio : "",
                    expertise: role === "instructor" ? expertise : ""
                },
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });

        if (error) throw error;

        if (!data.session) {
            hideLoader();
            showToast("Account created. Check your email to confirm your account.", "success");
            setTimeout(() => { window.location.href = "login.html"; }, 1800);
            return;
        }

        showToast("Account created successfully! 🎉", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 1000);
    } catch (error) {
        console.error("Supabase signup error:", error);
        hideLoader();
        busy(false);
        showToast(error.message || "Signup failed. Please try again.", "error");
    }
});

googleSignupBtn?.addEventListener("click", async () => {
    if (termsCheckbox && !termsCheckbox.checked) {
        showToast("Please accept the Terms & Conditions and Privacy Policy first.", "warning");
        termsCheckbox.focus();
        return;
    }

    try {
        busy(true);
        showLoader("Opening Google sign-up...");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/login.html`
            }
        });
        if (error) throw error;
    } catch (error) {
        console.error("Google signup error:", error);
        hideLoader();
        busy(false);
        showToast("Google sign-up isn't configured yet. Use email and password for now.", "warning");
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

console.log("🚀 SSA Supabase Auth Signup Loaded");
