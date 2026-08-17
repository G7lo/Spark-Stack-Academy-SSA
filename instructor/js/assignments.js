// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR PORTAL
// ASSIGNMENTS ENGINE
// ============================================================

import {
    db
} from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let instructor = null;
let assignments = [];
let activeFilter = "all";


// ============================================================
// DOM HELPER
// ============================================================

const $ = id =>
    document.getElementById(id);


// ============================================================
// BOOT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await waitForInstructor();

            instructor =
                window.currentInstructor;

            if (!instructor) {

                console.error(
                    "❌ Instructor not available"
                );

                return;

            }

            setupEvents();

            await loadAssignments();

            refreshIcons();

            console.log(
                "✓ Assignments page loaded"
            );

        } catch (error) {

            console.error(
                "❌ Assignments error:",
                error
            );

        }

    }
);


// ============================================================
// WAIT FOR INSTRUCTOR
// ============================================================

function waitForInstructor() {

    return new Promise(resolve => {

        let attempts = 0;

        const timer =
            setInterval(() => {

                attempts++;

                if (
                    window.currentInstructor
                ) {

                    clearInterval(timer);

                    resolve();

                    return;

                }

                if (attempts >= 100) {

                    clearInterval(timer);

                    resolve();

                }

            }, 100);

    });

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

    // CREATE BUTTON

    $("createAssignmentBtn")
        ?.addEventListener(
            "click",
            openCreateAssignment
        );


    $("emptyCreateAssignmentBtn")
        ?.addEventListener(
            "click",
            openCreateAssignment
        );


    // SEARCH

    $("assignmentSearch")
        ?.addEventListener(
            "input",
            renderAssignments
        );


    // FILTERS

    document
        .querySelectorAll(
            ".assignment-filter"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    activeFilter =
                        button.dataset.filter ||
                        "all";


                    document
                        .querySelectorAll(
                            ".assignment-filter"
                        )
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    renderAssignments();

                }
            );

        });

}


// ============================================================
// LOAD ASSIGNMENTS
// ============================================================

async function loadAssignments() {

    const list =
        $("assignmentList");


    try {

        const ref =
            collection(
                db,
                "assignments"
            );


        const q =
            query(
                ref,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        assignments =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));


        // Newest first locally.
        // Avoids requiring a Firestore composite index.

        assignments.sort(
            (a, b) =>
                getTime(b.createdAt) -
                getTime(a.createdAt)
        );


        calculateStats();

        renderAssignments();


    } catch (error) {

        console.error(
            "❌ Failed to load assignments:",
            error
        );


        if (list) {

            list.innerHTML = `

                <div class="assignment-loading">

                    <i
                        data-lucide="alert-circle"
                    ></i>

                    <span>
                        Unable to load assignments.
                    </span>

                </div>

            `;

            refreshIcons();

        }

    }

}


// ============================================================
// STATS
// ============================================================

function calculateStats() {

    const total =
        assignments.length;


    const pending =
        assignments.filter(
            assignment =>
                getStatus(assignment) ===
                "pending"
        ).length;


    const graded =
        assignments.filter(
            assignment =>
                getStatus(assignment) ===
                "graded"
        ).length;


    const submissions =
        assignments.reduce(
            (total, assignment) => {

                return total +
                    Number(
                        assignment.submissionCount ||
                        assignment.submissionsCount ||
                        assignment.submissions ||
                        0
                    );

            },
            0
        );


    setText(
        "totalAssignments",
        total
    );


    setText(
        "pendingAssignments",
        pending
    );


    setText(
        "gradedAssignments",
        graded
    );


    setText(
        "totalSubmissions",
        submissions
    );

}


// ============================================================
// RENDER
// ============================================================

function renderAssignments() {

    const list =
        $("assignmentList");

    const empty =
        $("assignmentEmpty");


    if (!list || !empty) return;


    const search =
        ($("assignmentSearch")?.value || "")
            .trim()
            .toLowerCase();


    let filtered =
        assignments.filter(
            assignment => {

                const status =
                    getStatus(assignment);


                const matchesFilter =
                    activeFilter === "all" ||
                    status === activeFilter;


                const title =
                    String(
                        assignment.title || ""
                    ).toLowerCase();


                const course =
                    String(
                        assignment.courseName ||
                        assignment.courseTitle ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    course.includes(search);


                return (
                    matchesFilter &&
                    matchesSearch
                );

            }
        );


    if (!filtered.length) {

        list.innerHTML = "";

        empty.classList.remove(
            "hidden"
        );

        refreshIcons();

        return;

    }


    empty.classList.add(
        "hidden"
    );


    list.innerHTML =
        filtered.map(
            assignment =>
                createAssignmentHTML(
                    assignment
                )
        ).join("");


    refreshIcons();


    // OPEN ASSIGNMENT

    list.querySelectorAll(
        "[data-assignment-id]"
    ).forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const id =
                    item.dataset.assignmentId;

                window.location.href =
                    `assignment.html?id=${encodeURIComponent(id)}`;

            }
        );

    });

}


// ============================================================
// ASSIGNMENT HTML
// ============================================================

function createAssignmentHTML(
    assignment
) {

    const title =
        escapeHTML(
            assignment.title ||
            "Untitled Assignment"
        );


    const course =
        escapeHTML(
            assignment.courseName ||
            assignment.courseTitle ||
            "Course"
        );


    const status =
        getStatus(assignment);


    const statusLabel =
        status === "graded"
            ? "Graded"
            : "Pending";


    const submissions =
        Number(
            assignment.submissionCount ||
            assignment.submissionsCount ||
            assignment.submissions ||
            0
        );


    const dueDate =
        formatDate(
            assignment.dueDate
        );


    return `

        <div
            class="assignment-item"
            data-assignment-id="${escapeHTML(
                assignment.id
            )}"
            style="cursor:pointer"
        >

            <div class="assignment-main">

                <div class="assignment-icon">

                    <i data-lucide="clipboard-list"></i>

                </div>


                <div class="assignment-info">

                    <h3>
                        ${title}
                    </h3>

                    <p>
                        ${course}
                        •
                        ${submissions} submission${submissions === 1 ? "" : "s"}
                        ${dueDate ? ` • Due ${dueDate}` : ""}
                    </p>

                </div>

            </div>


            <div class="assignment-meta">

                <span
                    class="assignment-status ${status}"
                >
                    ${statusLabel}
                </span>

                <i
                    data-lucide="chevron-right"
                ></i>

            </div>

        </div>

    `;

}


// ============================================================
// STATUS
// ============================================================

function getStatus(
    assignment
) {

    const status =
        String(
            assignment.status || ""
        ).toLowerCase();


    if (
        status === "graded" ||
        status === "completed"
    ) {

        return "graded";

    }


    return "pending";

}


// ============================================================
// CREATE ASSIGNMENT
// ============================================================

function openCreateAssignment() {

    window.location.href =
        "create-assignment.html";

}


// ============================================================
// DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) return "";


    let date;


    if (
        typeof value?.toDate ===
        "function"
    ) {

        date = value.toDate();

    } else {

        date = new Date(value);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "en-KE",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// TIMESTAMP
// ============================================================

function getTime(
    value
) {

    if (!value) return 0;


    if (
        typeof value?.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value?.toDate ===
        "function"
    ) {

        return value.toDate().getTime();

    }


    const time =
        new Date(value).getTime();


    return Number.isNaN(time)
        ? 0
        : time;

}


// ============================================================
// TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// ESCAPE HTML
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
// ICONS
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