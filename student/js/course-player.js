// ============================================================
// SPARK STACK ACADEMY
// MASTERCLASS COURSE PLAYER V2
// ============================================================

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
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let course = null;
let lessons = [];

let currentLessonIndex = 0;
let completedLessons = [];


// ============================================================
// COURSE ID
// ============================================================

const params = new URLSearchParams(
    window.location.search
);

const courseId = params.get("id");


// ============================================================
// DOM
// ============================================================

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

const videoBox =
    document.querySelector(".video-box");


// ============================================================
// START
// ============================================================

console.log(
    "🎓 SSA MASTERCLASS COURSE PLAYER V2 LOADED"
);


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(auth, async user => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;
    }

    currentUser = user;

    console.log(
        "👨‍🎓 Student:",
        user.uid
    );

    await initializeClassroom();

});


// ============================================================
// INITIALIZE
// ============================================================

async function initializeClassroom() {

    try {

        if (!courseId) {

            showError(
                "No course was selected."
            );

            return;
        }


        await loadCourse();


        const access =
            await checkCourseAccess();


        if (!access) {

            showLockedState();

            return;
        }


        showClassroom();


        await loadLessons();


        await loadStudentProgress();


        renderLessons();


        if (lessons.length) {

            showLesson(
                currentLessonIndex
            );

        } else {

            showNoLessons();

        }

    }

    catch (error) {

        console.error(
            "❌ CLASSROOM ERROR:",
            error
        );

        showError(
            "We couldn't load this classroom."
        );

    }

}


// ============================================================
// LOAD COURSE
// ============================================================

async function loadCourse() {

    const ref =
        doc(
            db,
            "courses",
            courseId
        );

    const snap =
        await getDoc(ref);

    if (!snap.exists()) {

        throw new Error(
            "Course not found."
        );

    }

    course = {
        id: snap.id,
        ...snap.data()
    };


    console.log(
        "📚 COURSE:",
        course
    );


    if (courseTitle) {

        courseTitle.textContent =
            course.title ||
            "Course";

    }


    if (courseDescription) {

        courseDescription.textContent =
            course.description ||
            "Welcome to your classroom.";

    }


    if (instructorName) {

        instructorName.textContent =
            course.instructorName ||
            "SSA Instructor";

    }


    if (instructorAvatar) {

        const name =
            course.instructorName ||
            "S";

        instructorAvatar.textContent =
            name.charAt(0).toUpperCase();

    }


    if (classAnnouncement) {

        classAnnouncement.textContent =
            course.announcement ||
            "No announcements yet.";

    }

}


// ============================================================
// CHECK ACCESS
// ============================================================

async function checkCourseAccess() {

    const price =
        Number(course.price || 0);

    const isFree =
        course.isFree === true ||
        price <= 0;

    if (isFree) {

        console.log(
            "🆓 FREE COURSE"
        );

        return true;

    }


    // --------------------------------------------------------
    // MAIN ENROLLMENTS
    // --------------------------------------------------------

    try {

        const q =
            query(
                collection(
                    db,
                    "enrollments"
                ),
                where(
                    "userId",
                    "==",
                    currentUser.uid
                ),
                where(
                    "courseId",
                    "==",
                    courseId
                )
            );


        const snap =
            await getDocs(q);


        if (!snap.empty) {

            const enrollment =
                snap.docs[0].data();

            if (
                enrollment.paymentStatus === "paid" ||
                enrollment.status === "active" ||
                enrollment.status === "approved" ||
                enrollment.status === "paid"
            ) {

                return true;

            }

        }

    }

    catch (error) {

        console.warn(
            "Enrollment collection check failed:",
            error
        );

    }


    // --------------------------------------------------------
    // LEGACY / FREE ENROLLMENT PATH
    // --------------------------------------------------------

    const legacyRef =
        doc(
            db,
            "students",
            currentUser.uid,
            "enrollments",
            courseId
        );


    const legacySnap =
        await getDoc(
            legacyRef
        );


    if (legacySnap.exists()) {

        const enrollment =
            legacySnap.data();

        if (
            enrollment.paymentStatus === "paid" ||
            enrollment.paymentStatus === "free" ||
            enrollment.status === "active" ||
            enrollment.status === "approved" ||
            enrollment.status === "paid"
        ) {

            return true;

        }

    }


    return false;

}


// ============================================================
// LOCKED STATE
// ============================================================

function showLockedState() {

    if (courseLocked)
        courseLocked.style.display = "block";

    if (courseContent)
        courseContent.style.display = "none";


    if (unlockCourseBtn) {

        unlockCourseBtn.onclick = () => {

            window.location.href =
                `payments.html?courseId=${courseId}`;

        };

    }

}


// ============================================================
// CLASSROOM
// ============================================================

function showClassroom() {

    if (courseLocked)
        courseLocked.style.display = "none";

    if (courseContent)
        courseContent.style.display = "block";

}


// ============================================================
// LOAD LESSONS
// IMPORTANT: courseLessons collection
// ============================================================

async function loadLessons() {

    console.log(
        "🔎 Loading courseLessons..."
    );

    lessons = [];


    const q =
        query(
            collection(
                db,
                "courseLessons"
            ),
            where(
                "courseId",
                "==",
                courseId
            )
        );


    const snap =
        await getDocs(q);


    console.log(
        `📦 Found ${snap.size} course lessons`
    );


    snap.forEach(docSnap => {

        const data =
            docSnap.data();


        lessons.push({

            id:
                docSnap.id,

            ...data

        });

    });


    // --------------------------------------------------------
    // SORT BY ORDER
    // --------------------------------------------------------

    lessons.sort(
        (a, b) =>
            Number(a.order ?? 0) -
            Number(b.order ?? 0)
    );


    console.log(
        "🎯 LESSONS:",
        lessons
    );

}


// ============================================================
// RENDER LESSON LIST
// ============================================================

function renderLessons() {

    if (!lessonList)
        return;


    lessonList.innerHTML = "";


    if (!lessons.length) {

        showNoLessons();

        return;

    }


    lessons.forEach(
        (lesson, index) => {

            const completed =
                completedLessons.includes(
                    lesson.id
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "lesson-item";


            if (
                index === currentLessonIndex
            ) {

                button.classList.add(
                    "active"
                );

            }


            if (completed) {

                button.classList.add(
                    "completed"
                );

            }


            button.innerHTML = `

                <span class="lesson-number">
                    ${
                        completed
                            ? "✓"
                            : index + 1
                    }
                </span>

                <span class="lesson-info">

                    <strong>
                        ${
                            lesson.title ||
                            `Lesson ${index + 1}`
                        }
                    </strong>

                    <small>
                        ${
                            lesson.duration
                                ? lesson.duration + " min"
                                : lesson.type || "Lesson"
                        }
                    </small>

                </span>

                <i data-lucide="${
                    completed
                        ? "check-circle"
                        : "play-circle"
                }"></i>

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


    refreshIcons();

}


// ============================================================
// SHOW LESSON
// ============================================================

async function showLesson(index) {

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


    console.log(
        "🎬 CURRENT LESSON:",
        lesson
    );


    if (lessonTitle) {

        lessonTitle.textContent =
            lesson.title ||
            `Lesson ${index + 1}`;

    }


    if (lessonDescription) {

        lessonDescription.textContent =
            lesson.description ||
            "";

    }


    renderVideo(
        lesson
    );


    renderResources(
        lesson
    );


    await loadNotes(
        lesson
    );


    updateNavigation();

    updateProgress();

    renderLessons();

    refreshIcons();


    // Save current lesson
    saveProgress(false);

}


// ============================================================
// VIDEO ENGINE
// ============================================================

function renderVideo(lesson) {

    if (!videoBox)
        return;


    const youtubeId =
        lesson.youtubeId ||
        extractYouTubeId(
            lesson.videoUrl ||
            lesson.youtubeUrl ||
            ""
        );


    const directVideo =
        lesson.videoUrl &&
        !youtubeId;


    // --------------------------------------------------------
    // YOUTUBE
    // --------------------------------------------------------

    if (youtubeId) {

        videoBox.innerHTML = `

            <div class="video-frame-wrapper">

                <iframe
                    id="lessonVideo"
                    src="https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1"
                    title="${escapeHTML(
                        lesson.title ||
                        "SSA Lesson"
                    )}"
                    allow="
                        accelerometer;
                        autoplay;
                        clipboard-write;
                        encrypted-media;
                        gyroscope;
                        picture-in-picture;
                        web-share
                    "
                    allowfullscreen>
                </iframe>

                <button
                    class="video-fullscreen-btn"
                    id="fullscreenVideoBtn"
                    type="button"
                    title="Fullscreen">

                    <i data-lucide="maximize"></i>

                    Fullscreen

                </button>

            </div>

        `;


        setupFullscreenButton();

        refreshIcons();

        return;

    }


    // --------------------------------------------------------
    // DIRECT VIDEO
    // --------------------------------------------------------

    if (directVideo) {

        videoBox.innerHTML = `

            <div class="video-frame-wrapper">

                <video
                    id="lessonVideo"
                    class="lesson-video"
                    controls
                    playsinline
                    preload="metadata">

                    <source
                        src="${escapeAttribute(
                            lesson.videoUrl
                        )}">

                    Your browser does not support
                    video playback.

                </video>

                <button
                    class="video-fullscreen-btn"
                    id="fullscreenVideoBtn"
                    type="button">

                    <i data-lucide="maximize"></i>

                    Fullscreen

                </button>

            </div>

        `;


        setupFullscreenButton();

        refreshIcons();

        return;

    }


    // --------------------------------------------------------
    // NO VIDEO
    // --------------------------------------------------------

    videoBox.innerHTML = `

        <div class="video-placeholder">

            <div class="video-placeholder-icon">
                <i data-lucide="play-circle"></i>
            </div>

            <h3>
                Lesson content ready
            </h3>

            <p>
                This lesson does not have a video yet.
                Start with the lesson content below.
            </p>

        </div>

    `;


    refreshIcons();

}


// ============================================================
// FULLSCREEN
// ============================================================

function setupFullscreenButton() {

    const button =
        document.getElementById(
            "fullscreenVideoBtn"
        );


    const frame =
        document.querySelector(
            ".video-frame-wrapper"
        );


    if (!button || !frame)
        return;


    button.onclick = async () => {

        try {

            if (
                document.fullscreenElement
            ) {

                await document.exitFullscreen();

                return;

            }


            if (
                frame.requestFullscreen
            ) {

                await frame.requestFullscreen();

            }

        }

        catch (error) {

            console.warn(
                "Fullscreen unavailable:",
                error
            );

        }

    };

}


// ============================================================
// YOUTUBE ID
// ============================================================

function extractYouTubeId(url) {

    if (!url)
        return null;


    try {

        const parsed =
            new URL(url);


        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {

            return parsed.pathname
                .replace(
                    "/",
                    ""
                );

        }


        if (
            parsed.hostname.includes(
                "youtube.com"
            )
        ) {

            return (
                parsed.searchParams.get(
                    "v"
                ) ||
                parsed.pathname
                    .split("/")
                    .pop()
            );

        }

    }

    catch {

        return null;

    }


    return null;

}


// ============================================================
// RESOURCES
// ============================================================

function renderResources(lesson) {

    if (!courseResources)
        return;


    const resources =
        Array.isArray(
            lesson.resources
        )
            ? lesson.resources
            : [];


    if (!resources.length) {

        courseResources.innerHTML = `

            <div class="resource-empty">

                <i data-lucide="folder-open"></i>

                <p>
                    No learning resources for this lesson yet.
                </p>

            </div>

        `;

        refreshIcons();

        return;

    }


    courseResources.innerHTML = "";


    resources.forEach(resource => {

        const link =
            document.createElement(
                "a"
            );


        link.className =
            "resource-item";


        link.href =
            resource.url || "#";


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.innerHTML = `

            <span>

                <i data-lucide="file-text"></i>

                <strong>
                    ${
                        resource.title ||
                        "Learning Resource"
                    }
                </strong>

            </span>

            <i data-lucide="external-link"></i>

        `;


        courseResources.appendChild(
            link
        );

    });


    refreshIcons();

}


// ============================================================
// NAVIGATION
// ============================================================

function updateNavigation() {

    if (previousLessonBtn) {

        previousLessonBtn.disabled =
            currentLessonIndex === 0;

    }


    if (nextLessonBtn) {

        nextLessonBtn.disabled =
            currentLessonIndex ===
            lessons.length - 1;

    }


    if (completeLessonBtn) {

        const completed =
            completedLessons.includes(
                lessons[currentLessonIndex]?.id
            );


        completeLessonBtn.disabled =
            completed;


        completeLessonBtn.innerHTML =
            completed
                ? "Completed ✓"
                : `
                    Mark Complete
                    <i data-lucide="check"></i>
                  `;

    }

}


// ============================================================
// NEXT
// ============================================================

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


// ============================================================
// PREVIOUS
// ============================================================

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


// ============================================================
// COMPLETE LESSON
// ============================================================

completeLessonBtn?.addEventListener(
    "click",
    async () => {

        if (!lessons.length)
            return;


        const lesson =
            lessons[currentLessonIndex];


        if (
            completedLessons.includes(
                lesson.id
            )
        ) {

            return;

        }


        completedLessons.push(
            lesson.id
        );


        updateProgress();

        renderLessons();

        updateNavigation();

        await saveProgress(true);


        // Automatically move forward
        if (
            currentLessonIndex <
            lessons.length - 1
        ) {

            setTimeout(
                () => {

                    showLesson(
                        currentLessonIndex + 1
                    );

                },
                500
            );

        }

    }
);


// ============================================================
// PROGRESS
// ============================================================

function updateProgress() {

    if (
        !courseProgressText ||
        !courseProgressBar
    ) {

        return;

    }


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


// ============================================================
// SAVE PROGRESS
// ============================================================

async function saveProgress(showMessage = false) {

    if (!currentUser || !courseId)
        return;


    try {

        const percentage =
            lessons.length
                ? Math.round(
                    (
                        completedLessons.length /
                        lessons.length
                    ) * 100
                )
                : 0;


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

                currentLessonId:
                    lessons[currentLessonIndex]?.id || null,

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


        // ----------------------------------------------------
        // MAIN ENROLLMENT
        // ----------------------------------------------------

        try {

            const q =
                query(
                    collection(
                        db,
                        "enrollments"
                    ),
                    where(
                        "userId",
                        "==",
                        currentUser.uid
                    ),
                    where(
                        "courseId",
                        "==",
                        courseId
                    )
                );


            const snap =
                await getDocs(q);


            if (!snap.empty) {

                await setDoc(
                    snap.docs[0].ref,
                    {

                        progress:
                            percentage,

                        lastLesson:
                            lessons[currentLessonIndex]?.id || null,

                        status:
                            percentage >= 100
                                ? "completed"
                                : "active",

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            }

        }

        catch (error) {

            console.warn(
                "Enrollment progress update failed:",
                error
            );

        }


        // ----------------------------------------------------
        // LEGACY ENROLLMENT
        // ----------------------------------------------------

        await setDoc(
            doc(
                db,
                "students",
                currentUser.uid,
                "enrollments",
                courseId
            ),
            {

                progress:
                    percentage,

                lastLesson:
                    lessons[currentLessonIndex]?.id || null,

                status:
                    percentage >= 100
                        ? "completed"
                        : "active",

                updatedAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        if (showMessage) {

            showToast(
                percentage >= 100
                    ? "Course completed 🎉"
                    : "Lesson completed ✓"
            );

        }

    }

    catch (error) {

        console.error(
            "❌ PROGRESS SAVE FAILED:",
            error
        );

    }

}


// ============================================================
// LOAD PROGRESS
// ============================================================

async function loadStudentProgress() {

    const ref =
        doc(
            db,
            "courseProgress",
            `${currentUser.uid}_${courseId}`
        );


    const snap =
        await getDoc(ref);


    if (!snap.exists()) {

        completedLessons = [];
        currentLessonIndex = 0;

        return;

    }


    const data =
        snap.data();


    completedLessons =
        Array.isArray(
            data.completedLessons
        )
            ? data.completedLessons
            : [];


    // --------------------------------------------------------
    // Prefer lesson ID
    // --------------------------------------------------------

    if (data.currentLessonId) {

        const found =
            lessons.findIndex(
                lesson =>
                    lesson.id ===
                    data.currentLessonId
            );


        if (found >= 0) {

            currentLessonIndex =
                found;

            return;

        }

    }


    currentLessonIndex =
        Number(
            data.currentLesson || 0
        );


    if (
        currentLessonIndex < 0 ||
        currentLessonIndex >= lessons.length
    ) {

        currentLessonIndex = 0;

    }

}


// ============================================================
// NOTES
// ============================================================

async function loadNotes(lesson) {

    if (!lessonNotes)
        return;


    lessonNotes.value = "";


    if (!currentUser)
        return;


    const noteId =
        `${currentUser.uid}_${courseId}_${lesson.id}`;


    const ref =
        doc(
            db,
            "courseNotes",
            noteId
        );


    const snap =
        await getDoc(ref);


    if (snap.exists()) {

        lessonNotes.value =
            snap.data().notes || "";

    }

}


// ============================================================
// SAVE NOTES
// ============================================================

saveNotesBtn?.addEventListener(
    "click",
    async () => {

        if (!lessonNotes)
            return;


        const lesson =
            lessons[currentLessonIndex];


        if (!lesson)
            return;


        try {

            const noteId =
                `${currentUser.uid}_${courseId}_${lesson.id}`;


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

                    lessonId:
                        lesson.id,

                    notes:
                        lessonNotes.value,

                    updatedAt:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


            saveNotesBtn.innerHTML =
                "Saved ✓";


            setTimeout(
                () => {

                    saveNotesBtn.innerHTML = `
                        <i data-lucide="save"></i>
                        Save Notes
                    `;

                    refreshIcons();

                },
                1500
            );

        }

        catch (error) {

            console.error(
                "❌ NOTES ERROR:",
                error
            );

        }

    }
);


// ============================================================
// NO LESSONS
// ============================================================

function showNoLessons() {

    if (lessonList) {

        lessonList.innerHTML = `

            <div class="empty-state">

                <i data-lucide="book-open"></i>

                <h3>
                    Lessons Coming Soon
                </h3>

                <p>
                    Your instructor hasn't published
                    lessons for this course yet.
                </p>

            </div>

        `;

    }


    if (lessonTitle) {

        lessonTitle.textContent =
            "No lesson selected";

    }


    if (lessonDescription) {

        lessonDescription.textContent =
            "Lessons will appear here once published.";

    }


    renderVideo({});

    updateProgress();

    refreshIcons();

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    if (!courseContent)
        return;


    courseContent.innerHTML = `

        <div class="course-error-state">

            <div class="error-icon">

                <i data-lucide="circle-alert"></i>

            </div>

            <h2>
                Something went wrong
            </h2>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                class="primary-btn"
                onclick="history.back()">

                Go Back

            </button>

        </div>

    `;


    refreshIcons();

}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    let toast =
        document.getElementById(
            "ssaCourseToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "ssaCourseToast";

        toast.className =
            "ssa-course-toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


// ============================================================
// SECURITY HELPERS
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

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