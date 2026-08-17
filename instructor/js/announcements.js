// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR ANNOUNCEMENTS ENGINE
// ============================================================

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentInstructor = null;
let announcements = [];
let activeFilter = "all";


// ============================================================
// DOM
// ============================================================

const $ = id =>
    document.getElementById(id);


// ============================================================
// BOOT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupUI();

        waitForInstructor();

    }
);


// ============================================================
// AUTH
// ============================================================

function waitForInstructor() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "../login.html";

                return;

            }


            currentInstructor =
                window.currentInstructor || {

                    uid: user.uid,

                    email:
                        user.email || "",

                    displayName:
                        user.displayName ||
                        "Instructor"

                };


            await loadAnnouncements();

        }
    );

}


// ============================================================
// UI SETUP
// ============================================================

function setupUI() {

    const createButton =
        $("createAnnouncementBtn");

    const emptyButton =
        $("emptyCreateAnnouncementBtn");

    const closeButton =
        $("closeAnnouncementModal");

    const cancelButton =
        $("cancelAnnouncementBtn");

    const backdrop =
        document.querySelector(
            ".announcement-modal-backdrop"
        );

    const form =
        $("announcementForm");

    const message =
        $("announcementMessage");


    createButton?.addEventListener(
        "click",
        openModal
    );


    emptyButton?.addEventListener(
        "click",
        openModal
    );


    closeButton?.addEventListener(
        "click",
        closeModal
    );


    cancelButton?.addEventListener(
        "click",
        closeModal
    );


    backdrop?.addEventListener(
        "click",
        closeModal
    );


    form?.addEventListener(
        "submit",
        publishAnnouncement
    );


    message?.addEventListener(
        "input",
        updateCharacterCount
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );


    // FILTERS

    document
        .querySelectorAll(
            ".announcement-filter"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".announcement-filter"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );


                    button.classList.add(
                        "active"
                    );


                    activeFilter =
                        button.dataset.filter ||
                        "all";


                    renderAnnouncements();

                }
            );

        });


    // SEARCH

    $("announcementSearch")
        ?.addEventListener(
            "input",
            renderAnnouncements
        );


    refreshIcons();

}


// ============================================================
// OPEN MODAL
// ============================================================

function openModal() {

    const modal =
        $("announcementModal");


    if (!modal) return;


    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";


    setTimeout(
        () =>
            $("announcementTitle")?.focus(),
        100
    );

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    const modal =
        $("announcementModal");


    if (!modal) return;


    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";


    $("announcementForm")?.reset();


    updateCharacterCount();

}


// ============================================================
// CHARACTER COUNT
// ============================================================

function updateCharacterCount() {

    const message =
        $("announcementMessage");

    const counter =
        $("announcementCharCount");


    if (!message || !counter) return;


    counter.textContent =
        message.value.length;

}


// ============================================================
// PUBLISH
// ============================================================

async function publishAnnouncement(
    event
) {

    event.preventDefault();


    if (!currentInstructor) {

        alert(
            "Your instructor session is still loading."
        );

        return;

    }


    const title =
        $("announcementTitle")
            ?.value
            .trim();


    const message =
        $("announcementMessage")
            ?.value
            .trim();


    const audience =
        $("announcementAudience")
            ?.value || "all";


    const priority =
        document.querySelector(
            'input[name="priority"]:checked'
        )?.value || "normal";


    if (!title || !message) {

        alert(
            "Please enter a title and message."
        );

        return;

    }


    const publishButton =
        $("publishAnnouncementBtn");


    try {

        if (publishButton) {

            publishButton.disabled =
                true;

            publishButton.innerHTML = `
                <span class="loading-spinner"></span>
                Publishing...
            `;

        }


        await addDoc(
            collection(
                db,
                "announcements"
            ),
            {

                title,

                message,

                audience,

                priority,

                status: "published",

                authorId:
                    currentInstructor.uid,

                authorName:
                    currentInstructor.displayName ||
                    "Instructor",

                authorRole:
                    "instructor",

                createdAt:
                    serverTimestamp()

            }
        );


        closeModal();


        alert(
            "Announcement published successfully! 🎉"
        );


        await loadAnnouncements();


    } catch (error) {

        console.error(
            "❌ Failed to publish announcement:",
            error
        );


        alert(
            "Unable to publish announcement. Please try again."
        );


    } finally {

        if (publishButton) {

            publishButton.disabled =
                false;

            publishButton.innerHTML = `
                <i data-lucide="send"></i>
                Publish Announcement
            `;

            refreshIcons();

        }

    }

}


// ============================================================
// LOAD ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    const list =
        $("announcementList");


    if (list) {

        list.innerHTML = `
            <div class="assignment-loading">
                <div class="loading-spinner"></div>
                <span>Loading announcements...</span>
            </div>
        `;

    }


    try {

        const announcementsRef =
            collection(
                db,
                "announcements"
            );


        const q =
            query(
                announcementsRef,
                where(
                    "authorId",
                    "==",
                    currentInstructor.uid
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(q);


        announcements =
            snapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        updateStats();

        renderAnnouncements();


    } catch (error) {

        console.error(
            "❌ Failed loading announcements:",
            error
        );


        if (list) {

            list.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Unable to load announcements
                    </h3>
                    <p>
                        Please refresh the page and try again.
                    </p>
                </div>
            `;

        }

    }

}


// ============================================================
// FILTER + SEARCH
// ============================================================

function getVisibleAnnouncements() {

    const search =
        $("announcementSearch")
            ?.value
            .trim()
            .toLowerCase() || "";


    return announcements.filter(
        announcement => {

            const status =
                announcement.status ||
                "published";


            const matchesFilter =
                activeFilter === "all" ||
                status === activeFilter;


            const matchesSearch =
                !search ||
                String(
                    announcement.title || ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    announcement.message || ""
                )
                    .toLowerCase()
                    .includes(search);


            return (
                matchesFilter &&
                matchesSearch
            );

        }
    );

}


// ============================================================
// RENDER
// ============================================================

function renderAnnouncements() {

    const list =
        $("announcementList");

    const empty =
        $("announcementEmpty");


    if (!list) return;


    const visible =
        getVisibleAnnouncements();


    if (!visible.length) {

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
        visible.map(
            announcement =>
                createAnnouncementHTML(
                    announcement
                )
        ).join("");


    refreshIcons();

}


// ============================================================
// ANNOUNCEMENT CARD
// ============================================================

function createAnnouncementHTML(
    announcement
) {

    const title =
        escapeHTML(
            announcement.title ||
            "Untitled Announcement"
        );


    const message =
        escapeHTML(
            announcement.message ||
            ""
        );


    const audience =
        formatAudience(
            announcement.audience
        );


    const priority =
        announcement.priority ||
        "normal";


    const date =
        formatDate(
            announcement.createdAt
        );


    return `

        <article class="announcement-item">

            <div class="announcement-item-icon">

                <i data-lucide="megaphone"></i>

            </div>


            <div class="announcement-item-content">

                <div class="announcement-item-top">

                    <h3>
                        ${title}
                    </h3>

                    <span class="
                        announcement-priority
                        ${priority}
                    ">
                        ${priority}
                    </span>

                </div>


                <p>
                    ${message}
                </p>


                <div class="announcement-meta">

                    <span>
                        <i data-lucide="users"></i>
                        ${audience}
                    </span>

                    <span>
                        <i data-lucide="clock-3"></i>
                        ${date}
                    </span>

                </div>

            </div>

        </article>

    `;

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        announcements.length;


    const published =
        announcements.filter(
            item =>
                item.status ===
                "published"
        ).length;


    const draft =
        announcements.filter(
            item =>
                item.status ===
                "draft"
        ).length;


    setText(
        "totalAnnouncements",
        total
    );


    setText(
        "publishedAnnouncements",
        published
    );


    setText(
        "draftAnnouncements",
        draft
    );

}


// ============================================================
// AUDIENCE
// ============================================================

function formatAudience(
    audience
) {

    const labels = {

        all:
            "Everyone",

        students:
            "Students",

        instructors:
            "Instructors",

        founder:
            "Founder / Admin"

    };


    return (
        labels[audience] ||
        "Everyone"
    );

}


// ============================================================
// DATE
// ============================================================

function formatDate(
    timestamp
) {

    if (
        !timestamp ||
        !timestamp.toDate
    ) {

        return "Just now";

    }


    return timestamp
        .toDate()
        .toLocaleDateString(
            "en-KE",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ============================================================
// TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value;

    }

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