// ============================================
// SPARK STACK ACADEMY
// SHARED AUTH GUARD
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showError, toast } from "./ui.js";

const DASHBOARDS = {
  founder: "/founder/dashboard.html",
  admin: "/admin/dashboard.html",
  instructor: "/instructor/dashboard.html",
  student: "/student/dashboard.html"
};

let guardPromise = null;

function redirect(path) {
  if (location.pathname !== path) window.location.replace(path);
}

async function resolveUser() {
  if (guardPromise) return guardPromise;
  guardPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) return resolve(null);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        resolve(snap.exists() ? { user, data: snap.data() } : null);
      } catch (error) {
        console.error("Guard error:", error);
        showError(error, "We couldn't verify your account.");
        resolve(null);
      }
    });
  });
  return guardPromise;
}

export async function protectPage(requiredRole) {
  const result = await resolveUser();
  if (!result) {
    toast("Please sign in to continue.", "info");
    redirect("/login.html");
    return null;
  }

  const { data } = result;
  if (data.active === false || data.status === "suspended") {
    toast("Your account is currently unavailable. Please contact support.", "warning", { duration: 5000 });
    await auth.signOut();
    redirect("/login.html");
    return null;
  }

  if (requiredRole && data.role !== requiredRole) {
    toast("You don't have access to this page.", "error");
    redirect(DASHBOARDS[data.role] || "/login.html");
    return null;
  }

  return { user: result.user, profile: data };
}

export { DASHBOARDS };
