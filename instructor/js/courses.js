// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR COURSES
// COURSE MANAGEMENT ENGINE
// ============================================================

import {
    db
} from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let instructor = null;
let courses = [];
let currentFilter = "all";
let editingCourseId = null;


// ============================================================
// HELPERS
// ============================================================

const $ = id => document.getElementById(id);

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// BOOT
// ============================================================

async function initCourses() {

    try {

        await waitForInstructor();

        instructor =
            window.currentInstructor;

        if (!instructor) {

            console.error(
                "Instructor authentication unavailable."
            );

            return;

        }


        createCourseModal();

        setupEvents();

        await loadCourses();

        await loadStudentCount();

        refreshIcons();


        console.log(
            "✓ Instructor courses loaded"
        );


    } catch (error) {

        console.error(
            "Courses engine error:",
            error
        );

    }

}


// ============================================================
// WAIT FOR INSTRUCTOR
// ============================================================

function waitForInstructor() {

    return new Promise(resolve => {

        let attempts = 0;

        const timer = setInterval(() => {

            attempts++;

            if (window.currentInstructor) {

                clearInterval(timer);

                resolve();

                return;

            }

            if (attempts >= 100) {

                clearInterval(timer);

                resolve();

            }

        }, 100);

    });

}


// ============================================================
// LOAD COURSES
// ============================================================

async function loadCourses() {

    const grid =
        $("courseGrid");

    try {

        const coursesRef =
            collection(db, "courses");


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


        courses =
            snapshot.docs.map(item => ({

                id: item.id,

                ...item.data()

            }));


        updateStats();

        renderCourses();


    } catch (error) {

        console.error(
            "Failed to load courses:",
            error
        );


        if (grid) {

            grid.innerHTML = `

                <div class="course-error">

                    <i data-lucide="alert-circle"></i>

                    <h3>
                        Unable to load courses
                    </h3>

                    <p>
                        Please refresh and try again.
                    </p>

                </div>

            `;

        }

        refreshIcons();

    }

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const published =
        courses.filter(course =>
            course.status === "published"
        );

    const drafts =
        courses.filter(course =>
            course.status !== "published"
        );


    setText(
        "totalCourses",
        courses.length
    );


    setText(
        "publishedCourses",
        published.length
    );


    setText(
        "draftCourses",
        drafts.length
    );

}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudentCount() {

    try {

        const ref =
            collection(
                db,
                "enrollments"
            );


        const q =
            query(
                ref,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        const students =
            new Set();


        snapshot.forEach(item => {

            const data =
                item.data();


            if (data.studentId) {

                students.add(
                    data.studentId
                );

            }

        });


        setText(
            "totalStudents",
            students.size
        );


    } catch (error) {

        console.warn(
            "Student count unavailable:",
            error
        );

    }

}


// ============================================================
// RENDER COURSES
// ============================================================

function renderCourses() {

    const grid =
        $("courseGrid");

    const empty =
        $("courseEmpty");

    if (!grid) return;


    const search =
        ($("courseSearch")?.value || "")
            .trim()
            .toLowerCase();


    let filtered =
        courses.filter(course => {

            const status =
                course.status === "published"
                    ? "published"
                    : "draft";


            const matchesFilter =
                currentFilter === "all" ||
                currentFilter === status;


            const title =
                String(
                    course.title || ""
                ).toLowerCase();


            const description =
                String(
                    course.description || ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                title.includes(search) ||
                description.includes(search);


            return (
                matchesFilter &&
                matchesSearch
            );

        });


    if (!filtered.length) {

        grid.innerHTML = "";

        empty?.classList.remove("hidden");

        refreshIcons();

        return;

    }


    empty?.classList.add("hidden");


    grid.innerHTML =
        filtered.map(renderCourseCard).join("");


    refreshIcons();


    grid
        .querySelectorAll("[data-edit-course]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editCourse(
                        button.dataset.editCourse
                    );

                }
            );

        });


    grid
        .querySelectorAll("[data-delete-course]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCourse(
                        button.dataset.deleteCourse
                    );

                }
            );

        });

}


// ============================================================
// COURSE CARD
// ============================================================

function renderCourseCard(course) {

    const published =
        course.status === "published";


    const price =
        Number(course.price || 0);


    const discount =
        Number(course.discountPrice || 0);


    const displayPrice =
        discount > 0
            ? discount
            : price;


    const priceHTML =
        course.isFree || displayPrice <= 0

            ? `<strong class="course-price">
                    FREE
               </strong>`

            : `

                <strong class="course-price">
                    KSh ${formatNumber(displayPrice)}
                </strong>

                ${
                    discount > 0 && price > discount

                    ? `
                        <del>
                            KSh ${formatNumber(price)}
                        </del>
                    `

                    : ""
                }

            `;


    return `

        <article class="course-card">

            <div class="course-card-top">

                <div class="course-cover">

                    <i data-lucide="book-open"></i>

                </div>

                <span class="course-status ${
                    published
                        ? "published"
                        : "draft"
                }">

                    ${
                        published
                            ? "Published"
                            : "Draft"
                    }

                </span>

            </div>


            <div class="course-card-body">

                <span class="course-category">

                    ${escapeHTML(
                        course.category ||
                        "Technology"
                    )}

                </span>


                <h3>

                    ${escapeHTML(
                        course.title ||
                        "Untitled Course"
                    )}

                </h3>


                <p>

                    ${escapeHTML(
                        course.description ||
                        "No description provided."
                    )}

                </p>


                <div class="course-meta">

                    <span>

                        <i data-lucide="signal"></i>

                        ${escapeHTML(
                            course.level ||
                            "Beginner"
                        )}

                    </span>


                    <span>

                        <i data-lucide="users"></i>

                        ${Number(
                            course.studentCount || 0
                        )}

                    </span>

                </div>


                <div class="course-pricing">

                    ${priceHTML}

                </div>

            </div>


            <div class="course-card-actions">

                <button
                    type="button"
                    data-edit-course="${course.id}"
                    class="course-action"
                >

                    <i data-lucide="square-pen"></i>

                    Edit

                </button>


                <button
                    type="button"
                    data-delete-course="${course.id}"
                    class="course-action danger"
                >

                    <i data-lucide="trash-2"></i>

                    Delete

                </button>

            </div>

        </article>

    `;

}


// ============================================================
// CREATE MODAL
// ============================================================

function createCourseModal() {

    if ($("courseModal")) return;


    const modal =
        document.createElement("div");


    modal.id =
        "courseModal";


    modal.className =
        "course-modal";


    modal.innerHTML = `

        <div class="course-modal-backdrop"
             data-close-modal></div>


        <div class="course-modal-content">

            <div class="course-modal-header">

                <div>

                    <span>
                        COURSE BUILDER
                    </span>

                    <h2 id="courseModalTitle">
                        Create Course
                    </h2>

                </div>


                <button
                    type="button"
                    id="closeCourseModal"
                    class="modal-close"
                >

                    <i data-lucide="x"></i>

                </button>

            </div>


            <form id="courseForm">

                <div class="form-group">

                    <label>
                        Course Title
                    </label>

                    <input
                        id="courseTitle"
                        type="text"
                        placeholder="e.g. Full Stack Web Development"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="courseDescription"
                        rows="4"
                        placeholder="Describe what students will learn..."
                        required
                    ></textarea>

                </div>


                <div class="form-row">

                    <div class="form-group">

                        <label>
                            Category
                        </label>

                        <select id="courseCategory">

                            <option>
                                Technology
                            </option>

                            <option>
                                Programming
                            </option>

                            <option>
                                Web Development
                            </option>

                            <option>
                                Mobile Development
                            </option>

                            <option>
                                Business
                            </option>

                            <option>
                                Design
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Level
                        </label>

                        <select id="courseLevel">

                            <option>
                                Beginner
                            </option>

                            <option>
                                Intermediate
                            </option>

                            <option>
                                Advanced
                            </option>

                        </select>

                    </div>

                </div>


                <div class="pricing-box">

                    <div class="pricing-header">

                        <div>

                            <strong>
                                Course Pricing
                            </strong>

                            <span>
                                Set how much students pay.
                            </span>

                        </div>


                        <label class="switch">

                            <input
                                type="checkbox"
                                id="courseFree"
                            >

                            <span>
                                Free Course
                            </span>

                        </label>

                    </div>


                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                Price (KSh)
                            </label>

                            <input
                                id="coursePrice"
                                type="number"
                                min="0"
                                step="50"
                                value="0"
                                placeholder="1500"
                            >

                        </div>


                        <div class="form-group">

                            <label>
                                Discount Price (KSh)
                            </label>

                            <input
                                id="courseDiscount"
                                type="number"
                                min="0"
                                step="50"
                                placeholder="Optional"
                            >

                        </div>

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Course Status
                    </label>

                    <select id="courseStatus">

                        <option value="draft">
                            Save as Draft
                        </option>

                        <option value="published">
                            Publish Course
                        </option>

                    </select>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        id="cancelCourseBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                        id="saveCourseBtn"
                    >

                        <i data-lucide="save"></i>

                        Save Course

                    </button>

                </div>

            </form>

        </div>

    `;


    document.body.appendChild(modal);


    refreshIcons();

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

    $("createCourseBtn")
        ?.addEventListener(
            "click",
            () => openCourseModal()
        );


    $("emptyCreateCourseBtn")
        ?.addEventListener(
            "click",
            () => openCourseModal()
        );


    $("courseSearch")
        ?.addEventListener(
            "input",
            renderCourses
        );


    document
        .querySelectorAll(".course-filter")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".course-filter")
                        .forEach(btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter ||
                        "all";


                    renderCourses();

                }
            );

        });


    $("closeCourseModal")
        ?.addEventListener(
            "click",
            closeCourseModal
        );


    $("cancelCourseBtn")
        ?.addEventListener(
            "click",
            closeCourseModal
        );


    document
        .querySelector("#courseModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.matches(
                        "[data-close-modal]"
                    )
                ) {

                    closeCourseModal();

                }

            }
        );


    $("courseForm")
        ?.addEventListener(
            "submit",
            saveCourse
        );


    $("courseFree")
        ?.addEventListener(
            "change",
            togglePricing
        );

}


// ============================================================
// OPEN MODAL
// ============================================================

function openCourseModal(course = null) {

    const modal =
        $("courseModal");


    if (!modal) return;


    editingCourseId =
        course?.id || null;


    setText(
        "courseModalTitle",
        editingCourseId
            ? "Edit Course"
            : "Create Course"
    );


    $("courseTitle").value =
        course?.title || "";


    $("courseDescription").value =
        course?.description || "";


    $("courseCategory").value =
        course?.category ||
        "Technology";


    $("courseLevel").value =
        course?.level ||
        "Beginner";


    $("coursePrice").value =
        course?.price || 0;


    $("courseDiscount").value =
        course?.discountPrice || "";


    $("courseFree").checked =
        course?.isFree === true;


    $("courseStatus").value =
        course?.status ||
        "draft";


    togglePricing();


    modal.classList.add("open");

    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => $("courseTitle")?.focus(),
        100
    );

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeCourseModal() {

    const modal =
        $("courseModal");


    modal?.classList.remove("open");

    document.body.classList.remove(
        "modal-open"
    );


    editingCourseId = null;

}


// ============================================================
// PRICING
// ============================================================

function togglePricing() {

    const free =
        $("courseFree")?.checked;


    const price =
        $("coursePrice");

    const discount =
        $("courseDiscount");


    if (price) {

        price.disabled =
            free;

    }


    if (discount) {

        discount.disabled =
            free;

    }

}


// ============================================================
// SAVE COURSE
// ============================================================

async function saveCourse(event) {

    event.preventDefault();


    const title =
        $("courseTitle")
            ?.value.trim();


    const description =
        $("courseDescription")
            ?.value.trim();


    const category =
        $("courseCategory")
            ?.value;


    const level =
        $("courseLevel")
            ?.value;


    const isFree =
        $("courseFree")
            ?.checked;


    const price =
        isFree
            ? 0
            : Number(
                $("coursePrice")
                    ?.value || 0
            );


    const discountPrice =
        isFree
            ? 0
            : Number(
                $("courseDiscount")
                    ?.value || 0
            );


    const status =
        $("courseStatus")
            ?.value || "draft";


    if (!title) {

        alert(
            "Please enter a course title."
        );

        return;

    }


    if (!description) {

        alert(
            "Please enter a course description."
        );

        return;

    }


    if (!isFree && price <= 0) {

        alert(
            "Please enter a valid course price."
        );

        return;

    }


    if (
        discountPrice > 0 &&
        discountPrice >= price
    ) {

        alert(
            "Discount price must be lower than the original price."
        );

        return;

    }


    const button =
        $("saveCourseBtn");


    try {

        button.disabled = true;

        button.innerHTML = `
            <i data-lucide="loader-circle"></i>
            Saving...
        `;

        refreshIcons();


        const courseData = {

            instructorId:
                instructor.uid,

            instructorName:
                instructor.displayName ||
                "Instructor",

            title,

            description,

            category,

            level,

            isFree,

            price,

            discountPrice,

            status,

            published:
                status === "published",

            studentCount:
                editingCourseId
                    ? (
                        courses.find(
                            c =>
                                c.id ===
                                editingCourseId
                        )?.studentCount || 0
                    )
                    : 0,

            updatedAt:
                serverTimestamp()

        };


        if (editingCourseId) {

            await updateDoc(

                doc(
                    db,
                    "courses",
                    editingCourseId
                ),

                courseData

            );

        } else {

            await addDoc(

                collection(
                    db,
                    "courses"
                ),

                {

                    ...courseData,

                    createdAt:
                        serverTimestamp()

                }

            );

        }


        closeCourseModal();

        await loadCourses();


        console.log(
            "✓ Course saved successfully"
        );


    } catch (error) {

        console.error(
            "Failed to save course:",
            error
        );


        alert(
            "Unable to save course. Please try again."
        );


    } finally {

        button.disabled = false;

        button.innerHTML = `
            <i data-lucide="save"></i>
            Save Course
        `;

        refreshIcons();

    }

}


// ============================================================
// EDIT COURSE
// ============================================================

function editCourse(id) {

    const course =
        courses.find(
            item => item.id === id
        );


    if (!course) return;


    openCourseModal(course);

}


// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

    const course =
        courses.find(
            item => item.id === id
        );


    if (!course) return;


    const confirmed =
        confirm(
            `Delete "${course.title || "this course"}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "courses",
                id
            )
        );


        courses =
            courses.filter(
                item => item.id !== id
            );


        updateStats();

        renderCourses();


        console.log(
            "✓ Course deleted"
        );


    } catch (error) {

        console.error(
            "Failed to delete course:",
            error
        );


        alert(
            "Unable to delete course."
        );

    }

}


// ============================================================
// UI
// ============================================================

function setText(id, value) {

    const element =
        $(id);

    if (element) {

        element.textContent =
            value;

    }

}


function formatNumber(value) {

    return new Intl.NumberFormat(
        "en-KE"
    ).format(value);

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
// START
// ============================================================

initCourses();