// ============================================
// SPARK STACK ACADEMY
// AUTH GUARD SYSTEM — V2
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { notifyError } from "./ui.js";

const DASHBOARDS = {
  founder: "/founder/dashboard.html",
  admin: "/admin/dashboard.html",
  instructor: "/instructor/dashboard.html",
  student: "/student/dashboard.html"
};

let guardPromise = null;

export function protectPage(requiredRole) {
  if (guardPromise) return guardPromise;

  guardPromise = new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      unsubscribe();

      if (!user) {
        window.location.replace("/login.html");
        resolve(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));

        if (!snapshot.exists()) {
          notifyError("Your account profile could not be found. Please sign in again.");
          window.location.replace("/login.html");
          resolve(false);
          return;
        }

        const userData = snapshot.data() || {};
        const role = userData.role;

        if (requiredRole && role !== requiredRole) {
          notifyError("You don't have access to this area.");
          window.location.replace(DASHBOARDS[role] || "/login.html");
          resolve(false);
          return;
        }

        if (userData.active === false || userData.status === "suspended") {
          notifyError("Your account is currently suspended.");
          await auth.signOut().catch(() => {});
          window.location.replace("/login.html");
          resolve(false);
          return;
        }

        document.documentElement.dataset.userRole = role || "";
        document.documentElement.dataset.authenticated = "true";
        resolve(true);
      } catch (error) {
        console.error("Auth guard error:", error);
        notifyError(error, "We couldn't verify your account right now.");
        window.location.replace("/login.html");
        resolve(false);
      }
    });
  });

  return guardPromise;
}

export { DASHBOARDS };
