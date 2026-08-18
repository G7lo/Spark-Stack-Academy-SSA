// ============================================================
// SPARK STACK ACADEMY
// ADMIN / MODERATOR APP ENGINE
// ============================================================

console.log("🛡️🛡️ ADMIN APP JS LOADED");

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// CONFIG
// ============================================================

const COMPONENT_PATHS = {

    sidebar:
        "components/sidebar.html",

    topbar:
        "components/topbar.html"

};


// ============================================================
// ELEMENTS
// ============================================================

const sidebar =
    document.getElementById(
        "adminSidebar"
    );

const topbar =
    document.getElementById(
        "adminTopbar"
    );


// ============================================================
// LOAD COMPONENT
// ============================================================

async function loadComponent(
    element,
    path
) {

    if (!element) return false;

    try {

        const response =
            await fetch(path);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        element.innerHTML =
            await response.text();

        return true;

    } catch (error) {

        console.error(
            `❌ Failed loading ${path}`,
            error
        );

        return false;

    }

}


// ============================================================
// LOAD ADMIN SHELL
// ============================================================

async function loadAdminShell() {

    console.log(
        "🚀 Loading admin shell..."
    );


    const sidebarLoaded =
        await loadComponent(
            sidebar,
            COMPONENT_PATHS.sidebar
        );


    if (sidebarLoaded) {

        console.log(
            "✓ Loaded: components/sidebar.html"
        );

    }


    const topbarLoaded =
        await loadComponent(
            topbar,
            COMPONENT_PATHS.topbar
        );


    if (topbarLoaded) {

        console.log(
            "✓ Loaded: components/topbar.html"
        );

    }


    // Initialize component engines

    if (
        window.AdminSidebar &&
        typeof window.AdminSidebar.init ===
        "function"
    ) {

        window.AdminSidebar.init();

    }


    if (
        window.AdminTopbar &&
        typeof window.AdminTopbar.init ===
        "function"
    ) {

        window.AdminTopbar.init();

    }


    console.log(
        "✓ Admin shell ready"
    );

}


// ============================================================
// GET ADMIN PROFILE
// ============================================================

async function getAdminProfile(
    uid
) {

    try {

        const userRef =
            doc(
                db,
                "users",
                uid
            );

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {

            return null;

        }


        return {

            uid,
            ...snapshot.data()

        };

    } catch (error) {

        console.error(
            "❌ Failed loading admin profile:",
            error
        );

        return null;

    }

}


// ============================================================
// ROLE CHECK
// ============================================================

function isAuthorized(
    profile
) {

    if (!profile) return false;


    const role =
        String(
            profile.role || ""
        )
        .trim()
        .toLowerCase();


    return [
        "admin",
        "administrator",
        "moderator"
    ].includes(role);

}


// ============================================================
// ACCESS DENIED
// ============================================================

function denyAccess() {

    console.warn(
        "⛔ Unauthorized admin access"
    );


    document.body.innerHTML = `

        <main
            style="
                min-height:100vh;
                display:grid;
                place-items:center;
                padding:30px;
                font-family:Poppins,Arial,sans-serif;
                background:#f7f9fc;
                text-align:center;
            "
        >

            <div>

                <div
                    style="
                        font-size:52px;
                        margin-bottom:15px;
                    "
                >
                    🛡️
                </div>

                <h1>
                    Access Restricted
                </h1>

                <p
                    style="
                        color:#667085;
                        max-width:420px;
                        margin:10px auto 25px;
                    "
                >
                    You don't have permission to access
                    the Spark Stack Academy moderator console.
                </p>

                <a
                    href="../login.html"
                    style="
                        display:inline-flex;
                        padding:11px 18px;
                        border-radius:10px;
                        background:#2979ff;
                        color:white;
                        text-decoration:none;
                        font-weight:600;
                    "
                >
                    Return to Login
                </a>

            </div>

        </main>

    `;

}


// ============================================================
// UPDATE GLOBAL PROFILE
// ============================================================

function syncAdminProfile(
    profile
) {

    if (
        window.AdminSidebar?.updateProfile
    ) {

        window.AdminSidebar.updateProfile(
            profile
        );

    }


    if (
        window.AdminTopbar?.updateProfile
    ) {

        window.AdminTopbar.updateProfile(
            profile
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutAdmin() {

    try {

        await signOut(auth);

        window.location.href =
            "../login.html";

    } catch (error) {

        console.error(
            "❌ Admin logout failed:",
            error
        );

        alert(
            "Unable to sign out. Please try again."
        );

    }

}


// ============================================================
// LOGOUT LISTENER
// ============================================================

function initLogout() {

    document.addEventListener(
        "click",
        event => {

            const logoutButton =
                event.target.closest(
                    "#adminDropdownLogout"
                );

            if (!logoutButton) return;

            logoutAdmin();

        }
    );

}


// ============================================================
// GLOBAL ADMIN API
// ============================================================

window.AdminApp = {

    getProfile:
        getAdminProfile,

    logout:
        logoutAdmin,

    isAuthorized,

    getCurrentUser:
        () => auth.currentUser

};


// ============================================================
// BOOT
// ============================================================

async function bootAdminApp() {

    console.log(
        "🔐 Checking admin authentication..."
    );


    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                console.warn(
                    "⛔ No authenticated user"
                );

                window.location.href =
                    "../login.html";

                return;

            }


            console.log(
                "✓ Authenticated:",
                user.email
            );


            const profile =
                await getAdminProfile(
                    user.uid
                );


            if (!isAuthorized(profile)) {

                denyAccess();

                return;

            }


            console.log(
                "✓ Authorized admin:",
                profile.role
            );


            await loadAdminShell();


            syncAdminProfile({

                ...profile,

                email:
                    user.email ||
                    profile.email,

                photoURL:
                    user.photoURL ||
                    profile.photoURL

            });


            initLogout();


            // Tell page-specific scripts
            // that the admin shell is ready.

            document.dispatchEvent(
                new CustomEvent(
                    "admin:ready",
                    {
                        detail: {
                            user,
                            profile
                        }
                    }
                )
            );

        }
    );

}


bootAdminApp();