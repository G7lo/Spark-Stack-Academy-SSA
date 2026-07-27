// ===========================
// SSA INSTRUCTOR SIDEBAR
// ===========================

const sidebarContainer =
document.getElementById("sidebarContainer");

if (sidebarContainer) {

    // Load CSS
    const css = document.createElement("link");

    css.rel = "stylesheet";
    css.href = "components/sidebar.css";

    document.head.appendChild(css);

    // Load HTML
    fetch("components/sidebar.html")

    .then(res => res.text())

    .then(html => {

        sidebarContainer.innerHTML = html;

        if (typeof lucide !== "undefined") {

            lucide.createIcons();

        }

        setupSidebar();

    });

}


function setupSidebar() {

    const menuBtn =
    document.getElementById("menuBtn");

    const sidebar =
    document.querySelector(".sidebar");

    const overlay =
    document.getElementById("sidebarOverlay");

    if (!menuBtn || !sidebar || !overlay) return;


    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");

    });


    overlay.addEventListener("click", () => {

        sidebar.classList.remove("active");
        overlay.classList.remove("active");

    });


    document.addEventListener("click", (e) => {

        if (

            window.innerWidth <= 768 &&

            !sidebar.contains(e.target) &&

            !menuBtn.contains(e.target)

        ) {

            sidebar.classList.remove("active");
            overlay.classList.remove("active");

        }

    });

}