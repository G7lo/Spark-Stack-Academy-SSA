// Spark Stack Academy — Supabase Auth Guard
import { supabase } from "./supabase.js";
import { getCurrentProfile } from "./supabase-auth.js";

const DASHBOARDS = {
    founder: "/founder/dashboard.html",
    admin: "/admin/dashboard.html",
    instructor: "/instructor/dashboard.html",
    student: "/student/dashboard.html"
};

export function protectPage(requiredRole) {
    let checking = true;

    const check = async (session) => {
        if (!checking) return;
        if (!session?.user) {
            window.location.replace("/login.html");
            return;
        }

        try {
            const profile = await getCurrentProfile();
            if (!profile || profile.status !== "active") {
                await supabase.auth.signOut();
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
            console.error("Supabase auth guard error:", error);
            await supabase.auth.signOut();
            window.location.replace("/login.html");
        }
    };

    supabase.auth.getSession().then(({ data }) => check(data.session));
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
            window.location.replace("/login.html");
            return;
        }
        check(session);
    });
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
