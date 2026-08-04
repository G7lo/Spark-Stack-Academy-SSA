// =====================================
// SPARK STACK ACADEMY
// STUDENT SIDEBAR V2
// =====================================

console.log("🚀 SSA Sidebar Loaded");

// =====================================
// LOAD SIDEBAR
// =====================================

export async function loadSidebar() {

    const container =
        document.getElementById("sidebarContainer");

    if (!container) return;

    try {

        const response =
            await fetch("components/sidebar.html");

        container.innerHTML =
            await response.text();

        initializeSidebar();

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

    } catch (error) {

        console.error(
            "Sidebar loading failed:",
            error
        );

    }

}
// =====================================
// INITIALIZE SIDEBAR
// =====================================

function initializeSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("mobileMenuBtn");

    const overlay =
        document.getElementById("sidebarOverlay");

    const logoutBtn =
        document.getElementById("logoutBtn");

    // =========================
    // MOBILE MENU
    // =========================

    if (menuBtn && sidebar && overlay) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("open");
            overlay.classList.toggle("show");

        });

        overlay.addEventListener("click", () => {

            sidebar.classList.remove("open");
            overlay.classList.remove("show");

        });

        document
            .querySelectorAll(".sidebar-link")
            .forEach(link => {

                link.addEventListener("click", () => {

                    if (window.innerWidth <= 900) {

                        sidebar.classList.remove("open");
                        overlay.classList.remove("show");

                    }

                });

            });

    }

    // =========================
    // LOGOUT
    // =========================

    if (logoutBtn) {

        logoutBtn.addEventListener("click", async () => {

            const { auth } =
                await import("../../js/firebase.js");

            const { signOut } =
                await import(
                    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
                );

            await signOut(auth);

            window.location.href = "../login.html";

        });

    }

}