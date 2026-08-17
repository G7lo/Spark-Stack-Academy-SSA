// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR TOPBAR
// ============================================================

export function initTopbar() {

    const notificationButton =
        document.getElementById(
            "notificationBtn"
        );


    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    notificationButton?.addEventListener(
        "click",
        () => {

            window.location.href =
                "notifications.html";

        }
    );


    // ========================================================
    // PAGE TITLE
    // ========================================================

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (pageTitle) {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();


        const titles = {

            "dashboard.html":
                "Dashboard",

            "courses.html":
                "My Courses",

            "students.html":
                "My Students",

            "assignments.html":
                "Assignments",

            "announcements.html":
                "Announcements",

            "analytics.html":
                "Analytics",

            "earnings.html":
                "Earnings",

            "profile.html":
                "My Profile",

            "settings.html":
                "Settings",

            "notifications.html":
                "Notifications"

        };


        pageTitle.textContent =
            titles[currentPage] ||
            "Instructor Portal";

    }

}