// Spark Stack Academy — Clerk Login UI
import { getClerk } from "./clerk-client.js";
import { getCurrentProfile, provisionAccount } from "./supabase-auth.js";

const loginForm = document.getElementById("loginForm");
const card = document.querySelector(".login-card");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");
const toastContainer = document.getElementById("toastContainer");

const DASHBOARDS = {
    founder: "founder/dashboard.html",
    admin: "admin/dashboard.html",
    instructor: "instructor/dashboard.html",
    student: "student/dashboard.html"
};

function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const text = document.createElement("strong");
    text.textContent = message;
    toast.appendChild(text);
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function showLoader(message = "Securely signing you in...") {
    loader?.classList.add("active");
    if (loaderText) loaderText.textContent = message;
}

function hideLoader() {
    loader?.classList.remove("active");
}

async function finishLogin(clerk) {
    if (!clerk?.isSignedIn || !clerk.user) return;

    showLoader("Preparing your Spark Stack Academy account...");

    try {
        let profile = await getCurrentProfile();

        if (!profile) {
            await provisionAccount({
                role: clerk.user.unsafeMetadata?.role === "instructor" ? "instructor" : "student",
                bio: clerk.user.unsafeMetadata?.bio || "",
                expertise: clerk.user.unsafeMetadata?.expertise || ""
            });
            profile = await getCurrentProfile();
        }

        if (!profile || profile.status !== "active") {
            throw new Error("Your account is currently unavailable.");
        }

        showToast("Welcome back 👋", "success");
        window.location.replace(DASHBOARDS[profile.role] || DASHBOARDS.student);
    } catch (error) {
        console.error("Account setup error:", error);
        hideLoader();
        showToast(error.message || "We couldn't finish signing you in.", "error");
        await clerk.signOut().catch(() => {});
    }
}

async function init() {
    try {
        const clerk = await getClerk();

        if (clerk.isSignedIn) {
            await finishLogin(clerk);
            return;
        }

        if (loginForm) loginForm.style.display = "none";

        const mount = document.createElement("div");
        mount.id = "clerkSignIn";
        mount.style.width = "100%";
        card?.appendChild(mount);

        clerk.mountSignIn(mount, {
            signUpUrl: "/signup.html",
            fallbackRedirectUrl: "/student/dashboard.html",
            legalAccepted: true
        });

        clerk.addListener(({ user }) => {
            if (user) finishLogin(clerk);
        });
    } catch (error) {
        console.error("Clerk initialization error:", error);
        hideLoader();
        showToast(error.message || "Authentication is temporarily unavailable.", "error");
    }
}

init();
