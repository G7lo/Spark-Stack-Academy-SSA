// =====================================
// SPARK STACK ACADEMY
// STUDENT ASSIGNMENTS CONTROLLER V2
// =====================================

import {
    db,
    auth
} from "../../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("📚 Assignments Controller Loaded");

let assignments = [];


// =====================================
// AUTH
// =====================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    console.log("👤 Student:", user.uid);

    await loadAssignments(user.uid);

});


// =====================================
// LOAD ASSIGNMENTS
// =====================================

async function loadAssignments(uid) {

    const container =
        document.getElementById("assignmentContainer");

    try {

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Loading assignments...</h3>
                    <p>Checking your enrolled courses.</p>
                </div>
            `;
        }


        // =================================
        // 1. GET STUDENT ENROLLMENTS
        // =================================

        const enrollmentQuery = query(
            collection(db, "enrollments"),
            where("userId", "==", uid)
        );

        const enrollmentSnapshot =
            await getDocs(enrollmentQuery);


        if (enrollmentSnapshot.empty) {

            console.log(
                "ℹ️ Student has no enrollments."
            );

            assignments = [];

            updateStats();
            renderAssignments([]);

            return;
        }


        // =================================
        // 2. COLLECT COURSE IDS
        // =================================

        const courseIds = [];

        enrollmentSnapshot.forEach(doc => {

            const data = doc.data();

            if (
                data.courseId &&
                !courseIds.includes(data.courseId)
            ) {

                courseIds.push(
                    data.courseId
                );

            }

        });


        console.log(
            "📚 Enrolled courses:",
            courseIds
        );


        if (!courseIds.length) {

            assignments = [];

            updateStats();
            renderAssignments([]);

            return;
        }


        // =================================
        // 3. LOAD ASSIGNMENTS
        // =================================

        const assignmentSnapshot =
            await getDocs(
                collection(
                    db,
                    "assignments"
                )
            );


        assignments = [];


        assignmentSnapshot.forEach(doc => {

            const data = doc.data();


            // Only assignments belonging
            // to student's courses
            if (
                data.courseId &&
                courseIds.includes(
                    data.courseId
                )
            ) {

                assignments.push({

                    id: doc.id,

                    ...data

                });

            }

        });


        console.log(
            "📝 Assignments found:",
            assignments.length
        );


        // =================================
        // 4. SORT BY DEADLINE
        // =================================

        assignments.sort(
            (a, b) => {

                const dateA =
                    getDateValue(
                        a.dueDate
                    );

                const dateB =
                    getDateValue(
                        b.dueDate
                    );

                return dateA - dateB;

            }
        );


        updateStats();

        renderAssignments(
            assignments
        );


    } catch (error) {

        console.error(
            "❌ Failed to load assignments:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load assignments</h3>
                    <p>
                        Please refresh the page and try again.
                    </p>
                </div>
            `;

        }

    }

}


// =====================================
// STATS
// =====================================

function updateStats() {

    const pending =
        assignments.filter(
            a =>
                getAssignmentStatus(a) ===
                "pending"
        ).length;


    const submitted =
        assignments.filter(
            a =>
                getAssignmentStatus(a) ===
                "submitted"
        ).length;


    const graded =
        assignments.filter(
            a =>
                getAssignmentStatus(a) ===
                "graded"
        ).length;


    setText(
        "pendingAssignments",
        pending
    );


    setText(
        "submittedAssignments",
        submitted
    );


    setText(
        "gradedAssignments",
        graded
    );

}


// =====================================
// STATUS
// =====================================

function getAssignmentStatus(
    assignment
) {

    return String(
        assignment.status ||
        "pending"
    ).toLowerCase();

}


// =====================================
// RENDER
// =====================================

function renderAssignments(list) {

    const container =
        document.getElementById(
            "assignmentContainer"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!list.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i data-lucide="clipboard-list"></i>

                <h3>
                    No Assignments Yet
                </h3>

                <p>
                    Assignments from your instructors
                    will appear here.
                </p>

            </div>

        `;


        refreshIcons();

        return;

    }


    container.innerHTML =
        list.map(
            renderAssignmentCard
        ).join("");


    refreshIcons();

}


// =====================================
// ASSIGNMENT CARD
// =====================================

function renderAssignmentCard(
    assignment
) {

    const status =
        getAssignmentStatus(
            assignment
        );


    return `

        <div class="assignment-card">

            <div class="assignment-top">

                <h3>
                    ${escapeHTML(
                        assignment.title ||
                        "Untitled Assignment"
                    )}
                </h3>

                <span
                    class="status ${escapeHTML(
                        status
                    )}"
                >
                    ${escapeHTML(
                        capitalize(status)
                    )}
                </span>

            </div>


            <div class="assignment-body">

                <p>
                    ${escapeHTML(
                        assignment.description ||
                        "No description provided."
                    )}
                </p>


                <div class="assignment-meta">

                    <span>
                        📅
                        ${escapeHTML(
                            formatDate(
                                assignment.dueDate
                            )
                        )}
                    </span>

                    <span>
                        🏫
                        ${escapeHTML(
                            assignment.courseName ||
                            "Course"
                        )}
                    </span>

                </div>


                <div class="assignment-actions">

                    <button
                        class="primary-btn"
                        data-open-assignment="${
                            assignment.id
                        }"
                    >
                        Open
                    </button>


                    <button
                        class="secondary-btn"
                        data-submit-assignment="${
                            assignment.id
                        }"
                    >
                        Submit
                    </button>

                </div>

            </div>

        </div>

    `;

}


// =====================================
// CARD EVENTS
// =====================================

document.addEventListener(
    "click",
    event => {

        const openButton =
            event.target.closest(
                "[data-open-assignment]"
            );


        if (openButton) {

            openAssignment(
                openButton.dataset
                    .openAssignment
            );

            return;

        }


        const submitButton =
            event.target.closest(
                "[data-submit-assignment]"
            );


        if (submitButton) {

            submitAssignment(
                submitButton.dataset
                    .submitAssignment
            );

        }

    }
);


// =====================================
// SEARCH
// =====================================

const searchInput =
    document.getElementById(
        "assignmentSearch"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterAssignments
    );

}


// =====================================
// FILTER
// =====================================

const statusFilter =
    document.getElementById(
        "statusFilter"
    );


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterAssignments
    );

}


function filterAssignments() {

    const keyword =
        (
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const status =
        statusFilter?.value ||
        "all";


    const filtered =
        assignments.filter(
            item => {

                const title =
                    String(
                        item.title ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        item.description ||
                        ""
                    ).toLowerCase();


                const course =
                    String(
                        item.courseName ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    title.includes(keyword) ||
                    description.includes(keyword) ||
                    course.includes(keyword);


                const itemStatus =
                    getAssignmentStatus(
                        item
                    );


                const matchesStatus =
                    status === "all" ||
                    itemStatus === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderAssignments(
        filtered
    );

}


// =====================================
// OPEN
// =====================================

function openAssignment(id) {

    const assignment =
        assignments.find(
            a => a.id === id
        );


    if (!assignment) return;


    window.location.href =
        `assignment-details.html?id=${encodeURIComponent(id)}`;

}


// =====================================
// SUBMIT
// =====================================

function submitAssignment(id) {

    const assignment =
        assignments.find(
            a => a.id === id
        );


    if (!assignment) return;


    window.location.href =
        `assignment-details.html?id=${encodeURIComponent(id)}&action=submit`;

}


// =====================================
// DATE HELPERS
// =====================================

function getDateValue(value) {

    if (!value) return Infinity;


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate().getTime();

    }


    const date =
        new Date(value);


    return isNaN(
        date.getTime()
    )
        ? Infinity
        : date.getTime();

}


function formatDate(value) {

    if (!value)
        return "No deadline";


    let date;


    if (
        typeof value.toDate ===
        "function"
    ) {

        date =
            value.toDate();

    } else {

        date =
            new Date(value);

    }


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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


// =====================================
// HELPERS
// =====================================

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


function capitalize(value) {

    const text =
        String(value || "");


    return text
        ? text.charAt(0).toUpperCase() +
          text.slice(1)
        : "";

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
            "function"
    ) {

        window.lucide.createIcons();

    }

}