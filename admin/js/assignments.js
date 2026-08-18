// ============================================================
// SPARK STACK ACADEMY
// ADMIN — ASSIGNMENTS
// ============================================================

console.log("📝 ASSIGNMENTS JS LOADED");

import { db } from "../../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    updateDoc,
    doc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let assignments = [];
let filteredAssignments = [];

let currentAssignment = null;


// ============================================================
// HELPER
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initEvents();

    if (window.lucide) {
        lucide.createIcons();
    }

    loadAssignments();

});


// ============================================================
// EVENTS
// ============================================================

function initEvents() {

    $("refreshAssignmentsBtn")
        ?.addEventListener("click", loadAssignments);

    $("assignmentSearch")
        ?.addEventListener("input", applyFilters);

    $("assignmentStatusFilter")
        ?.addEventListener("change", applyFilters);

    $("assignmentCourseFilter")
        ?.addEventListener("change", applyFilters);

    $("assignmentSort")
        ?.addEventListener("change", applyFilters);

    $("clearAssignmentFilters")
        ?.addEventListener("click", clearFilters);

    $("closeAssignmentDetails")
        ?.addEventListener("click", closeModal);

    $("assignmentDetailsModal")
        ?.querySelector(".admin-modal-backdrop")
        ?.addEventListener("click", closeModal);

    $("toggleAssignmentStatusBtn")
        ?.addEventListener("click", toggleAssignmentStatus);

}


// ============================================================
// LOAD ASSIGNMENTS
// ============================================================

async function loadAssignments() {

    const refresh =
        $("refreshAssignmentsBtn");

    if (refresh) {
        refresh.disabled = true;
    }

    showLoading();

    try {

        let snapshot;

        try {

            const assignmentQuery = query(
                collection(db, "assignments"),
                orderBy("createdAt", "desc")
            );

            snapshot = await getDocs(
                assignmentQuery
            );

        } catch (error) {

            console.warn(
                "Ordered assignment query failed. Using fallback.",
                error
            );

            snapshot = await getDocs(
                collection(db, "assignments")
            );

        }


        assignments = [];


        snapshot.forEach(item => {

            assignments.push({
                id: item.id,
                ...item.data()
            });

        });


        populateCourseFilter();

        updateStats();

        applyFilters();


        console.log(
            `✓ Loaded ${assignments.length} assignments`
        );


    } catch (error) {

        console.error(
            "❌ Failed loading assignments:",
            error
        );

        showError();

    } finally {

        if (refresh) {
            refresh.disabled = false;
        }

    }

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        assignments.length;


    const active =
        assignments.filter(
            item =>
                getStatus(item) === "active" ||
                getStatus(item) === "published"
        ).length;


    const pending =
        assignments.filter(
            item =>
                getStatus(item) === "pending" ||
                getStatus(item) === "draft"
        ).length;


    const submissions =
        assignments.reduce(
            (total, item) =>
                total +
                Number(
                    item.submissionsCount ||
                    item.submissionCount ||
                    item.submissions ||
                    0
                ),
            0
        );


    setText(
        "totalAssignments",
        total
    );

    setText(
        "activeAssignments",
        active
    );

    setText(
        "pendingAssignments",
        pending
    );

    setText(
        "totalSubmissions",
        submissions
    );

}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    const search =
        ($("assignmentSearch")?.value || "")
            .trim()
            .toLowerCase();


    const status =
        $("assignmentStatusFilter")?.value ||
        "all";


    const course =
        $("assignmentCourseFilter")?.value ||
        "all";


    const sort =
        $("assignmentSort")?.value ||
        "newest";


    filteredAssignments =
        assignments.filter(item => {

            const title =
                getAssignmentName(item)
                    .toLowerCase();


            const courseName =
                getCourseName(item)
                    .toLowerCase();


            const itemStatus =
                getStatus(item);


            const matchesSearch =
                !search ||
                title.includes(search) ||
                courseName.includes(search);


            const matchesStatus =
                status === "all" ||
                itemStatus === status;


            const matchesCourse =
                course === "all" ||
                getCourseId(item) === course;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesCourse
            );

        });


    sortAssignments(sort);

    renderAssignments();

}


// ============================================================
// SORT
// ============================================================

function sortAssignments(sort) {

    filteredAssignments.sort(
        (a, b) => {

            if (
                sort === "name" ||
                sort === "name-desc"
            ) {

                const nameA =
                    getAssignmentName(a)
                        .toLowerCase();

                const nameB =
                    getAssignmentName(b)
                        .toLowerCase();


                return sort === "name"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);

            }


            if (sort === "submissions") {

                return (
                    getSubmissionCount(b) -
                    getSubmissionCount(a)
                );

            }


            const timeA =
                getCreatedTime(a);

            const timeB =
                getCreatedTime(b);


            return sort === "oldest"
                ? timeA - timeB
                : timeB - timeA;

        }
    );

}


// ============================================================
// RENDER
// ============================================================

function renderAssignments() {

    const body =
        $("assignmentsTableBody");

    const empty =
        $("assignmentsEmptyState");


    if (!body) return;


    body.innerHTML = "";


    setText(
        "assignmentResultsCount",
        filteredAssignments.length
    );


    if (!filteredAssignments.length) {

        empty?.classList.remove("hidden");

        return;

    }


    empty?.classList.add("hidden");


    filteredAssignments.forEach(
        assignment => {

            body.appendChild(
                createAssignmentRow(
                    assignment
                )
            );

        }
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// CREATE ROW
// ============================================================

function createAssignmentRow(assignment) {

    const row =
        document.createElement("tr");


    const title =
        getAssignmentName(assignment);


    const course =
        getCourseName(assignment);


    const status =
        getStatus(assignment);


    const submissions =
        getSubmissionCount(assignment);


    const dueDate =
        formatDate(
            assignment.dueDate
        );


    const points =
        Number(
            assignment.points ||
            assignment.maxPoints ||
            0
        );


    row.innerHTML = `

        <td>

            <div class="assignment-table-item">

                <div class="assignment-icon">

                    <i data-lucide="clipboard-check"></i>

                </div>

                <div class="assignment-info">

                    <strong>
                        ${escapeHTML(title)}
                    </strong>

                    <span>
                        ${points} points
                    </span>

                </div>

            </div>

        </td>


        <td>

            <span class="assignment-course">
                ${escapeHTML(course)}
            </span>

        </td>


        <td>

            <strong class="assignment-count">
                ${submissions}
            </strong>

            <span class="assignment-count-label">
                submissions
            </span>

        </td>


        <td>

            <span class="assignment-date">
                ${dueDate}
            </span>

        </td>


        <td>

            <span class="assignment-status ${escapeHTML(status)}">

                ${capitalize(status)}

            </span>

        </td>


        <td>

            <div class="assignment-actions">

                <button
                    type="button"
                    class="assignment-action-btn"
                    title="View assignment"
                    data-action="view"
                    data-id="${assignment.id}"
                >

                    <i data-lucide="eye"></i>

                </button>


                <button
                    type="button"
                    class="assignment-action-btn"
                    title="Toggle status"
                    data-action="toggle"
                    data-id="${assignment.id}"
                >

                    <i data-lucide="${
                        status === "active" ||
                        status === "published"
                            ? "eye-off"
                            : "eye"
                    }"></i>

                </button>

            </div>

        </td>

    `;


    row.querySelectorAll(
        "[data-action]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const assignment =
                    assignments.find(
                        item =>
                            item.id ===
                            button.dataset.id
                    );


                if (!assignment) return;


                if (
                    button.dataset.action ===
                    "view"
                ) {

                    openModal(
                        assignment
                    );

                }


                if (
                    button.dataset.action ===
                    "toggle"
                ) {

                    currentAssignment =
                        assignment;

                    toggleAssignmentStatus();

                }

            }
        );

    });


    return row;

}


// ============================================================
// OPEN MODAL
// ============================================================

function openModal(assignment) {

    currentAssignment =
        assignment;


    const title =
        getAssignmentName(assignment);


    setText(
        "assignmentModalName",
        title
    );


    setText(
        "assignmentModalCourse",
        getCourseName(assignment)
    );


    setText(
        "assignmentModalId",
        assignment.id
    );


    setText(
        "assignmentModalSubmissions",
        getSubmissionCount(assignment)
    );


    setText(
        "assignmentModalPoints",
        assignment.points ||
        assignment.maxPoints ||
        0
    );


    setText(
        "assignmentModalDueDate",
        formatDate(
            assignment.dueDate
        )
    );


    setText(
        "assignmentModalStatus",
        capitalize(
            getStatus(assignment)
        )
    );


    const toggle =
        $("toggleAssignmentStatusBtn");


    if (toggle) {

        const active =
            getStatus(assignment) ===
                "active" ||
            getStatus(assignment) ===
                "published";


        toggle.innerHTML = active

            ? `
                <i data-lucide="eye-off"></i>
                Unpublish Assignment
              `

            : `
                <i data-lucide="eye"></i>
                Publish Assignment
              `;

    }


    const modal =
        $("assignmentDetailsModal");


    modal?.classList.remove(
        "hidden"
    );


    modal?.setAttribute(
        "aria-hidden",
        "false"
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    const modal =
        $("assignmentDetailsModal");


    modal?.classList.add(
        "hidden"
    );


    modal?.setAttribute(
        "aria-hidden",
        "true"
    );


    currentAssignment = null;

}


// ============================================================
// TOGGLE STATUS
// ============================================================

async function toggleAssignmentStatus() {

    if (!currentAssignment) return;


    const assignment =
        currentAssignment;


    const oldStatus =
        getStatus(assignment);


    const active =
        oldStatus === "active" ||
        oldStatus === "published";


    const newStatus =
        active
            ? "draft"
            : "published";


    const button =
        $("toggleAssignmentStatusBtn");


    if (button) {
        button.disabled = true;
    }


    try {

        await updateDoc(
            doc(
                db,
                "assignments",
                assignment.id
            ),
            {
                status: newStatus
            }
        );


        assignment.status =
            newStatus;


        updateStats();

        applyFilters();


        if (
            $("assignmentDetailsModal") &&
            !$("assignmentDetailsModal")
                .classList.contains("hidden")
        ) {

            openModal(
                assignment
            );

        }


    } catch (error) {

        console.error(
            "❌ Assignment status update failed:",
            error
        );


        alert(
            "Unable to update assignment status."
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


// ============================================================
// COURSE FILTER
// ============================================================

function populateCourseFilter() {

    const select =
        $("assignmentCourseFilter");


    if (!select) return;


    const current =
        select.value;


    const courses = new Map();


    assignments.forEach(
        assignment => {

            const id =
                getCourseId(
                    assignment
                );


            const name =
                getCourseName(
                    assignment
                );


            if (id) {
                courses.set(
                    id,
                    name
                );
            }

        }
    );


    select.innerHTML = `
        <option value="all">
            All Courses
        </option>
    `;


    [...courses.entries()]
        .sort(
            (a, b) =>
                a[1].localeCompare(b[1])
        )
        .forEach(
            ([id, name]) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = id;

                option.textContent =
                    name;

                select.appendChild(
                    option
                );

            }
        );


    if (
        [...select.options]
            .some(
                option =>
                    option.value ===
                    current
            )
    ) {

        select.value = current;

    }

}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearFilters() {

    if ($("assignmentSearch")) {
        $("assignmentSearch").value = "";
    }

    if ($("assignmentStatusFilter")) {
        $("assignmentStatusFilter").value = "all";
    }

    if ($("assignmentCourseFilter")) {
        $("assignmentCourseFilter").value = "all";
    }

    if ($("assignmentSort")) {
        $("assignmentSort").value = "newest";
    }


    applyFilters();

}


// ============================================================
// HELPERS
// ============================================================

function getAssignmentName(item) {

    return (
        item.title ||
        item.name ||
        item.assignmentName ||
        "Untitled Assignment"
    );

}


function getCourseName(item) {

    return (
        item.courseName ||
        item.courseTitle ||
        item.course?.name ||
        item.course?.title ||
        "Unknown Course"
    );

}


function getCourseId(item) {

    return (
        item.courseId ||
        item.course?.id ||
        ""
    );

}


function getStatus(item) {

    return String(
        item.status ||
        "active"
    ).toLowerCase();

}


function getSubmissionCount(item) {

    return Number(
        item.submissionsCount ||
        item.submissionCount ||
        item.submissions ||
        0
    );

}


function getCreatedTime(item) {

    const value =
        item.createdAt;


    if (!value) return 0;


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        value instanceof Timestamp
    ) {

        return value.toMillis();

    }


    if (value.seconds) {

        return value.seconds * 1000;

    }


    const date =
        new Date(value);


    return isNaN(date)
        ? 0
        : date.getTime();

}


function formatDate(value) {

    if (!value) return "—";


    let time = 0;


    if (
        typeof value.toMillis ===
        "function"
    ) {

        time = value.toMillis();

    } else if (
        value instanceof Timestamp
    ) {

        time = value.toMillis();

    } else if (value.seconds) {

        time =
            value.seconds * 1000;

    } else {

        time =
            new Date(value)
                .getTime();

    }


    if (!time) return "—";


    return new Date(time)
        .toLocaleDateString(
            "en-KE",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


function capitalize(value) {

    value =
        String(value || "");


    return (
        value.charAt(0)
            .toUpperCase() +
        value.slice(1)
    );

}


function setText(id, value) {

    const element =
        $(id);


    if (element) {
        element.textContent =
            value ?? "0";
    }

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const body =
        $("assignmentsTableBody");


    if (!body) return;


    body.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-state-cell"
            >

                <div class="table-loading">

                    <div class="loading-spinner"></div>

                    <span>
                        Loading assignments...
                    </span>

                </div>

            </td>

        </tr>

    `;

}


// ============================================================
// ERROR
// ============================================================

function showError() {

    const body =
        $("assignmentsTableBody");


    if (!body) return;


    body.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-state-cell"
            >

                <div class="table-error">

                    <i data-lucide="triangle-alert"></i>

                    <strong>
                        Unable to load assignments
                    </strong>

                    <span>
                        Check your connection and try again.
                    </span>

                </div>

            </td>

        </tr>

    `;


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// ESCAPE KEY
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            $("assignmentDetailsModal") &&
            !$("assignmentDetailsModal")
                .classList.contains("hidden")
        ) {

            closeModal();

        }

    }
);