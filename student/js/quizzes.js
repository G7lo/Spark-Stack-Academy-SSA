// ============================================================
// SPARK STACK ACADEMY
// STUDENT PORTAL
// QUIZZES ENGINE V2
// ============================================================

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


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let currentStudent = null;

let enrolledCourses = [];
let quizzes = [];
let attempts = [];


// ============================================================
// HELPERS
// ============================================================

const $ = id =>
    document.getElementById(id);


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons === "function"
    ) {

        window.lucide.createIcons();

    }

}


function showLoading() {

    const container = $("quizList");

    if (!container) return;

    container.innerHTML = `

        <div class="quiz-loading">

            <div class="quiz-loading-icon">
                <i data-lucide="loader-circle"></i>
            </div>

            <h3>Preparing your quizzes</h3>

            <p>
                Loading your personalized learning challenges...
            </p>

        </div>

    `;

    refreshIcons();

}


function showEmpty(message) {

    const container = $("quizList");

    if (!container) return;

    container.innerHTML = `

        <div class="quiz-empty">

            <div class="quiz-empty-icon">

                <i data-lucide="file-question"></i>

            </div>

            <h3>
                No quizzes found
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

    refreshIcons();

}


// ============================================================
// BOOT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        showLoading();

        setupFilters();

        onAuthStateChanged(
            auth,
            async user => {

                if (!user) {

                    window.location.href =
                        "../login.html";

                    return;

                }

                currentUser = user;

                try {

                    await loadStudentData();

                    await loadCourses();

                    await loadQuizzes();

                    await loadAttempts();

                    updateOverview();

                    renderQuizzes();

                }

                catch (error) {

                    console.error(
                        "❌ QUIZZES V2 FAILED:",
                        error
                    );

                    showEmpty(
                        "We couldn't load your quizzes. Please try again."
                    );

                }

            }
        );

    }
);


// ============================================================
// STUDENT DATA
// ============================================================

async function loadStudentData() {

    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(studentRef);


    if (!snapshot.exists()) {

        currentStudent = {
            id: currentUser.uid,
            xp: 0,
            level: 1
        };

        return;

    }


    currentStudent = {

        id:
            snapshot.id,

        ...snapshot.data()

    };

}


// ============================================================
// LOAD ENROLLED COURSES
// ============================================================

async function loadCourses() {

    enrolledCourses = [];


    const enrollmentRef =
        collection(
            db,
            "enrollments"
        );


    // --------------------------------------------------------
    // Support both existing SSA enrollment field names
    // --------------------------------------------------------

    let snapshots = [];


    try {

        const userQuery =
            query(
                enrollmentRef,
                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );

        const userSnap =
            await getDocs(userQuery);

        snapshots =
            [...userSnap.docs];

    }

    catch (error) {

        console.warn(
            "userId enrollment query failed:",
            error
        );

    }


    try {

        const studentQuery =
            query(
                enrollmentRef,
                where(
                    "studentId",
                    "==",
                    currentUser.uid
                )
            );

        const studentSnap =
            await getDocs(studentQuery);

        snapshots =
            [
                ...snapshots,
                ...studentSnap.docs
            ];

    }

    catch (error) {

        console.warn(
            "studentId enrollment query failed:",
            error
        );

    }


    // --------------------------------------------------------
    // Remove duplicate enrollment documents
    // --------------------------------------------------------

    const uniqueEnrollments =
        new Map();


    snapshots.forEach(
        item => {

            uniqueEnrollments.set(
                item.id,
                item
            );

        }
    );


    // --------------------------------------------------------
    // Get active enrollments only
    // --------------------------------------------------------

    const courseIds =
        new Set();


    uniqueEnrollments.forEach(
        enrollment => {

            const data =
                enrollment.data();


            const active =
                data.status === "active" ||
                data.status === "approved" ||
                data.status === "completed";


            const paid =
                data.paymentStatus === "paid" ||
                data.paymentStatus === "free";


            if (
                active ||
                paid
            ) {

                if (data.courseId) {

                    courseIds.add(
                        data.courseId
                    );

                }

            }

        }
    );


    // --------------------------------------------------------
    // Load courses
    // --------------------------------------------------------

    for (
        const courseId of courseIds
    ) {

        const courseRef =
            doc(
                db,
                "courses",
                courseId
            );


        const courseSnap =
            await getDoc(courseRef);


        if (
            !courseSnap.exists()
        ) {

            continue;

        }


        const course =
            courseSnap.data();


        const published =
            course.published === true ||
            String(
                course.status || ""
            ).toLowerCase() === "published";


        if (!published) {

            continue;

        }


        enrolledCourses.push({

            id:
                courseSnap.id,

            ...course

        });

    }


    console.log(
        "🎓 Enrolled courses:",
        enrolledCourses.length
    );

}


// ============================================================
// LOAD QUIZZES
// ============================================================

async function loadQuizzes() {

    quizzes = [];


    if (
        !enrolledCourses.length
    ) {

        return;

    }


    const quizCollection =
        collection(
            db,
            "quizzes"
        );


    // --------------------------------------------------------
    // ONLY QUERY QUIZZES FOR ENROLLED COURSE IDS
    // --------------------------------------------------------

    for (
        const course
        of enrolledCourses
    ) {

        const quizQuery =
            query(
                quizCollection,
                where(
                    "courseId",
                    "==",
                    course.id
                )
            );


        const snapshot =
            await getDocs(
                quizQuery
            );


        snapshot.docs.forEach(
            quizDoc => {

                const data =
                    quizDoc.data();


                const published =
                    data.published === true ||
                    String(
                        data.status || ""
                    ).toLowerCase() ===
                        "published";


                if (!published) {

                    return;

                }


                quizzes.push({

                    id:
                        quizDoc.id,

                    ...data,

                    courseTitle:
                        course.title ||
                        "Untitled Course"

                });

            }
        );

    }


    // --------------------------------------------------------
    // REMOVE DUPLICATES
    // --------------------------------------------------------

    const unique =
        new Map();


    quizzes.forEach(
        quiz => {

            unique.set(
                quiz.id,
                quiz
            );

        }
    );


    quizzes =
        Array.from(
            unique.values()
        );


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    quizzes.sort(
        (a, b) => {

            const courseCompare =
                String(
                    a.courseTitle || ""
                ).localeCompare(
                    String(
                        b.courseTitle || ""
                    )
                );


            if (
                courseCompare !== 0
            ) {

                return courseCompare;

            }


            return (
                Number(
                    a.order || 0
                ) -
                Number(
                    b.order || 0
                )
            );

        }
    );


    console.log(
        "🧠 Available quizzes:",
        quizzes.length
    );

}


// ============================================================
// LOAD ATTEMPTS
// ============================================================

async function loadAttempts() {

    attempts = [];


    const ref =
        collection(
            db,
            "quizSubmissions"
        );


    const q =
        query(
            ref,
            where(
                "studentId",
                "==",
                currentUser.uid
            )
        );


    const snapshot =
        await getDocs(q);


    attempts =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


}


// ============================================================
// QUIZ ATTEMPTS
// ============================================================

function getQuizAttempts(
    quizId
) {

    return attempts.filter(
        attempt =>
            attempt.quizId ===
            quizId
    );

}


// ============================================================
// ATTEMPT LIMIT
// ============================================================

function getAttemptLimit(index) {

    if (index === 0)
        return 3;

    if (index === 1)
        return 2;

    return 1;

}


// ============================================================
// COMPLETION
// ============================================================

function isQuizCompleted(
    quizId
) {

    return attempts.some(
        attempt => {

            return (
                attempt.quizId === quizId &&
                (
                    attempt.completed === true ||
                    attempt.status === "completed" ||
                    attempt.status === "graded"
                )
            );

        }
    );

}


// ============================================================
// COURSE QUIZZES
// ============================================================

function getCourseQuizzes(
    courseId
) {

    return quizzes
        .filter(
            quiz =>
                quiz.courseId ===
                courseId
        )
        .sort(
            (a, b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
        );

}


// ============================================================
// UNLOCK LOGIC
// ============================================================

function isQuizUnlocked(
    quiz,
    index,
    courseQuizzes
) {

    if (
        index === 0
    ) {

        return true;

    }


    const previousQuiz =
        courseQuizzes[
            index - 1
        ];


    if (!previousQuiz) {

        return false;

    }


    return isQuizCompleted(
        previousQuiz.id
    );

}


// ============================================================
// QUIZ STATE
// ============================================================

function getQuizState(
    quiz,
    index,
    courseQuizzes
) {

    const quizAttempts =
        getQuizAttempts(
            quiz.id
        );


    const limit =
        getAttemptLimit(
            index
        );


    const used =
        quizAttempts.length;


    const remaining =
        Math.max(
            limit - used,
            0
        );


    const completed =
        isQuizCompleted(
            quiz.id
        );


    const unlocked =
        isQuizUnlocked(
            quiz,
            index,
            courseQuizzes
        );


    if (completed) {

        return {

            type:
                "completed",

            label:
                "Completed",

            icon:
                "check-circle-2",

            disabled:
                false,

            remaining,

            limit

        };

    }


    if (!unlocked) {

        return {

            type:
                "locked",

            label:
                "Locked",

            icon:
                "lock",

            disabled:
                true,

            remaining,

            limit

        };

    }


    if (
        remaining <= 0
    ) {

        return {

            type:
                "attempts",

            label:
                "No Attempts Left",

            icon:
                "ban",

            disabled:
                true,

            remaining: 0,

            limit

        };

    }


    return {

        type:
            "available",

        label:
            "Start Quiz",

        icon:
            "play",

        disabled:
            false,

        remaining,

        limit

    };

}


// ============================================================
// OVERVIEW
// ============================================================

function updateOverview() {

    const total =
        quizzes.length;


    const completed =
        quizzes.filter(
            quiz =>
                isQuizCompleted(
                    quiz.id
                )
        ).length;


    const unlocked =
        quizzes.filter(
            quiz => {

                const courseQuizzes =
                    getCourseQuizzes(
                        quiz.courseId
                    );


                const index =
                    courseQuizzes.findIndex(
                        item =>
                            item.id ===
                            quiz.id
                    );


                return isQuizUnlocked(
                    quiz,
                    index,
                    courseQuizzes
                );

            }
        ).length;


    const xp =
        Number(
            currentStudent?.xp || 0
        );


    if ($("totalQuizzes")) {

        $("totalQuizzes").textContent =
            total;

    }


    if ($("completedQuizzes")) {

        $("completedQuizzes").textContent =
            completed;

    }


    if ($("unlockedQuizzes")) {

        $("unlockedQuizzes").textContent =
            unlocked;

    }


    if ($("quizXP")) {

        $("quizXP").textContent =
            `${xp} XP`;

    }


    if ($("quizCount")) {

        $("quizCount").textContent =
            `${total} ${
                total === 1
                    ? "quiz"
                    : "quizzes"
            }`;

    }


    populateCourseFilter();

}


// ============================================================
// COURSE FILTER
// ============================================================

function populateCourseFilter() {

    const select =
        $("courseFilter");


    if (!select)
        return;


    select.innerHTML = `

        <option value="all">
            All Courses
        </option>

    `;


    enrolledCourses.forEach(
        course => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                course.id;


            option.textContent =
                course.title ||
                "Untitled Course";


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// RENDER
// ============================================================

function renderQuizzes() {

    const container =
        $("quizList");


    if (!container)
        return;


    if (
        !quizzes.length
    ) {

        showEmpty(
            enrolledCourses.length
                ? "Your instructors haven't published any quizzes for your enrolled courses yet."
                : "Enroll in a course to unlock its quizzes."
        );

        return;

    }


    let html = "";


    enrolledCourses.forEach(
        course => {

            const courseQuizzes =
                getCourseQuizzes(
                    course.id
                );


            if (
                !courseQuizzes.length
            ) {

                return;

            }


            html += `

                <section
                    class="course-quiz-group"
                    data-course-group="${escapeHTML(course.id)}"
                >

                    <div class="course-quiz-header">

                        <div>

                            <span>
                                YOUR COURSE
                            </span>

                            <h2>
                                ${escapeHTML(
                                    course.title ||
                                    "Untitled Course"
                                )}
                            </h2>

                        </div>

                        <span class="quiz-course-count">

                            ${courseQuizzes.length}
                            ${
                                courseQuizzes.length === 1
                                    ? " Quiz"
                                    : " Quizzes"
                            }

                        </span>

                    </div>


                    <div class="quiz-list">

            `;


            courseQuizzes.forEach(
                (quiz, index) => {

                    const state =
                        getQuizState(
                            quiz,
                            index,
                            courseQuizzes
                        );


                    html +=
                        renderQuizCard(
                            quiz,
                            index,
                            state
                        );

                }
            );


            html += `

                    </div>

                </section>

            `;

        }
    );


    container.innerHTML =
        html;


    bindQuizButtons();

    applyFilters();

    refreshIcons();

}


// ============================================================
// QUIZ CARD
// ============================================================

function renderQuizCard(
    quiz,
    index,
    state
) {

    const attemptsText =
        state.type === "completed"
            ? "Quiz completed"
            : state.type === "locked"
                ? "Complete the previous quiz"
                : `${state.remaining} of ${state.limit} attempts left`;


    const lessonText =
        quiz.lessonName ||
        quiz.lessonTitle ||
        (
            quiz.lessonId
                ? "Lesson Quiz"
                : quiz.moduleId
                    ? "Module Quiz"
                    : "Course Quiz"
        );


    return `

        <article
            class="quiz-card quiz-${state.type}"
            data-quiz-id="${escapeHTML(quiz.id)}"
            data-course-id="${escapeHTML(quiz.courseId)}"
        >

            <div class="quiz-card-number">

                ${index + 1}

            </div>


            <div class="quiz-card-icon">

                <i data-lucide="${state.icon}"></i>

            </div>


            <div class="quiz-card-content">

                <div class="quiz-card-top">

                    <span class="quiz-type">

                        ${
                            quiz.lessonId
                                ? "LESSON QUIZ"
                                : quiz.moduleId
                                    ? "MODULE QUIZ"
                                    : "COURSE QUIZ"
                        }

                    </span>


                    <span class="quiz-status ${state.type}">

                        <i data-lucide="${state.icon}"></i>

                        ${state.label}

                    </span>

                </div>


                <h3>

                    ${escapeHTML(
                        quiz.title ||
                        "Untitled Quiz"
                    )}

                </h3>


                <p>

                    ${escapeHTML(
                        quiz.description ||
                        "Test your knowledge and continue your learning journey."
                    )}

                </p>


                <div class="quiz-card-meta">

                    <span>

                        <i data-lucide="list-checks"></i>

                        ${
                            quiz.questionCount ||
                            0
                        }
                        Questions

                    </span>


                    <span>

                        <i data-lucide="clock-3"></i>

                        ${
                            quiz.duration ||
                            0
                        }
                        min

                    </span>


                    <span>

                        <i data-lucide="target"></i>

                        Pass ${
                            quiz.passingScore ||
                            0
                        }%

                    </span>

                </div>


                <div class="quiz-card-footer">

                    <span class="attempt-info">

                        <i data-lucide="rotate-ccw"></i>

                        ${attemptsText}

                    </span>


                    ${
                        quiz.lessonId
                            ? `
                                <span class="quiz-location">

                                    <i data-lucide="book-open"></i>

                                    ${escapeHTML(
                                        lessonText
                                    )}

                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="quiz-card-action">

                <button
                    type="button"
                    class="quiz-start-btn"
                    data-start-quiz="${escapeHTML(quiz.id)}"
                    ${
                        state.disabled
                            ? "disabled"
                            : ""
                    }
                >

                    ${
                        state.type === "available"
                            ? `
                                Start
                                <i data-lucide="arrow-right"></i>
                            `
                            : state.type === "completed"
                                ? `
                                    Review
                                    <i data-lucide="eye"></i>
                                `
                                : `
                                    <i data-lucide="lock"></i>
                                `
                    }

                </button>

            </div>

        </article>

    `;

}


// ============================================================
// BUTTON EVENTS
// ============================================================

function bindQuizButtons() {

    document
        .querySelectorAll(
            "[data-start-quiz]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const quizId =
                            button.dataset.startQuiz;


                        if (!quizId)
                            return;


                        const quiz =
                            quizzes.find(
                                item =>
                                    item.id === quizId
                            );


                        if (!quiz)
                            return;


                        const courseQuizzes =
                            getCourseQuizzes(
                                quiz.courseId
                            );


                        const index =
                            courseQuizzes.findIndex(
                                item =>
                                    item.id === quizId
                            );


                        const state =
                            getQuizState(
                                quiz,
                                index,
                                courseQuizzes
                            );


                        if (
                            state.disabled
                        ) {

                            return;

                        }


                        window.location.href =
                            `take-quiz.html?quizId=${
                                encodeURIComponent(
                                    quizId
                                )
                            }`;

                    }
                );

            }
        );

}


// ============================================================
// FILTERS
// ============================================================

function setupFilters() {

    const search =
        $("quizSearch");


    const courseFilter =
        $("courseFilter");


    const statusFilter =
        $("statusFilter");


    search?.addEventListener(
        "input",
        applyFilters
    );


    courseFilter?.addEventListener(
        "change",
        applyFilters
    );


    statusFilter?.addEventListener(
        "change",
        applyFilters
    );

}


function applyFilters() {

    const search =
        (
            $("quizSearch")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const course =
        $("courseFilter")?.value ||
        "all";


    const status =
        $("statusFilter")?.value ||
        "all";


    let visible =
        0;


    document
        .querySelectorAll(
            ".quiz-card"
        )
        .forEach(
            card => {

                const text =
                    card.textContent
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    text.includes(search);


                const matchesCourse =
                    course === "all" ||
                    card.dataset.courseId ===
                        course;


                const matchesStatus =
                    status === "all" ||
                    card.classList.contains(
                        `quiz-${status}`
                    );


                const show =
                    matchesSearch &&
                    matchesCourse &&
                    matchesStatus;


                card.style.display =
                    show
                        ? ""
                        : "none";


                if (show) {

                    visible++;

                }

            }
        );


    document
        .querySelectorAll(
            ".course-quiz-group"
        )
        .forEach(
            group => {

                const visibleCards =
                    group.querySelectorAll(
                        ".quiz-card:not([style*='display: none'])"
                    );


                group.style.display =
                    visibleCards.length
                        ? ""
                        : "none";

            }
        );


    const empty =
        $("quizEmpty");


    if (empty) {

        empty.classList.toggle(
            "hidden",
            visible !== 0
        );

    }


    if ($("quizCount")) {

        $("quizCount").textContent =
            `${visible} ${
                visible === 1
                    ? "quiz"
                    : "quizzes"
            }`;

    }

}


// ============================================================
// FINAL
// ============================================================

console.log(
    "%cSSA Quizzes V2 Ready 🧠",
    "color:#2979FF;font-size:16px;font-weight:700;"
);