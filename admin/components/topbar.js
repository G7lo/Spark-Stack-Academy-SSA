// ============================================================
// SPARK STACK ACADEMY
// ADMIN TOPBAR ENGINE
// ============================================================

console.log("🛡️ ADMIN TOPBAR JS LOADED");


const ADMIN_PAGE_NAMES = {

    "dashboard.html": "Dashboard",
    "students.html": "Students",
    "instructors.html": "Instructors",
    "courses.html": "Courses",
    "assignments.html": "Assignments",
    "reports.html": "Reports",
    "announcements.html": "Announcements",
    "notifications.html": "Notifications",
    "profile.html": "My Profile",
    "settings.html": "Settings"

};


// ============================================================
// CURRENT PAGE
// ============================================================

function updateAdminPageTitle() {

    const file =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const title =
        ADMIN_PAGE_NAMES[file] || "Dashboard";

    const element =
        document.getElementById(
            "adminCurrentPage"
        );

    if (element) {

        element.textContent = title;

    }

}


// ============================================================
// PROFILE DROPDOWN
// ============================================================

function initAdminProfileDropdown() {

    const button =
        document.getElementById(
            "adminProfileMenu"
        );

    const dropdown =
        document.getElementById(
            "adminProfileDropdown"
        );

    if (!button || !dropdown) return;


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            dropdown.classList.toggle(
                "active"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !dropdown.contains(event.target) &&
                !button.contains(event.target)
            ) {

                dropdown.classList.remove(
                    "active"
                );

            }

        }
    );

}


// ============================================================
// MOBILE MENU
// ============================================================

function initAdminMenuToggle() {

    const button =
        document.getElementById(
            "adminMenuToggle"
        );

    const sidebar =
        document.getElementById(
            "adminSidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );

            overlay?.classList.toggle(
                "active"
            );

            document.body.classList.toggle(
                "admin-menu-open"
            );

        }
    );


    overlay?.addEventListener(
        "click",
        closeAdminMenu
    );

}


function closeAdminMenu() {

    document
        .getElementById("adminSidebar")
        ?.classList.remove("open");

    document
        .getElementById("sidebarOverlay")
        ?.classList.remove("active");

    document.body
        .classList.remove(
            "admin-menu-open"
        );

}


// ============================================================
// PROFILE DATA
// ============================================================

function updateAdminTopbarProfile(data = {}) {

    const name =
        data.displayName ||
        data.name ||
        data.fullName ||
        "Administrator";


    const avatar =
        document.getElementById(
            "adminTopbarAvatar"
        );

    const topbarName =
        document.getElementById(
            "adminTopbarName"
        );

    const dropdownName =
        document.getElementById(
            "dropdownAdminName"
        );

    const dropdownAvatar =
        document.getElementById(
            "dropdownAdminAvatar"
        );


    if (topbarName) {

        topbarName.textContent =
            name;

    }


    if (dropdownName) {

        dropdownName.textContent =
            name;

    }


    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase();


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
                initial;

        }

    }


    if (dropdownAvatar) {

        if (data.photoURL) {

            dropdownAvatar.innerHTML = `
                <img
                    src="${escapeHTML(data.photoURL)}"
                    alt="Admin"
                >
            `;

        } else {

            dropdownAvatar.textContent =
                initial;

        }

    }

}


// ============================================================
// NOTIFICATION BADGE
// ============================================================

function updateAdminNotificationBadge(
    count = 0
) {

    const badge =
        document.getElementById(
            "adminNotificationBadge"
        );

    if (!badge) return;


    const total =
        Number(count || 0);


    if (total <= 0) {

        badge.classList.add(
            "hidden"
        );

        return;

    }


    badge.classList.remove(
        "hidden"
    );

    badge.textContent =
        total > 99
            ? "99+"
            : total;

}


// ============================================================
// SEARCH BUTTON
// ============================================================

function initAdminSearch() {

    const button =
        document.getElementById(
            "adminSearchBtn"
        );

    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            document.dispatchEvent(
                new CustomEvent(
                    "admin:search"
                )
            );

        }
    );

}


// ============================================================
// LUCIDE
// ============================================================

function refreshAdminTopbarIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
        "function"
    ) {

        window.lucide.createIcons();

    }

}


// ============================================================
// HTML ESCAPE
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

function initAdminTopbar() {

    updateAdminPageTitle();

    initAdminProfileDropdown();

    initAdminMenuToggle();

    initAdminSearch();

    refreshAdminTopbarIcons();

    console.log(
        "✓ Admin topbar ready"
    );

}


// ============================================================
// GLOBAL API
// ============================================================

window.AdminTopbar = {

    init:
        initAdminTopbar,

    updatePageTitle:
        updateAdminPageTitle,

    updateProfile:
        updateAdminTopbarProfile,

    updateNotificationBadge:
        updateAdminNotificationBadge,

    closeMenu:
        closeAdminMenu

};