// ============================================================
// SPARK STACK ACADEMY
// CREATE ASSIGNMENT ENGINE
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let instructor = null;

const $ = id =>
    document.getElementById(id);


// ============================================================
// BOOT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await waitForInstructor();

            instructor =
                window.currentInstructor;

            if (!instructor) {

                console.error(
                    "❌ Instructor authentication unavailable."
                );

                return;

            }


            await loadCourses();

            setupForm();

            refreshIcons();


            console.log(
                "✓ Create Assignment loaded"
            );


        } catch (error) {

            console.error(
                "❌ Create Assignment boot error:",
                error
            );

        }

    }
);


// ============================================================
// WAIT FOR AUTH
// ============================================================

function waitForInstructor() {

    return new Promise(resolve => {

        let attempts = 0;

        const timer =
            setInterval(() => {

                attempts++;


                if (
                    window.currentInstructor
                ) {

                    clearInterval(timer);

                    resolve();

                    return;

                }


                if (
                    attempts >= 100
                ) {

                    clearInterval(timer);

                    resolve();

                }

            }, 100);

    });

}


// ============================================================
// LOAD INSTRUCTOR COURSES
// ============================================================

async function loadCourses() {

    const select =
        $("courseSelect");


    if (!select) return;


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


        select.innerHTML = "";


        if (
            snapshot.empty
        ) {

            select.innerHTML = `
                <option value="">
                    No courses available
                </option>
            `;

            return;

        }


        const defaultOption =
            document.createElement(
                "option"
            );


        defaultOption.value = "";

        defaultOption.textContent =
            "Select a course";


        select.appendChild(
            defaultOption
        );


        snapshot.docs
            .sort((a, b) => {

                const titleA =
                    String(
                        a.data().title || ""
                    );

                const titleB =
                    String(
                        b.data().title || ""
                    );

                return titleA.localeCompare(
                    titleB
                );

            })
            .forEach(courseDoc => {

                const data =
                    courseDoc.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    courseDoc.id;


                option.textContent =
                    data.title ||
                    "Untitled Course";


                option.dataset.courseName =
                    data.title ||
                    "Untitled Course";


                select.appendChild(
                    option
                );

            });


    } catch (error) {

        console.error(
            "❌ Failed to load courses:",
            error
        );


        select.innerHTML = `
            <option value="">
                Unable to load courses
            </option>
        `;

    }

}


// ============================================================
// FORM
// ============================================================

function setupForm() {

    const form =
        $("assignmentForm");


    if (!form) return;


    form.addEventListener(
        "submit",
        createAssignment
    );

}


// ============================================================
// CREATE ASSIGNMENT
// ============================================================

async function createAssignment(
    event
) {

    event.preventDefault();


    const title =
        $("assignmentTitle")
            ?.value
            .trim();


    const description =
        $("assignmentDescription")
            ?.value
            .trim();


    const courseSelect =
        $("courseSelect");


    const courseId =
        courseSelect?.value;


    const selectedCourse =
        courseSelect
            ?.selectedOptions[0];


    const courseName =
        selectedCourse
            ?.dataset.courseName ||
        selectedCourse
            ?.textContent ||
        "";


    const dueDate =
        $("dueDate")
            ?.value || null;


    const maxScore =
        Number(
            $("maxScore")
                ?.value || 100
        );


    // ========================================================
    // VALIDATION
    // ========================================================

    if (!title) {

        showMessage(
            "Please enter an assignment title.",
            "error"
        );

        return;

    }


    if (!description) {

        showMessage(
            "Please enter assignment instructions.",
            "error"
        );

        return;

    }


    if (!courseId) {

        showMessage(
            "Please select a course.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(maxScore) ||
        maxScore <= 0
    ) {

        showMessage(
            "Maximum score must be greater than 0.",
            "error"
        );

        return;

    }


    const button =
        $("saveAssignmentBtn");


    try {

        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <span class="loading-spinner"></span>
                Creating...
            `;

        }


        // ====================================================
        // ASSIGNMENT DOCUMENT
        // ====================================================

        const assignmentData = {

            // OWNERSHIP

            instructorId:
                instructor.uid,

            instructorName:
                instructor.displayName ||
                instructor.name ||
                "Instructor",


            // COURSE RELATIONSHIP

            courseId,

            courseName,


            // CONTENT

            title,

            description,


            // ASSESSMENT

            maxScore,


            // DEADLINE

            dueDate,


            // PUBLICATION STATE

            status:
                "published",

            published:
                true,


            // SUBMISSION TRACKING

            submissionCount:
                0,

            submissionStatus:
                "none",


            // GRADING

            gradedCount:
                0,

            averageScore:
                0,


            // TIMESTAMPS

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        const assignmentRef =
            await addDoc(
                collection(
                    db,
                    "assignments"
                ),
                assignmentData
            );


        console.log(
            "✓ Assignment created:",
            assignmentRef.id
        );


        showMessage(
            "Assignment created successfully.",
            "success"
        );


        // ====================================================
        // REDIRECT
        // ====================================================

        setTimeout(() => {

            window.location.href =
                "assignments.html";

        }, 700);


    } catch (error) {

        console.error(
            "❌ Failed to create assignment:",
            error
        );


        showMessage(
            "Unable to create assignment. Please try again.",
            "error"
        );


        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i data-lucide="save"></i>
                Create Assignment
            `;

            refreshIcons();

        }

    }

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    message,
    type
) {

    const element =
        $("formMessage");


    if (!element) return;


    element.hidden = false;

    element.className =
        `form-message ${type}`;

    element.textContent =
        message;

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