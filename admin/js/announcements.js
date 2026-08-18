// ============================================================
// SPARK STACK ACADEMY
// ADMIN — ANNOUNCEMENTS ENGINE
// ============================================================

import {
    db,
    auth
} from "../../js/firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    orderBy,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let announcements = [];
let filteredAnnouncements = [];

let editingAnnouncementId = null;
let currentPage = 1;

const ITEMS_PER_PAGE = 8;


// ============================================================
// DOM
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    bindEvents();

    if (window.lucide) {
        lucide.createIcons();
    }

    await loadAnnouncements();

});


// ============================================================
// LOAD ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    try {

        const announcementsRef =
            collection(db, "announcements");

        const q = query(
            announcementsRef,
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        announcements = snapshot.docs.map(docSnap => ({

            id: docSnap.id,

            ...docSnap.data()

        }));

        applyFilters();

        renderStats();

        renderAnalytics();

    } catch (error) {

        console.error(
            "Failed to load announcements:",
            error
        );

        announcements = [];

        applyFilters();

    }

}


// ============================================================
// EVENTS
// ============================================================

function bindEvents() {


    // ----------------------------------------------------------
    // REFRESH
    // ----------------------------------------------------------

    $("refreshAnnouncementsBtn")
        ?.addEventListener(
            "click",
            async () => {

                await loadAnnouncements();

            }
        );


    // ----------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------

    $("createAnnouncementBtn")
        ?.addEventListener(
            "click",
            () => {

                openAnnouncementModal();

            }
        );


    $("quickBroadcastBtn")
        ?.addEventListener(
            "click",
            () => {

                openAnnouncementModal();

                $("announcementAudience").value =
                    "all-users";

                $("announcementPriority").value =
                    "urgent";

            }
        );


    // ----------------------------------------------------------
    // CLOSE MODAL
    // ----------------------------------------------------------

    $("closeAnnouncementModal")
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    $("cancelAnnouncementBtn")
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    document
        .querySelector(
            "#announcementModal .admin-modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    // ----------------------------------------------------------
    // FORM
    // ----------------------------------------------------------

    $("announcementForm")
        ?.addEventListener(
            "submit",
            handleAnnouncementSubmit
        );


    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    $("announcementSearch")
        ?.addEventListener(
            "input",
            () => {

                currentPage = 1;

                applyFilters();

            }
        );


    // ----------------------------------------------------------
    // FILTERS
    // ----------------------------------------------------------

    [
        "announcementStatusFilter",
        "announcementAudienceFilter"
    ].forEach(id => {

        $(id)?.addEventListener(
            "change",
            () => {

                currentPage = 1;

                applyFilters();

            }
        );

    });


    // ----------------------------------------------------------
    // CLEAR
    // ----------------------------------------------------------

    $("clearAnnouncementFilters")
        ?.addEventListener(
            "click",
            () => {

                $("announcementSearch").value = "";

                $("announcementStatusFilter").value =
                    "all";

                $("announcementAudienceFilter").value =
                    "all";

                currentPage = 1;

                applyFilters();

            }
        );


    // ----------------------------------------------------------
    // PUBLISH TOGGLE
    // ----------------------------------------------------------

    $("publishImmediately")
        ?.addEventListener(
            "change",
            toggleScheduleField
        );


    // ----------------------------------------------------------
    // ESCAPE
    // ----------------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !$("announcementModal")
                    ?.classList.contains("hidden")
            ) {

                closeAnnouncementModal();

            }

        }
    );

}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    const search =
        $("announcementSearch")
            ?.value
            .trim()
            .toLowerCase() || "";

    const status =
        $("announcementStatusFilter")
            ?.value || "all";

    const audience =
        $("announcementAudienceFilter")
            ?.value || "all";


    filteredAnnouncements =
        announcements.filter(item => {


            const title =
                String(item.title || "")
                    .toLowerCase();

            const message =
                String(item.message || "")
                    .toLowerCase();


            const matchesSearch =
                !search ||
                title.includes(search) ||
                message.includes(search);


            const matchesStatus =
                status === "all" ||
                getAnnouncementStatus(item) === status;


            const matchesAudience =
                audience === "all" ||
                item.audience === audience;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesAudience
            );

        });


    renderTable();

}


// ============================================================
// STATUS
// ============================================================

function getAnnouncementStatus(item) {

    if (item.status) {
        return item.status;
    }

    if (
        item.scheduledAt &&
        !item.publishedAt
    ) {

        return "scheduled";

    }

    if (item.published === true) {

        return "published";

    }

    return "draft";

}


// ============================================================
// TABLE
// ============================================================

function renderTable() {

    const tbody =
        $("announcementsTableBody");

    const empty =
        $("announcementsEmptyState");

    const pagination =
        $("announcementsPagination");


    if (!tbody) return;


    tbody.innerHTML = "";


    const total =
        filteredAnnouncements.length;


    if ($("announcementResultsCount")) {

        $("announcementResultsCount")
            .textContent = total;

    }


    if (!total) {

        empty?.classList.remove("hidden");

        renderPagination(0);

        return;

    }


    empty?.classList.add("hidden");


    const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;


    const pageItems =
        filteredAnnouncements.slice(
            start,
            start + ITEMS_PER_PAGE
        );


    pageItems.forEach(item => {

        tbody.appendChild(
            createAnnouncementRow(item)
        );

    });


    renderPagination(total);


    if (window.lucide) {

        lucide.createIcons();

    }

}


// ============================================================
// ROW
// ============================================================

function createAnnouncementRow(item) {

    const tr =
        document.createElement("tr");


    const status =
        getAnnouncementStatus(item);


    const audience =
        formatAudience(item.audience);


    const priority =
        item.priority || "normal";


    const date =
        formatDate(
            item.publishedAt ||
            item.createdAt
        );


    const reach =
        Number(item.reach || 0);


    tr.innerHTML = `

        <td>

            <div class="announcement-cell">

                <div class="announcement-row-icon">

                    <i data-lucide="megaphone"></i>

                </div>

                <div>

                    <strong>
                        ${escapeHTML(
                            item.title || "Untitled"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            truncate(
                                item.message || "",
                                70
                            )
                        )}
                    </span>

                </div>

            </div>

        </td>


        <td>

            <span class="announcement-audience">

                ${escapeHTML(audience)}

            </span>

        </td>


        <td>

            <span class="
                announcement-priority
                ${escapeHTML(priority)}
            ">

                ${capitalize(priority)}

            </span>

        </td>


        <td>

            <span class="
                announcement-status
                ${escapeHTML(status)}
            ">

                ${capitalize(status)}

            </span>

        </td>


        <td>

            <span class="announcement-date">

                ${date}

            </span>

        </td>


        <td>

            <strong class="announcement-reach">

                ${reach.toLocaleString()}

            </strong>

        </td>


        <td>

            <div class="announcement-actions">

                <button
                    class="announcement-action-btn"
                    data-action="edit"
                    data-id="${item.id}"
                    title="Edit"
                >

                    <i data-lucide="pencil"></i>

                </button>


                <button
                    class="announcement-action-btn"
                    data-action="publish"
                    data-id="${item.id}"
                    title="Publish"
                >

                    <i data-lucide="send"></i>

                </button>


                <button
                    class="announcement-action-btn danger"
                    data-action="delete"
                    data-id="${item.id}"
                    title="Delete"
                >

                    <i data-lucide="trash-2"></i>

                </button>

            </div>

        </td>

    `;


    tr.querySelectorAll(
        ".announcement-action-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                handleRowAction(
                    button.dataset.action,
                    button.dataset.id
                );

            }
        );

    });


    return tr;

}


// ============================================================
// ROW ACTIONS
// ============================================================

async function handleRowAction(
    action,
    id
) {

    const item =
        announcements.find(
            announcement =>
                announcement.id === id
        );


    if (!item) return;


    if (action === "edit") {

        openAnnouncementModal(item);

        return;

    }


    if (action === "publish") {

        await publishAnnouncement(item);

        return;

    }


    if (action === "delete") {

        await deleteAnnouncement(item);

    }

}


// ============================================================
// CREATE / EDIT
// ============================================================

function openAnnouncementModal(item = null) {

    editingAnnouncementId =
        item?.id || null;


    $("announcementModal")
        ?.classList.remove("hidden");


    $("announcementModal")
        ?.setAttribute(
            "aria-hidden",
            "false"
        );


    if (item) {

        $("announcementModalTitle")
            .textContent =
            "Edit Announcement";


        $("announcementTitle").value =
            item.title || "";


        $("announcementMessage").value =
            item.message || "";


        $("announcementAudience").value =
            item.audience ||
            "all-users";


        $("announcementPriority").value =
            item.priority ||
            "normal";


        $("publishImmediately").checked =
            item.status !== "scheduled";


        $("sendAnnouncementNotification").checked =
            item.sendNotification !== false;


        toggleScheduleField();


    } else {

        $("announcementModalTitle")
            .textContent =
            "New Announcement";


        $("announcementForm")
            ?.reset();


        $("publishImmediately").checked =
            true;


        $("sendAnnouncementNotification")
            .checked = true;


        toggleScheduleField();

    }


    if (window.lucide) {

        lucide.createIcons();

    }

}


// ============================================================
// CLOSE
// ============================================================

function closeAnnouncementModal() {

    $("announcementModal")
        ?.classList.add("hidden");


    $("announcementModal")
        ?.setAttribute(
            "aria-hidden",
            "true"
        );


    editingAnnouncementId = null;

}


// ============================================================
// SCHEDULE FIELD
// ============================================================

function toggleScheduleField() {

    const scheduleField =
        $("announcementScheduleField");


    if (
        !$("publishImmediately") ||
        !scheduleField
    ) return;


    if (
        $("publishImmediately").checked
    ) {

        scheduleField.classList.add(
            "hidden"
        );

    } else {

        scheduleField.classList.remove(
            "hidden"
        );

    }

}


// ============================================================
// SUBMIT
// ============================================================

async function handleAnnouncementSubmit(
    event
) {

    event.preventDefault();


    const title =
        $("announcementTitle")
            .value.trim();


    const message =
        $("announcementMessage")
            .value.trim();


    const audience =
        $("announcementAudience")
            .value;


    const priority =
        $("announcementPriority")
            .value;


    const sendNotification =
        $("sendAnnouncementNotification")
            .checked;


    const publishImmediately =
        $("publishImmediately")
            .checked;


    const schedule =
        $("announcementSchedule")
            ?.value;


    if (!title || !message) {

        alert(
            "Please enter a title and message."
        );

        return;

    }


    if (
        !publishImmediately &&
        !schedule
    ) {

        alert(
            "Please select a schedule date and time."
        );

        return;

    }


    const button =
        $("saveAnnouncementBtn");


    if (button) {

        button.disabled = true;

        button.innerHTML =
            `<span>Saving...</span>`;

    }


    try {

        const status =
            publishImmediately
                ? "published"
                : "scheduled";


        const payload = {

            title,

            message,

            audience,

            priority,

            status,

            published:
                publishImmediately,

            sendNotification,

            reach: 0,

            createdBy:
                auth.currentUser?.uid || null,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        if (!publishImmediately) {

            payload.scheduledAt =
                new Date(schedule);

        }


        if (publishImmediately) {

            payload.publishedAt =
                serverTimestamp();

        }


        if (editingAnnouncementId) {

            await updateDoc(

                doc(
                    db,
                    "announcements",
                    editingAnnouncementId
                ),

                {

                    title,

                    message,

                    audience,

                    priority,

                    status,

                    published:
                        publishImmediately,

                    sendNotification,

                    updatedAt:
                        serverTimestamp(),

                    ...(publishImmediately
                        ? {
                            publishedAt:
                                serverTimestamp()
                        }
                        : {
                            scheduledAt:
                                new Date(schedule)
                        })

                }

            );

        } else {

            await addDoc(
                collection(
                    db,
                    "announcements"
                ),
                payload
            );

        }


        closeAnnouncementModal();


        await loadAnnouncements();


        alert(
            publishImmediately
                ? "Announcement published successfully."
                : "Announcement scheduled successfully."
        );


    } catch (error) {

        console.error(
            "Announcement save error:",
            error
        );

        alert(
            "Failed to save announcement."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `

                <i data-lucide="send"></i>

                Publish Announcement

            `;

            if (window.lucide) {

                lucide.createIcons();

            }

        }

    }

}


// ============================================================
// PUBLISH
// ============================================================

async function publishAnnouncement(item) {

    if (
        !confirm(
            `Publish "${item.title}" now?`
        )
    ) return;


    try {

        await updateDoc(

            doc(
                db,
                "announcements",
                item.id
            ),

            {

                status: "published",

                published: true,

                publishedAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }

        );


        await loadAnnouncements();


    } catch (error) {

        console.error(error);

        alert(
            "Failed to publish announcement."
        );

    }

}


// ============================================================
// DELETE
// ============================================================

async function deleteAnnouncement(item) {

    if (
        !confirm(
            `Delete "${item.title}"?`
        )
    ) return;


    try {

        await deleteDoc(

            doc(
                db,
                "announcements",
                item.id
            )

        );


        await loadAnnouncements();


    } catch (error) {

        console.error(error);

        alert(
            "Failed to delete announcement."
        );

    }

}


// ============================================================
// STATS
// ============================================================

function renderStats() {

    const total =
        announcements.length;


    const published =
        announcements.filter(
            item =>
                getAnnouncementStatus(item) ===
                "published"
        ).length;


    const scheduled =
        announcements.filter(
            item =>
                getAnnouncementStatus(item) ===
                "scheduled"
        ).length;


    const recipients =
        announcements.reduce(
            (sum, item) =>
                sum +
                Number(item.reach || 0),
            0
        );


    setText(
        "totalAnnouncements",
        total
    );

    setText(
        "publishedAnnouncements",
        published
    );

    setText(
        "scheduledAnnouncements",
        scheduled
    );

    setText(
        "announcementRecipients",
        recipients
    );

}


// ============================================================
// ANALYTICS
// ============================================================

function renderAnalytics() {

    const delivered =
        announcements.reduce(
            (sum, item) =>
                sum +
                Number(item.delivered || 0),
            0
        );


    const read =
        announcements.reduce(
            (sum, item) =>
                sum +
                Number(item.read || 0),
            0
        );


    const readRate =
        delivered > 0
            ? Math.round(
                (read / delivered) * 100
            )
            : 0;


    setText(
        "deliveredCount",
        delivered
    );


    setText(
        "readCount",
        read
    );


    setText(
        "readRate",
        `${readRate}%`
    );


    renderAudienceBreakdown();

}


// ============================================================
// AUDIENCE BREAKDOWN
// ============================================================

function renderAudienceBreakdown() {

    const container =
        $("announcementAudienceBreakdown");


    if (!container) return;


    const counts = {

        "all-users": 0,

        students: 0,

        instructors: 0

    };


    announcements.forEach(item => {

        if (
            counts[item.audience] !== undefined
        ) {

            counts[item.audience] += 1;

        }

    });


    const total =
        announcements.length || 1;


    container.innerHTML = `

        ${Object.entries(counts)
            .map(
                ([key, value]) => {

                    const percent =
                        Math.round(
                            (value / total) * 100
                        );


                    return `

                        <div class="audience-breakdown-item">

                            <div>

                                <span>
                                    ${escapeHTML(
                                        formatAudience(key)
                                    )}
                                </span>

                                <strong>
                                    ${value}
                                </strong>

                            </div>

                            <div class="audience-progress">

                                <span
                                    style="width:${percent}%"
                                ></span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("")}

    `;

}


// ============================================================
// PAGINATION
// ============================================================

function renderPagination(total) {

    const container =
        $("announcementsPagination");


    if (!container) return;


    container.innerHTML = "";


    const pages =
        Math.ceil(
            total / ITEMS_PER_PAGE
        );


    if (pages <= 1) return;


    for (
        let i = 1;
        i <= pages;
        i++
    ) {

        const button =
            document.createElement("button");


        button.className =
            "announcement-page-btn";


        if (i === currentPage) {

            button.classList.add("active");

        }


        button.textContent = i;


        button.addEventListener(
            "click",
            () => {

                currentPage = i;

                renderTable();

            }
        );


        container.appendChild(button);

    }

}


// ============================================================
// HELPERS
// ============================================================

function setText(
    id,
    value
) {

    const element = $(id);

    if (element) {

        element.textContent = value;

    }

}


function formatAudience(
    audience
) {

    const labels = {

        "all-users":
            "Everyone",

        students:
            "Students",

        instructors:
            "Instructors"

    };


    return (
        labels[audience] ||
        "Everyone"
    );

}


function capitalize(value) {

    if (!value) return "";

    return value
        .charAt(0)
        .toUpperCase() +
        value.slice(1);

}


function truncate(
    value,
    length
) {

    if (
        !value ||
        value.length <= length
    ) {

        return value || "";

    }


    return (
        value.slice(
            0,
            length
        ) + "..."
    );

}


function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "—";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


        return date.toLocaleDateString(
            "en-KE",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return "—";

    }

}


function escapeHTML(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}