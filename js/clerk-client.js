import { Clerk } from "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6/+esm";
import { CLERK_PUBLISHABLE_KEY } from "./clerk-config.js";

let clerkPromise;

function assertKey() {
    if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY.includes("REPLACE_WITH")) {
        throw new Error("Clerk is not configured yet. Add the Clerk Publishable Key in js/clerk-config.js.");
    }
}

async function loadClerkUI(publishableKey) {
    const parts = publishableKey.split("_");
    if (parts.length < 3) throw new Error("Invalid Clerk Publishable Key.");

    const domain = atob(parts[2]).slice(0, -1);
    if (window.__SSA_CLERK_UI_LOADED) return;

    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Unable to load Clerk UI."));
        document.head.appendChild(script);
    });

    window.__SSA_CLERK_UI_LOADED = true;
}

export async function getClerk() {
    if (!clerkPromise) {
        clerkPromise = (async () => {
            assertKey();
            await loadClerkUI(CLERK_PUBLISHABLE_KEY);
            const clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
            await clerk.load({
                ui: { ClerkUI: window.__internal_ClerkUICtor },
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
        return clerk.session?.getToken() || null;
    } catch {
        return null;
    }
}
