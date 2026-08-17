// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR PORTAL
// STUDENTS ENGINE
// ============================================================

import {
    db
} from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let instructor = null;
let students = [];
let activeFilter = "all";


// ============================================================
// DOM
// ============================================================

const $ = id =>
    document.getElementById(id);


// ============================================================
// BOOT
// ============================================================

async function initStudents() {

    try {

        await waitForInstructor();

        instructor =
            window.currentInstructor;

        if (!instructor) {

            console.error(
                "❌ Instructor not available."
            );

            return;

        }


        setupSearch();

        setupFilters();

        await loadStudents();

        refreshIcons();


        console.log(
            "✓ Students page loaded"
        );


    } catch (error) {

        console.error(
            "❌ Students page error:",
            error
        );

        showEmptyState();

    }

}


// ============================================================
// WAIT FOR INSTRUCTOR
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


                if (attempts >= 100) {

                    clearInterval(timer);

                    resolve();

                }

            }, 100);

    });

}


// ============================================================
// LOAD STUDENTS
// ============================================================

async function loadStudents() {

    const loading =
        $("studentsLoading");


    try {

        const enrollmentsRef =
            collection(
                db,
                "enrollments"
            );


        const q =
            query(
                enrollmentsRef,
                where(
                    "instructorId",
                    "==",
                    instructor.uid
                )
            );


        const snapshot =
            await getDocs(q);


        const studentMap =
            new Map();


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            const studentId =
                data.studentId ||
                data.userId;


            if (!studentId) return;


            /*
             * Prevent duplicate students
             * when they are enrolled in
             * multiple courses.
             */

            if (!studentMap.has(studentId)) {

                studentMap.set(
                    studentId,
                    {
                        id: studentId,

                        name:
                            data.studentName ||
                            data.name ||
                            "Student",

                        email:
                            data.studentEmail ||
                            data.email ||
                            "",

                        course:
                            data.courseName ||
                            data.courseTitle ||
                            "Course",

                        progress:
                            Number(
                                data.progress || 0
                            ),

                        status:
                            getStudentStatus(data)

                    }
                );

            }

        });


        students =
            Array.from(
                studentMap.values()
            );


        updateStats();

        renderStudents();


    } catch (error) {

        console.error(
            "❌ Failed to load students:",
            error
        );

        students = [];

        updateStats();

        showEmptyState();

    } finally {

        loading?.remove();

    }

}


// ============================================================
// STUDENT STATUS
// ============================================================

function getStudentStatus(data) {

    const status =
        String(
            data.status || ""
        ).toLowerCase();


    const progress =
        Number(
            data.progress || 0
        );


    if (
        status === "completed" ||
        progress >= 100
    ) {

        return "completed";

    }


    return "active";

}


// ============================================================
// UPDATE STATS
// ============================================================

function updateStats() {

    const total =
        students.length;


    const active =
        students.filter(
            student =>
                student.status === "active"
        ).length;


    const completed =
        students.filter(
            student =>
                student.status === "completed"
        ).length;


    const average =
        total
            ? Math.round(
                students.reduce(
                    (sum, student) =>
                        sum +
                        student.progress,
                    0
                ) / total
            )
            : 0;


    setText(
        "totalStudents",
        total
    );


    setText(
        "activeStudents",
        active
    );


    setText(
        "completedStudents",
        completed
    );


    setText(
        "averageProgress",
        `${average}%`
    );

}


// ============================================================
// RENDER
// ============================================================

function renderStudents() {

    const container =
        $("studentList");

    const empty =
        $("studentsEmpty");


    if (!container) return;


    const search =
        (
            $("studentSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    let filtered =
        students.filter(student => {

            const matchesSearch =
                !search ||
                student.name
                    .toLowerCase()
                    .includes(search) ||
                student.email
                    .toLowerCase()
                    .includes(search);


            const matchesFilter =
                activeFilter === "all" ||
                student.status === activeFilter;


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    if (!filtered.length) {

        container.innerHTML = "";

        empty?.classList.remove("hidden");

        refreshIcons();

        return;

    }


    empty?.classList.add("hidden");


    container.innerHTML =
        filtered
            .map(renderStudent)
            .join("");


    refreshIcons();

}


// ============================================================
// STUDENT ROW
// ============================================================

function renderStudent(student) {

    const initials =
        getInitials(
            student.name
        );


    const progress =
        Math.min(
            100,
            Math.max(
                0,
                student.progress
            )
        );


    const statusLabel =
        student.status === "completed"
            ? "Completed"
            : "Active";


    return `

        <div class="student-row">

            <div class="student-info">

                <div class="student-avatar">
                    ${escapeHTML(initials)}
                </div>

                <div class="student-name">

                    <strong>
                        ${escapeHTML(
                            student.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            student.email ||
                            "Student account"
                        )}
                    </span>

                </div>

            </div>


            <div class="student-course">

                ${escapeHTML(
                    student.course
                )}

            </div>


            <div class="student-progress">

                <div class="progress-label">

                    <span>
                        Progress
                    </span>

                    <strong>
                        ${progress}%
                    </strong>

                </div>

                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${progress}%"
                    ></div>

                </div>

            </div>


            <span
                class="student-status ${student.status}"
            >

                ${statusLabel}

            </span>

        </div>

    `;

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

    const search =
        $("studentSearch");


    if (!search) return;


    search.addEventListener(
        "input",
        renderStudents
    );

}


// ============================================================
// FILTERS
// ============================================================

function setupFilters() {

    document
        .querySelectorAll(".filter-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    activeFilter =
                        button.dataset.filter ||
                        "all";


                    document
                        .querySelectorAll(
                            ".filter-btn"
                        )
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    renderStudents();

                }
            );

        });

}


// ============================================================
// EMPTY STATE
// ============================================================

function showEmptyState() {

    const container =
        $("studentList");

    const empty =
        $("studentsEmpty");


    if (container) {

        container.innerHTML = "";

    }


    empty?.classList.remove(
        "hidden"
    );


    refreshIcons();

}


// ============================================================
// INITIALS
// ============================================================

function getInitials(name) {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {

        return "S";

    }


    if (parts.length === 1) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    return (
        parts[0].charAt(0) +
        parts[parts.length - 1]
            .charAt(0)
    ).toUpperCase();

}


// ============================================================
// TEXT
// ============================================================

function setText(id, value) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

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


// ============================================================
// LUCIDE
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

initStudents();