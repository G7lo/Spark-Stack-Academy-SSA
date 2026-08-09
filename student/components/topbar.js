// =====================================
// SPARK STACK ACADEMY
// STUDENT TOPBAR CONTROLLER V2
// =====================================

console.log("🚀 SSA Topbar Loaded");


// =====================================
// LOAD TOPBAR
// =====================================

export async function loadTopbar() {

    const container =
        document.getElementById("topbarContainer");

    if (!container) return;


    try {

        const response = await fetch(
            new URL("./topbar.html", import.meta.url)
        );


        if (!response.ok) {

            throw new Error(
                `Failed to load topbar: ${response.status}`
            );

        }


        container.innerHTML =
            await response.text();


        initializeTopbar();


    } catch (error) {

        console.error(
            "Topbar error:",
            error
        );

    }

}


// =====================================
// INITIALIZE
// =====================================

function initializeTopbar() {


    // =================================
    // LUCIDE
    // =================================

    if (typeof lucide !== "undefined") {

        lucide.createIcons();

    }


    // =================================
    // MOBILE MENU
    // =================================

    const menuBtn =
        document.getElementById("mobileMenuBtn");

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (menuBtn && sidebar) {

        menuBtn.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("open");

                overlay?.classList.toggle("show");

            }
        );

    }


    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    function closeSidebar() {

        sidebar?.classList.remove("open");

        overlay?.classList.remove("show");

    }


    // =================================
    // THEME
    // =================================

    const themeBtn =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");


    let savedTheme =
        localStorage.getItem("ssa-theme");


    if (!savedTheme) {

        savedTheme = "light";

    }


    applyTheme(savedTheme);


    themeBtn?.addEventListener(
        "click",
        () => {

            const current =
                document.documentElement
                    .getAttribute("data-theme");

            const next =
                current === "dark"
                    ? "light"
                    : "dark";


            applyTheme(next);

        }
    );


    function applyTheme(theme) {

        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );


        localStorage.setItem(
            "ssa-theme",
            theme
        );


        if (themeIcon) {

            themeIcon.setAttribute(
                "data-lucide",
                theme === "dark"
                    ? "sun"
                    : "moon"
            );


            if (typeof lucide !== "undefined") {

                lucide.createIcons();

            }

        }

    }


// =================================
// NOTIFICATIONS
// =================================

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");


notificationBtn?.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        notificationPanel?.classList.toggle("show");

    }
);


notificationPanel?.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

    }
);


document.addEventListener(
    "click",
    () => {

        notificationPanel?.classList.remove("show");

    }
);


    // =================================
    // PROFILE
    // =================================

    const profileMenu =
        document.getElementById(
            "profileMenu"
        );


    profileMenu?.addEventListener(
        "click",
        () => {

            window.location.href =
                "profile.html";

        }
    );


    // Keyboard accessibility

    profileMenu?.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                window.location.href =
                    "profile.html";

            }

        }
    );


    // =================================
    // SEARCH
    // =================================

    const searchInput =
        document.getElementById(
            "studentSearch"
        );


    searchInput?.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                searchInput.value.trim()
            ) {

                const query =
                    encodeURIComponent(
                        searchInput.value.trim()
                    );


                window.location.href =
                    `courses.html?search=${query}`;

            }

        }
    );

}


// =====================================
// UPDATE TOPBAR
// =====================================

export function updateTopbar(student) {

    if (!student) return;


    const name =
        student.name ||
        student.fullName ||
        "Student";


    const initial =
        name.charAt(0).toUpperCase();


    const topName =
        document.getElementById(
            "topStudentName"
        );


    const avatar =
        document.getElementById(
            "topAvatar"
        );


    if (topName) {

    topName.textContent = "";

    const nameNode =
        document.createTextNode(name);

    topName.appendChild(nameNode);


    if (student.premium === true) {

        const badge =
            document.createElement("span");

        badge.className =
            "premium-badge";

        badge.textContent = "✓";

        badge.title =
            "SSA Premium Verified";

        topName.appendChild(badge);

    }

}


    if (avatar) {

        avatar.textContent =
            initial;

    }

}