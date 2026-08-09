// ============================================
// SPARK STACK ACADEMY
// INSTRUCTOR DASHBOARD ENGINE V1
// ============================================

import { db, auth } from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================
// HELPERS
// ============================================

const $ = id => document.getElementById(id);

const money = value =>
    `KSh ${Number(value || 0).toLocaleString()}`;


// ============================================
// DASHBOARD STATE
// ============================================

let currentInstructor = null;

let dashboardData = {
    courses: [],
    students: [],
    completions: 0,
    earnings: 0
};


// ============================================
// INITIALIZE
// ============================================

async function initDashboard(user) {

    try {

        console.log("⚡ Instructor Dashboard loading...");

        currentInstructor = user;

        await loadInstructorData(user);

        await loadCourses(user);

        await loadStudentStats(user);

        await loadEarnings(user);

        renderStats();

        renderCourses();

        renderActivity();

        bindDashboardActions();

        refreshIcons();

        console.log("✅ Instructor Dashboard ready.");

    }

    catch (error) {

        console.error(
            "❌ Instructor Dashboard error:",
            error
        );

    }

}


// ============================================
// INSTRUCTOR PROFILE
// ============================================

async function loadInstructorData(user) {

    try {

        const instructorRef =
            doc(
                db,
                "instructors",
                user.uid
            );

        const snapshot =
            await getDoc(instructorRef);

        if (snapshot.exists()) {

            dashboardData.instructor =
                snapshot.data();

        }

    }

    catch (error) {

        console.warn(
            "Instructor profile unavailable:",
            error
        );

    }

}


// ============================================
// LOAD COURSES
// ============================================

async function loadCourses(user) {

    dashboardData.courses = [];

    try {

        const coursesRef =
            collection(
                db,
                "courses"
            );

        let snapshot;

        /*
         * Primary query:
         * courses belonging to this instructor.
         */

        try {

            snapshot =
                await getDocs(
                    query(
                        coursesRef,
                        where(
                            "instructorId",
                            "==",
                            user.uid
                        )
                    )
                );

        }

        catch (error) {

            console.warn(
                "Primary course query failed.",
                error
            );

            /*
             * Fallback for projects using
             * instructorUID instead.
             */

            snapshot =
                await getDocs(
                    query(
                        coursesRef,
                        where(
                            "instructorUID",
                            "==",
                            user.uid
                        )
                    )
                );

        }


        snapshot.forEach(courseDoc => {

            dashboardData.courses.push({
                id: courseDoc.id,
                ...courseDoc.data()
            });

        });

    }

    catch (error) {

        console.error(
            "Course loading failed:",
            error
        );

    }

}


// ============================================
// STUDENT STATISTICS
// ============================================

async function loadStudentStats(user) {

    dashboardData.students = [];

    try {

        /*
         * First attempt:
         * instructor-specific students.
         */

        const studentsRef =
            collection(
                db,
                "students"
            );

        let snapshot;

        try {

            snapshot =
                await getDocs(
                    query(
                        studentsRef,
                        where(
                            "instructorId",
                            "==",
                            user.uid
                        )
                    )
                );

        }

        catch {

            /*
             * If students don't directly
             * contain instructorId, use
             * course enrollment information.
             */

            snapshot = null;

        }


        if (snapshot) {

            snapshot.forEach(studentDoc => {

                dashboardData.students.push({
                    id: studentDoc.id,
                    ...studentDoc.data()
                });

            });

        }


        /*
         * If no direct instructor students
         * were found, calculate students
         * from course enrollment fields.
         */

        if (
            !dashboardData.students.length
        ) {

            const uniqueStudents =
                new Set();

            dashboardData.courses
                .forEach(course => {

                    const enrolled =
                        Array.isArray(
                            course.enrolledStudents
                        )
                            ? course.enrolledStudents
                            : [];

                    enrolled.forEach(uid => {

                        uniqueStudents.add(uid);

                    });

                });

            dashboardData.students =
                [...uniqueStudents]
                    .map(uid => ({
                        id: uid
                    }));

        }


        /*
         * Completion count
         */

        let completions = 0;

        dashboardData.students
            .forEach(student => {

                const completed =
                    Number(
                        student.completedCourses ||
                        student.coursesCompleted ||
                        student.completions ||
                        0
                    );

                completions += completed;

            });


        /*
         * Also support completion count
         * stored directly on courses.
         */

        dashboardData.courses
            .forEach(course => {

                completions += Number(
                    course.completions ||
                    course.completedStudents ||
                    0
                );

            });


        dashboardData.completions =
            completions;

    }

    catch (error) {

        console.error(
            "Student statistics failed:",
            error
        );

    }

}


// ============================================
// EARNINGS
// ============================================

async function loadEarnings(user) {

    dashboardData.earnings = 0;

    try {

        /*
         * Instructor wallet/profile values
         */

        const instructor =
            dashboardData.instructor || {};

        dashboardData.earnings =
            Number(
                instructor.earnings ||
                instructor.totalEarnings ||
                instructor.balanceEarned ||
                0
            );


        /*
         * If no profile earnings exist,
         * calculate from course earnings.
         */

        if (
            dashboardData.earnings === 0
        ) {

            dashboardData.courses
                .forEach(course => {

                    dashboardData.earnings +=
                        Number(
                            course.earnings ||
                            course.totalEarnings ||
                            0
                        );

                });

        }

    }

    catch (error) {

        console.warn(
            "Earnings unavailable:",
            error
        );

    }

}


// ============================================
// RENDER STATS
// ============================================

function renderStats() {

    const courses =
        dashboardData.courses
            .filter(course =>
                course.status === "published" ||
                course.published === true ||
                !course.status
            )
            .length;


    if ($("statCourses")) {

        $("statCourses").textContent =
            courses.toLocaleString();

    }


    if ($("statStudents")) {

        $("statStudents").textContent =
            dashboardData.students.length
                .toLocaleString();

    }


    if ($("statCompletions")) {

        $("statCompletions").textContent =
            dashboardData.completions
                .toLocaleString();

    }


    if ($("statEarnings")) {

        $("statEarnings").textContent =
            money(
                dashboardData.earnings
            );

    }

}


// ============================================
// RENDER COURSES
// ============================================

function renderCourses() {

    const container =
        $("courseList");

    if (!container)
        return;


    const courses =
        dashboardData.courses
            .slice(0, 5);


    if (!courses.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i data-lucide="book-open"></i>

                </div>

                <h3>
                    No courses yet
                </h3>

                <p>
                    Create your first course
                    and start teaching.
                </p>

                <button
                    class="empty-action"
                    id="emptyCreateCourseBtn"
                >

                    <i data-lucide="plus"></i>

                    Create Course

                </button>

            </div>

        `;

        const button =
            $("emptyCreateCourseBtn");

        if (button) {

            button.addEventListener(
                "click",
                createCourse
            );

        }

        refreshIcons();

        return;

    }


    container.innerHTML = "";


    courses.forEach(course => {

        const item =
            document.createElement("div");

        item.className =
            "dashboard-course";


        const title =
            escapeHTML(
                course.title ||
                course.name ||
                "Untitled Course"
            );


        const status =
            course.status ||
            (
                course.published === true
                    ? "published"
                    : "draft"
            );


        const students =
            Number(
                course.studentsCount ||
                course.enrolledCount ||
                (
                    Array.isArray(
                        course.enrolledStudents
                    )
                        ? course.enrolledStudents.length
                        : 0
                )
            );


        item.innerHTML = `

            <div class="course-main">

                <div class="course-thumb">

                    <i data-lucide="book-open"></i>

                </div>

                <div>

                    <strong>
                        ${title}
                    </strong>

                    <span>
                        ${students.toLocaleString()}
                        student${students === 1 ? "" : "s"}
                    </span>

                </div>

            </div>

            <span class="
                course-status
                ${status.toLowerCase()}
            ">
                ${escapeHTML(status)}
            </span>

        `;


        item.addEventListener(
            "click",
            () => {

                window.location.href =
                    `courses.html?id=${encodeURIComponent(course.id)}`;

            }
        );


        container.appendChild(item);

    });


    refreshIcons();

}


// ============================================
// ACTIVITY
// ============================================

function renderActivity() {

    const container =
        $("activityList");

    if (!container)
        return;


    /*
     * For now activity is derived from
     * available course data.
     *
     * We can connect this to a dedicated
     * activity collection later.
     */

    const activities = [];


    dashboardData.courses
        .slice(0, 5)
        .forEach(course => {

            if (
                course.updatedAt ||
                course.createdAt
            ) {

                activities.push({

                    icon: "book-open",

                    title:
                        course.title ||
                        course.name ||
                        "Course updated",

                    description:
                        "Course activity",

                    time:
                        formatDate(
                            course.updatedAt ||
                            course.createdAt
                        )

                });

            }

        });


    if (!activities.length) {

        container.innerHTML = `

            <div class="empty-activity">

                <i data-lucide="activity"></i>

                <p>
                    Student activity will appear here.
                </p>

            </div>

        `;

        refreshIcons();

        return;

    }


    container.innerHTML = "";


    activities.forEach(activity => {

        const item =
            document.createElement("div");

        item.className =
            "activity-item";


        item.innerHTML = `

            <div class="activity-icon">

                <i data-lucide="${activity.icon}"></i>

            </div>

            <div class="activity-content">

                <strong>
                    ${escapeHTML(activity.title)}
                </strong>

                <span>
                    ${escapeHTML(activity.description)}
                </span>

            </div>

            <time>
                ${escapeHTML(activity.time)}
            </time>

        `;


        container.appendChild(item);

    });


    refreshIcons();

}


// ============================================
// ACTIONS
// ============================================

function bindDashboardActions() {

    const createButtons = [

        $("createCourseBtn"),

        $("emptyCreateCourseBtn")

    ];


    createButtons.forEach(button => {

        if (!button) return;

        button.addEventListener(
            "click",
            createCourse
        );

    });


    const studentsButton =
        $("viewStudentsBtn");


    if (studentsButton) {

        studentsButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "students.html";

            }
        );

    }


    document
        .querySelectorAll(
            ".quick-action"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.action;

                    handleQuickAction(
                        action
                    );

                }
            );

        });

}


// ============================================
// CREATE COURSE
// ============================================

function createCourse() {

    window.location.href =
        "courses.html?action=create";

}


// ============================================
// QUICK ACTIONS
// ============================================

function handleQuickAction(action) {

    switch (action) {

        case "lesson":

            window.location.href =
                "courses.html?action=lesson";

            break;


        case "assignment":

            window.location.href =
                "courses.html?action=assignment";

            break;


        case "quiz":

            window.location.href =
                "courses.html?action=quiz";

            break;


        case "announcement":

            window.location.href =
                "announcements.html";

            break;


        default:

            console.warn(
                "Unknown dashboard action:",
                action
            );

    }

}


// ============================================
// DATE FORMATTER
// ============================================

function formatDate(timestamp) {

    if (!timestamp)
        return "Recently";


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


        if (Number.isNaN(
            date.getTime()
        )) {

            return "Recently";

        }


        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }

    catch {

        return "Recently";

    }

}


// ============================================
// HTML SAFETY
// ============================================

function escapeHTML(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================
// ICON REFRESH
// ============================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof lucide.createIcons === "function"
    ) {

        lucide.createIcons();

    }

}


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            console.log(
                "🔐 Instructor not authenticated."
            );

            return;

        }


        initDashboard(user);

    }
);


console.log(
    "🚀 Instructor Dashboard Engine Loaded"
);