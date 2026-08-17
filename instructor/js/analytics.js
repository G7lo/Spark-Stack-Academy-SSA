// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR PORTAL
// ANALYTICS ENGINE
// ============================================================

console.log("🔥 ANALYTICS JS LOADED");

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentInstructor = null;

let courses = [];
let enrollments = [];
let assignments = [];
let submissions = [];
let earnings = [];

let selectedCourse = "all";


// ============================================================
// HELPERS
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function formatMoney(value) {

    const amount =
        Number(value) || 0;

    return `KSh ${amount.toLocaleString()}`;

}


function getPercent(value) {

    const number =
        Number(value) || 0;

    return Math.min(
        100,
        Math.max(0, Math.round(number))
    );

}


function safeArray(value) {

    return Array.isArray(value)
        ? value
        : [];

}


// ============================================================
// AUTH
// ============================================================

function initAnalyticsAuth() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {
                return;
            }

            currentInstructor = user;

            console.log(
                "✓ Analytics instructor:",
                user.uid
            );

            await loadAnalytics();

        }
    );

}


// ============================================================
// MAIN LOADER
// ============================================================

async function loadAnalytics() {

    try {

        showLoading();

        await Promise.all([
            loadCourses(),
            loadEnrollments(),
            loadAssignments(),
            loadSubmissions(),
            loadEarnings()
        ]);

        populateCourseFilter();

        calculateAnalytics();

        console.log(
            "✓ Analytics loaded"
        );

    } catch (error) {

        console.error(
            "❌ Analytics loading failed:",
            error
        );

        renderFallback();

    }

}


// ============================================================
// COURSES
// ============================================================

async function loadCourses() {

    try {

        const q =
            query(
                collection(db, "courses"),
                where(
                    "instructorId",
                    "==",
                    currentInstructor.uid
                )
            );

        const snapshot =
            await getDocs(q);

        courses =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

    } catch (error) {

        console.error(
            "❌ Failed loading courses:",
            error
        );

        courses = [];

    }

}


// ============================================================
// ENROLLMENTS
// ============================================================

async function loadEnrollments() {

    try {

        const q =
            query(
                collection(db, "enrollments"),
                where(
                    "instructorId",
                    "==",
                    currentInstructor.uid
                )
            );

        const snapshot =
            await getDocs(q);

        enrollments =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

    } catch (error) {

        console.error(
            "❌ Failed loading enrollments:",
            error
        );

        enrollments = [];

    }

}


// ============================================================
// ASSIGNMENTS
// ============================================================

async function loadAssignments() {

    try {

        const q =
            query(
                collection(db, "assignments"),
                where(
                    "instructorId",
                    "==",
                    currentInstructor.uid
                )
            );

        const snapshot =
            await getDocs(q);

        assignments =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

    } catch (error) {

        console.error(
            "❌ Failed loading assignments:",
            error
        );

        assignments = [];

    }

}


// ============================================================
// SUBMISSIONS
// ============================================================

async function loadSubmissions() {

    try {

        const q =
            query(
                collection(db, "submissions"),
                where(
                    "instructorId",
                    "==",
                    currentInstructor.uid
                )
            );

        const snapshot =
            await getDocs(q);

        submissions =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

    } catch (error) {

        console.error(
            "❌ Failed loading submissions:",
            error
        );

        submissions = [];

    }

}


// ============================================================
// EARNINGS
// ============================================================

async function loadEarnings() {

    try {

        const q =
            query(
                collection(db, "transactions"),
                where(
                    "instructorId",
                    "==",
                    currentInstructor.uid
                )
            );

        const snapshot =
            await getDocs(q);

        earnings =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

    } catch (error) {

        console.error(
            "❌ Failed loading earnings:",
            error
        );

        earnings = [];

    }

}


// ============================================================
// COURSE FILTER
// ============================================================

function populateCourseFilter() {

    const select =
        document.getElementById(
            "analyticsCourseFilter"
        );

    if (!select) return;


    courses.forEach(course => {

        const option =
            document.createElement("option");

        option.value = course.id;

        option.textContent =
            course.title ||
            course.name ||
            "Untitled Course";

        select.appendChild(option);

    });


    select.addEventListener(
        "change",
        () => {

            selectedCourse =
                select.value;

            calculateAnalytics();

        }
    );

}


// ============================================================
// FILTER DATA
// ============================================================

function getFilteredCourses() {

    if (selectedCourse === "all") {
        return courses;
    }

    return courses.filter(
        course =>
            course.id === selectedCourse
    );

}


function getFilteredEnrollments() {

    if (selectedCourse === "all") {
        return enrollments;
    }

    return enrollments.filter(
        enrollment =>
            enrollment.courseId === selectedCourse
    );

}


function getFilteredAssignments() {

    if (selectedCourse === "all") {
        return assignments;
    }

    return assignments.filter(
        assignment =>
            assignment.courseId === selectedCourse
    );

}


function getFilteredSubmissions() {

    if (selectedCourse === "all") {
        return submissions;
    }

    return submissions.filter(
        submission =>
            submission.courseId === selectedCourse
    );

}


// ============================================================
// CALCULATE
// ============================================================

function calculateAnalytics() {

    const filteredCourses =
        getFilteredCourses();

    const filteredEnrollments =
        getFilteredEnrollments();

    const filteredAssignments =
        getFilteredAssignments();

    const filteredSubmissions =
        getFilteredSubmissions();


    // --------------------------------------------------------
    // STUDENTS
    // --------------------------------------------------------

    const uniqueStudents =
        new Set(
            filteredEnrollments
                .map(item =>
                    item.studentId ||
                    item.userId
                )
                .filter(Boolean)
        );


    const totalStudents =
        uniqueStudents.size;


    setText(
        "analyticsStudents",
        totalStudents
    );


    setText(
        "activeStudents",
        totalStudents
    );


    // --------------------------------------------------------
    // COMPLETION
    // --------------------------------------------------------

    const completed =
        filteredEnrollments.filter(
            enrollment =>
                enrollment.completed === true ||
                enrollment.status === "completed" ||
                Number(enrollment.progress) >= 100
        ).length;


    const completionRate =
        filteredEnrollments.length
            ? (completed /
                filteredEnrollments.length) * 100
            : 0;


    setText(
        "analyticsCompletion",
        `${getPercent(completionRate)}%`
    );


    setText(
        "completedCourses",
        completed
    );


    // --------------------------------------------------------
    // ASSIGNMENTS
    // --------------------------------------------------------

    const submitted =
        filteredSubmissions.length;


    const graded =
        filteredSubmissions.filter(
            submission =>
                submission.status === "graded" ||
                submission.graded === true ||
                submission.score !== undefined
        ).length;


    const scores =
        filteredSubmissions
            .map(item =>
                Number(item.score)
            )
            .filter(
                score =>
                    !Number.isNaN(score)
            );


    const averageScore =
        scores.length
            ? scores.reduce(
                (sum, score) =>
                    sum + score,
                0
            ) / scores.length
            : 0;


    setText(
        "submittedAssignments",
        submitted
    );


    setText(
        "assignmentSubmitted",
        submitted
    );


    setText(
        "assignmentGraded",
        graded
    );


    setText(
        "assignmentAverage",
        `${getPercent(averageScore)}%`
    );


    const progress =
        document.getElementById(
            "assignmentProgress"
        );

    if (progress) {

        progress.style.width =
            `${getPercent(averageScore)}%`;

    }


    // --------------------------------------------------------
    // ENGAGEMENT
    // --------------------------------------------------------

    const engagement =
        totalStudents > 0
            ? Math.min(
                100,
                (
                    (completed / totalStudents) * 100
                )
            )
            : 0;


    setText(
        "analyticsEngagement",
        `${getPercent(engagement)}%`
    );


    setText(
        "engagementScore",
        `${getPercent(engagement)}%`
    );


    // --------------------------------------------------------
    // EARNINGS
    // --------------------------------------------------------

    calculateEarnings();


    // --------------------------------------------------------
    // COURSE PERFORMANCE
    // --------------------------------------------------------

    renderCoursePerformance(
        filteredCourses,
        filteredEnrollments
    );


    // --------------------------------------------------------
    // COMPLETION LIST
    // --------------------------------------------------------

    renderCompletion(
        filteredCourses,
        filteredEnrollments
    );

}


// ============================================================
// COURSE PERFORMANCE
// ============================================================

function renderCoursePerformance(
    filteredCourses,
    filteredEnrollments
) {

    const container =
        document.getElementById(
            "coursePerformance"
        );

    if (!container) return;


    if (!filteredCourses.length) {

        container.innerHTML = `
            <div class="analytics-empty">
                No courses available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        filteredCourses.map(course => {

            const courseEnrollments =
                filteredEnrollments.filter(
                    item =>
                        item.courseId === course.id
                );


            const completed =
                courseEnrollments.filter(
                    item =>
                        item.completed === true ||
                        Number(item.progress) >= 100
                ).length;


            const completion =
                courseEnrollments.length
                    ? (
                        completed /
                        courseEnrollments.length
                    ) * 100
                    : 0;


            return `
                <div class="course-performance-row">

                    <div class="course-performance-info">

                        <strong>
                            ${escapeHTML(
                                course.title ||
                                course.name ||
                                "Untitled Course"
                            )}
                        </strong>

                        <span>
                            ${courseEnrollments.length}
                            students
                        </span>

                    </div>

                    <div class="course-performance-progress">

                        <div class="progress-track">

                            <div
                                class="progress-fill"
                                style="width:${getPercent(completion)}%"
                            ></div>

                        </div>

                        <strong>
                            ${getPercent(completion)}%
                        </strong>

                    </div>

                </div>
            `;

        }).join("");

}


// ============================================================
// COMPLETION
// ============================================================

function renderCompletion(
    filteredCourses,
    filteredEnrollments
) {

    const container =
        document.getElementById(
            "completionOverview"
        );

    if (!container) return;


    if (!filteredCourses.length) {

        container.innerHTML = `
            <div class="analytics-empty">
                No completion data available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        filteredCourses.map(course => {

            const records =
                filteredEnrollments.filter(
                    item =>
                        item.courseId === course.id
                );


            const completed =
                records.filter(
                    item =>
                        item.completed === true ||
                        Number(item.progress) >= 100
                ).length;


            const percent =
                records.length
                    ? (
                        completed /
                        records.length
                    ) * 100
                    : 0;


            return `
                <div class="completion-row">

                    <div>

                        <strong>
                            ${escapeHTML(
                                course.title ||
                                course.name ||
                                "Untitled Course"
                            )}
                        </strong>

                        <span>
                            ${completed}
                            of
                            ${records.length}
                            completed
                        </span>

                    </div>

                    <strong>
                        ${getPercent(percent)}%
                    </strong>

                </div>

                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${getPercent(percent)}%"
                    ></div>

                </div>
            `;

        }).join("");

}


// ============================================================
// EARNINGS
// ============================================================

function calculateEarnings() {

    const total =
        earnings.reduce(
            (sum, transaction) =>
                sum +
                Number(
                    transaction.amount ||
                    transaction.total ||
                    transaction.value ||
                    0
                ),
            0
        );


    setText(
        "analyticsEarnings",
        formatMoney(total)
    );


    setText(
        "earningsTotal",
        formatMoney(total)
    );


    const now =
        new Date();


    const month =
        earnings.filter(
            transaction => {

                const date =
                    transaction.createdAt?.toDate
                        ? transaction.createdAt.toDate()
                        : new Date(
                            transaction.createdAt ||
                            0
                        );


                return (
                    date.getMonth() ===
                    now.getMonth()
                    &&
                    date.getFullYear() ===
                    now.getFullYear()
                );

            }
        );


    const monthlyTotal =
        month.reduce(
            (sum, transaction) =>
                sum +
                Number(
                    transaction.amount ||
                    transaction.total ||
                    0
                ),
            0
        );


    setText(
        "earningsMonth",
        formatMoney(monthlyTotal)
    );


    setText(
        "earningsTransactions",
        earnings.length
    );

}


// ============================================================
// SEARCH-SAFE HTML
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
// LOADING
// ============================================================

function showLoading() {

    console.log(
        "⏳ Loading instructor analytics..."
    );

}


// ============================================================
// FALLBACK
// ============================================================

function renderFallback() {

    setText(
        "analyticsStudents",
        0
    );

    setText(
        "analyticsEngagement",
        "0%"
    );

    setText(
        "analyticsCompletion",
        "0%"
    );

    setText(
        "analyticsEarnings",
        "KSh 0"
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


// ============================================================
// BOOT
// ============================================================

initAnalyticsAuth();

refreshIcons();