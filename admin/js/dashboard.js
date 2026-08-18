// ============================================================
// SPARK STACK ACADEMY
// ADMIN / MODERATOR DASHBOARD
// ============================================================

console.log("📊 ADMIN DASHBOARD JS LOADED");

import { db } from "../../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// SET TEXT
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "0";
    }

}


// ============================================================
// COUNT COLLECTION
// ============================================================

async function countCollection(name) {

    try {

        const snapshot =
            await getDocs(
                collection(db, name)
            );

        return snapshot.size;

    } catch (error) {

        console.warn(
            `Unable to count ${name}:`,
            error
        );

        return 0;

    }

}


// ============================================================
// COUNT REPORTS
// ============================================================

async function countOpenReports() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "reports")
            );

        let count = 0;

        snapshot.forEach(doc => {

            const data = doc.data();

            const status =
                String(
                    data.status || "open"
                ).toLowerCase();

            if (
                status === "open" ||
                status === "pending" ||
                status === "review"
            ) {

                count++;

            }

        });

        return count;

    } catch (error) {

        console.warn(
            "Unable to count reports:",
            error
        );

        return 0;

    }

}


// ============================================================
// PLATFORM STATS
// ============================================================

async function loadPlatformStats() {

    console.log(
        "📊 Loading platform statistics..."
    );


    const [
        students,
        instructors,
        courses,
        reports
    ] = await Promise.all([

        countCollection("users"),

        countCollection("instructors"),

        countCollection("courses"),

        countOpenReports()

    ]);


    setText(
        "totalStudents",
        students
    );


    setText(
        "totalInstructors",
        instructors
    );


    setText(
        "totalCourses",
        courses
    );


    setText(
        "openReports",
        reports
    );


    console.log(
        "✓ Platform statistics loaded"
    );

}


// ============================================================
// RECENT ACTIVITY
// ============================================================

async function loadRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );

    if (!container) return;


    try {

        const activityQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(8)
            );


        const snapshot =
            await getDocs(
                activityQuery
            );


        if (snapshot.empty) {

            renderEmptyActivity(
                container
            );

            return;

        }


        container.innerHTML = "";


        snapshot.forEach(notification => {

            const data =
                notification.data();


            const item =
                document.createElement("div");


            item.className =
                "activity-item";


            item.innerHTML = `

                <div class="activity-icon">

                    <i data-lucide="bell"></i>

                </div>

                <div class="activity-content">

                    <strong>
                        ${escapeHTML(
                            data.title ||
                            "Academy Activity"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            data.message ||
                            "New platform activity."
                        )}
                    </span>

                </div>

            `;


            container.appendChild(item);

        });


        refreshIcons();


    } catch (error) {

        console.warn(
            "⚠️ Activity loading failed:",
            error
        );


        renderEmptyActivity(
            container
        );

    }

}


// ============================================================
// EMPTY ACTIVITY
// ============================================================

function renderEmptyActivity(container) {

    container.innerHTML = `

        <div class="activity-empty">

            <i data-lucide="inbox"></i>

            <span>
                No recent activity
            </span>

        </div>

    `;


    refreshIcons();

}


// ============================================================
// LUCIDE
// ============================================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
        "function"
    ) {

        window.lucide.createIcons();

    }

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    console.log(
        "🚀 Loading moderator dashboard..."
    );


    await Promise.all([

        loadPlatformStats(),

        loadRecentActivity()

    ]);


    refreshIcons();


    console.log(
        "🔥 Moderator dashboard ready"
    );

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
// ADMIN READY
// ============================================================

document.addEventListener(
    "admin:ready",
    () => {

        console.log(
            "✓ Admin authentication confirmed"
        );

        loadDashboard();

    }
);