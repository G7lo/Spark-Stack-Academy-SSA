// ============================================================
// SPARK STACK ACADEMY
// ADMIN — COURSE PROFILE
// ============================================================

console.log("📚 COURSE PROFILE JS LOADED");

import { db } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentCourse = null;
let courseId = null;


// ============================================================
// HELPERS
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    if (window.lucide) {
        lucide.createIcons();
    }

    courseId =
        new URLSearchParams(window.location.search)
            .get("id");

    if (!courseId) {
        showError("No course selected.");
        return;
    }

    await loadCourse(courseId);

    initEvents();

});


// ============================================================
// EVENTS
// ============================================================

function initEvents() {

    $("suspendCourseBtn")
        ?.addEventListener(
            "click",
            toggleCourseStatus
        );


    $("editCourseBtn")
        ?.addEventListener(
            "click",
            () => {

                if (!courseId) return;

                window.location.href =
                    `course-edit.html?id=${courseId}`;

            }
        );


    $("deleteCourseBtn")
        ?.addEventListener(
            "click",
            deleteCourse
        );


    $("viewInstructorBtn")
        ?.addEventListener(
            "click",
            () => {

                if (!currentCourse?.instructorId) return;

                window.location.href =
                    `instructor-profile.html?id=${currentCourse.instructorId}`;

            }
        );

}


// ============================================================
// LOAD COURSE
// ============================================================

async function loadCourse(id) {

    try {

        showLoading();


        const courseRef =
            doc(
                db,
                "courses",
                id
            );


        const snapshot =
            await getDoc(courseRef);


        if (!snapshot.exists()) {

            showError("Course not found.");

            return;

        }


        currentCourse = {

            id: snapshot.id,

            ...snapshot.data()

        };


        await renderCourse();


        console.log(
            "✓ Loaded course:",
            currentCourse
        );


    } catch (error) {

        console.error(
            "❌ Failed loading course:",
            error
        );


        showError(
            "Unable to load course."
        );

    }

}


// ============================================================
// RENDER COURSE
// ============================================================

async function renderCourse() {

    const course =
        currentCourse;


    const name =
        getCourseName(course);


    const status =
        getStatus(course);


    // --------------------------------------------------------
    // BASIC INFO
    // --------------------------------------------------------

    setText(
        "courseName",
        name
    );


    setText(
        "courseDescription",
        course.description ||
        "No course description available."
    );


    setText(
        "courseId",
        course.id
    );


    setText(
        "courseStatus",
        capitalize(status)
    );


    setText(
        "courseJoined",
        formatDate(course.createdAt)
    );


    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    setText(
        "coursePrice",
        formatPrice(
            course.price
        )
    );


    // --------------------------------------------------------
    // STUDENTS
    // --------------------------------------------------------

    const students =
        getStudentCount(course);


    setText(
        "courseStudents",
        students
    );


    // --------------------------------------------------------
    // LESSONS
    // --------------------------------------------------------

    setText(
        "courseLessons",
        course.lessonCount ||
        course.lessonsCount ||
        (
            Array.isArray(course.lessons)
                ? course.lessons.length
                : 0
        )
    );


    // --------------------------------------------------------
    // RATING
    // --------------------------------------------------------

    setText(
        "courseRating",
        Number(
            course.rating || 0
        ).toFixed(1)
    );


    // --------------------------------------------------------
    // INSTRUCTOR
    // --------------------------------------------------------

    await loadInstructor();


    // --------------------------------------------------------
    // STATUS UI
    // --------------------------------------------------------

    updateStatusUI(status);


    // --------------------------------------------------------
    // COURSE ICON
    // --------------------------------------------------------

    const icon =
        $("courseIcon");


    if (icon) {

        icon.innerHTML = `
            <i data-lucide="book-open"></i>
        `;

    }


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// LOAD INSTRUCTOR
// ============================================================

async function loadInstructor() {

    const course =
        currentCourse;


    const instructorId =
        course.instructorId ||
        course.instructorID ||
        course.createdBy;


    if (!instructorId) {

        setText(
            "courseInstructor",
            "Unassigned"
        );

        return;

    }


    try {

        const instructorSnap =
            await getDoc(
                doc(
                    db,
                    "instructors",
                    instructorId
                )
            );


        if (!instructorSnap.exists()) {

            setText(
                "courseInstructor",
                "Unknown Instructor"
            );

            return;

        }


        const instructor = {

            id: instructorSnap.id,

            ...instructorSnap.data()

        };


        const name =
            instructor.displayName ||
            instructor.name ||
            instructor.fullName ||
            [
                instructor.firstName,
                instructor.lastName
            ]
                .filter(Boolean)
                .join(" ") ||
            "Instructor";


        setText(
            "courseInstructor",
            name
        );


        setText(
            "courseInstructorEmail",
            instructor.email ||
            "No email"
        );


        const avatar =
            $("courseInstructorAvatar");


        if (avatar) {

            avatar.textContent =
                getInitials(name);

        }


        currentCourse.instructorId =
            instructorId;

    } catch (error) {

        console.error(
            "❌ Failed loading instructor:",
            error
        );

    }

}


// ============================================================
// STATUS UI
// ============================================================

function updateStatusUI(status) {

    const statusElement =
        $("courseStatus");


    if (statusElement) {

        statusElement.className =
            `status-text ${status}`;

        statusElement.textContent =
            capitalize(status);

    }


    const badge =
        $("courseVerification");


    if (badge) {

        badge.className =
            `admin-badge ${status}`;

        badge.textContent =
            capitalize(status);

    }


    const button =
        $("suspendCourseBtn");


    if (button) {

        button.innerHTML =
            status === "published"

                ? `
                    <i data-lucide="eye-off"></i>
                    Unpublish
                  `

                : `
                    <i data-lucide="eye"></i>
                    Publish
                  `;

    }


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// TOGGLE COURSE STATUS
// ============================================================

async function toggleCourseStatus() {

    if (!currentCourse) return;


    const button =
        $("suspendCourseBtn");


    const oldStatus =
        getStatus(currentCourse);


    const newStatus =
        oldStatus === "published"
            ? "draft"
            : "published";


    if (button) {
        button.disabled = true;
    }


    try {

        const courseRef =
            doc(
                db,
                "courses",
                currentCourse.id
            );


        const { updateDoc } =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
            );


        await updateDoc(
            courseRef,
            {
                status: newStatus
            }
        );


        currentCourse.status =
            newStatus;


        updateStatusUI(
            newStatus
        );


        console.log(
            `✓ Course ${newStatus}`
        );


    } catch (error) {

        console.error(
            "❌ Failed updating course:",
            error
        );


        alert(
            "Unable to update course status."
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse() {

    if (!currentCourse) return;


    const confirmed =
        confirm(
            `Delete "${getCourseName(currentCourse)}"? This action cannot be undone.`
        );


    if (!confirmed) return;


    try {

        const { deleteDoc } =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
            );


        await deleteDoc(
            doc(
                db,
                "courses",
                currentCourse.id
            )
        );


        alert(
            "Course deleted successfully."
        );


        window.location.href =
            "courses.html";


    } catch (error) {

        console.error(
            "❌ Failed deleting course:",
            error
        );


        alert(
            "Unable to delete course."
        );

    }

}


// ============================================================
// COURSE NAME
// ============================================================

function getCourseName(course) {

    return (
        course.title ||
        course.name ||
        course.courseName ||
        "Untitled Course"
    );

}


// ============================================================
// STATUS
// ============================================================

function getStatus(course) {

    return String(
        course.status ||
        course.courseStatus ||
        "draft"
    ).toLowerCase();

}


// ============================================================
// STUDENT COUNT
// ============================================================

function getStudentCount(course) {

    if (
        typeof course.studentCount ===
        "number"
    ) {

        return course.studentCount;

    }


    if (
        typeof course.studentsCount ===
        "number"
    ) {

        return course.studentsCount;

    }


    if (
        Array.isArray(course.students)
    ) {

        return course.students.length;

    }


    if (
        Array.isArray(course.enrolledStudents)
    ) {

        return course.enrolledStudents.length;

    }


    return 0;

}


// ============================================================
// PRICE
// ============================================================

function formatPrice(price) {

    const value =
        Number(price || 0);


    if (value <= 0) {
        return "Free";
    }


    return `KSh ${value.toLocaleString(
        "en-KE"
    )}`;

}


// ============================================================
// DATE
// ============================================================

function getTimestamp(value) {

    if (!value) return 0;


    if (
        typeof value.toMillis ===
        "function"
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

    const time =
        getTimestamp(value);


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

    return String(name)
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

    const text =
        String(value || "");


    return text.charAt(0)
        .toUpperCase() +
        text.slice(1);

}


// ============================================================
// SET TEXT
// ============================================================

function setText(id, value) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value ?? "—";

    }

}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    document
        .querySelector(
            ".course-profile-page"
        )
        ?.classList.add(
            "course-loading"
        );

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    console.error(
        "Course Profile:",
        message
    );


    const page =
        document.querySelector(
            ".course-profile-page"
        );


    if (!page) return;


    page.innerHTML = `

        <div class="admin-card"
             style="
                padding:60px 25px;
                text-align:center;
             ">

            <i
                data-lucide="triangle-alert"
                style="
                    width:40px;
                    height:40px;
                    color:#d92d20;
                    margin-bottom:15px;
                "
            ></i>

            <h2>
                ${escapeHTML(message)}
            </h2>

            <p>
                The selected course could not be loaded.
            </p>

            <a
                href="courses.html"
                class="admin-btn secondary"
                style="margin-top:18px;"
            >
                Back to Courses
            </a>

        </div>

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
            event.key === "Escape"
        ) {

            window.history.back();

        }

    }
);