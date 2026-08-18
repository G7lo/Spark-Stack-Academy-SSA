// ============================================================
// SPARK STACK ACADEMY
// ADMIN / MODERATOR DASHBOARD
// ============================================================

console.log("📊 ADMIN DASHBOARD JS LOADED");

import {
    db
} from "../../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// ELEMENT HELPER
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
// SAFE COUNT
// ============================================================

async function getCollectionCount(
    collectionName
) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    collectionName
                )
            );

        return snapshot.size;

    } catch (error) {

        console.warn(
            `⚠️ Unable to count ${collectionName}:`,
            error
        );

        return 0;

    }

}


// ============================================================
// LOAD PLATFORM STATS
// ============================================================

async function loadPlatformStats() {

    console.log(
        "📊 Loading platform statistics..."
    );


    const [
        students,
        instructors,
        courses,
        assignments
    ] = await Promise.all([

        getCollectionCount(
            "users"
        ),

        getCollectionCount(
            "instructors"
        ),

        getCollectionCount(
            "courses"
        ),

        getCollectionCount(
            "assignments"
        )

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
        "totalAssignments",
        assignments
    );


    console.log(
        "✓ Platform statistics loaded"
    );

}


// ============================================================
// LOAD RECENT ACTIVITY
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


        snapshot.forEach(
            notification => {

                const data =
                    notification.data();


                const item =
                    document.createElement(
                        "div"
                    );


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


                container.appendChild(
                    item
                );

            }
        );


        if (window.lucide) {

            window.lucide.createIcons();

        }

    } catch (error) {

        console.warn(
            "⚠️ Failed loading recent activity:",
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

function renderEmptyActivity(
    container
) {

    container.innerHTML = `

        <div class="activity-empty">

            <i data-lucide="inbox"></i>

            <span>
                No recent activity
            </span>

        </div>

    `;


    if (window.lucide) {

        window.lucide.createIcons();

    }

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    console.log(
        "🚀 Loading moderator dashboard..."
    );


    await Promise.all([

        loadPlatformStats(),

        loadRecentActivity()

    ]);


    console.log(
        "✓ Moderator dashboard ready"
    );

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// ============================================================
// WAIT FOR ADMIN APP
// ============================================================

document.addEventListener(
    "admin:ready",
    event => {

        console.log(
            "✓ Admin authentication confirmed"
        );


        loadDashboard();

    }
);