import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DASHBOARDS = {
    founder: "/founder/dashboard.html",
    admin: "/admin/dashboard.html",
    instructor: "/instructor/dashboard.html",
    student: "/student/dashboard.html"
};

export function protectPage(requiredRole = null) {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            window.location.replace("/login.html");
            return;
        }

        try {

            const profileSnap =
                await getDoc(doc(db, "profiles", user.uid));

            if (!profileSnap.exists()) {
                await signOut(auth);
                window.location.replace("/login.html");
                return;
            }

            const profile = profileSnap.data();

            if (profile.status && profile.status !== "active") {
                await signOut(auth);
                window.location.replace("/login.html");
                return;
            }

            const role = profile.role || "student";

            if (requiredRole && role !== requiredRole) {
                showAccessToast(
                    "You don't have permission to open this page."
                );

                setTimeout(() => {
                    window.location.replace(
                        DASHBOARDS[role] || "/login.html"
                    );
                }, 500);

                return;
            }

            document.documentElement.classList.add("auth-ready");

            console.log(
                "🔥 Firebase authorized:",
                user.uid,
                role
            );

        } catch (error) {

            console.error(
                "Firebase auth guard error:",
                error
            );

            window.location.replace("/login.html");
        }
    });
}

function showAccessToast(message) {

    let container =
        document.getElementById("toastContainer");

    if (!container) {

        container =
            document.createElement("div");

        container.id = "toastContainer";

        document.body.appendChild(container);
    }

    const toast =
        document.createElement("div");

    toast.className = "toast error";

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}
