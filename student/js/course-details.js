// ============================================
// SPARK STACK ACADEMY
// COURSE DETAILS CONTROLLER V2
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

const params = new URLSearchParams(
    window.location.search
);

const courseId = params.get("id");

console.log("🚀 Course Details V2 Loaded");
console.log("🎯 Course ID:", courseId);


// ============================================
// DOM
// ============================================

const loading =
    document.getElementById("courseLoading");

const content =
    document.getElementById("courseDetailsContent");

const errorBox =
    document.getElementById("courseError");

const errorMessage =
    document.getElementById("courseErrorMessage");

const enrollBtn =
    document.getElementById("enrollBtn");


// ============================================
// START
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById("backBtn")
            ?.addEventListener("click", goBack);

        document
            .getElementById("errorBackBtn")
            ?.addEventListener("click", goBack);

        initialize();

    }
);


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;

        console.log(
            "👤 Current student:",
            user?.uid || "Guest"
        );

        if (!courseId) {

            showError(
                "No course was selected."
            );

            return;
        }

        await loadCourse();

    }
);


// ============================================
// INITIALIZE
// ============================================

async function initialize() {

    if (!courseId) {

        showError(
            "No course ID was provided."
        );

        return;
    }

    showLoading();

}


// ============================================
// LOAD COURSE
// ============================================

async function loadCourse() {

    try {

        showLoading();

        const courseRef = doc(
            db,
            "courses",
            courseId
        );

        const snapshot = await getDoc(
            courseRef
        );

        if (!snapshot.exists()) {

            showError(
                "This course no longer exists."
            );

            return;
        }

        course = {
            id: snapshot.id,
            ...snapshot.data()
        };

        console.log(
            "📚 COURSE:",
            course
        );

        await loadLessons();

        renderCourse();

        if (currentUser) {
            await checkEnrollment();
        } else {
            setGuestState();
        }

        showContent();

    }

    catch (error) {

        console.error(
            "❌ COURSE LOAD FAILED:",
            error
        );

        showError(
            "Unable to load this course right now."
        );

    }

}


// ============================================
// LOAD LESSONS
// ============================================
// Lessons are stored in:
// courseLessons
//
// NOT inside courses.
// ============================================

async function loadLessons() {

    lessons = [];

    try {

        const lessonsQuery = query(
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

        const snapshot = await getDocs(
            lessonsQuery
        );

        lessons = snapshot.docs.map(
            lessonDoc => ({
                id: lessonDoc.id,
                ...lessonDoc.data()
            })
        );

        lessons.sort(
            (a, b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
        );

        console.log(
            "🎥 COURSE LESSONS:",
            lessons.length
        );

    }

    catch (error) {

        console.error(
            "❌ LESSON LOAD FAILED:",
            error
        );

        lessons = [];

    }

}


// ============================================
// RENDER COURSE
// ============================================

function renderCourse() {

    setText(
        "courseTitle",
        course.title || "Untitled Course"
    );

    setText(
        "courseDescription",
        course.description ||
        "Start your learning journey with Spark Stack Academy."
    );

    setText(
        "aboutCourse",
        course.description ||
        "This course is designed to help you build practical technology skills."
    );


    // Category
    setText(
        "courseCategory",
        course.category || "Technology"
    );


    // Level
    const level =
        course.level || "Beginner";

    setText(
        "courseLevel",
        level
    );

    setText(
        "courseLevelInfo",
        level
    );


    // Instructor
    const instructor =
        course.instructorName ||
        course.instructor ||
        "Spark Stack Academy";

    setText(
        "instructorName",
        instructor
    );

    setText(
        "sideInstructorName",
        instructor
    );


    setInitial(
        "instructorAvatar",
        instructor
    );

    setInitial(
        "sideInstructorAvatar",
        instructor
    );


    // Duration
    setText(
        "courseDuration",
        course.duration
            ? formatDuration(course.duration)
            : "Self-paced"
    );


    // Students
    setText(
        "studentCount",
        Number(
            course.studentCount ??
            course.students ??
            0
        )
    );


    // Lessons
    setText(
        "lessonCount",
        lessons.length
    );


    // Price
    renderPricing();


    // Learning points
    renderLearningPoints();


    // Curriculum
    renderCurriculum();

}


// ============================================
// PRICING
// ============================================

function renderPricing() {

    const price =
        Number(course.price || 0);

    const discount =
        Number(course.discountPrice || 0);

    const isFree =
        course.isFree === true ||
        price <= 0;


    const priceElement =
        document.getElementById(
            "coursePrice"
        );

    const discountElement =
        document.getElementById(
            "discountPrice"
        );

    const freeBadge =
        document.getElementById(
            "courseFreeBadge"
        );


    if (isFree) {

        if (priceElement)
            priceElement.textContent =
                "Free";

        if (freeBadge)
            freeBadge.style.display =
                "inline-flex";

        if (discountElement)
            discountElement.style.display =
                "none";

        return;
    }


    if (
        discount > 0 &&
        discount < price
    ) {

        if (priceElement)
            priceElement.textContent =
                `KSh ${discount.toLocaleString()}`;

        if (discountElement) {

            discountElement.textContent =
                `Regular price: KSh ${price.toLocaleString()}`;

            discountElement.style.display =
                "block";

        }

        return;
    }


    if (priceElement) {

        priceElement.textContent =
            `KSh ${price.toLocaleString()}`;

    }

}


// ============================================
// LEARNING POINTS
// ============================================

function renderLearningPoints() {

    const list =
        document.getElementById(
            "learningList"
        );

    if (!list)
        return;


    const points =
        Array.isArray(course.learningPoints)
            ? course.learningPoints
            : [];


    if (!points.length) {

        list.innerHTML = `

            <li>
                <i data-lucide="check"></i>
                <span>Practical course content</span>
            </li>

            <li>
                <i data-lucide="check"></i>
                <span>Structured learning experience</span>
            </li>

            <li>
                <i data-lucide="check"></i>
                <span>Progress tracking</span>
            </li>

        `;

        refreshIcons();

        return;
    }


    list.innerHTML = points
        .map(point => `

            <li>

                <i data-lucide="check"></i>

                <span>
                    ${escapeHTML(point)}
                </span>

            </li>

        `)
        .join("");


    refreshIcons();

}


// ============================================
// CURRICULUM
// ============================================

function renderCurriculum() {

    const box =
        document.getElementById(
            "curriculumList"
        );

    if (!box)
        return;


    if (!lessons.length) {

        box.innerHTML = `

            <div class="curriculum-empty">

                <i data-lucide="book-open"></i>

                <h3>
                    Curriculum coming soon
                </h3>

                <p>
                    Lessons are being prepared by the instructor.
                </p>

            </div>

        `;

        refreshIcons();

        return;
    }


    box.innerHTML = lessons
        .map((lesson, index) => {

            const type =
                lesson.type || "lesson";

            const duration =
                lesson.duration
                    ? `${lesson.duration} min`
                    : "";

            return `

                <div class="curriculum-item">

                    <div class="lesson-number">
                        ${index + 1}
                    </div>

                    <div class="lesson-icon">

                        <i data-lucide="${
                            type === "video"
                                ? "play-circle"
                                : "file-text"
                        }"></i>

                    </div>

                    <div class="lesson-info">

                        <strong>
                            ${escapeHTML(
                                lesson.title ||
                                `Lesson ${index + 1}`
                            )}
                        </strong>

                        <span>
                            ${
                                duration ||
                                "Lesson"
                            }
                        </span>

                    </div>

                    <i
                        class="lesson-lock"
                        data-lucide="lock">
                    </i>

                </div>

            `;

        })
        .join("");


    refreshIcons();

}


// ============================================
// CHECK ENROLLMENT
// ============================================

async function checkEnrollment() {

    if (!currentUser)
        return false;


    try {

        // ----------------------------------------
        // MAIN ENROLLMENTS
        // ----------------------------------------

        const mainQuery = query(
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

        const mainSnapshot =
            await getDocs(mainQuery);


        if (!mainSnapshot.empty) {

            const enrollment =
                mainSnapshot.docs[0].data();

            console.log(
                "✅ MAIN ENROLLMENT:",
                enrollment
            );

            if (hasAccess(enrollment)) {

                setEnrolledState(
                    enrollment
                );

                return enrollment;

            }

        }


        // ----------------------------------------
        // LEGACY / FREE ENROLLMENT
        // ----------------------------------------

        const legacyRef = doc(
            db,
            "students",
            currentUser.uid,
            "enrollments",
            courseId
        );

        const legacySnapshot =
            await getDoc(legacyRef);


        if (legacySnapshot.exists()) {

            const enrollment =
                legacySnapshot.data();

            console.log(
                "✅ STUDENT ENROLLMENT:",
                enrollment
            );

            if (hasAccess(enrollment)) {

                setEnrolledState(
                    enrollment
                );

                return enrollment;

            }

        }


        setAvailableState();

        return false;

    }

    catch (error) {

        console.error(
            "❌ ENROLLMENT CHECK FAILED:",
            error
        );

        setAvailableState();

        return false;

    }

}


// ============================================
// ACCESS RULE
// ============================================

function hasAccess(enrollment) {

    return (
        enrollment.paymentStatus === "paid" ||
        enrollment.paymentStatus === "free" ||
        enrollment.status === "active" ||
        enrollment.status === "approved" ||
        enrollment.status === "paid" ||
        enrollment.status === "completed"
    );

}


// ============================================
// ENROLLMENT BUTTON
// ============================================

enrollBtn?.addEventListener(
    "click",
    async () => {

        if (!currentUser) {

            window.location.href =
                "../login.html";

            return;

        }


        if (!course) {
            return;
        }


        const price =
            Number(course.price || 0);

        const isFree =
            course.isFree === true ||
            price <= 0;


        enrollBtn.disabled = true;

        enrollBtn.innerHTML = `

            <span class="button-spinner"></span>
            Processing...

        `;


        try {

            if (isFree) {

                await enrollFree();

            } else {

                window.location.href =
                    `payments.html?courseId=${courseId}`;

            }

        }

        catch (error) {

            console.error(
                "❌ ENROLLMENT FAILED:",
                error
            );

            enrollBtn.disabled = false;

            setAvailableState();

            alert(
                "Unable to complete enrollment. Please try again."
            );

        }

    }
);


// ============================================
// FREE ENROLLMENT
// ============================================

async function enrollFree() {

    const enrollmentData = {

        userId:
            currentUser.uid,

        courseId,

        paymentStatus:
            "free",

        status:
            "active",

        progress:
            0,

        completedLessons:
            [],

        enrolledAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()

    };


    // Main enrollment
    await setDoc(
        doc(
            db,
            "enrollments",
            `${currentUser.uid}_${courseId}`
        ),
        enrollmentData,
        {
            merge: true
        }
    );


    // Legacy enrollment
    await setDoc(
        doc(
            db,
            "students",
            currentUser.uid,
            "enrollments",
            courseId
        ),
        enrollmentData,
        {
            merge: true
        }
    );


    console.log(
        "🎉 FREE COURSE ENROLLED"
    );


    setEnrolledState(
        enrollmentData
    );

}


// ============================================
// BUTTON STATES
// ============================================

function setAvailableState() {

    if (!enrollBtn)
        return;


    const price =
        Number(course?.price || 0);

    const isFree =
        course?.isFree === true ||
        price <= 0;


    enrollBtn.disabled = false;

    enrollBtn.innerHTML = `

        <i data-lucide="${
            isFree
                ? "book-open"
                : "credit-card"
        }"></i>

        ${
            isFree
                ? "Enroll for Free"
                : "Enroll Now"
        }

    `;

    setText(
        "enrollmentNote",
        isFree
            ? "Start learning instantly."
            : "Secure your place in this course."
    );

    refreshIcons();

}


function setEnrolledState(enrollment) {

    if (!enrollBtn)
        return;


    enrollBtn.disabled = false;

    enrollBtn.innerHTML = `

        <i data-lucide="play"></i>
        Start Learning

    `;


    enrollBtn.onclick = () => {

        window.location.href =
            `course-player.html?id=${courseId}`;

    };


    const progress =
        Number(
            enrollment?.progress || 0
        );


    setText(
        "enrollmentNote",
        progress > 0
            ? `${progress}% complete • Continue learning`
            : "You're enrolled. Start learning now."
    );


    refreshIcons();

}


function setGuestState() {

    if (!enrollBtn)
        return;


    enrollBtn.innerHTML = `

        <i data-lucide="log-in"></i>
        Login to Enroll

    `;


    enrollBtn.onclick = () => {

        window.location.href =
            "../login.html";

    };


    refreshIcons();

}


// ============================================
// UI STATES
// ============================================

function showLoading() {

    if (loading)
        loading.style.display =
            "flex";

    if (content)
        content.style.display =
            "none";

    if (errorBox)
        errorBox.style.display =
            "none";

}


function showContent() {

    if (loading)
        loading.style.display =
            "none";

    if (content)
        content.style.display =
            "block";

}


function showError(message) {

    if (loading)
        loading.style.display =
            "none";

    if (content)
        content.style.display =
            "none";

    if (errorBox)
        errorBox.style.display =
            "flex";

    if (errorMessage)
        errorMessage.textContent =
            message;

    refreshIcons();

}


// ============================================
// HELPERS
// ============================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element)
        element.textContent =
            value;

}


function setInitial(id, name) {

    const element =
        document.getElementById(id);

    if (!element)
        return;

    element.textContent =
        String(name || "S")
            .charAt(0)
            .toUpperCase();

}


function formatDuration(value) {

    if (typeof value === "number") {

        return `${value} hours`;

    }

    return String(value);

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

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


function goBack() {

    window.location.href =
        "course-library.html";

}