// =====================================
// SPARK STACK ACADEMY
// LEARNING PROGRESS
// learning-progress.js
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
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("📊 Learning Progress Loaded");


// =====================================
// DOM
// =====================================

const totalCourses =
    document.getElementById("totalCourses");

const activeCourses =
    document.getElementById("activeCourses");

const completedCourses =
    document.getElementById("completedCourses");

const overallProgress =
    document.getElementById("overallProgress");

const completedLessons =
    document.getElementById("completedLessons");

const certificatesEarned =
    document.getElementById("certificatesEarned");

const learningStreak =
    document.getElementById("learningStreak");

const courseProgressList =
    document.getElementById("courseProgressList");

const progressMessage =
    document.getElementById("progressMessage");


// =====================================
// AUTH
// =====================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }

        await loadLearningProgress(user.uid);

    }
);


// =====================================
// LOAD EVERYTHING
// =====================================

async function loadLearningProgress(userId) {

    try {

        console.time("Learning Progress");


        const enrollmentsRef =
            collection(
                db,
                "students",
                userId,
                "enrollments"
            );


        const snapshot =
            await getDocs(enrollmentsRef);


        courseProgressList.innerHTML = "";


        if (snapshot.empty) {

            showEmptyState();

            updateStats(0, 0, 0, 0, 0);

            return;

        }


        let totalProgress = 0;

        let active = 0;

        let completed = 0;

        let lessonsDone = 0;


        for (
            const enrollmentDoc
            of snapshot.docs
        ) {

            const enrollment =
                enrollmentDoc.data();


            const courseId =
                enrollment.courseId ||
                enrollmentDoc.id;


            // -------------------------
            // COURSE DATA
            // -------------------------

            let course = {};


            try {

                const courseSnap =
                    await getDoc(
                        doc(
                            db,
                            "courses",
                            courseId
                        )
                    );


                if (courseSnap.exists()) {

                    course =
                        courseSnap.data();

                }

            }
            catch (error) {

                console.warn(
                    "Course lookup failed:",
                    courseId,
                    error
                );

            }


            // -------------------------
            // PROGRESS
            // -------------------------

            let progress =
                Number(
                    enrollment.progress || 0
                );


            progress =
                Math.max(
                    0,
                    Math.min(
                        100,
                        progress
                    )
                );


            const completedLessonList =
                Array.isArray(
                    enrollment.completedLessons
                )
                    ? enrollment.completedLessons
                    : [];


            lessonsDone +=
                completedLessonList.length;


            totalProgress += progress;


            if (progress >= 100) {

                completed++;

            }
            else {

                active++;

            }


            renderCourseProgress({

                courseId,

                course,

                enrollment,

                progress,

                completedLessonCount:
                    completedLessonList.length

            });

        }


        const courseCount =
            snapshot.size;


        const averageProgress =
            courseCount
                ? Math.round(
                    totalProgress /
                    courseCount
                )
                : 0;


        updateStats(
            courseCount,
            active,
            completed,
            averageProgress,
            lessonsDone
        );


        await loadCertificates(userId);

        loadLearningStreak(
            snapshot.docs
        );


        console.timeEnd(
            "Learning Progress"
        );

    }


    catch (error) {

        console.error(
            "❌ Learning progress failed:",
            error
        );


        showErrorState();

    }

}


// =====================================
// COURSE CARD
// =====================================

function renderCourseProgress({

    courseId,
    course,
    enrollment,
    progress,
    completedLessonCount

}) {

    const card =
        document.createElement("div");


    card.className =
        "course-progress-card";


    const courseTitle =
        course.title ||
        enrollment.courseTitle ||
        enrollment.courseName ||
        "Untitled Course";


    const totalLessons =
        Number(
            course.totalLessons ||
            course.lessonCount ||
            enrollment.totalLessons ||
            0
        );


    const lessonText =
        totalLessons > 0

            ? `${completedLessonCount} / ${totalLessons} lessons`

            : `${completedLessonCount} lessons completed`;


    const completed =
        progress >= 100;


    card.innerHTML = `

        <div class="course-progress-top">

            <div class="course-progress-info">

                <h3>
                    ${escapeHTML(courseTitle)}
                </h3>

                <p>
                    ${completed
                        ? "Course completed 🎉"
                        : "Keep going — you're making progress."
                    }
                </p>

            </div>


            <div class="course-progress-percent">

                ${progress}%

            </div>

        </div>


        <div class="progress-bar">

            <div
                class="progress-bar-fill"
                style="width:${progress}%"
            ></div>

        </div>


        <div class="course-progress-bottom">

            <span>
                ${lessonText}
            </span>


            <button
                class="continue-learning-btn"
                data-course-id="${courseId}"
            >

                ${completed
                    ? "Review Course"
                    : "Continue Learning"
                }

            </button>

        </div>

    `;


    const button =
        card.querySelector(
            ".continue-learning-btn"
        );


    button?.addEventListener(
        "click",
        () => {

            window.location.href =
                `course-player.html?courseId=${encodeURIComponent(courseId)}`;

        }
    );


    courseProgressList.appendChild(card);

}


// =====================================
// STATS
// =====================================

function updateStats(
    courses,
    active,
    completed,
    progress,
    lessons
) {

    totalCourses.textContent =
        courses;

    activeCourses.textContent =
        active;

    completedCourses.textContent =
        completed;

    overallProgress.textContent =
        `${progress}%`;

    completedLessons.textContent =
        lessons;

}


// =====================================
// CERTIFICATES
// =====================================

async function loadCertificates(userId) {

    try {

        const certificatesRef =
            collection(
                db,
                "certificates"
            );


        const snapshot =
            await getDocs(
                certificatesRef
            );


        let count = 0;


        snapshot.forEach(
            (certificateDoc) => {

                const data =
                    certificateDoc.data();


                if (
                    data.studentId ===
                    userId
                ) {

                    count++;

                }

            }
        );


        certificatesEarned.textContent =
            count;

    }

    catch (error) {

        console.warn(
            "Certificate count failed:",
            error
        );


        certificatesEarned.textContent =
            "0";

    }

}


// =====================================
// LEARNING STREAK
// =====================================

function loadLearningStreak(
    enrollmentDocs
) {

    const dates = [];


    enrollmentDocs.forEach(
        (enrollmentDoc) => {

            const data =
                enrollmentDoc.data();


            const date =
                data.lastAccessed ||
                data.updatedAt ||
                data.joinedAt;


            if (!date) return;


            if (
                typeof date.toDate ===
                "function"
            ) {

                dates.push(
                    date.toDate()
                );

            }

        }
    );


    if (!dates.length) {

        learningStreak.textContent =
            "0 days";

        return;

    }


    // Basic activity streak.
    // More advanced daily activity
    // tracking can be added later.

    const uniqueDays =
        new Set(
            dates.map(
                date =>
                    date.toISOString()
                        .split("T")[0]
            )
        );


    learningStreak.textContent =
        `${uniqueDays.size} days`;

}


// =====================================
// EMPTY STATE
// =====================================

function showEmptyState() {

    courseProgressList.innerHTML = `

        <div class="progress-loading">

            <i data-lucide="book-open"></i>

            <p>
                You haven't enrolled in any courses yet.
            </p>

        </div>

    `;


    progressMessage.style.display =
        "flex";


    if (window.lucide) {

        lucide.createIcons();

    }

}


// =====================================
// ERROR STATE
// =====================================

function showErrorState() {

    courseProgressList.innerHTML = `

        <div class="progress-loading">

            <i data-lucide="alert-circle"></i>

            <p>
                Unable to load your learning progress.
            </p>

        </div>

    `;


    if (window.lucide) {

        lucide.createIcons();

    }

}


// =====================================
// HTML SAFETY
// =====================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}