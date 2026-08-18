// ============================================================
// SPARK STACK ACADEMY
// ADMIN — INSTRUCTORS
// ============================================================

console.log("👨‍🏫 INSTRUCTORS JS LOADED");

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

let instructors = [];
let filteredInstructors = [];

let currentInstructor = null;


// ============================================================
// ELEMENT HELPER
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initEvents();

    if (window.lucide) {
        lucide.createIcons();
    }

    loadInstructors();

});


// ============================================================
// EVENTS
// ============================================================

function initEvents() {

    $("refreshInstructorsBtn")
        ?.addEventListener("click", loadInstructors);


    $("instructorSearch")
        ?.addEventListener("input", applyFilters);


    $("instructorStatusFilter")
        ?.addEventListener("change", applyFilters);


    $("instructorSort")
        ?.addEventListener("change", applyFilters);


    $("clearInstructorFilters")
        ?.addEventListener("click", clearFilters);


    $("closeInstructorDetails")
        ?.addEventListener("click", closeModal);


    $("instructorDetailsModal")
        ?.querySelector(".admin-modal-backdrop")
        ?.addEventListener("click", closeModal);


    $("suspendInstructorBtn")
        ?.addEventListener("click", toggleInstructorStatus);


    $("viewInstructorProfileBtn")
    ?.addEventListener("click", () => {

        if (!currentInstructor?.id) return;

        window.location.href =
            `instructor-profile.html?id=${encodeURIComponent(
                currentInstructor.id
            )}`;

    });

}


// ============================================================
// LOAD INSTRUCTORS
// ============================================================

async function loadInstructors() {

    const button = $("refreshInstructorsBtn");

    if (button) {
        button.disabled = true;
    }


    showTableLoading();


    try {

        const instructorsQuery = query(
            collection(db, "instructors"),
            orderBy("createdAt", "desc")
        );


        const snapshot =
            await getDocs(instructorsQuery);


        instructors = [];


        snapshot.forEach(snapshotDoc => {

            instructors.push({

                id: snapshotDoc.id,

                ...snapshotDoc.data()

            });

        });


        /*
         * Fallback for projects where some instructor
         * documents don't have createdAt.
         */

        if (!instructors.length) {

            const fallback =
                await getDocs(
                    collection(db, "instructors")
                );


            fallback.forEach(snapshotDoc => {

                instructors.push({

                    id: snapshotDoc.id,

                    ...snapshotDoc.data()

                });

            });

        }


        updateStats();

        applyFilters();


        console.log(
            `✓ Loaded ${instructors.length} instructors`
        );


    } catch (error) {

        console.error(
            "❌ Failed loading instructors:",
            error
        );


        showTableError();


    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        instructors.length;


    const active =
        instructors.filter(
            instructor =>
                getStatus(instructor) === "active"
        ).length;


    const suspended =
        instructors.filter(
            instructor =>
                getStatus(instructor) === "suspended"
        ).length;


    const pending =
        instructors.filter(
            instructor =>
                getStatus(instructor) === "pending"
        ).length;


    setText(
        "totalInstructors",
        total
    );


    setText(
        "activeInstructors",
        active
    );


    setText(
        "suspendedInstructors",
        suspended
    );


    setText(
        "pendingInstructors",
        pending
    );

}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    const search =
        ($("instructorSearch")?.value || "")
            .trim()
            .toLowerCase();


    const status =
        $("instructorStatusFilter")?.value ||
        "all";


    const sort =
        $("instructorSort")?.value ||
        "newest";


    filteredInstructors =
        instructors.filter(instructor => {

            const name =
                getInstructorName(instructor)
                    .toLowerCase();


            const email =
                String(
                    instructor.email || ""
                ).toLowerCase();


            const instructorStatus =
                getStatus(instructor);


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search);


            const matchesStatus =
                status === "all" ||
                instructorStatus === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    sortInstructors(sort);


    renderInstructors();

}


// ============================================================
// SORT
// ============================================================

function sortInstructors(sort) {

    filteredInstructors.sort(
        (a, b) => {

            if (
                sort === "name" ||
                sort === "name-desc"
            ) {

                const nameA =
                    getInstructorName(a)
                        .toLowerCase();


                const nameB =
                    getInstructorName(b)
                        .toLowerCase();


                return sort === "name"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);

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

function renderInstructors() {

    const body =
        $("instructorsTableBody");


    const empty =
        $("instructorsEmptyState");


    if (!body) return;


    body.innerHTML = "";


    setText(
        "instructorResultsCount",
        filteredInstructors.length
    );


    if (!filteredInstructors.length) {

        empty?.classList.remove("hidden");

        return;

    }


    empty?.classList.add("hidden");


    filteredInstructors.forEach(
        instructor => {

            body.appendChild(
                createInstructorRow(
                    instructor
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

function createInstructorRow(instructor) {

    const row =
        document.createElement("tr");


    const name =
        getInstructorName(instructor);


    const email =
        instructor.email ||
        "No email";


    const status =
        getStatus(instructor);


    const courses =
        getCourseCount(instructor);


    const joined =
        formatDate(
            instructor.createdAt
        );


    const avatar =
        getInitials(name);


    row.innerHTML = `

        <td>

            <div class="instructor-table-user">

                <div class="instructor-avatar">
                    ${escapeHTML(avatar)}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            instructor.specialization ||
                            instructor.department ||
                            "Instructor"
                        )}
                    </span>

                </div>

            </div>

        </td>


        <td>

            <span class="instructor-email">
                ${escapeHTML(email)}
            </span>

        </td>


        <td>

            <strong>
                ${courses}
            </strong>

        </td>


        <td>

            <span class="admin-badge ${status}">
                ${capitalize(status)}
            </span>

        </td>


        <td>

            ${joined}

        </td>


        <td>

            <div class="instructor-actions">

                <button
                    type="button"
                    class="icon-action"
                    title="View instructor"
                    data-action="view"
                    data-id="${instructor.id}"
                >

                    <i data-lucide="eye"></i>

                </button>


                <button
                    type="button"
                    class="icon-action"
                    title="${
                        status === "suspended"
                            ? "Activate instructor"
                            : "Suspend instructor"
                    }"
                    data-action="toggle"
                    data-id="${instructor.id}"
                >

                    <i data-lucide="${
                        status === "suspended"
                            ? "user-check"
                            : "user-round-x"
                    }"></i>

                </button>

            </div>

        </td>

    `;


    row.querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;


                    const action =
                        button.dataset.action;


                    const instructor =
                        instructors.find(
                            item =>
                                item.id === id
                        );


                    if (!instructor) return;


                    if (action === "view") {

                        openModal(instructor);

                    }


                    if (action === "toggle") {

                        currentInstructor =
                            instructor;

                        toggleInstructorStatus();

                    }

                }
            );

        });


    return row;

}


// ============================================================
// OPEN MODAL
// ============================================================

function openModal(instructor) {

    currentInstructor =
        instructor;


    const name =
        getInstructorName(instructor);


    setText(
        "instructorModalName",
        name
    );


    setText(
        "instructorModalEmail",
        instructor.email ||
        "No email"
    );


    setText(
        "instructorModalId",
        instructor.id
    );


    setText(
        "instructorModalJoined",
        formatDate(
            instructor.createdAt
        )
    );


    setText(
        "instructorModalCourses",
        getCourseCount(instructor)
    );


    setText(
        "instructorModalStudents",
        instructor.studentCount ||
        instructor.studentsCount ||
        0
    );


    const avatar =
        $("instructorModalAvatar");


    if (avatar) {

        avatar.textContent =
            getInitials(name);

    }


    const status =
        getStatus(instructor);


    setText(
        "instructorModalStatus",
        capitalize(status)
    );


    const action =
        $("suspendInstructorBtn");


    if (action) {

        action.innerHTML = status === "suspended"

            ? `
                <i data-lucide="user-check"></i>
                Activate Instructor
              `

            : `
                <i data-lucide="user-round-x"></i>
                Suspend Instructor
              `;

    }


    $("instructorDetailsModal")
        ?.classList.remove("hidden");


    $("instructorDetailsModal")
        ?.setAttribute(
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
        $("instructorDetailsModal");


    modal?.classList.add("hidden");


    modal?.setAttribute(
        "aria-hidden",
        "true"
    );


    currentInstructor = null;

}


// ============================================================
// TOGGLE STATUS
// ============================================================

async function toggleInstructorStatus() {

    if (!currentInstructor) return;


    const instructor =
        currentInstructor;


    const oldStatus =
        getStatus(instructor);


    const newStatus =
        oldStatus === "suspended"
            ? "active"
            : "suspended";


    const action =
        $("suspendInstructorBtn");


    if (action) {

        action.disabled = true;

    }


    try {

        await updateDoc(
            doc(
                db,
                "instructors",
                instructor.id
            ),
            {
                status: newStatus
            }
        );


        instructor.status =
            newStatus;


        updateStats();

        applyFilters();


        if (
            $("instructorDetailsModal") &&
            !$("instructorDetailsModal")
                .classList.contains("hidden")
        ) {

            openModal(instructor);

        }


        console.log(
            `✓ Instructor ${newStatus}`
        );


    } catch (error) {

        console.error(
            "❌ Failed updating instructor:",
            error
        );


        alert(
            "Unable to update instructor status."
        );


    } finally {

        if (action) {

            action.disabled = false;

        }

    }

}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearFilters() {

    if ($("instructorSearch")) {
        $("instructorSearch").value = "";
    }


    if ($("instructorStatusFilter")) {
        $("instructorStatusFilter").value = "all";
    }


    if ($("instructorSort")) {
        $("instructorSort").value = "newest";
    }


    applyFilters();

}


// ============================================================
// STATUS
// ============================================================

function getStatus(instructor) {

    return String(
        instructor.status ||
        instructor.accountStatus ||
        "active"
    ).toLowerCase();

}


// ============================================================
// NAME
// ============================================================

function getInstructorName(instructor) {

    return (
        instructor.displayName ||
        instructor.name ||
        instructor.fullName ||
        [
            instructor.firstName,
            instructor.lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        "Instructor"
    );

}


// ============================================================
// COURSE COUNT
// ============================================================

function getCourseCount(instructor) {

    if (Array.isArray(instructor.courseIds)) {
        return instructor.courseIds.length;
    }


    if (Array.isArray(instructor.courses)) {
        return instructor.courses.length;
    }


    return (
        instructor.courseCount ||
        0
    );

}


// ============================================================
// CREATED TIME
// ============================================================

function getCreatedTime(instructor) {

    const value =
        instructor.createdAt;


    if (!value) return 0;


    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }


    if (value instanceof Timestamp) {
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


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    const time =
        getCreatedTime({
            createdAt: value
        });


    if (!time) {
        return "—";
    }


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


// ============================================================
// INITIALS
// ============================================================

function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .toUpperCase();

}


// ============================================================
// CAPITALIZE
// ============================================================

function capitalize(value) {

    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1);

}


// ============================================================
// SET TEXT
// ============================================================

function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent =
            value ?? "0";
    }

}


// ============================================================
// LOADING
// ============================================================

function showTableLoading() {

    const body =
        $("instructorsTableBody");


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
                        Loading instructors...
                    </span>

                </div>

            </td>

        </tr>

    `;

}


// ============================================================
// ERROR
// ============================================================

function showTableError() {

    const body =
        $("instructorsTableBody");


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
                        Unable to load instructors
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
// ESC KEY
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            $("instructorDetailsModal") &&
            !$("instructorDetailsModal")
                .classList.contains("hidden")
        ) {

            closeModal();

        }

    }
);