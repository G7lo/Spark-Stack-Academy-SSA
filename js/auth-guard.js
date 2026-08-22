// Spark Stack Academy — Clerk + Supabase Auth Guard
import { getClerk } from "./clerk-client.js";
import { getCurrentProfile, provisionAccount, signOut } from "./supabase-auth.js";

const DASHBOARDS = {
    founder: "/founder/dashboard.html",
    admin: "/admin/dashboard.html",
    instructor: "/instructor/dashboard.html",
    student: "/student/dashboard.html"
};

export function protectPage(requiredRole) {
    let checking = true;

    (async () => {
        try {
            const clerk = await getClerk();

            if (!clerk.isSignedIn || !clerk.user) {
                window.location.replace("/login.html");
                return;
            }

            let profile = await getCurrentProfile();

            // Existing Clerk users can be provisioned lazily after migration.
            if (!profile) {
                const role = clerk.user.unsafeMetadata?.role === "instructor" ? "instructor" : "student";
                await provisionAccount({
                    role,
                    bio: clerk.user.unsafeMetadata?.bio || "",
                    expertise: clerk.user.unsafeMetadata?.expertise || ""
                });
                profile = await getCurrentProfile();
            }

            if (!profile || profile.status !== "active") {
                await signOut();
                window.location.replace("/login.html");
                return;
            }

            if (requiredRole && profile.role !== requiredRole) {
                showAccessToast("You don't have permission to open this page.");
                window.location.replace(DASHBOARDS[profile.role] || "/login.html");
                return;
            }

            checking = false;
            document.documentElement.classList.add("auth-ready");
            console.log("Authorized:", profile.username || profile.full_name, profile.role);
        } catch (error) {
            console.error("Clerk auth guard error:", error);
            if (checking) window.location.replace("/login.html");
        }
    })();

    return () => { checking = false; };
}

function showAccessToast(message) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast error";
    const text = document.createElement("strong");
    text.textContent = message;
    toast.appendChild(text);
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}
