// =====================================
// SPARK STACK ACADEMY
// MY COURSES ENGINE V2
// =====================================

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================
// STATE
// =====================================

let currentUser = null;

let myCourses = [];


// =====================================
// DOM
// =====================================

const coursesContainer =
    document.getElementById(
        "coursesContainer"
    );

const enrolledCount =
    document.getElementById(
        "enrolledCount"
    );

const progressCount =
    document.getElementById(
        "progressCount"
    );

const completedCount =
    document.getElementById(
        "completedCount"
    );

const hoursCount =
    document.getElementById(
        "hoursCount"
    );

const myCoursesCount =
    document.getElementById(
        "myCoursesCount"
    );


// =====================================
// START
// =====================================

console.log(
    "🚀 SSA MY COURSES V2 LOADED"
);


document.addEventListener(
    "DOMContentLoaded",
    initializeCourses
);


// =====================================
// INITIALIZE
// =====================================

function initializeCourses() {

    console.log(
        "📚 Initializing My Courses..."
    );


    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "../login.html";

                return;

            }


            currentUser =
                user;


            console.log(
                "👨‍🎓 Student:",
                user.uid
            );


            await loadMyCourses();

        }
    );

}


// =====================================
// LOAD MY COURSES
// =====================================

async function loadMyCourses() {

    showLoading();


    try {

        console.log(
            "🔎 Loading student enrollments..."
        );


        const enrollmentQuery =
            query(

                collection(
                    db,
                    "enrollments"
                ),

                where(
                    "userId",
                    "==",
                    currentUser.uid
                )

            );


        const enrollmentSnapshot =
            await getDocs(
                enrollmentQuery
            );


        console.log(
            "📦 Enrollment documents:",
            enrollmentSnapshot.size
        );


        myCourses = [];


        // =================================
        // LOAD EACH COURSE
        // =================================

        for (
            const enrollmentDoc
            of enrollmentSnapshot.docs
        ) {

            const enrollment =
                enrollmentDoc.data();


            const courseId =
                enrollment.courseId;


            if (!courseId) {

                continue;

            }


            // -----------------------------
            // ACCESS CHECK
            // -----------------------------

            if (
                !hasAccess(
                    enrollment
                )
            ) {

                console.log(
                    "⛔ Enrollment has no access:",
                    courseId
                );

                continue;

            }


            // -----------------------------
            // COURSE DOCUMENT
            // -----------------------------

            const courseRef =
                doc(
                    db,
                    "courses",
                    courseId
                );


            const courseSnapshot =
                await getDoc(
                    courseRef
                );


            if (
                !courseSnapshot.exists()
            ) {

                console.warn(
                    "⚠️ Course document missing:",
                    courseId
                );

                continue;

            }


            const course =
                courseSnapshot.data();


            myCourses.push({

                id:
                    courseId,

                ...course,

                enrollmentId:
                    enrollmentDoc.id,

                progress:
                    Number(
                        enrollment.progress || 0
                    ),

                enrollmentStatus:
                    enrollment.status ||
                    "active",

                paymentStatus:
                    enrollment.paymentStatus ||
                    "",

                joinedAt:
                    enrollment.enrolledAt ||
                    enrollment.joinedAt ||
                    null

            });

        }


        // =================================
        // REMOVE DUPLICATES
        // =================================

        myCourses =
            removeDuplicates(
                myCourses
            );


        // =================================
        // SORT
        // =================================

        myCourses.sort(
            (a, b) => {

                const aTime =
                    getTime(
                        a.joinedAt
                    );

                const bTime =
                    getTime(
                        b.joinedAt
                    );

                return bTime - aTime;

            }
        );


        console.log(
            "🎓 My Courses:",
            myCourses
        );


        renderCourses();


        updateStats();


    }

    catch (error) {

        console.error(
            "❌ MY COURSES FAILED:",
            error
        );


        showError();

    }

}


// =====================================
// ACCESS RULE
// =====================================

function hasAccess(
    enrollment
) {

    if (!enrollment) {

        return false;

    }


    const status =
        String(
            enrollment.status || ""
        )
        .trim()
        .toLowerCase();


    const paymentStatus =
        String(
            enrollment.paymentStatus || ""
        )
        .trim()
        .toLowerCase();


    // FREE COURSE

    if (
        paymentStatus === "free" &&
        (
            status === "active" ||
            status === "approved" ||
            status === "completed"
        )
    ) {

        return true;

    }


    // PAID COURSE

    if (
        paymentStatus === "paid" &&
        (
            status === "active" ||
            status === "approved" ||
            status === "completed"
        )
    ) {

        return true;

    }


    return false;

}


// =====================================
// RENDER COURSES
// =====================================

function renderCourses() {

    if (!coursesContainer) {

        return;

    }


    if (!myCourses.length) {

        showEmpty();

        return;

    }


    coursesContainer.innerHTML =
        "";


    myCourses.forEach(
        course => {

            coursesContainer.appendChild(
                createCourseCard(
                    course
                )
            );

        }
    );


    updateCourseCount();


    refreshIcons();

}


// =====================================
// CREATE COURSE CARD
// =====================================

function createCourseCard(
    course
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "my-course-card";


    const progress =
        Math.min(
            100,
            Math.max(
                0,
                Number(
                    course.progress || 0
                )
            )
        );


    const completed =
        progress >= 100;


    const thumbnail =
        course.thumbnail ||
        "";


    const title =
        course.title ||
        "Untitled Course";


    const description =
        course.description ||
        "Continue your learning journey.";


    const instructor =
        course.instructorName ||
        "SSA Instructor";


    const category =
        course.category ||
        "Technology";


    const level =
        course.level ||
        "Beginner";


    const duration =
        course.duration ||
        "Self-paced";


    card.innerHTML = `

        <!-- COVER -->

        <div class="my-course-cover">


            ${
                thumbnail

                ? `

                    <img
                        src="${escapeHTML(thumbnail)}"
                        alt="${escapeHTML(title)}"
                        loading="lazy"
                    >

                `

                : `

                    <div class="course-cover-placeholder">

                        <i data-lucide="book-open"></i>

                    </div>

                `
            }


            <div class="course-cover-overlay">


                <span class="course-category">

                    ${escapeHTML(category)}

                </span>


                <span class="course-progress-pill">

                    ${progress}%

                </span>


            </div>


        </div>


        <!-- BODY -->

        <div class="my-course-body">


            <div class="course-meta-row">


                <span>

                    <i data-lucide="signal"></i>

                    ${escapeHTML(level)}

                </span>


                <span>

                    <i data-lucide="clock-3"></i>

                    ${escapeHTML(
                        String(duration)
                    )}

                </span>


            </div>


            <h3>

                ${escapeHTML(title)}

            </h3>


            <p>

                ${escapeHTML(description)}

            </p>


            <!-- INSTRUCTOR -->

            <div class="course-instructor-row">


                <span class="instructor-avatar">

                    ${escapeHTML(
                        instructor
                            .charAt(0)
                            .toUpperCase()
                    )}

                </span>


                <span>

                    ${escapeHTML(
                        instructor
                    )}

                </span>

            </div>


            <!-- PROGRESS -->

            <div class="course-progress-block">


                <div class="progress-label">


                    <span>

                        ${
                            completed
                                ? "Course completed"
                                : "Your progress"
                        }

                    </span>


                    <strong>

                        ${progress}%

                    </strong>


                </div>


                <div class="progress-track">


                    <span
                        class="progress-fill"
                        style="width:${progress}%"
                    ></span>


                </div>


            </div>


            <!-- ACTION -->

            <button
                type="button"
                class="continue-course-btn"
                data-course-id="${escapeHTML(course.id)}"
            >

                <span>

                    ${
                        completed
                            ? "Review Course"
                            : "Continue Learning"
                    }

                </span>


                <i
                    data-lucide="${
                        completed
                            ? "rotate-ccw"
                            : "arrow-right"
                    }"
                ></i>

            </button>


        </div>

    `;


    const button =
        card.querySelector(
            ".continue-course-btn"
        );


    button?.addEventListener(
        "click",
        () => {

            window.location.href =
                `course-player.html?id=${course.id}`;

        }
    );


    return card;

}


// =====================================
// STATS
// =====================================

function updateStats() {

    const enrolled =
        myCourses.length;


    let inProgress =
        0;


    let completed =
        0;


    let totalHours =
        0;


    myCourses.forEach(
        course => {

            const progress =
                Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            course.progress || 0
                        )
                    )
                );


            if (
                progress >= 100
            ) {

                completed++;

            }

            else if (
                progress > 0
            ) {

                inProgress++;

            }


            totalHours +=
                getCourseHours(
                    course.duration
                );

        }
    );


    if (enrolledCount) {

        enrolledCount.textContent =
            enrolled;

    }


    if (progressCount) {

        progressCount.textContent =
            inProgress;

    }


    if (completedCount) {

        completedCount.textContent =
            completed;

    }


    if (hoursCount) {

        hoursCount.textContent =
            formatHours(
                totalHours
            );

    }


    updateCourseCount();

}


// =====================================
// COURSE COUNT
// =====================================

function updateCourseCount() {

    if (!myCoursesCount) {

        return;

    }


    const count =
        myCourses.length;


    myCoursesCount.textContent =
        `${count} ${
            count === 1
                ? "course"
                : "courses"
        }`;

}


// =====================================
// DURATION → HOURS
// =====================================

function getCourseHours(
    duration
) {

    if (
        typeof duration ===
        "number"
    ) {

        return duration;

    }


    const value =
        String(
            duration || ""
        )
        .toLowerCase();


    const number =
        parseFloat(
            value
        );


    if (
        Number.isNaN(number)
    ) {

        return 0;

    }


    if (
        value.includes("week")
    ) {

        return number * 5;

    }


    if (
        value.includes("minute")
    ) {

        return number / 60;

    }


    return number;

}


// =====================================
// FORMAT HOURS
// =====================================

function formatHours(
    hours
) {

    if (!hours) {

        return "0h";

    }


    if (
        hours < 1
    ) {

        return `${Math.round(
            hours * 60
        )}m`;

    }


    return `${Math.round(
        hours
    )}h`;

}


// =====================================
// EMPTY
// =====================================

function showEmpty() {

    if (!coursesContainer) {

        return;

    }


    coursesContainer.innerHTML = `

        <div class="courses-state empty-state">


            <div class="state-icon">

                <i data-lucide="book-open"></i>

            </div>


            <h3>

                No Courses Yet

            </h3>


            <p>

                You haven't enrolled in any courses yet.
                Explore the library and start learning.

            </p>


            <a
                href="course-library.html"
                class="primary-btn"
            >

                <i data-lucide="compass"></i>

                Explore Courses

            </a>


        </div>

    `;


    updateStats();

    refreshIcons();

}


// =====================================
// LOADING
// =====================================

function showLoading() {

    if (!coursesContainer) {

        return;

    }


    coursesContainer.innerHTML = `

        <div class="courses-state loading-state">


            <div class="state-icon">

                <i data-lucide="loader-circle"></i>

            </div>


            <h3>

                Loading your courses...

            </h3>


            <p>

                Preparing your learning dashboard.

            </p>


        </div>

    `;


    refreshIcons();

}


// =====================================
// ERROR
// =====================================

function showError() {

    if (!coursesContainer) {

        return;

    }


    coursesContainer.innerHTML = `

        <div class="courses-state error-state">


            <div class="state-icon">

                <i data-lucide="triangle-alert"></i>

            </div>


            <h3>

                Couldn't load your courses

            </h3>


            <p>

                Something went wrong while loading
                your classroom.

            </p>


            <button
                type="button"
                class="primary-btn"
                id="retryCourses"
            >

                <i data-lucide="refresh-cw"></i>

                Try Again

            </button>


        </div>

    `;


    document
        .getElementById("retryCourses")
        ?.addEventListener(
            "click",
            loadMyCourses
        );


    refreshIcons();

}


// =====================================
// REMOVE DUPLICATES
// =====================================

function removeDuplicates(
    courses
) {

    const map =
        new Map();


    courses.forEach(
        course => {

            if (
                !map.has(
                    course.id
                )
            ) {

                map.set(
                    course.id,
                    course
                );

            }

        }
    );


    return Array.from(
        map.values()
    );

}


// =====================================
// TIMESTAMP
// =====================================

function getTime(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    if (
        typeof value === "number"
    ) {

        return value;

    }


    return 0;

}


// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


// =====================================
// ICONS
// =====================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
            "function"
    ) {

        window.lucide.createIcons();

    }

}