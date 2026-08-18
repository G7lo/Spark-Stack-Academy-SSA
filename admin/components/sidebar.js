// ============================================================
// SPARK STACK ACADEMY
// ADMIN SIDEBAR ENGINE
// ============================================================

console.log("🛡️ ADMIN SIDEBAR JS LOADED");


const ADMIN_PAGES = {
    "dashboard.html": "dashboard",
    "students.html": "students",
    "instructors.html": "instructors",
    "courses.html": "courses",
    "assignments.html": "assignments",
    "reports.html": "reports",
    "announcements.html": "announcements",
    "notifications.html": "notifications",
    "profile.html": "profile",
    "settings.html": "settings"
};


// ============================================================
// ACTIVE PAGE
// ============================================================

function setActiveAdminPage() {

    const currentFile =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const page =
        ADMIN_PAGES[currentFile];

    if (!page) return;

    document
        .querySelectorAll(".admin-nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        });

}


// ============================================================
// ADMIN PROFILE
// ============================================================

function updateAdminSidebarProfile(data = {}) {

    const name =
        data.displayName ||
        data.name ||
        data.fullName ||
        "Administrator";

    const avatar =
        document.getElementById(
            "adminSidebarAvatar"
        );

    const nameElement =
        document.getElementById(
            "adminSidebarName"
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (avatar) {

        if (data.photoURL) {

            avatar.innerHTML = `
                <img
                    src="${escapeHTML(data.photoURL)}"
                    alt="Admin"
                >
            `;

        } else {

            avatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();

        }

    }

}


// ============================================================
// REPORT BADGE
// ============================================================

function updateReportBadge(count = 0) {

    const badge =
        document.getElementById(
            "adminReportBadge"
        );

    if (!badge) return;


    const total =
        Number(count || 0);


    if (total <= 0) {

        badge.classList.add("hidden");

        return;

    }


    badge.classList.remove("hidden");

    badge.textContent =
        total > 99
            ? "99+"
            : total;

}


// ============================================================
// LUCIDE
// ============================================================

function refreshAdminSidebarIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
        "function"
    ) {

        window.lucide.createIcons();

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// INIT
// ============================================================

function initAdminSidebar() {

    setActiveAdminPage();

    refreshAdminSidebarIcons();

    console.log(
        "✓ Admin sidebar ready"
    );

}


// ============================================================
// GLOBAL API
// ============================================================

window.AdminSidebar = {

    init: initAdminSidebar,

    setActivePage:
        setActiveAdminPage,

    updateProfile:
        updateAdminSidebarProfile,

    updateReportBadge:
        updateReportBadge

};