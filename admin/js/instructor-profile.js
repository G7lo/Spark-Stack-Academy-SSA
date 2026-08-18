// ============================================================
// SPARK STACK ACADEMY
// ADMIN — INSTRUCTOR PROFILE
// ============================================================

import { db } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("👨‍🏫 INSTRUCTOR PROFILE JS LOADED");


// ============================================================
// GET SELECTED INSTRUCTOR ID
// ============================================================

const params =
    new URLSearchParams(window.location.search);

const instructorId =
    params.get("id");


// ============================================================
// ELEMENT HELPER
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "—";
    }

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) return "—";

    try {

        const date =
            value.toDate
                ? value.toDate()
                : new Date(value);

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    } catch {
        return "—";
    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// LOAD INSTRUCTOR
// ============================================================

async function loadInstructor() {

    if (!instructorId) {

        showError(
            "No instructor was selected."
        );

        return;

    }

    try {

        console.log(
            "🔎 Loading instructor:",
            instructorId
        );


        const instructorRef =
            doc(
                db,
                "instructors",
                instructorId
            );


        const snapshot =
            await getDoc(
                instructorRef
            );


        if (!snapshot.exists()) {

            showError(
                "Instructor not found."
            );

            return;

        }


        const instructor = {

            id: snapshot.id,

            ...snapshot.data()

        };


        populateInstructor(
            instructor
        );


        await loadInstructorCourses(
            instructor
        );


        console.log(
            "✓ Instructor profile loaded"
        );

    } catch (error) {

        console.error(
            "❌ Failed loading instructor:",
            error
        );

        showError(
            "Unable to load instructor profile."
        );

    }

}


// ============================================================
// POPULATE PROFILE
// ============================================================

function populateInstructor(
    instructor
) {

    const name =
        instructor.name ||
        instructor.displayName ||
        instructor.fullName ||
        "Instructor";


    const email =
        instructor.email ||
        "No email";


    const avatar =
        instructor.photoURL ||
        instructor.photoUrl ||
        instructor.avatar ||
        "";


    setText(
        "instructorName",
        name
    );


    setText(
        "instructorEmail",
        email
    );


    setText(
        "instructorId",
        instructor.id
    );


    setText(
        "instructorBio",
        instructor.bio ||
        "No instructor bio available."
    );


    setText(
        "instructorSpecialization",
        instructor.specialization ||
        instructor.subject ||
        "Not specified"
    );


    setText(
        "instructorJoined",
        formatDate(
            instructor.createdAt ||
            instructor.joinedAt
        )
    );


    setText(
        "instructorStatus",
        instructor.status ||
        "active"
    );


    // --------------------------------------------------------
    // AVATAR
    // --------------------------------------------------------

    const avatarElement =
        document.getElementById(
            "instructorAvatar"
        );


    if (avatarElement) {

        if (avatar) {

            avatarElement.innerHTML = `
                <img
                    src="${escapeHTML(avatar)}"
                    alt="${escapeHTML(name)}"
                >
            `;

        } else {

            avatarElement.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }

    }


    // --------------------------------------------------------
    // STATS
    // --------------------------------------------------------

    setText(
        "totalCourses",
        instructor.totalCourses || 0
    );


    setText(
        "totalStudents",
        instructor.totalStudents || 0
    );


    setText(
        "totalEarnings",
        instructor.totalEarnings
            ? `KSh ${Number(
                instructor.totalEarnings
              ).toLocaleString()}`
            : "KSh 0"
    );


    setText(
        "totalCertificates",
        instructor.totalCertificates || 0
    );


    // --------------------------------------------------------
    // STATUS BADGE
    // --------------------------------------------------------

    const statusElement =
        document.getElementById(
            "instructorStatus"
        );


    if (statusElement) {

        statusElement.className =
            `admin-badge ${
                instructor.status === "suspended"
                    ? "suspended"
                    : instructor.status === "pending"
                    ? "pending"
                    : "active"
            }`;

    }


    // --------------------------------------------------------
    // PAGE TITLE
    // --------------------------------------------------------

    document.title =
        `${name} | Instructor Profile | Spark Stack Academy`;

}


// ============================================================
// LOAD INSTRUCTOR COURSES
// ============================================================

async function loadInstructorCourses(
    instructor
) {

    const container =
        document.getElementById(
            "instructorCourses"
        );


    if (!container) return;


    try {

        const coursesQuery =
            query(
                collection(
                    db,
                    "courses"
                ),
                where(
                    "instructorId",
                    "==",
                    instructor.id
                )
            );


        const snapshot =
            await getDocs(
                coursesQuery
            );


        setText(
            "totalCourses",
            snapshot.size
        );


        if (snapshot.empty) {

            container.innerHTML = `
                <div class="admin-empty">
                    <h3>No courses yet</h3>
                    <p>
                        This instructor has not created
                        any courses.
                    </p>
                </div>
            `;

            return;

        }


        container.innerHTML = "";


        snapshot.forEach(
            courseSnapshot => {

                const course =
                    courseSnapshot.data();


                const card =
                    document.createElement("div");


                card.className =
                    "instructor-course-item";


                card.innerHTML = `

                    <div class="course-icon">

                        <i data-lucide="book-open"></i>

                    </div>

                    <div class="course-info">

                        <strong>
                            ${escapeHTML(
                                course.title ||
                                course.name ||
                                "Untitled Course"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                course.category ||
                                "Course"
                            )}
                        </span>

                    </div>

                    <span class="admin-badge ${
                        course.status === "published"
                            ? "active"
                            : "pending"
                    }">

                        ${escapeHTML(
                            course.status ||
                            "draft"
                        )}

                    </span>

                `;


                container.appendChild(
                    card
                );

            }
        );


        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (error) {

        console.warn(
            "⚠️ Failed loading instructor courses:",
            error
        );

        container.innerHTML = `
            <div class="admin-empty">
                <h3>Unable to load courses</h3>
                <p>
                    Please try refreshing the page.
                </p>
            </div>
        `;

    }

}


// ============================================================
// ERROR STATE
// ============================================================

function showError(
    message
) {

    const container =
        document.getElementById(
            "instructorProfile"
        );


    if (container) {

        container.innerHTML = `
            <div class="admin-empty">
                <i data-lucide="alert-circle"></i>

                <h3>
                    ${escapeHTML(message)}
                </h3>

                <p>
                    Return to the instructors page
                    and select an instructor.
                </p>

                <a
                    href="instructors.html"
                    class="admin-btn primary"
                >
                    Back to Instructors
                </a>
            </div>
        `;

    }


    if (window.lucide) {
        window.lucide.createIcons();
    }

}


// ============================================================
// START
// ============================================================

loadInstructor();