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

        const response = await fetch(new URL("./sidebar.html", import.meta.url));

console.log(response.url);
console.log(response.status);

        container.innerHTML =
            await response.text();

console.log("Sidebar inserted:", container.innerHTML.length);

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

            window.location.href = "/login.html";

        });

    }

}
// =====================================
// UPDATE SIDEBAR
// =====================================

export function updateSidebar(student) {

    const name = student.name || student.fullName || "Student";

    const initial = name.charAt(0).toUpperCase();

    const sidebarName = document.getElementById("sidebarName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const sidebarLevel = document.getElementById("sidebarLevel");

    if (sidebarName) sidebarName.textContent = name;

    if (sidebarAvatar) sidebarAvatar.textContent = initial;

    if (sidebarLevel) sidebarLevel.textContent = student.level || 1;
}