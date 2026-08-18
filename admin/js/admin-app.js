// ============================================================
// SPARK STACK ACADEMY
// ADMIN / MODERATOR APP ENGINE
// ============================================================

console.log("🛡️ ADMIN APP JS LOADED");

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
// COMPONENT PATHS
// ============================================================

const COMPONENTS = {
    sidebar: "components/sidebar.html",
    topbar: "components/topbar.html"
};


// ============================================================
// DOM
// ============================================================

const sidebar =
    document.getElementById("adminSidebar");

const topbar =
    document.getElementById("adminTopbar");


// ============================================================
// LOAD HTML COMPONENT
// ============================================================

async function fetchComponent(path) {

    const response = await fetch(path);

    if (!response.ok) {

        throw new Error(
            `Failed to load ${path} (${response.status})`
        );

    }

    return response.text();

}


// ============================================================
// INJECT ADMIN SHELL
// ============================================================

async function loadAdminShell() {

    console.log("🚀 Injecting admin shell...");

    try {

        // Load BOTH components simultaneously
        const [
            sidebarHTML,
            topbarHTML
        ] = await Promise.all([

            fetchComponent(
                COMPONENTS.sidebar
            ),

            fetchComponent(
                COMPONENTS.topbar
            )

        ]);


        // Inject immediately
        if (sidebar) {

            sidebar.innerHTML =
                sidebarHTML;

        }


        if (topbar) {

            topbar.innerHTML =
                topbarHTML;

        }


        console.log(
            "✓ Admin HTML shell injected"
        );


        // Load component engines simultaneously
        await Promise.all([

            import("../components/sidebar.js"),

            import("../components/topbar.js")

        ]);


        // Initialize sidebar
        if (
            window.AdminSidebar &&
            typeof window.AdminSidebar.init ===
            "function"
        ) {

            window.AdminSidebar.init();

        }


        // Initialize topbar
        if (
            window.AdminTopbar &&
            typeof window.AdminTopbar.init ===
            "function"
        ) {

            window.AdminTopbar.init();

        }


        console.log(
            "✓ Admin shell initialized"
        );


        return true;

    } catch (error) {

        console.error(
            "❌ Admin shell failed:",
            error
        );

        return false;

    }

}


// ============================================================
// ADMIN PROFILE
// ============================================================

async function getAdminProfile(uid) {

    try {

        const reference =
            doc(
                db,
                "users",
                uid
            );

        const snapshot =
            await getDoc(reference);


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
// AUTHORIZATION
// ============================================================

function isAuthorized(profile) {

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
// SYNC PROFILE
// ============================================================

function syncAdminProfile(profile) {

    window.AdminSidebar?.updateProfile?.(
        profile
    );

    window.AdminTopbar?.updateProfile?.(
        profile
    );

}


// ============================================================
// ACCESS DENIED
// ============================================================

function denyAccess() {

    document.body.innerHTML = `

        <main class="admin-access-denied">

            <div class="access-denied-content">

                <div class="access-denied-icon">
                    🛡️
                </div>

                <h1>
                    Access Restricted
                </h1>

                <p>
                    You don't have permission to access
                    the Spark Stack Academy moderator console.
                </p>

                <a
                    href="../login.html"
                    class="access-denied-btn"
                >
                    Return to Login
                </a>

            </div>

        </main>

    `;

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
            "❌ Logout failed:",
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

            const button =
                event.target.closest(
                    "#adminLogoutBtn, #adminDropdownLogout"
                );


            if (!button) return;


            event.preventDefault();

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

    // --------------------------------------------------------
    // STEP 1
    // SHELL LOADS IMMEDIATELY
    // --------------------------------------------------------

    const shellReady =
        await loadAdminShell();


    if (!shellReady) {

        console.error(
            "❌ Admin shell could not start."
        );

        return;

    }


    // --------------------------------------------------------
    // STEP 2
    // LOGOUT
    // --------------------------------------------------------

    initLogout();


    // --------------------------------------------------------
    // STEP 3
    // AUTHENTICATION
    // --------------------------------------------------------

    console.log(
        "🔐 Checking admin authentication..."
    );


    onAuthStateChanged(
        auth,
        async user => {

            try {

                // --------------------------------------------
                // NOT AUTHENTICATED
                // --------------------------------------------

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


                // --------------------------------------------
                // FIRESTORE PROFILE
                // --------------------------------------------

                const profile =
                    await getAdminProfile(
                        user.uid
                    );


                // --------------------------------------------
                // ROLE CHECK
                // --------------------------------------------

                if (!isAuthorized(profile)) {

                    console.warn(
                        "⛔ Unauthorized role"
                    );

                    denyAccess();

                    return;

                }


                console.log(
                    "✓ Authorized:",
                    profile.role
                );


                // --------------------------------------------
                // PROFILE SYNC
                // --------------------------------------------

                syncAdminProfile({

                    ...profile,

                    email:
                        user.email ||
                        profile.email,

                    photoURL:
                        user.photoURL ||
                        profile.photoURL

                });


                // --------------------------------------------
                // PAGE READY
                // --------------------------------------------

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


                console.log(
                    "🔥 ADMIN CONSOLE READY"
                );


            } catch (error) {

                console.error(
                    "❌ Admin authentication failed:",
                    error
                );

            }

        }
    );

}


// ============================================================
// START
// ============================================================

bootAdminApp();