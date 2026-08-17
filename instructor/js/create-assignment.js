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

        await waitForInstructor();

        instructor =
            window.currentInstructor;

        if (!instructor) return;

        await loadCourses();

        setupForm();

        refreshIcons();

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

    const select =
        $("courseSelect");

    if (!select) return;


    try {

        const ref =
            collection(
                db,
                "courses"
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


        if (snapshot.empty) {

            select.innerHTML = `
                <option value="">
                    No courses available
                </option>
            `;

            return;

        }


        snapshot.docs.forEach(
            courseDoc => {

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

            }
        );


    } catch (error) {

        console.error(
            "❌ Failed to load courses:",
            error
        );

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
// CREATE
// ============================================================

async function createAssignment(
    event
) {

    event.preventDefault();


    const title =
        $("assignmentTitle")
            ?.value.trim();


    const description =
        $("assignmentDescription")
            ?.value.trim();


    const courseSelect =
        $("courseSelect");


    const courseId =
        courseSelect?.value;


    const courseName =
        courseSelect
            ?.selectedOptions[0]
            ?.dataset.courseName ||
        "";


    const dueDate =
        $("dueDate")?.value;


    const maxScore =
        Number(
            $("maxScore")?.value || 100
        );


    if (
        !title ||
        !description ||
        !courseId
    ) {

        showMessage(
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    const button =
        $("saveAssignmentBtn");


    try {

        button.disabled = true;


        button.innerHTML = `
            <span class="loading-spinner"></span>
            Creating...
        `;


        await addDoc(
            collection(
                db,
                "assignments"
            ),
            {

                instructorId:
                    instructor.uid,

                instructorName:
                    instructor.displayName ||
                    "Instructor",

                title,

                description,

                courseId,

                courseName,

                dueDate:
                    dueDate || null,

                maxScore,

                status:
                    "pending",

                submissionCount:
                    0,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        showMessage(
            "Assignment created successfully.",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "assignments.html";

        }, 800);


    } catch (error) {

        console.error(
            "❌ Failed to create assignment:",
            error
        );


        showMessage(
            "Unable to create assignment. Please try again.",
            "error"
        );


        button.disabled = false;


        button.innerHTML = `
            <i data-lucide="save"></i>
            Create Assignment
        `;


        refreshIcons();

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