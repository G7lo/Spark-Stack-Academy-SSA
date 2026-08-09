// ============================================
// SPARK STACK ACADEMY
// MASTERCLASS COURSE PLAYER
// course-player.js
// ============================================

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================
// STATE
// ============================================

let currentUser = null;
let course = null;
let lessons = [];

let currentLessonIndex = 0;
let completedLessons = [];


// ============================================
// COURSE ID
// ============================================

const params =
    new URLSearchParams(window.location.search);

const courseId =
    params.get("id");


// ============================================
// DOM
// ============================================

const courseLocked =
    document.getElementById("courseLocked");

const courseContent =
    document.getElementById("courseContent");

const unlockCourseBtn =
    document.getElementById("unlockCourseBtn");

const courseTitle =
    document.getElementById("courseTitle");

const courseDescription =
    document.getElementById("courseDescription");

const instructorName =
    document.getElementById("instructorName");

const instructorAvatar =
    document.getElementById("instructorAvatar");

const lessonList =
    document.getElementById("lessonList");

const lessonTitle =
    document.getElementById("lessonTitle");

const lessonDescription =
    document.getElementById("lessonDescription");

const courseProgressText =
    document.getElementById("courseProgressText");

const courseProgressBar =
    document.getElementById("courseProgressBar");

const previousLessonBtn =
    document.getElementById("previousLessonBtn");

const nextLessonBtn =
    document.getElementById("nextLessonBtn");

const completeLessonBtn =
    document.getElementById("completeLessonBtn");

const lessonNotes =
    document.getElementById("lessonNotes");

const saveNotesBtn =
    document.getElementById("saveNotesBtn");

const courseResources =
    document.getElementById("courseResources");

const classAnnouncement =
    document.getElementById("classAnnouncement");


// ============================================
// START
// ============================================

console.log("🎓 Masterclass Classroom Loaded");


// ============================================
// AUTH
// ============================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;
    }

    currentUser = user;

    console.log(
        "👨‍🎓 Student:",
        user.email
    );

    await initializeClassroom();

});


// ============================================
// INITIALIZE
// ============================================

async function initializeClassroom() {

    try {

        if (!courseId) {

            showError(
                "No course selected."
            );

            return;
        }


        // Load course
        await loadCourse();


        // Check access
        const hasAccess =
            await checkCourseAccess();


        if (!hasAccess) {

            showLockedState();

            return;
        }


        // Student has access
        showClassroom();


        // Load classroom data
        await loadLessons();

        await loadStudentProgress();

        renderLessons();

        if (lessons.length > 0) {

            showLesson(
                currentLessonIndex
            );

        }

    }

    catch (error) {

        console.error(
            "❌ Classroom initialization failed:",
            error
        );

        showError(
            "Unable to load this classroom."
        );

    }

}


// ============================================
// LOAD COURSE
// ============================================

async function loadCourse() {

    const courseRef =
        doc(
            db,
            "courses",
            courseId
        );

    const snapshot =
        await getDoc(courseRef);


    if (!snapshot.exists()) {

        throw new Error(
            "Course not found"
        );

    }


    course = {

        id: snapshot.id,

        ...snapshot.data()

    };


    console.log(
        "📚 Course:",
        course.title
    );


    // Header
    if (courseTitle) {

        courseTitle.textContent =
            course.title || "Course";

    }


    if (courseDescription) {

        courseDescription.textContent =
            course.description ||
            "Welcome to your classroom.";

    }


    // Instructor
    if (instructorName) {

        instructorName.textContent =
            course.instructorName ||
            "SSA Instructor";

    }


    if (instructorAvatar) {

        const name =
            course.instructorName ||
            "I";

        instructorAvatar.textContent =
            name.charAt(0).toUpperCase();

    }


    // Announcement
    if (classAnnouncement) {

        classAnnouncement.textContent =
            course.announcement ||
            "No announcements yet.";

    }

}


// ============================================
// CHECK COURSE ACCESS
// ============================================

async function checkCourseAccess() {

    const price =
        Number(course.price || 0);


    // ========================================
    // FREE COURSE
    // ========================================

    if (price <= 0) {

        console.log("🆓 Free course");

        return true;

    }


    // ========================================
    // CHECK STUDENT ENROLLMENT
    // ========================================

    const enrollmentRef =
        doc(
            db,
            "students",
            currentUser.uid,
            "enrollments",
            courseId
        );


    const enrollmentSnapshot =
        await getDoc(
            enrollmentRef
        );


    console.log(
        "🔎 Checking enrollment:",
        `students/${currentUser.uid}/enrollments/${courseId}`
    );


    if (!enrollmentSnapshot.exists()) {

        console.log(
            "❌ Enrollment does not exist"
        );

        return false;

    }


    const enrollment =
        enrollmentSnapshot.data();


    console.log(
        "📦 Enrollment found:",
        enrollment
    );


    // ========================================
    // VERIFY PAYMENT
    // ========================================

    if (

        enrollment.paymentStatus === "paid"

        ||

        enrollment.status === "active"

        ||

        enrollment.status === "approved"

        ||

        enrollment.status === "paid"

    ) {

        console.log(
            "✅ Course access granted"
        );

        return true;

    }


    console.log(
        "❌ Enrollment exists but payment not confirmed"
    );


    return false;

}


// ============================================
// LOCKED STATE
// ============================================

function showLockedState() {

    if (courseLocked) {

        courseLocked.style.display =
            "block";

    }


    if (courseContent) {

        courseContent.style.display =
            "none";

    }


    if (unlockCourseBtn) {

        unlockCourseBtn.onclick = () => {

            window.location.href =
                `payments.html?courseId=${courseId}`;

        };

    }


    console.log(
        "🔒 Course locked"
    );

}


// ============================================
// UNLOCK CLASSROOM
// ============================================

function showClassroom() {

    if (courseLocked) {

        courseLocked.style.display =
            "none";

    }


    if (courseContent) {

        courseContent.style.display =
            "block";

    }


    console.log(
        "🔓 Classroom unlocked"
    );

}


// ============================================
// LOAD LESSONS
// ============================================

async function loadLessons() {

    lessonList.innerHTML = "";


    // ----------------------------------------
    // Expected Firestore structure:
    //
    // courses
    //   └── courseId
    //       └── lessons[]
    //
    // ----------------------------------------

    if (
        Array.isArray(
            course.lessons
        )
    ) {

        lessons =
            course.lessons;

    }

    else {

        lessons = [];

    }


    console.log(
        "🎥 Lessons:",
        lessons.length
    );

}


// ============================================
// RENDER LESSONS
// ============================================

function renderLessons() {

    lessonList.innerHTML = "";


    if (!lessons.length) {

        lessonList.innerHTML = `

            <div class="empty-state">

                <p>
                    No lessons available yet.
                </p>

            </div>

        `;

        return;
    }


    lessons.forEach(
        (lesson, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "lesson-item";


            if (
                index ===
                currentLessonIndex
            ) {

                button.classList.add(
                    "active"
                );

            }


            if (
                completedLessons.includes(
                    index
                )
            ) {

                button.classList.add(
                    "completed"
                );

            }


            button.innerHTML = `

                <i data-lucide="${
                    completedLessons.includes(index)
                        ? "check-circle"
                        : "play-circle"
                }"></i>

                <span>
                    ${index + 1}.
                    ${lesson.title || "Lesson"}
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    showLesson(index);

                }
            );


            lessonList.appendChild(
                button
            );

        }
    );


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}


// ============================================
// SHOW LESSON
// ============================================

function showLesson(index) {

    if (
        index < 0 ||
        index >= lessons.length
    ) {

        return;
    }


    currentLessonIndex =
        index;


    const lesson =
        lessons[index];


    lessonTitle.textContent =
        lesson.title ||
        `Lesson ${index + 1}`;


    lessonDescription.textContent =
        lesson.description ||
        "";


    // ----------------------------------------
    // VIDEO
    // ----------------------------------------

    renderVideo(lesson);


    // ----------------------------------------
    // RESOURCES
    // ----------------------------------------

    renderResources(lesson);


    // ----------------------------------------
    // NOTES
    // ----------------------------------------

    loadNotes(lesson);


    // ----------------------------------------
    // BUTTONS
    // ----------------------------------------

    previousLessonBtn.disabled =
        index === 0;


    nextLessonBtn.disabled =
        index === lessons.length - 1;


    completeLessonBtn.disabled =
        completedLessons.includes(index);


    completeLessonBtn.innerHTML =
        completedLessons.includes(index)

            ? `Completed ✓`

            : `Mark Complete <i data-lucide="check"></i>`;


    updateProgress();


    renderLessons();


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}


// ============================================
// EMBED VIDEO
// ============================================

function renderVideo(lesson) {

    const videoBox =
        document.querySelector(
            ".video-box"
        );


    if (!videoBox) return;


    const url =
        lesson.videoUrl ||
        lesson.youtubeUrl ||
        "";


    if (!url) {

        videoBox.innerHTML = `

            <div class="video-placeholder">

                <i data-lucide="play-circle"></i>

                <h3>
                    Video coming soon
                </h3>

                <p>
                    This lesson does not have
                    a video yet.
                </p>

            </div>

        `;

        return;
    }


    const videoId =
        extractYouTubeId(url);


    if (!videoId) {

        videoBox.innerHTML = `

            <div class="video-placeholder">

                <h3>
                    Invalid video link
                </h3>

            </div>

        `;

        return;
    }


    videoBox.innerHTML = `

        <iframe

            src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"

            title="${lesson.title || "SSA Lesson"}"

            allow="accelerometer; autoplay; clipboard-write;
                   encrypted-media; gyroscope; picture-in-picture;
                   web-share"

            allowfullscreen>

        </iframe>

    `;

}


// ============================================
// YOUTUBE ID
// ============================================

function extractYouTubeId(url) {

    try {

        const parsed =
            new URL(url);


        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {

            return parsed.pathname
                .replace("/", "");

        }


        if (
            parsed.hostname.includes(
                "youtube.com"
            )
        ) {

            return parsed.searchParams.get(
                "v"
            );

        }

    }

    catch {

        return null;

    }


    return null;

}


// ============================================
// RESOURCES
// ============================================

function renderResources(lesson) {

    if (!courseResources) return;


    const resources =
        lesson.resources || [];


    if (!resources.length) {

        courseResources.innerHTML = `

            <p>
                No resources available.
            </p>

        `;

        return;
    }


    courseResources.innerHTML = "";


    resources.forEach(
        resource => {

            const link =
                document.createElement(
                    "a"
                );


            link.href =
                resource.url || "#";


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.className =
                "resource-item";


            link.innerHTML = `

                <span>
                    ${resource.title || "Resource"}
                </span>

                <i data-lucide="external-link"></i>

            `;


            courseResources.appendChild(
                link
            );

        }
    );


    if (window.lucide) {

        lucide.createIcons();

    }

}


// ============================================
// PROGRESS
// ============================================

function updateProgress() {

    if (!lessons.length) {

        courseProgressText.textContent =
            "0%";

        courseProgressBar.style.width =
            "0%";

        return;

    }


    const percentage =
        Math.round(

            (
                completedLessons.length /
                lessons.length
            ) * 100

        );


    courseProgressText.textContent =
        `${percentage}%`;


    courseProgressBar.style.width =
        `${percentage}%`;

}


// ============================================
// COMPLETE LESSON
// ============================================

completeLessonBtn?.addEventListener(
    "click",
    async () => {

        if (
            completedLessons.includes(
                currentLessonIndex
            )
        ) {

            return;

        }


        completedLessons.push(
            currentLessonIndex
        );


        updateProgress();

        renderLessons();

        completeLessonBtn.disabled =
            true;

        completeLessonBtn.innerHTML =
            "Completed ✓";


        await saveProgress();

    }
);


// ============================================
// NEXT
// ============================================

nextLessonBtn?.addEventListener(
    "click",
    () => {

        if (
            currentLessonIndex <
            lessons.length - 1
        ) {

            showLesson(
                currentLessonIndex + 1
            );

        }

    }
);


// ============================================
// PREVIOUS
// ============================================

previousLessonBtn?.addEventListener(
    "click",
    () => {

        if (
            currentLessonIndex > 0
        ) {

            showLesson(
                currentLessonIndex - 1
            );

        }

    }
);


// ============================================
// SAVE PROGRESS + SYNC ENROLLMENT
// ============================================

async function saveProgress() {

    try {

        const percentage =
            lessons.length
                ? Math.round(
                    (completedLessons.length / lessons.length) * 100
                )
                : 0;


        // ========================================
        // SAVE DETAILED COURSE PROGRESS
        // ========================================

        const progressRef =
            doc(
                db,
                "courseProgress",
                `${currentUser.uid}_${courseId}`
            );


        await setDoc(
            progressRef,
            {

                userId:
                    currentUser.uid,

                courseId,

                completedLessons,

                currentLesson:
                    currentLessonIndex,

                progress:
                    percentage,

                updatedAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        // ========================================
        // SYNC STUDENT ENROLLMENT
        // ========================================

        const enrollmentRef =
            doc(
                db,
                "students",
                currentUser.uid,
                "enrollments",
                courseId
            );


        await setDoc(
            enrollmentRef,
            {

                progress:
                    percentage,

                status:
                    percentage >= 100
                        ? "completed"
                        : "active",

                paymentStatus:
                    "paid",

                lastLesson:
                    currentLessonIndex,

                updatedAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        console.log(
            `💾 Progress synced: ${percentage}%`
        );

    }

    catch (error) {

        console.error(
            "❌ Progress save failed:",
            error
        );

    }

}


// ============================================
// LOAD PROGRESS
// ============================================

async function loadStudentProgress() {

    const progressRef =
        doc(
            db,
            "courseProgress",
            `${currentUser.uid}_${courseId}`
        );


    const snapshot =
        await getDoc(
            progressRef
        );


    if (
        !snapshot.exists()
    ) {

        return;

    }


    const data =
        snapshot.data();


    completedLessons =
        Array.isArray(
            data.completedLessons
        )
            ? data.completedLessons
            : [];


    currentLessonIndex =
        Number(
            data.currentLesson || 0
        );


    console.log(
        "📈 Progress loaded:",
        completedLessons
    );

}


// ============================================
// NOTES
// ============================================

async function loadNotes(lesson) {

    if (!lessonNotes) return;


    lessonNotes.value = "";


    const noteId =
        `${currentUser.uid}_${courseId}_${currentLessonIndex}`;


    const noteRef =
        doc(
            db,
            "courseNotes",
            noteId
        );


    const snapshot =
        await getDoc(
            noteRef
        );


    if (
        snapshot.exists()
    ) {

        lessonNotes.value =
            snapshot.data().notes || "";

    }

}


saveNotesBtn?.addEventListener(
    "click",
    async () => {

        try {

            const noteId =
                `${currentUser.uid}_${courseId}_${currentLessonIndex}`;


            await setDoc(

                doc(
                    db,
                    "courseNotes",
                    noteId
                ),

                {

                    userId:
                        currentUser.uid,

                    courseId,

                    lessonIndex:
                        currentLessonIndex,

                    notes:
                        lessonNotes.value,

                    updatedAt:
                        serverTimestamp()

                },

                {
                    merge: true
                }

            );


            saveNotesBtn.textContent =
                "Saved ✓";


            setTimeout(
                () => {

                    saveNotesBtn.textContent =
                        "Save Notes";

                },
                1500
            );

        }

        catch (error) {

            console.error(
                "Notes save failed:",
                error
            );

        }

    }
);


// ============================================
// ERROR
// ============================================

function showError(message) {

    if (courseContent) {

        courseContent.innerHTML = `

            <div class="course-lock-card">

                <h2>
                    Something went wrong
                </h2>

                <p>
                    ${message}
                </p>

                <button
                    class="primary-btn"
                    onclick="history.back()">

                    Go Back

                </button>

            </div>

        `;

    }

}