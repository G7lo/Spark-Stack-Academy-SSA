// =====================================
// SPARK STACK ACADEMY
// COURSE LIBRARY ENGINE V3
// =====================================

import {
    db,
    auth
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

let allCourses = [];

let activeFilter = "all";

let searchTerm = "";

let enrollmentMap = new Map();


// =====================================
// DOM
// =====================================

const libraryCourses =
    document.getElementById("libraryCourses");

const courseSearch =
    document.getElementById("courseSearch");

const clearCourseSearch =
    document.getElementById("clearCourseSearch");

const courseLibraryCount =
    document.getElementById("courseLibraryCount");

const libraryEmptyState =
    document.getElementById("libraryEmptyState");

const libraryErrorState =
    document.getElementById("libraryErrorState");

const resetCourseFilters =
    document.getElementById("resetCourseFilters");

const retryCoursesBtn =
    document.getElementById("retryCoursesBtn");

const filterButtons =
    document.querySelectorAll(".filter-btn");

const premiumBadge =
    document.getElementById("libraryPremiumBadge");


// =====================================
// START
// =====================================

console.log(
    "🚀 SSA COURSE LIBRARY V3 LOADED"
);


document.addEventListener(
    "DOMContentLoaded",
    initializeLibrary
);


// =====================================
// INITIALIZE
// =====================================

function initializeLibrary() {

    console.log(
        "📚 Initializing Course Library..."
    );


    setupSearch();

    setupFilters();

    setupActions();


    onAuthStateChanged(
        auth,
        async user => {

            currentUser = user;

            console.log(
                "🔐 Library User:",
                user?.uid || "Guest"
            );


            if (user) {

                await loadPremiumStatus();

                await loadEnrollments();

            }

            else {

                enrollmentMap.clear();

            }


            await loadCourses();

        }
    );

}


// =====================================
// LOAD COURSES
// =====================================

async function loadCourses() {

    if (!libraryCourses) {

        console.warn(
            "⚠️ #libraryCourses not found"
        );

        return;

    }


    showLoading();


    try {

        console.log(
            "🔎 Loading courses..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "courses"
                )
            );


        allCourses = [];


        snapshot.forEach(
            courseDoc => {

                const data =
                    courseDoc.data();


                // =================================
                // PUBLISHED CHECK
                // =================================

                const published =
                    data.published === true;


                const status =
                    String(
                        data.status || ""
                    )
                    .trim()
                    .toLowerCase();


                const isPublished =
                    published ||
                    status === "published";


                if (!isPublished) {

                    return;

                }


                allCourses.push({

                    id:
                        courseDoc.id,

                    ...data

                });

            }
        );


        // =================================
        // SORT NEWEST FIRST
        // =================================

        allCourses.sort(
            (a, b) => {

                const aTime =
                    getTimestamp(
                        a.createdAt
                    );

                const bTime =
                    getTimestamp(
                        b.createdAt
                    );

                return bTime - aTime;

            }
        );


        console.log(
            "📚 Published courses:",
            allCourses.length
        );


        if (!allCourses.length) {

            showEmpty();

            return;

        }


        renderCourses();

    }

    catch (error) {

        console.error(
            "❌ COURSE LIBRARY FAILED:",
            error
        );

        showError();

    }

}


// =====================================
// LOAD ENROLLMENTS
// =====================================

async function loadEnrollments() {

    if (!currentUser) {

        enrollmentMap.clear();

        return;

    }


    try {

        console.log(
            "📦 Loading student enrollments..."
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


        const snapshot =
            await getDocs(
                enrollmentQuery
            );


        enrollmentMap.clear();


        snapshot.forEach(
            enrollmentDoc => {

                const data =
                    enrollmentDoc.data();


                if (!data.courseId) {

                    return;

                }


                if (
                    hasCourseAccess(
                        data
                    )
                ) {

                    enrollmentMap.set(
                        data.courseId,
                        {
                            id:
                                enrollmentDoc.id,

                            ...data
                        }
                    );

                }

            }
        );


        console.log(
            "✅ Accessible enrollments:",
            enrollmentMap.size
        );

    }

    catch (error) {

        console.error(
            "❌ ENROLLMENTS FAILED:",
            error
        );

        enrollmentMap.clear();

    }

}


// =====================================
// ACCESS CHECK
// =====================================

function hasCourseAccess(
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


    // =================================
    // ACTIVE / APPROVED / COMPLETED
    // =================================

    const validStatus =
        status === "active" ||
        status === "approved" ||
        status === "completed";


    // =================================
    // PAID / FREE
    // =================================

    const validPayment =
        paymentStatus === "paid" ||
        paymentStatus === "free";


    // =================================
    // FREE ENROLLMENT
    // =================================

    if (
        paymentStatus === "free" &&
        validStatus
    ) {

        return true;

    }


    // =================================
    // PAID ENROLLMENT
    // =================================

    if (
        paymentStatus === "paid" &&
        validStatus
    ) {

        return true;

    }


    return false;

}


// =====================================
// RENDER COURSES
// =====================================

function renderCourses() {

    if (!libraryCourses) {

        return;

    }


    const filteredCourses =
        getFilteredCourses();


    hideStates();


    updateCourseCount(
        filteredCourses.length
    );


    if (!filteredCourses.length) {

        libraryCourses.innerHTML = "";

        showEmpty();

        return;

    }


    libraryCourses.innerHTML = "";


    filteredCourses.forEach(
        course => {

            libraryCourses.appendChild(
                createCourseCard(course)
            );

        }
    );


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
        "library-course-card";


    const price =
        Number(
            course.price || 0
        );


    const discountPrice =
        Number(
            course.discountPrice || 0
        );


    const isFree =
        course.isFree === true ||
        price <= 0;


    const hasDiscount =
        !isFree &&
        discountPrice > 0 &&
        discountPrice < price;


    const finalPrice =
        hasDiscount
            ? discountPrice
            : price;


    const thumbnail =
        course.thumbnail ||
        "";


    const instructor =
        course.instructorName ||
        "SSA Instructor";


    const level =
        course.level ||
        "Beginner";


    const category =
        course.category ||
        "Technology";


    const duration =
        course.duration ||
        "Self-paced";


    const enrolled =
        enrollmentMap.has(
            course.id
        );


    // =================================
    // BUTTON
    // =================================

    let buttonText =
        "View Course";


    let buttonIcon =
        "arrow-right";


    if (enrolled) {

        buttonText =
            "Continue Learning";

        buttonIcon =
            "play-circle";

    }


    card.innerHTML = `

        <!-- COURSE COVER -->

        <div class="course-cover">

            ${
                thumbnail

                ? `

                    <img
                        src="${escapeHTML(thumbnail)}"
                        alt="${escapeHTML(
                            course.title ||
                            "Course"
                        )}"
                        loading="lazy"
                    >

                `

                : `

                    <div class="course-cover-placeholder">

                        <i data-lucide="book-open"></i>

                    </div>

                `
            }


            <div class="course-category">

                ${escapeHTML(category)}

            </div>


            ${
                isFree

                ? `

                    <span
                        class="course-price-badge free"
                    >

                        Free

                    </span>

                `

                : `

                    <span
                        class="course-price-badge premium"
                    >

                        Premium

                    </span>

                `
            }

        </div>


        <!-- COURSE BODY -->

        <div class="course-card-body">


            <!-- META -->

            <div class="course-card-meta">

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


            <!-- TITLE -->

            <h3>

                ${escapeHTML(
                    course.title ||
                    "Untitled Course"
                )}

            </h3>


            <!-- DESCRIPTION -->

            <p>

                ${escapeHTML(
                    course.description ||
                    "Start your learning journey with Spark Stack Academy."
                )}

            </p>


            <!-- INSTRUCTOR -->

            <div class="course-instructor">

                <div class="instructor-avatar">

                    ${escapeHTML(
                        instructor
                            .charAt(0)
                            .toUpperCase()
                    )}

                </div>


                <span>

                    ${escapeHTML(
                        instructor
                    )}

                </span>

            </div>


            <!-- FOOTER -->

            <div class="course-card-footer">


                <!-- PRICE -->

                <div class="course-price">

                    ${
                        isFree

                        ? `

                            <strong>
                                Free
                            </strong>

                        `

                        : hasDiscount

                        ? `

                            <strong>
                                KSh
                                ${formatNumber(
                                    finalPrice
                                )}
                            </strong>

                            <del>
                                KSh
                                ${formatNumber(
                                    price
                                )}
                            </del>

                        `

                        : `

                            <strong>
                                KSh
                                ${formatNumber(
                                    price
                                )}
                            </strong>

                        `
                    }

                </div>


                <!-- ACTION -->

                <button
                    type="button"
                    class="course-action"
                    data-course-id="${escapeHTML(
                        course.id
                    )}"
                >

                    <span>
                        ${buttonText}
                    </span>

                    <i
                        data-lucide="${buttonIcon}"
                    ></i>

                </button>


            </div>


        </div>

    `;


    const button =
        card.querySelector(
            ".course-action"
        );


    button?.addEventListener(
        "click",
        () => {

            openCourse(
                course.id,
                button
            );

        }
    );


    return card;

}


// =====================================
// OPEN COURSE
// =====================================

async function openCourse(
    courseId,
    button
) {

    if (!courseId) {

        return;

    }


    if (button) {

        button.disabled = true;

        button.classList.add(
            "loading"
        );

    }


    try {

        // =================================
        // GUEST
        // =================================

        if (!currentUser) {

            window.location.href =
                `course-details.html?id=${courseId}`;

            return;

        }


        // =================================
        // ALREADY ENROLLED
        // =================================

        const enrollment =
            enrollmentMap.get(
                courseId
            );


        if (enrollment) {

            console.log(
                "✅ ENROLLED:",
                courseId
            );


            window.location.href =
                `course-player.html?id=${courseId}`;

            return;

        }


        // =================================
        // NOT ENROLLED
        // =================================

        window.location.href =
            `course-details.html?id=${courseId}`;

    }

    catch (error) {

        console.error(
            "❌ COURSE NAVIGATION FAILED:",
            error
        );


        window.location.href =
            `course-details.html?id=${courseId}`;

    }

}


// =====================================
// PREMIUM BADGE
// =====================================

async function loadPremiumStatus() {

    if (
        !currentUser ||
        !premiumBadge
    ) {

        return;

    }


    try {

        const studentSnap =
            await getDoc(
                doc(
                    db,
                    "students",
                    currentUser.uid
                )
            );


        if (!studentSnap.exists()) {

            premiumBadge.hidden =
                true;

            return;

        }


        const student =
            studentSnap.data();


        premiumBadge.hidden =
            student.premium !== true;

    }

    catch (error) {

        console.error(
            "❌ PREMIUM STATUS FAILED:",
            error
        );

        premiumBadge.hidden =
            true;

    }

}


// =====================================
// SEARCH
// =====================================

function setupSearch() {

    if (!courseSearch) {

        return;

    }


    courseSearch.addEventListener(
        "input",
        () => {

            searchTerm =
                courseSearch.value
                    .trim()
                    .toLowerCase();


            if (clearCourseSearch) {

                clearCourseSearch.hidden =
                    !searchTerm;

            }


            renderCourses();

        }
    );


    clearCourseSearch?.addEventListener(
        "click",
        () => {

            courseSearch.value = "";

            searchTerm = "";

            clearCourseSearch.hidden =
                true;

            courseSearch.focus();

            renderCourses();

        }
    );

}


// =====================================
// FILTERS
// =====================================

function setupFilters() {

    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    activeFilter =
                        button.dataset.filter ||
                        "all";


                    filterButtons.forEach(
                        btn => {

                            const active =
                                btn === button;


                            btn.classList.toggle(
                                "active",
                                active
                            );


                            btn.setAttribute(
                                "aria-pressed",
                                String(active)
                            );

                        }
                    );


                    renderCourses();

                }
            );

        }
    );

}


// =====================================
// FILTER ENGINE
// =====================================

function getFilteredCourses() {

    return allCourses.filter(
        course => {

            const price =
                Number(
                    course.price || 0
                );


            const isFree =
                course.isFree === true ||
                price <= 0;


            // =================================
            // FREE
            // =================================

            if (
                activeFilter === "free" &&
                !isFree
            ) {

                return false;

            }


            // =================================
            // PREMIUM
            // =================================

            if (
                activeFilter === "paid" &&
                isFree
            ) {

                return false;

            }


            // =================================
            // SEARCH
            // =================================

            if (!searchTerm) {

                return true;

            }


            const searchableText = [

                course.title,

                course.description,

                course.category,

                course.level,

                course.instructorName

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                searchTerm
            );

        }
    );

}


// =====================================
// ACTIONS
// =====================================

function setupActions() {

    resetCourseFilters?.addEventListener(
        "click",
        resetFilters
    );


    retryCoursesBtn?.addEventListener(
        "click",
        () => {

            loadCourses();

        }
    );

}


// =====================================
// RESET FILTERS
// =====================================

function resetFilters() {

    activeFilter =
        "all";


    searchTerm =
        "";


    if (courseSearch) {

        courseSearch.value =
            "";

    }


    if (clearCourseSearch) {

        clearCourseSearch.hidden =
            true;

    }


    filterButtons.forEach(
        button => {

            const active =
                button.dataset.filter ===
                "all";


            button.classList.toggle(
                "active",
                active
            );


            button.setAttribute(
                "aria-pressed",
                String(active)
            );

        }
    );


    renderCourses();

}


// =====================================
// LOADING
// =====================================

function showLoading() {

    hideStates();


    if (!libraryCourses) {

        return;

    }


    libraryCourses.innerHTML = `

        <div class="library-state loading-card">

            <div class="state-icon">

                <i data-lucide="loader-circle"></i>

            </div>

            <h3>
                Loading courses...
            </h3>

            <p>
                Preparing your learning library.
            </p>

        </div>

    `;


    refreshIcons();

}


// =====================================
// EMPTY
// =====================================

function showEmpty() {

    hideStates();


    if (libraryCourses) {

        libraryCourses.innerHTML = "";

    }


    if (libraryEmptyState) {

        libraryEmptyState.hidden =
            false;

    }


    updateCourseCount(
        0
    );

}


// =====================================
// ERROR
// =====================================

function showError() {

    hideStates();


    if (libraryCourses) {

        libraryCourses.innerHTML =
            "";

    }


    if (libraryErrorState) {

        libraryErrorState.hidden =
            false;

    }


    updateCourseCount(
        0
    );

}


// =====================================
// HIDE STATES
// =====================================

function hideStates() {

    if (libraryEmptyState) {

        libraryEmptyState.hidden =
            true;

    }


    if (libraryErrorState) {

        libraryErrorState.hidden =
            true;

    }

}


// =====================================
// COURSE COUNT
// =====================================

function updateCourseCount(
    count
) {

    if (!courseLibraryCount) {

        return;

    }


    courseLibraryCount.textContent =
        `${count} ${
            count === 1
                ? "course"
                : "courses"
        }`;

}


// =====================================
// TIMESTAMP
// =====================================

function getTimestamp(
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
// NUMBER FORMAT
// =====================================

function formatNumber(
    number
) {

    return Number(
        number || 0
    )
        .toLocaleString(
            "en-KE"
        );

}


// =====================================
// HTML ESCAPE
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