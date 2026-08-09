// ============================================
// SPARK STACK ACADEMY
// INSTRUCTOR APP V1
// ============================================

import {
    auth,
    db
} from "../../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================
// CONFIG
// ============================================

const COMPONENT_PATH = "components/";


// ============================================
// DOM READY
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    await loadComponents();

    setupNavigation();

    setupLogout();

    setupPageTitle();

    await loadInstructor();

    refreshIcons();

});


// ============================================
// LOAD COMPONENTS
// ============================================

async function loadComponents() {

    const sidebar = document.getElementById("instructorSidebar");
    const topbar = document.getElementById("instructorTopbar");

    try {

        const [sidebarResponse, topbarResponse] = await Promise.all([

            fetch(`${COMPONENT_PATH}sidebar.html`),

            fetch(`${COMPONENT_PATH}topbar.html`)

        ]);


        if (!sidebarResponse.ok || !topbarResponse.ok) {

            throw new Error("Failed to load instructor components.");

        }


        sidebar.innerHTML = await sidebarResponse.text();

        topbar.innerHTML = await topbarResponse.text();


    } catch (error) {

        console.error(
            "Instructor components error:",
            error
        );

    }

}


// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {

    const menuButton =
        document.getElementById("mobileMenuBtn");

    const closeButton =
        document.getElementById("sidebarClose");

    const sidebar =
        document.getElementById("instructorSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openSidebar
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSidebar
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    // Close sidebar after navigation on mobile

    document
        .querySelectorAll(".nav-item[href]")
        .forEach(link => {

            link.addEventListener("click", () => {

                if (
                    window.innerWidth <= 900 &&
                    sidebar
                ) {

                    closeSidebar();

                }

            });

        });


    setActiveNavigation();

}


// ============================================
// OPEN SIDEBAR
// ============================================

function openSidebar() {

    const sidebar =
        document.getElementById("instructorSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    sidebar?.classList.add("sidebar-open");

    overlay?.classList.add("overlay-visible");

    document.body.classList.add("sidebar-active");

}


// ============================================
// CLOSE SIDEBAR
// ============================================

function closeSidebar() {

    const sidebar =
        document.getElementById("instructorSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    sidebar?.classList.remove("sidebar-open");

    overlay?.classList.remove("overlay-visible");

    document.body.classList.remove("sidebar-active");

}


// ============================================
// ACTIVE NAVIGATION
// ============================================

function setActiveNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .replace(".html", "")
            .toLowerCase();


    document
        .querySelectorAll(".nav-item[data-page]")
        .forEach(item => {

            const page =
                item.dataset.page?.toLowerCase();


            item.classList.toggle(
                "active",
                page === currentPage
            );

        });

}


// ============================================
// LOGOUT
// ============================================

function setupLogout() {

    const logoutButton =
        document.getElementById("instructorLogout");


    if (!logoutButton) return;


    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed = confirm(
                "Are you sure you want to logout?"
            );


            if (!confirmed) return;


            try {

                await signOut(auth);

                window.location.href =
                    "../login.html";


            } catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );

                alert(
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}


// ============================================
// LOAD INSTRUCTOR
// ============================================

async function loadInstructor() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "../login.html";

                return;

            }


            try {

                const instructorRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const instructorSnap =
                    await getDoc(instructorRef);


                let instructor = {};


                if (instructorSnap.exists()) {

                    instructor =
                        instructorSnap.data();

                }


                const name =
                    instructor.displayName ||
                    instructor.name ||
                    user.displayName ||
                    "Instructor";


                const email =
                    instructor.email ||
                    user.email ||
                    "instructor@email.com";


                updateInstructorUI(
                    name,
                    email,
                    instructor
                );


            } catch (error) {

                console.error(
                    "Failed to load instructor:",
                    error
                );


                updateInstructorUI(
                    user.displayName || "Instructor",
                    user.email || "instructor@email.com",
                    {}
                );

            }

        }
    );

}


// ============================================
// UPDATE INSTRUCTOR UI
// ============================================

function updateInstructorUI(
    name,
    email,
    instructor
) {

    const firstLetter =
        name
            .trim()
            .charAt(0)
            .toUpperCase() || "I";


    // Topbar

    setText(
        "topbarInstructorName",
        name
    );


    setText(
        "topbarAvatar",
        firstLetter
    );


    // Sidebar

    setText(
        "sidebarInstructorName",
        name
    );


    setText(
        "sidebarAvatar",
        firstLetter
    );


    // Dashboard

    setText(
        "instructorName",
        name
    );


    setText(
        "profileName",
        name
    );


    setText(
        "profileEmail",
        email
    );


    setText(
        "profileAvatar",
        firstLetter
    );


    // Expertise

    const expertise =
        instructor.expertise ||
        instructor.specialization ||
        "Not specified";


    setText(
        "profileExpertise",
        `Expertise: ${expertise}`
    );

}


// ============================================
// PAGE TITLE
// ============================================

function setupPageTitle() {

    const title =
        document.getElementById("pageTitle");


    if (!title) return;


    const page =
        window.location.pathname
            .split("/")
            .pop()
            .replace(".html", "")
            .toLowerCase();


    const titles = {

        dashboard: "Dashboard",

        courses: "My Courses",

        students: "Students",

        assignments: "Assignments",

        quizzes: "Quizzes",

        announcements: "Announcements",

        notifications: "Notifications",

        wallet: "Wallet",

        earnings: "Earnings",

        payments: "Payments",

        withdrawals: "Withdrawals",

        profile: "My Profile",

        settings: "Settings",

        help: "Help & Support"

    };


    title.textContent =
        titles[page] || "Instructor Workspace";

}


// ============================================
// TODAY'S DATE
// ============================================

function setTodayDate() {

    const element =
        document.getElementById("todayDate");


    if (!element) return;


    const today =
        new Date();


    element.textContent =
        today.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

}


// ============================================
// UTILITY
// ============================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================
// LUCIDE
// ============================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons === "function"
    ) {

        window.lucide.createIcons();

    }

}


// ============================================
// INITIAL DATE
// ============================================

setTodayDate();