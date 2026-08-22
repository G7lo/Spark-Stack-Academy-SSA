import { Clerk } from "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6/+esm";
import { CLERK_PUBLISHABLE_KEY } from "./clerk-config.js";

let clerkPromise;

export async function getClerk() {
    if (!clerkPromise) {
        clerkPromise = (async () => {
            if (!CLERK_PUBLISHABLE_KEY || !CLERK_PUBLISHABLE_KEY.startsWith("pk_")) {
                throw new Error("Clerk Publishable Key is missing or invalid.");
            }

            const clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
            await clerk.load({
                signInUrl: "/login.html",
                signUpUrl: "/signup.html",
                signInFallbackRedirectUrl: "/student/dashboard.html",
                signUpFallbackRedirectUrl: "/student/dashboard.html"
            });

            window.__SSA_CLERK = clerk;
            return clerk;
        })();
    }

    return clerkPromise;
}

export async function getClerkToken() {
    try {
        const clerk = await getClerk();
        if (!clerk.session) return null;
        return await clerk.session.getToken();
    } catch (error) {
        console.error("Clerk token error:", error);
        return null;
    }
}
