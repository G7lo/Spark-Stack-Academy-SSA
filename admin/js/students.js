// ============================================================
// SPARK STACK ACADEMY
// ADMIN — STUDENTS ENGINE
// ============================================================

console.log("👨‍🎓 ADMIN STUDENTS JS LOADED");

import { db } from "../../js/firebase.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let allStudents = [];
let filteredStudents = [];

let currentPage = 1;

const STUDENTS_PER_PAGE = 10;

let selectedStudent = null;


// ============================================================
// ELEMENT HELPER
// ============================================================

const $ = id =>
    document.getElementById(id);


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "admin:ready",
    async () => {

        console.log(
            "✓ Admin ready — loading students"
        );

        initStudentEvents();

        await loadStudents();

    }
);


// ============================================================
// EVENTS
// ============================================================

function initStudentEvents() {

    $("studentSearch")
        ?.addEventListener(
            "input",
            applyStudentFilters
        );


    $("studentStatusFilter")
        ?.addEventListener(
            "change",
            applyStudentFilters
        );


    $("studentSort")
        ?.addEventListener(
            "change",
            applyStudentFilters
        );


    $("clearStudentFilters")
        ?.addEventListener(
            "click",
            clearStudentFilters
        );


    $("refreshStudentsBtn")
        ?.addEventListener(
            "click",
            async () => {

                const button =
                    $("refreshStudentsBtn");

                button?.classList.add(
                    "loading"
                );

                await loadStudents();

                button?.classList.remove(
                    "loading"
                );

            }
        );


    $("closeStudentDetails")
        ?.addEventListener(
            "click",
            closeStudentModal
        );


    document
        .querySelector(
            "#studentDetailsModal .admin-modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closeStudentModal
        );


    $("suspendStudentBtn")
        ?.addEventListener(
            "click",
            suspendSelectedStudent
        );


    $("viewStudentProfileBtn")
        ?.addEventListener(
            "click",
            viewSelectedStudent
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeStudentModal();

            }

        }
    );

}


// ============================================================
// LOAD STUDENTS
// ============================================================

async function loadStudents() {

    showLoading();

    try {

        console.log(
            "📚 Fetching students..."
        );


        const studentsQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                studentsQuery
            );


        allStudents = [];


        snapshot.forEach(
            snapshotDoc => {

                const data =
                    snapshotDoc.data();


                const role =
                    String(
                        data.role || ""
                    )
                    .trim()
                    .toLowerCase();


                // Only students

                if (
                    role === "student" ||
                    role === "learner" ||
                    !role
                ) {

                    allStudents.push({

                        id:
                            snapshotDoc.id,

                        ...data

                    });

                }

            }
        );


        console.log(
            `✓ ${allStudents.length} students loaded`
        );


        updateStatistics();

        applyStudentFilters();


    } catch (error) {

        console.error(
            "❌ Failed loading students:",
            error
        );


        // Fallback if createdAt is missing

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "users"
                    )
                );


            allStudents = [];


            snapshot.forEach(
                snapshotDoc => {

                    const data =
                        snapshotDoc.data();


                    const role =
                        String(
                            data.role || ""
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        role === "student" ||
                        role === "learner" ||
                        !role
                    ) {

                        allStudents.push({

                            id:
                                snapshotDoc.id,

                            ...data

                        });

                    }

                }
            );


            updateStatistics();

            applyStudentFilters();


        } catch (fallbackError) {

            console.error(
                "❌ Student fallback failed:",
                fallbackError
            );

            showError();

        }

    }

}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    const total =
        allStudents.length;


    const active =
        allStudents.filter(
            student =>
                getStudentStatus(student) ===
                "active"
        ).length;


    const suspended =
        allStudents.filter(
            student =>
                getStudentStatus(student) ===
                "suspended"
        ).length;


    const now =
        new Date();


    const month =
        now.getMonth();


    const year =
        now.getFullYear();


    const newStudents =
        allStudents.filter(
            student => {

                const date =
                    getDate(
                        student.createdAt
                    );


                if (!date) return false;


                return (
                    date.getMonth() === month &&
                    date.getFullYear() === year
                );

            }
        ).length;


    setText(
        "totalStudents",
        total
    );


    setText(
        "activeStudents",
        active
    );


    setText(
        "suspendedStudents",
        suspended
    );


    setText(
        "newStudents",
        newStudents
    );

}


// ============================================================
// FILTER
// ============================================================

function applyStudentFilters() {

    const search =
        (
            $("studentSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const status =
        $("studentStatusFilter")?.value ||
        "all";


    const sort =
        $("studentSort")?.value ||
        "newest";


    filteredStudents =
        allStudents.filter(
            student => {

                const name =
                    getStudentName(
                        student
                    )
                    .toLowerCase();


                const email =
                    String(
                        student.email || ""
                    )
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    email.includes(search);


                const studentStatus =
                    getStudentStatus(
                        student
                    );


                const matchesStatus =
                    status === "all" ||
                    studentStatus === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    sortStudents(
        filteredStudents,
        sort
    );


    currentPage = 1;

    renderStudents();

}


// ============================================================
// SORT
// ============================================================

function sortStudents(
    students,
    sort
) {

    students.sort(
        (a, b) => {

            if (
                sort === "name" ||
                sort === "name-desc"
            ) {

                const nameA =
                    getStudentName(
                        a
                    ).toLowerCase();


                const nameB =
                    getStudentName(
                        b
                    ).toLowerCase();


                return sort === "name"

                    ? nameA.localeCompare(
                        nameB
                    )

                    : nameB.localeCompare(
                        nameA
                    );

            }


            const dateA =
                getDate(
                    a.createdAt
                )?.getTime() || 0;


            const dateB =
                getDate(
                    b.createdAt
                )?.getTime() || 0;


            return sort === "oldest"

                ? dateA - dateB

                : dateB - dateA;

        }
    );

}


// ============================================================
// RENDER
// ============================================================

function renderStudents() {

    const tbody =
        $("studentsTableBody");


    const empty =
        $("studentsEmptyState");


    if (!tbody) return;


    const total =
        filteredStudents.length;


    setText(
        "studentResultsCount",
        total
    );


    if (!total) {

        tbody.innerHTML = "";

        empty?.classList.remove(
            "hidden"
        );

        renderPagination();

        return;

    }


    empty?.classList.add(
        "hidden"
    );


    const start =
        (
            currentPage - 1
        ) *
        STUDENTS_PER_PAGE;


    const pageStudents =
        filteredStudents.slice(
            start,
            start +
            STUDENTS_PER_PAGE
        );


    tbody.innerHTML =
        pageStudents
            .map(
                renderStudentRow
            )
            .join("");


    renderPagination();

    refreshIcons();

}


// ============================================================
// STUDENT ROW
// ============================================================

function renderStudentRow(
    student
) {

    const name =
        getStudentName(
            student
        );


    const email =
        student.email ||
        "No email";


    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "S";


    const status =
        getStudentStatus(
            student
        );


    const courses =
        getCourseCount(
            student
        );


    const joined =
        formatDate(
            student.createdAt
        );


    const avatar =
        student.photoURL
            ? `
                <img
                    src="${escapeHTML(
                        student.photoURL
                    )}"
                    alt="${escapeHTML(
                        name
                    )}"
                >
            `
            : initial;


    return `

        <tr>

            <td>

                <div class="student-cell">

                    <div class="student-avatar">

                        ${avatar}

                    </div>

                    <div class="student-info">

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                student.id
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(email)}
            </td>


            <td>

                <span class="student-course-count">

                    ${courses}

                </span>

            </td>


            <td>

                <span
                    class="student-status ${status}"
                >

                    ${capitalize(status)}

                </span>

            </td>


            <td>
                ${joined}
            </td>


            <td>

                <div class="student-actions">

                    <button
                        type="button"
                        class="student-action-btn"
                        title="View student"
                        data-student-view="${escapeHTML(
                            student.id
                        )}"
                    >

                        <i data-lucide="eye"></i>

                    </button>


                    <button
                        type="button"
                        class="student-action-btn"
                        title="More actions"
                        data-student-action="${escapeHTML(
                            student.id
                        )}"
                    >

                        <i data-lucide="more-horizontal"></i>

                    </button>

                </div>

            </td>

        </tr>

    `;

}


// ============================================================
// TABLE ACTION DELEGATION
// ============================================================

document.addEventListener(
    "click",
    event => {

        const viewButton =
            event.target.closest(
                "[data-student-view]"
            );


        if (viewButton) {

            const id =
                viewButton.dataset.studentView;


            openStudentModal(
                id
            );

            return;

        }


        const actionButton =
            event.target.closest(
                "[data-student-action]"
            );


        if (actionButton) {

            const id =
                actionButton.dataset.studentAction;


            openStudentModal(
                id
            );

        }

    }
);


// ============================================================
// MODAL
// ============================================================

function openStudentModal(
    studentId
) {

    const student =
        allStudents.find(
            item =>
                item.id === studentId
        );


    if (!student) return;


    selectedStudent =
        student;


    const name =
        getStudentName(
            student
        );


    const status =
        getStudentStatus(
            student
        );


    const avatar =
        $("studentModalAvatar");


    if (avatar) {

        if (student.photoURL) {

            avatar.innerHTML = `

                <img
                    src="${escapeHTML(
                        student.photoURL
                    )}"
                    alt="${escapeHTML(name)}"
                >

            `;

        } else {

            avatar.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }

    }


    setText(
        "studentModalName",
        name
    );


    setText(
        "studentModalEmail",
        student.email ||
        "No email"
    );


    setText(
        "studentModalStatus",
        capitalize(status)
    );


    setText(
        "studentModalId",
        student.id
    );


    setText(
        "studentModalJoined",
        formatDate(
            student.createdAt
        )
    );


    setText(
        "studentModalCourses",
        getCourseCount(
            student
        )
    );


    setText(
        "studentModalCertificates",
        getCertificateCount(
            student
        )
    );


    const suspendButton =
        $("suspendStudentBtn");


    if (suspendButton) {

        if (
            status === "suspended"
        ) {

            suspendButton.innerHTML = `

                <i data-lucide="user-check"></i>

                Activate Student

            `;

        } else {

            suspendButton.innerHTML = `

                <i data-lucide="user-round-x"></i>

                Suspend Student

            `;

        }

    }


    const modal =
        $("studentDetailsModal");


    modal?.classList.remove(
        "hidden"
    );


    modal?.setAttribute(
        "aria-hidden",
        "false"
    );


    refreshIcons();

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeStudentModal() {

    const modal =
        $("studentDetailsModal");


    modal?.classList.add(
        "hidden"
    );


    modal?.setAttribute(
        "aria-hidden",
        "true"
    );


    selectedStudent =
        null;

}


// ============================================================
// SUSPEND / ACTIVATE
// ============================================================

async function suspendSelectedStudent() {

    if (!selectedStudent) return;


    const currentlySuspended =
        getStudentStatus(
            selectedStudent
        ) === "suspended";


    const action =
        currentlySuspended
            ? "activate"
            : "suspend";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this student?`
        );


    if (!confirmed) return;


    try {

        const studentRef =
            doc(
                db,
                "users",
                selectedStudent.id
            );


        await updateDoc(
            studentRef,
            {
                status:
                    currentlySuspended
                        ? "active"
                        : "suspended"
            }
        );


        selectedStudent.status =
            currentlySuspended
                ? "active"
                : "suspended";


        const index =
            allStudents.findIndex(
                student =>
                    student.id ===
                    selectedStudent.id
            );


        if (index !== -1) {

            allStudents[index].status =
                selectedStudent.status;

        }


        updateStatistics();

        applyStudentFilters();

        openStudentModal(
            selectedStudent.id
        );


        alert(
            currentlySuspended
                ? "Student activated successfully."
                : "Student suspended successfully."
        );


    } catch (error) {

        console.error(
            "❌ Student status update failed:",
            error
        );


        alert(
            "Unable to update student status."
        );

    }

}


// ============================================================
// VIEW PROFILE
// ============================================================

function viewSelectedStudent() {

    if (!selectedStudent) return;


    // For now, open the student's public/profile page
    // when that page exists.

    console.log(
        "Viewing student:",
        selectedStudent
    );


    alert(
        "Student profile page will be connected next."
    );

}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearStudentFilters() {

    if ($("studentSearch"))
        $("studentSearch").value = "";


    if ($("studentStatusFilter"))
        $("studentStatusFilter").value = "all";


    if ($("studentSort"))
        $("studentSort").value = "newest";


    applyStudentFilters();

}


// ============================================================
// PAGINATION
// ============================================================

function renderPagination() {

    const container =
        $("studentsPagination");


    if (!container) return;


    const totalPages =
        Math.ceil(
            filteredStudents.length /
            STUDENTS_PER_PAGE
        );


    if (totalPages <= 1) {

        container.innerHTML = "";

        return;

    }


    const start =
        (
            currentPage - 1
        ) *
        STUDENTS_PER_PAGE +
        1;


    const end =
        Math.min(
            currentPage *
            STUDENTS_PER_PAGE,
            filteredStudents.length
        );


    container.innerHTML = `

        <span class="pagination-info">

            Showing ${start}–${end}
            of ${filteredStudents.length}

        </span>


        <div class="pagination-actions">

            <button
                class="pagination-btn"
                data-page-prev
                ${currentPage === 1 ? "disabled" : ""}
            >

                <i data-lucide="chevron-left"></i>

            </button>


            <button
                class="pagination-btn"
                data-page-next
                ${
                    currentPage === totalPages
                        ? "disabled"
                        : ""
                }
            >

                <i data-lucide="chevron-right"></i>

            </button>

        </div>

    `;


    container
        .querySelector(
            "[data-page-prev]"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    currentPage > 1
                ) {

                    currentPage--;

                    renderStudents();

                }

            }
        );


    container
        .querySelector(
            "[data-page-next]"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    currentPage < totalPages
                ) {

                    currentPage++;

                    renderStudents();

                }

            }
        );


    refreshIcons();

}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const tbody =
        $("studentsTableBody");


    if (!tbody) return;


    tbody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-state-cell"
            >

                <div class="table-loading">

                    <div class="loading-spinner"></div>

                    <span>
                        Loading students...
                    </span>

                </div>

            </td>

        </tr>

    `;


    $("studentsEmptyState")
        ?.classList.add(
            "hidden"
        );

}


// ============================================================
// ERROR
// ============================================================

function showError() {

    const tbody =
        $("studentsTableBody");


    if (!tbody) return;


    tbody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-state-cell"
            >

                <div class="admin-empty">

                    <i data-lucide="triangle-alert"></i>

                    <h3>
                        Unable to load students
                    </h3>

                    <p>
                        Check your Firestore connection
                        and try again.
                    </p>

                </div>

            </td>

        </tr>

    `;


    refreshIcons();

}


// ============================================================
// HELPERS
// ============================================================

function getStudentName(
    student
) {

    return (
        student.displayName ||
        student.name ||
        student.fullName ||
        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
        "Student"
    );

}


function getStudentStatus(
    student
) {

    const status =
        String(
            student.status ||
            "active"
        )
        .trim()
        .toLowerCase();


    return status === "suspended"
        ? "suspended"
        : "active";

}


function getCourseCount(
    student
) {

    if (
        Array.isArray(
            student.enrolledCourses
        )
    ) {

        return student.enrolledCourses.length;

    }


    if (
        Array.isArray(
            student.courses
        )
    ) {

        return student.courses.length;

    }


    if (
        typeof student.courseCount ===
        "number"
    ) {

        return student.courseCount;

    }


    return 0;

}


function getCertificateCount(
    student
) {

    if (
        Array.isArray(
            student.certificates
        )
    ) {

        return student.certificates.length;

    }


    if (
        typeof student.certificateCount ===
        "number"
    ) {

        return student.certificateCount;

    }


    return 0;

}


function getDate(
    value
) {

    if (!value) return null;


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        value instanceof Date
    ) {

        return value;

    }


    const date =
        new Date(value);


    return isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function formatDate(
    value
) {

    const date =
        getDate(value);


    if (!date) return "—";


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value ?? "0";

    }

}


function capitalize(
    value
) {

    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1);

}


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
// GLOBAL API
// ============================================================

window.AdminStudents = {

    refresh:
        loadStudents,

    getStudents:
        () => allStudents,

    getFilteredStudents:
        () => filteredStudents

};