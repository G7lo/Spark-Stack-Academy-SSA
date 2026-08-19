// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR PORTAL
// CREATE QUIZ ENGINE V1
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
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let instructor = null;

let courseId = null;
let course = null;

let modules = [];
let lessons = [];

let questions = [];

let editingQuestionIndex = null;

let saving = false;


// ============================================================
// HELPERS
// ============================================================

const $ = id =>
    document.getElementById(id);


function getCourseId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("courseId") ||
        params.get("id")
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

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


function setText(id, value) {

    const element = $(id);

    if (element) {

        element.textContent = value;

    }

}


// ============================================================
// BOOT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        courseId =
            getCourseId();

        if (!courseId) {

            showFatalError(
                "No course was selected."
            );

            return;

        }

        waitForAuth();

    }
);


// ============================================================
// AUTH
// ============================================================

function waitForAuth() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                showFatalError(
                    "Please sign in as an instructor."
                );

                return;

            }

            instructor = user;

            window.currentInstructor =
                user;

            try {

                await loadCourse();

                await loadModules();

                setupEvents();

                renderModules();

                renderQuestions();

                refreshIcons();

                console.log(
                    "✓ Create Quiz loaded"
                );

            } catch (error) {

                console.error(
                    "❌ Create Quiz error:",
                    error
                );

                showFatalError(
                    "Unable to load the quiz builder."
                );

            }

        }
    );

}


// ============================================================
// LOAD COURSE
// ============================================================

async function loadCourse() {

    const courseRef =
        doc(
            db,
            "courses",
            courseId
        );

    const snapshot =
        await getDoc(
            courseRef
        );

    if (!snapshot.exists()) {

        throw new Error(
            "Course not found."
        );

    }

    course = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    if (
        course.instructorId &&
        course.instructorId !==
            instructor.uid
    ) {

        throw new Error(
            "You do not own this course."
        );

    }


    renderCourse();

}


// ============================================================
// COURSE UI
// ============================================================

function renderCourse() {

    setText(
        "courseName",
        course.title ||
        "Untitled Course"
    );

    setText(
        "courseCategory",
        course.category ||
        "Technology"
    );

    setText(
        "courseLevel",
        course.level ||
        "Beginner"
    );

}


// ============================================================
// LOAD MODULES
// ============================================================

async function loadModules() {

    const ref =
        collection(
            db,
            "courseModules"
        );

    const q =
        query(
            ref,
            where(
                "courseId",
                "==",
                courseId
            )
        );

    const snapshot =
        await getDocs(q);


    modules =
        snapshot.docs
            .map(item => ({

                id:
                    item.id,

                ...item.data()

            }))
            .sort(
                sortByOrder
            );


    await loadLessons();

}


// ============================================================
// LOAD LESSONS
// ============================================================

async function loadLessons() {

    const ref =
        collection(
            db,
            "courseLessons"
        );

    const q =
        query(
            ref,
            where(
                "courseId",
                "==",
                courseId
            )
        );

    const snapshot =
        await getDocs(q);


    lessons =
        snapshot.docs
            .map(item => ({

                id:
                    item.id,

                ...item.data()

            }))
            .sort(
                sortByOrder
            );

}


function sortByOrder(a, b) {

    return (
        Number(a.order || 0) -
        Number(b.order || 0)
    );

}


// ============================================================
// MODULE DROPDOWN
// ============================================================

function renderModules() {

    const select =
        $("quizModule");

    if (!select) return;


    select.innerHTML = `

        <option value="">
            Entire Course
        </option>

        ${
            modules
                .map(
                    module => `
                        <option value="${module.id}">
                            ${escapeHTML(
                                module.title ||
                                "Untitled Module"
                            )}
                        </option>
                    `
                )
                .join("")
        }

    `;


    renderLessons("");

}


// ============================================================
// LESSON DROPDOWN
// ============================================================

function renderLessons(moduleId) {

    const select =
        $("quizLesson");

    if (!select) return;


    if (!moduleId) {

        select.innerHTML = `

            <option value="">
                Entire Course
            </option>

        `;

        select.disabled = true;

        return;

    }


    const moduleLessons =
        lessons.filter(
            lesson =>
                lesson.moduleId ===
                moduleId
        );


    select.disabled = false;


    select.innerHTML = `

        <option value="">
            Entire Module
        </option>

        ${
            moduleLessons
                .map(
                    lesson => `
                        <option value="${lesson.id}">
                            ${escapeHTML(
                                lesson.title ||
                                "Untitled Lesson"
                            )}
                        </option>
                    `
                )
                .join("")
        }

    `;

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

    $("quizModule")
        ?.addEventListener(
            "change",
            event => {

                renderLessons(
                    event.target.value
                );

            }
        );


    $("addQuestionBtn")
        ?.addEventListener(
            "click",
            () => {

                openQuestionEditor();

            }
        );


    $("firstQuestionBtn")
        ?.addEventListener(
            "click",
            () => {

                openQuestionEditor();

            }
        );


    $("quizForm")
        ?.addEventListener(
            "submit",
            saveQuiz
        );


    $("saveQuizBtn")
        ?.addEventListener(
            "click",
            () => {

                $("quizForm")
                    ?.requestSubmit();

            }
        );


    $("bottomSaveQuizBtn")
        ?.addEventListener(
            "click",
            () => {

                $("quizForm")
                    ?.requestSubmit();

            }
        );


    $("cancelQuizBtn")
        ?.addEventListener(
            "click",
            cancelQuiz
        );


    $("bottomCancelQuizBtn")
        ?.addEventListener(
            "click",
            cancelQuiz
        );


    $("quizStatus")
        ?.addEventListener(
            "change",
            event => {

                console.log(
                    "Quiz status:",
                    event.target.value
                );

            }
        );

}


// ============================================================
// QUESTION EDITOR
// ============================================================

function openQuestionEditor(
    index = null
) {

    editingQuestionIndex =
        index;


    const existing =
        index !== null
            ? questions[index]
            : null;


    const type =
        existing?.type ||
        "multiple_choice";


    const modal =
        createQuestionModal();


    document.body.appendChild(
        modal
    );


    populateQuestionModal(
        modal,
        existing,
        type
    );


    refreshIcons();

}


// ============================================================
// CREATE QUESTION MODAL
// ============================================================

function createQuestionModal() {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "questionEditorModal";


    wrapper.className =
        "question-editor-modal";


    wrapper.innerHTML = `

        <div class="question-editor-backdrop"
             data-close-question-modal>
        </div>


        <div class="question-editor-dialog">

            <div class="question-editor-header">

                <div>

                    <span>
                        QUIZ QUESTION
                    </span>

                    <h2 id="questionEditorTitle">
                        Add Question
                    </h2>

                </div>


                <button
                    type="button"
                    class="question-action"
                    data-close-question-modal
                >

                    <i data-lucide="x"></i>

                </button>

            </div>


            <div class="question-editor-body">


                <div class="editor-group">

                    <label>
                        Question
                    </label>

                    <textarea
                        id="editorQuestion"
                        rows="4"
                        placeholder="Enter your question..."
                    ></textarea>

                </div>


                <div class="editor-grid">

                    <div class="editor-group">

                        <label>
                            Question Type
                        </label>

                        <select id="editorType">

                            <option value="multiple_choice">
                                Multiple Choice
                            </option>

                            <option value="true_false">
                                True / False
                            </option>

                            <option value="short_answer">
                                Short Answer
                            </option>

                        </select>

                    </div>


                    <div class="editor-group">

                        <label>
                            Points
                        </label>

                        <input
                            type="number"
                            id="editorPoints"
                            min="1"
                            value="1"
                        >

                    </div>

                </div>


                <div
                    class="editor-options"
                    id="editorOptions"
                ></div>


            </div>


            <div class="question-editor-footer">

                <button
                    type="button"
                    class="btn btn-secondary"
                    data-close-question-modal
                >
                    Cancel
                </button>


                <button
                    type="button"
                    class="btn btn-primary"
                    id="saveQuestionBtn"
                >

                    <i data-lucide="check"></i>

                    Save Question

                </button>

            </div>

        </div>

    `;


    wrapper
        .querySelectorAll(
            "[data-close-question-modal]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeQuestionEditor
                );

            }
        );


    wrapper
        .querySelector(
            "#editorType"
        )
        ?.addEventListener(
            "change",
            event => {

                renderEditorOptions(
                    event.target.value
                );

            }
        );


    wrapper
        .querySelector(
            "#saveQuestionBtn"
        )
        ?.addEventListener(
            "click",
            saveQuestionFromEditor
        );


    return wrapper;

}


// ============================================================
// POPULATE EDITOR
// ============================================================

function populateQuestionModal(
    modal,
    question,
    type
) {

    const title =
        modal.querySelector(
            "#questionEditorTitle"
        );


    if (title) {

        title.textContent =
            question
                ? "Edit Question"
                : "Add Question";

    }


    modal.querySelector(
        "#editorQuestion"
    ).value =
        question?.question || "";


    modal.querySelector(
        "#editorType"
    ).value =
        type;


    modal.querySelector(
        "#editorPoints"
    ).value =
        question?.points || 1;


    renderEditorOptions(
        type,
        question?.options,
        question?.correctAnswer
    );

}


// ============================================================
// OPTIONS
// ============================================================

function renderEditorOptions(
    type,
    existingOptions = null,
    correctAnswer = ""
) {

    const container =
        document.querySelector(
            "#editorOptions"
        );

    if (!container) return;


    if (type === "multiple_choice") {

        const options =
            existingOptions?.length
                ? existingOptions
                : [
                    "",
                    "",
                    "",
                    ""
                ];


        container.innerHTML = `

            <div class="editor-options-title">
                Answer Options
            </div>

            ${
                options
                    .map(
                        (option, index) => `

                            <div class="answer-row">

                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    value="${index}"
                                    ${
                                        String(
                                            correctAnswer
                                        ) ===
                                        String(index)
                                            ? "checked"
                                            : ""
                                    }
                                >

                                <input
                                    type="text"
                                    class="answer-input"
                                    data-option-index="${index}"
                                    value="${escapeHTML(
                                        option
                                    )}"
                                    placeholder="Option ${
                                        index + 1
                                    }"
                                >

                            </div>

                        `
                    )
                    .join("")
            }

            <small>
                Select the radio button beside the correct answer.
            </small>

        `;

        return;

    }


    if (type === "true_false") {

        container.innerHTML = `

            <div class="editor-options-title">
                Correct Answer
            </div>

            <div class="true-false-options">

                <label>

                    <input
                        type="radio"
                        name="correctAnswer"
                        value="true"
                        ${
                            String(
                                correctAnswer
                            ) === "true"
                                ? "checked"
                                : ""
                        }
                    >

                    True

                </label>


                <label>

                    <input
                        type="radio"
                        name="correctAnswer"
                        value="false"
                        ${
                            String(
                                correctAnswer
                            ) === "false"
                                ? "checked"
                                : ""
                        }
                    >

                    False

                </label>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="editor-options-title">
            Expected Answer
        </div>

        <input
            type="text"
            id="shortAnswer"
            placeholder="Enter the expected answer..."
            value="${escapeHTML(
                correctAnswer
            )}"
        >

        <small>
            Short answers can be manually reviewed by the instructor.
        </small>

    `;

}


// ============================================================
// SAVE QUESTION
// ============================================================

function saveQuestionFromEditor() {

    const modal =
        document.querySelector(
            "#questionEditorModal"
        );


    if (!modal) return;


    const question =
        modal.querySelector(
            "#editorQuestion"
        )
        ?.value
        .trim();


    const type =
        modal.querySelector(
            "#editorType"
        )?.value;


    const points =
        Number(
            modal.querySelector(
                "#editorPoints"
            )?.value || 0
        );


    if (!question) {

        alert(
            "Please enter a question."
        );

        return;

    }


    if (points < 1) {

        alert(
            "Question points must be at least 1."
        );

        return;

    }


    let options = [];
    let correctAnswer = "";


    // ========================================================
    // MULTIPLE CHOICE
    // ========================================================

    if (
        type ===
        "multiple_choice"
    ) {

        const inputs =
            modal.querySelectorAll(
                ".answer-input"
            );


        options =
            Array.from(inputs)
                .map(
                    input =>
                        input.value.trim()
                );


        if (
            options.some(
                option =>
                    !option
            )
        ) {

            alert(
                "Please fill in all answer options."
            );

            return;

        }


        const correct =
            modal.querySelector(
                'input[name="correctAnswer"]:checked'
            );


        if (!correct) {

            alert(
                "Please select the correct answer."
            );

            return;

        }


        correctAnswer =
            correct.value;

    }


    // ========================================================
    // TRUE / FALSE
    // ========================================================

    if (
        type ===
        "true_false"
    ) {

        const correct =
            modal.querySelector(
                'input[name="correctAnswer"]:checked'
            );


        if (!correct) {

            alert(
                "Please select True or False."
            );

            return;

        }


        options = [
            "True",
            "False"
        ];


        correctAnswer =
            correct.value;

    }


    // ========================================================
    // SHORT ANSWER
    // ========================================================

    if (
        type ===
        "short_answer"
    ) {

        correctAnswer =
            modal.querySelector(
                "#shortAnswer"
            )?.value
                ?.trim() || "";

    }


    const data = {

        question,

        type,

        options,

        correctAnswer,

        points,

        order:
            editingQuestionIndex !== null
                ? questions[
                    editingQuestionIndex
                ].order
                : questions.length

    };


    if (
        editingQuestionIndex !==
        null
    ) {

        questions[
            editingQuestionIndex
        ] = {

            ...questions[
                editingQuestionIndex
            ],

            ...data

        };

    } else {

        questions.push(
            data
        );

    }


    closeQuestionEditor();

    renderQuestions();

}


// ============================================================
// CLOSE QUESTION EDITOR
// ============================================================

function closeQuestionEditor() {

    document
        .querySelector(
            "#questionEditorModal"
        )
        ?.remove();


    editingQuestionIndex =
        null;

}


// ============================================================
// RENDER QUESTIONS
// ============================================================

function renderQuestions() {

    const list =
        $("questionList");


    const empty =
        $("questionsEmpty");


    const count =
        $("questionCount");


    if (!list) return;


    if (count) {

        count.textContent =
            questions.length;

    }


    if (!questions.length) {

        list.innerHTML = "";

        empty?.classList.remove(
            "hidden"
        );

        refreshIcons();

        return;

    }


    empty?.classList.add(
        "hidden"
    );


    list.innerHTML =
        questions
            .map(
                renderQuestion
            )
            .join("");


    list
        .querySelectorAll(
            "[data-edit-question]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openQuestionEditor(
                            Number(
                                button.dataset
                                    .editQuestion
                            )
                        );

                    }
                );

            }
        );


    list
        .querySelectorAll(
            "[data-delete-question]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteQuestion(
                            Number(
                                button.dataset
                                    .deleteQuestion
                            )
                        );

                    }
                );

            }
        );


    refreshIcons();

}


// ============================================================
// QUESTION CARD
// ============================================================

function renderQuestion(
    question,
    index
) {

    const typeLabels = {

        multiple_choice:
            "Multiple Choice",

        true_false:
            "True / False",

        short_answer:
            "Short Answer"

    };


    let optionsHTML = "";


    if (
        question.type ===
        "multiple_choice"
    ) {

        optionsHTML =
            question.options
                .map(
                    (option, optionIndex) => `

                        <div class="question-option ${
                            String(
                                question.correctAnswer
                            ) ===
                            String(optionIndex)
                                ? "correct"
                                : ""
                        }">

                            <span class="option-indicator">

                                ${
                                    String(
                                        question.correctAnswer
                                    ) ===
                                    String(optionIndex)
                                        ? "✓"
                                        : String.fromCharCode(
                                            65 +
                                            optionIndex
                                        )
                                }

                            </span>

                            ${escapeHTML(
                                option
                            )}

                        </div>

                    `
                )
                .join("");

    }


    if (
        question.type ===
        "true_false"
    ) {

        optionsHTML = `

            <div class="question-option ${
                question.correctAnswer ===
                "true"
                    ? "correct"
                    : ""
            }">

                <span class="option-indicator">
                    ${
                        question.correctAnswer ===
                        "true"
                            ? "✓"
                            : "A"
                    }
                </span>

                True

            </div>


            <div class="question-option ${
                question.correctAnswer ===
                "false"
                    ? "correct"
                    : ""
            }">

                <span class="option-indicator">
                    ${
                        question.correctAnswer ===
                        "false"
                            ? "✓"
                            : "B"
                    }
                </span>

                False

            </div>

        `;

    }


    if (
        question.type ===
        "short_answer"
    ) {

        optionsHTML = `

            <div class="question-option">

                <span class="option-indicator">
                    ✓
                </span>

                Expected answer:
                ${escapeHTML(
                    question.correctAnswer ||
                    "Manual review"
                )}

            </div>

        `;

    }


    return `

        <article class="question-item">

            <div class="question-top">

                <div class="question-number">
                    ${index + 1}
                </div>


                <span class="question-type">

                    ${
                        typeLabels[
                            question.type
                        ] ||
                        "Question"
                    }

                </span>


                <span class="question-points">

                    ${question.points}
                    ${
                        question.points === 1
                            ? "point"
                            : "points"
                    }

                </span>


                <div class="question-actions">

                    <button
                        type="button"
                        class="question-action"
                        data-edit-question="${index}"
                        title="Edit"
                    >

                        <i data-lucide="square-pen"></i>

                    </button>


                    <button
                        type="button"
                        class="question-action danger"
                        data-delete-question="${index}"
                        title="Delete"
                    >

                        <i data-lucide="trash-2"></i>

                    </button>

                </div>

            </div>


            <p class="question-text">

                ${escapeHTML(
                    question.question
                )}

            </p>


            <div class="question-options">

                ${optionsHTML}

            </div>

        </article>

    `;

}


// ============================================================
// DELETE QUESTION
// ============================================================

function deleteQuestion(index) {

    const question =
        questions[index];


    if (!question) return;


    if (
        !confirm(
            `Delete this question?\n\n"${question.question}"`
        )
    ) {

        return;

    }


    questions.splice(
        index,
        1
    );


    questions.forEach(
        (item, position) => {

            item.order =
                position;

        }
    );


    renderQuestions();

}


// ============================================================
// SAVE QUIZ
// ============================================================

async function saveQuiz(
    event
) {

    event?.preventDefault();


    if (saving) return;


    const title =
        $("quizTitle")
            ?.value
            .trim();


    const description =
        $("quizDescription")
            ?.value
            .trim();


    const moduleId =
        $("quizModule")
            ?.value ||
        "";


    const lessonId =
        $("quizLesson")
            ?.value ||
        "";


    const duration =
        Number(
            $("quizDuration")
                ?.value || 0
        );


    const passingScore =
        Number(
            $("passingScore")
                ?.value || 0
        );


    const maxAttempts =
        Number(
            $("maxAttempts")
                ?.value || 1
        );


    const status =
        $("quizStatus")
            ?.value ||
        "draft";


    // ========================================================
    // VALIDATION
    // ========================================================

    if (!title) {

        alert(
            "Please enter a quiz title."
        );

        $("quizTitle")?.focus();

        return;

    }



    if (
        passingScore < 0 ||
        passingScore > 100
    ) {

        alert(
            "Passing score must be between 0 and 100."
        );

        return;

    }


    if (
        duration < 0
    ) {

        alert(
            "Time limit cannot be negative."
        );

        return;

    }


    if (
        maxAttempts < 1
    ) {

        alert(
            "Maximum attempts must be at least 1."
        );

        return;

    }


    saving = true;


    setSavingState(
        true
    );


    try {

        const totalPoints =
            questions.reduce(
                (
                    total,
                    question
                ) => {

                    return (
                        total +
                        Number(
                            question.points ||
                            0
                        )
                    );

                },
                0
            );


        // ====================================================
        // CREATE QUIZ
        // ====================================================

        const quizData = {

            courseId,

            moduleId:
                moduleId || null,

            lessonId:
                lessonId || null,

            instructorId:
                instructor.uid,

            courseName:
                course.title ||
                "",

            title,

            description,

            duration,

            passingScore,

            maxAttempts,

            totalPoints,

            questionCount:
                questions.length,

            status,

            published:
                status ===
                "published",

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        const quizRef =
            await addDoc(
                collection(
                    db,
                    "quizzes"
                ),
                quizData
            );


        // ====================================================
        // CREATE QUESTIONS
        // ====================================================

        for (
            const question of questions
        ) {

            await addDoc(
    collection(db, "quizQuestions"),
    {
        quizId: quizRef.id,

        courseId,

        moduleId:
            moduleId || null,

        lessonId:
            lessonId || null,

        instructorId:
            instructor.uid,

        question:
            question.question,

        type:
            question.type,

        options:
            question.options || [],

        correctAnswer:
            question.correctAnswer || "",

        points:
            Number(question.points || 1),

        order:
            question.order,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()
    }
);

        }


        showToast(
            "Quiz created successfully 🚀"
        );


        setTimeout(
            () => {

                window.location.href =
                    `quizzes.html?courseId=${
                        encodeURIComponent(
                            courseId
                        )
                    }`;

            },
            800
        );


    } catch (error) {

        console.error(
            "❌ Save quiz error:",
            error
        );

        alert(
            "Unable to save quiz. Please try again."
        );

    } finally {

        saving = false;

        setSavingState(
            false
        );

    }

}


// ============================================================
// SAVING STATE
// ============================================================

function setSavingState(
    state
) {

    const buttons = [

        $("saveQuizBtn"),

        $("bottomSaveQuizBtn")

    ];


    buttons.forEach(
        button => {

            if (!button) return;


            button.disabled =
                state;


            button.innerHTML =
                state
                    ? `
                        <i data-lucide="loader-circle"></i>
                        Saving...
                    `
                    : `
                        <i data-lucide="save"></i>
                        Save Quiz
                    `;

        }
    );


    refreshIcons();

}


// ============================================================
// CANCEL
// ============================================================

function cancelQuiz() {

    if (
        questions.length &&
        !confirm(
            "Discard this quiz?"
        )
    ) {

        return;

    }


    window.location.href =
        `quizzes.html?courseId=${
            encodeURIComponent(
                courseId
            )
        }`;

}


// ============================================================
// TOAST
// ============================================================

function showToast(
    message
) {

    let toast =
        $("quizToast");


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "quizToast";


        toast.style.cssText = `
            position:fixed;
            right:24px;
            bottom:24px;
            z-index:10000;
            padding:13px 17px;
            border-radius:10px;
            background:#081c3a;
            color:#fff;
            font:600 13px Poppins,sans-serif;
            box-shadow:0 12px 30px rgba(0,0,0,.2);
        `;


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            () => {

                toast.remove();

            },
            3000
        );

}


// ============================================================
// FATAL ERROR
// ============================================================

function showFatalError(
    message
) {

    const page =
        document.querySelector(
            ".create-quiz-page"
        );


    if (!page) {

        alert(message);

        return;

    }


    page.innerHTML = `

        <section style="
            max-width:600px;
            margin:80px auto;
            padding:40px;
            text-align:center;
            background:#fff;
            border:1px solid #e2e8f0;
            border-radius:16px;
        ">

            <div style="
                width:50px;
                height:50px;
                margin:0 auto 15px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:12px;
                background:#fef2f2;
                color:#ef4444;
            ">

                <i data-lucide="alert-circle"></i>

            </div>


            <h2 style="
                margin:0 0 8px;
                color:#0f172a;
                font-size:18px;
            ">
                Something went wrong
            </h2>


            <p style="
                margin:0;
                color:#64748b;
                font-size:13px;
            ">
                ${escapeHTML(message)}
            </p>

        </section>

    `;


    refreshIcons();

}