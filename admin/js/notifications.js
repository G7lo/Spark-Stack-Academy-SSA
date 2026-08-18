// ============================================================
// SPARK STACK ACADEMY
// ADMIN — NOTIFICATIONS ENGINE
// ============================================================

import {
    db,
    auth
} from "../../js/firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let notifications = [];
let filteredNotifications = [];

let currentPage = 1;
const pageSize = 10;

let activeNotificationId = null;


// ============================================================
// DOM
// ============================================================

const tableBody =
    document.getElementById("notificationsTableBody");

const searchInput =
    document.getElementById("notificationSearch");

const statusFilter =
    document.getElementById("notificationStatusFilter");

const typeFilter =
    document.getElementById("notificationTypeFilter");

const clearFiltersBtn =
    document.getElementById("clearNotificationFilters");

const resultsCount =
    document.getElementById("notificationResultsCount");

const pagination =
    document.getElementById("notificationsPagination");

const emptyState =
    document.getElementById("notificationsEmptyState");


// ============================================================
// HELPERS
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) return "—";

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    return date.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function formatDateTime(timestamp) {

    if (!timestamp) return "—";

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    return date.toLocaleString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getStatus(notification) {

    if (notification.read === true) {
        return "read";
    }

    return "unread";
}


function getType(notification) {

    return (
        notification.type ||
        notification.category ||
        "general"
    );
}


function getTitle(notification) {

    return (
        notification.title ||
        notification.subject ||
        "Notification"
    );
}


// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

function loadNotifications() {

    if (!tableBody) return;

    const notificationsRef =
        collection(db, "notifications");

    const notificationsQuery =
        query(
            notificationsRef,
            orderBy("createdAt", "desc")
        );

    onSnapshot(
        notificationsQuery,
        snapshot => {

            notifications =
                snapshot.docs.map(item => ({
                    id: item.id,
                    ...item.data()
                }));

            updateStats();

            applyFilters();

        },
        error => {

            console.error(
                "❌ Notifications load error:",
                error
            );

            showError();

        }
    );
}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    const search =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";

    const status =
        statusFilter?.value || "all";

    const type =
        typeFilter?.value || "all";


    filteredNotifications =
        notifications.filter(notification => {

            const title =
                getTitle(notification)
                    .toLowerCase();

            const message =
                (notification.message || "")
                    .toLowerCase();

            const recipient =
                (notification.recipientName || "")
                    .toLowerCase();

            const notificationType =
                getType(notification);

            const notificationStatus =
                getStatus(notification);


            const matchesSearch =
                !search ||
                title.includes(search) ||
                message.includes(search) ||
                recipient.includes(search);


            const matchesStatus =
                status === "all" ||
                notificationStatus === status;


            const matchesType =
                type === "all" ||
                notificationType === type;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );

        });


    currentPage = 1;

    renderNotifications();

}


// ============================================================
// RENDER
// ============================================================

function renderNotifications() {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!filteredNotifications.length) {

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        if (pagination) {
            pagination.innerHTML = "";
        }

        updateResultsCount();

        return;
    }


    if (emptyState) {
        emptyState.classList.add("hidden");
    }


    const start =
        (currentPage - 1) * pageSize;

    const end =
        start + pageSize;

    const pageItems =
        filteredNotifications.slice(
            start,
            end
        );


    pageItems.forEach(notification => {

        const row =
            document.createElement("tr");

        const status =
            getStatus(notification);

        const type =
            getType(notification);

        const title =
            getTitle(notification);

        row.className =
            status === "unread"
                ? "notification-unread"
                : "";


        row.innerHTML = `

            <td>

                <div class="notification-cell">

                    <div class="notification-icon ${escapeHTML(type)}">

                        <i data-lucide="bell"></i>

                    </div>

                    <div class="notification-cell-info">

                        <strong>
                            ${escapeHTML(title)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                notification.message || ""
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <td>

                <span class="notification-recipient">

                    ${escapeHTML(
                        notification.recipientName ||
                        notification.recipientEmail ||
                        "All Users"
                    )}

                </span>

            </td>


            <td>

                <span class="notification-type ${escapeHTML(type)}">

                    ${escapeHTML(
                        type.charAt(0).toUpperCase() +
                        type.slice(1)
                    )}

                </span>

            </td>


            <td>

                <span class="notification-status ${status}">

                    ${status === "read"
                        ? "Read"
                        : "Unread"}

                </span>

            </td>


            <td>

                <span class="notification-date">

                    ${formatDate(
                        notification.createdAt
                    )}

                </span>

            </td>


            <td>

                <div class="notification-actions">

                    <button
                        type="button"
                        class="notification-action-btn"
                        data-action="view"
                        data-id="${notification.id}"
                        title="View"
                    >
                        <i data-lucide="eye"></i>
                    </button>


                    ${
                        status === "unread"
                        ? `
                        <button
                            type="button"
                            class="notification-action-btn"
                            data-action="read"
                            data-id="${notification.id}"
                            title="Mark as read"
                        >
                            <i data-lucide="check"></i>
                        </button>
                        `
                        : ""
                    }


                    <button
                        type="button"
                        class="notification-action-btn danger"
                        data-action="delete"
                        data-id="${notification.id}"
                        title="Delete"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });


    if (window.lucide) {
        lucide.createIcons();
    }


    renderPagination();

    updateResultsCount();

}


// ============================================================
// PAGINATION
// ============================================================

function renderPagination() {

    if (!pagination) return;

    pagination.innerHTML = "";

    const totalPages =
        Math.ceil(
            filteredNotifications.length /
            pageSize
        );

    if (totalPages <= 1) return;


    const previous =
        document.createElement("button");

    previous.className =
        "notification-page-btn";

    previous.innerHTML =
        `<i data-lucide="chevron-left"></i>`;

    previous.disabled =
        currentPage === 1;

    previous.onclick = () => {

        if (currentPage > 1) {

            currentPage--;

            renderNotifications();

        }

    };

    pagination.appendChild(previous);


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            document.createElement("button");

        button.className =
            "notification-page-btn";

        if (page === currentPage) {
            button.classList.add("active");
        }

        button.textContent = page;

        button.onclick = () => {

            currentPage = page;

            renderNotifications();

        };

        pagination.appendChild(button);

    }


    const next =
        document.createElement("button");

    next.className =
        "notification-page-btn";

    next.innerHTML =
        `<i data-lucide="chevron-right"></i>`;

    next.disabled =
        currentPage === totalPages;

    next.onclick = () => {

        if (currentPage < totalPages) {

            currentPage++;

            renderNotifications();

        }

    };

    pagination.appendChild(next);


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// RESULTS COUNT
// ============================================================

function updateResultsCount() {

    if (!resultsCount) return;

    resultsCount.textContent =
        filteredNotifications.length;

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        notifications.length;

    const unread =
        notifications.filter(
            item => getStatus(item) === "unread"
        ).length;

    const read =
        notifications.filter(
            item => getStatus(item) === "read"
        ).length;


    const totalEl =
        document.getElementById(
            "totalNotifications"
        );

    const unreadEl =
        document.getElementById(
            "unreadNotifications"
        );

    const readEl =
        document.getElementById(
            "readNotifications"
        );


    if (totalEl)
        totalEl.textContent = total;

    if (unreadEl)
        unreadEl.textContent = unread;

    if (readEl)
        readEl.textContent = read;

}


// ============================================================
// MARK AS READ
// ============================================================

async function markAsRead(id) {

    try {

        await updateDoc(
            doc(db, "notifications", id),
            {
                read: true,
                readAt: serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "❌ Failed to mark notification read:",
            error
        );

    }

}


// ============================================================
// DELETE
// ============================================================

async function deleteNotification(id) {

    const confirmed =
        confirm(
            "Delete this notification?"
        );

    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(db, "notifications", id)
        );

    } catch (error) {

        console.error(
            "❌ Failed to delete notification:",
            error
        );

    }

}


// ============================================================
// VIEW NOTIFICATION
// ============================================================

function viewNotification(id) {

    const notification =
        notifications.find(
            item => item.id === id
        );

    if (!notification) return;

    activeNotificationId = id;


    const modal =
        document.getElementById(
            "notificationDetailsModal"
        );

    if (!modal) {

        console.log(
            "Notification:",
            notification
        );

        markAsRead(id);

        return;
    }


    const title =
        document.getElementById(
            "notificationModalTitle"
        );

    const message =
        document.getElementById(
            "notificationModalMessage"
        );

    const recipient =
        document.getElementById(
            "notificationModalRecipient"
        );

    const date =
        document.getElementById(
            "notificationModalDate"
        );


    if (title)
        title.textContent =
            getTitle(notification);

    if (message)
        message.textContent =
            notification.message || "";

    if (recipient)
        recipient.textContent =
            notification.recipientName ||
            notification.recipientEmail ||
            "All Users";

    if (date)
        date.textContent =
            formatDateTime(
                notification.createdAt
            );


    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    markAsRead(id);


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeNotificationModal() {

    const modal =
        document.getElementById(
            "notificationDetailsModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    activeNotificationId = null;

}


// ============================================================
// TABLE ACTIONS
// ============================================================

tableBody?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) return;

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;

        if (!id) return;


        if (action === "read") {

            markAsRead(id);

        }


        if (action === "delete") {

            deleteNotification(id);

        }


        if (action === "view") {

            viewNotification(id);

        }

    }
);


// ============================================================
// SEARCH
// ============================================================

searchInput?.addEventListener(
    "input",
    applyFilters
);


// ============================================================
// FILTERS
// ============================================================

statusFilter?.addEventListener(
    "change",
    applyFilters
);

typeFilter?.addEventListener(
    "change",
    applyFilters
);


// ============================================================
// CLEAR FILTERS
// ============================================================

clearFiltersBtn?.addEventListener(
    "click",
    () => {

        if (searchInput)
            searchInput.value = "";

        if (statusFilter)
            statusFilter.value = "all";

        if (typeFilter)
            typeFilter.value = "all";

        applyFilters();

    }
);


// ============================================================
// CLOSE MODAL
// ============================================================

document
    .getElementById("closeNotificationDetails")
    ?.addEventListener(
        "click",
        closeNotificationModal
    );


document
    .querySelector(
        "#notificationDetailsModal .admin-modal-backdrop"
    )
    ?.addEventListener(
        "click",
        closeNotificationModal
    );


// ============================================================
// ESCAPE KEY
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeNotificationModal();

        }

    }
);


// ============================================================
// SEND NOTIFICATION
// ============================================================

export async function sendNotification({
    recipientId = null,
    recipientName = "User",
    recipientEmail = null,
    title,
    message,
    type = "general",
    priority = "normal"
}) {

    if (!title || !message) {
        throw new Error(
            "Notification title and message are required."
        );
    }


    const currentUser =
        auth.currentUser;


    await addDoc(
        collection(db, "notifications"),
        {

            recipientId,

            recipientName,

            recipientEmail,

            title,

            message,

            type,

            priority,

            read: false,

            createdAt:
                serverTimestamp(),

            createdBy:
                currentUser?.uid || null,

            createdByName:
                currentUser?.displayName ||
                currentUser?.email ||
                "Administrator"

        }
    );

}


// ============================================================
// ERROR STATE
// ============================================================

function showError() {

    if (!tableBody) return;

    tableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-state-cell"
            >

                <div class="table-loading">

                    <span>
                        Unable to load notifications.
                    </span>

                </div>

            </td>

        </tr>

    `;

}


// ============================================================
// REFRESH BUTTON
// ============================================================

document
    .getElementById(
        "refreshNotificationsBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            applyFilters();

        }
    );


// ============================================================
// INITIALIZE
// ============================================================

loadNotifications();

console.log(
    "🔥🔥🔥 NOTIFICATIONS JS LOADED 🔥🔥🔥"
);