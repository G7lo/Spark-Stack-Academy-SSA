// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR DASHBOARD V2
// DASHBOARD ENGINE
// ============================================================

import { db } from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let instructor = null;


// ============================================================
// DOM HELPER
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// BOOT
// ============================================================

async function initDashboard() {

    try {

        await waitForInstructor();

        instructor = window.currentInstructor;

        if (!instructor) {

            console.warn(
                "Instructor dashboard: instructor not available."
            );

            return;
        }


        setInstructorName();

        await Promise.allSettled([

            loadCourses(),

            loadStudents(),

            loadAssignments(),

            loadEarnings(),

            loadRecentActivity()

        ]);


        refreshIcons();


        console.log(
            "✓ Instructor dashboard loaded"
        );

    } catch (error) {

        console.error(
            "Instructor dashboard failed:",
            error
        );

    }

}


// ============================================================
// WAIT FOR APP SHELL AUTH
// ============================================================

function waitForInstructor() {

    return new Promise(resolve => {

        let attempts = 0;

        const maxAttempts = 100;

        const timer = setInterval(() => {

            attempts++;


            if (window.currentInstructor) {

                clearInterval(timer);

                resolve();

                return;

            }


            if (attempts >= maxAttempts) {

                clearInterval(timer);

                resolve();

            }

        }, 100);

    });

}


// ============================================================
// INSTRUCTOR NAME
// ============================================================

function setInstructorName() {

    const name =
        instructor.displayName ||
        instructor.name ||
        instructor.email?.split("@")[0] ||
        "Instructor";


    setText(
        "instructorName",
        name
    );


    // Supports the current HTML if the
    // welcome heading contains a separate span.

    const welcomeName =
        $("instructorWelcomeName");

    if (welcomeName) {

        welcomeName.textContent =
            name;

    }

}


// ============================================================
// COURSES
// ============================================================

async function loadCourses() {

    try {

        const coursesRef =
            collection(
                db,
                "courses"
            );


        const q =
            query(
                coursesRef,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        const courses =
            snapshot.docs.map(course => ({

                id: course.id,

                ...course.data()

            }));


        const publishedCourses =
            courses.filter(course =>

                course.status === "published" ||
                course.published === true

            );


        // CURRENT HTML ID

        setText(
            "statCourses",
            publishedCourses.length
        );


        renderCourses(
            courses
        );


    } catch (error) {

        console.error(
            "Failed to load courses:",
            error
        );


        setText(
            "statCourses",
            "0"
        );

    }

}


// ============================================================
// COURSE LIST
// ============================================================

function renderCourses(courses) {

    const container =
        $("courseList");


    if (!container) return;


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
                    id="dashboardCreateCourse"
                    type="button"
                >

                    <i data-lucide="plus"></i>

                    Create Course

                </button>

            </div>

        `;


        const button =
            $("dashboardCreateCourse");


        button?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "course-builder.html";

            }
        );


        refreshIcons();

        return;

    }


    const recent =
        courses.slice(0, 5);


    container.innerHTML =
        recent.map(course => {

            const title =
                escapeHTML(
                    course.title ||
                    course.name ||
                    "Untitled Course"
                );


            const status =
                String(
                    course.status ||
                    (course.published
                        ? "Published"
                        : "Draft")
                );


            const students =
                Number(
                    course.studentCount ||
                    course.studentsCount ||
                    0
                );


            return `

                <article class="course-item">

                    <div class="course-item-icon">

                        <i data-lucide="book-open"></i>

                    </div>


                    <div class="course-item-info">

                        <h3>
                            ${title}
                        </h3>

                        <p>
                            ${escapeHTML(status)}
                            · ${students} students
                        </p>

                    </div>


                    <a
                        href="courses.html?id=${encodeURIComponent(course.id)}"
                        class="course-item-action"
                        aria-label="Open course"
                    >

                        <i data-lucide="arrow-up-right"></i>

                    </a>

                </article>

            `;

        }).join("");


    refreshIcons();

}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

    try {

        const enrollmentRef =
            collection(
                db,
                "enrollments"
            );


        const q =
            query(
                enrollmentRef,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        const enrollments =
            snapshot.docs.map(enrollment => ({

                id: enrollment.id,

                ...enrollment.data()

            }));


        const uniqueStudents =
            new Set();


        enrollments.forEach(enrollment => {

            if (enrollment.studentId) {

                uniqueStudents.add(
                    enrollment.studentId
                );

            }

        });


        setText(
            "statStudents",
            uniqueStudents.size
        );


        renderStudentActivity(
            enrollments
        );


    } catch (error) {

        console.error(
            "Failed to load students:",
            error
        );


        setText(
            "statStudents",
            "0"
        );

    }

}


// ============================================================
// STUDENT ACTIVITY
// ============================================================

function renderStudentActivity(
    enrollments
) {

    const container =
        $("activityList");


    if (!container) return;


    if (!enrollments.length) {

        container.innerHTML = `

            <div class="empty-activity">

                <i data-lucide="users"></i>

                <p>
                    Student activity will appear here.
                </p>

            </div>

        `;


        refreshIcons();

        return;

    }


    const recent =
        enrollments.slice(0, 5);


    container.innerHTML =
        recent.map(enrollment => {

            const name =
                escapeHTML(
                    enrollment.studentName ||
                    enrollment.name ||
                    "Student"
                );


            return `

                <div class="activity-item">

                    <div class="activity-icon">

                        <i data-lucide="user-plus"></i>

                    </div>


                    <div class="activity-content">

                        <h4>
                            ${name}
                        </h4>

                        <p>
                            Recently enrolled
                        </p>

                    </div>

                </div>

            `;

        }).join("");


    refreshIcons();

}


// ============================================================
// ASSIGNMENTS / COMPLETIONS
// ============================================================

async function loadAssignments() {

    try {

        const assignmentRef =
            collection(
                db,
                "assignments"
            );


        const q =
            query(
                assignmentRef,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        let completions = 0;


        snapshot.forEach(doc => {

            const data =
                doc.data();


            if (
                data.status === "completed" ||
                data.status === "graded" ||
                data.completed === true
            ) {

                completions++;

            }

        });


        setText(
            "statCompletions",
            completions
        );


    } catch (error) {

        console.error(
            "Failed to load completions:",
            error
        );


        setText(
            "statCompletions",
            "0"
        );

    }

}


// ============================================================
// EARNINGS
// ============================================================

async function loadEarnings() {

    try {

        const earningsRef =
            collection(
                db,
                "instructorEarnings"
            );


        const q =
            query(
                earningsRef,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        let total = 0;


        snapshot.forEach(doc => {

            const data =
                doc.data();


            total += Number(
                data.amount ||
                data.total ||
                data.earnings ||
                0
            );

        });


        setText(
            "statEarnings",
            formatCurrency(total)
        );


    } catch (error) {

        console.error(
            "Failed to load earnings:",
            error
        );


        setText(
            "statEarnings",
            "KSh 0"
        );

    }

}


// ============================================================
// RECENT ACTIVITY
// ============================================================

async function loadRecentActivity() {

    const container =
        $("activityList");


    if (!container) return;


    try {

        const activityRef =
            collection(
                db,
                "instructorActivity"
            );


        const q =
            query(
                activityRef,

                where(
                    "instructorId",
                    "==",
                    instructor.uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(5)
            );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            return;

        }


        container.innerHTML =
            snapshot.docs.map(doc => {

                const data =
                    doc.data();


                return `

                    <div class="activity-item">

                        <div class="activity-icon">

                            <i data-lucide="activity"></i>

                        </div>


                        <div class="activity-content">

                            <h4>
                                ${escapeHTML(
                                    data.title ||
                                    "Instructor activity"
                                )}
                            </h4>

                            <p>
                                ${escapeHTML(
                                    data.description ||
                                    "Recent activity"
                                )}
                            </p>

                        </div>

                    </div>

                `;

            }).join("");


        refreshIcons();


    } catch (error) {

        // Activity is optional.
        // Do not break the dashboard.

        console.warn(
            "Activity feed unavailable:",
            error
        );

    }

}


// ============================================================
// BUTTON ACTIONS
// ============================================================

function setupDashboardActions() {

    const createCourseBtn =
        $("createCourseBtn");


    const emptyCreateCourseBtn =
        $("emptyCreateCourseBtn");


    const viewStudentsBtn =
        $("viewStudentsBtn");


    createCourseBtn?.addEventListener(
        "click",
        () => {

            window.location.href =
                "course-builder.html";

        }
    );


    emptyCreateCourseBtn?.addEventListener(
        "click",
        () => {

            window.location.href =
                "course-builder.html";

        }
    );


    viewStudentsBtn?.addEventListener(
        "click",
        () => {

            window.location.href =
                "students.html";

        }
    );


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


                    const routes = {

                        lesson:
                            "lessons.html",

                        assignment:
                            "assignments.html",

                        quiz:
                            "quizzes.html",

                        announcement:
                            "announcements.html"

                    };


                    if (routes[action]) {

                        window.location.href =
                            routes[action];

                    }

                }
            );

        });

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
// CURRENCY
// ============================================================

function formatCurrency(
    amount
) {

    return new Intl.NumberFormat(
        "en-KE",
        {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0
        }
    ).format(amount);

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

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
// START AFTER DOM
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setupDashboardActions();

            initDashboard();

        }
    );

} else {

    setupDashboardActions();

    initDashboard();

}