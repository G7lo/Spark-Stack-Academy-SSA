// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR NOTIFICATIONS ENGINE
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
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentInstructor = null;
let allNotifications = [];

let currentFilter = "all";
let currentSearch = "";

const PAGE_SIZE = 20;
let visibleCount = PAGE_SIZE;


// ============================================================
// DOM
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// ICONS
// ============================================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons === "function"
    ) {
        window.lucide.createIcons();
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
// DATE
// ============================================================

function formatNotificationDate(timestamp) {

    if (!timestamp) return "Recently";

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    const now = new Date();

    const diff =
        Math.floor(
            (now - date) / 1000
        );

    if (diff < 60) {
        return "Just now";
    }

    if (diff < 3600) {
        return `${Math.floor(diff / 60)}m ago`;
    }

    if (diff < 86400) {
        return `${Math.floor(diff / 3600)}h ago`;
    }

    if (diff < 604800) {
        return `${Math.floor(diff / 86400)}d ago`;
    }

    return date.toLocaleDateString(
        "en-KE",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// NOTIFICATION TYPE
// ============================================================

function getNotificationType(data) {

    const type =
        String(
            data.type ||
            data.category ||
            "system"
        ).toLowerCase();

    if (
        type.includes("student") ||
        type.includes("enrollment")
    ) {
        return {
            key: "student",
            icon: "graduation-cap"
        };
    }

    if (
        type.includes("assignment")
    ) {
        return {
            key: "assignment",
            icon: "clipboard-check"
        };
    }

    if (
        type.includes("message") ||
        type.includes("chat")
    ) {
        return {
            key: "message",
            icon: "message-circle"
        };
    }

    if (
        type.includes("earning") ||
        type.includes("payment") ||
        type.includes("withdraw")
    ) {
        return {
            key: "earnings",
            icon: "wallet"
        };
    }

    if (
        type.includes("announcement")
    ) {
        return {
            key: "announcement",
            icon: "megaphone"
        };
    }

    return {
        key: "system",
        icon: "bell"
    };

}


// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

async function loadNotifications() {

    if (!currentInstructor) return;

    const list = $("notificationList");

    if (list) {

        list.innerHTML = `
            <div class="notifications-loading">
                <div class="loading-spinner"></div>
                <span>Loading notifications...</span>
            </div>
        `;

    }

    try {

        const q =
            query(
                collection(db, "notifications"),
                where(
                    "recipientId",
                    "==",
                    currentInstructor.uid
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(100)
            );

        const snapshot =
            await getDocs(q);

        allNotifications =
            snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

        visibleCount = PAGE_SIZE;

        updateStats();

        renderNotifications();

        console.log(
            `✓ Loaded ${allNotifications.length} instructor notifications`
        );

    } catch (error) {

        console.error(
            "❌ Failed loading notifications:",
            error
        );

        showNotificationError(error);

    }

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        allNotifications.length;

    const unread =
        allNotifications.filter(
            item => item.read !== true
        ).length;

    const students =
        allNotifications.filter(
            item => {

                const type =
                    getNotificationType(item).key;

                return type === "student";

            }
        ).length;

    const earnings =
        allNotifications.filter(
            item => {

                const type =
                    getNotificationType(item).key;

                return type === "earnings";

            }
        ).length;


    setText(
        "totalNotifications",
        total
    );

    setText(
        "unreadNotifications",
        unread
    );

    setText(
        "studentNotifications",
        students
    );

    setText(
        "earningNotifications",
        earnings
    );

}


// ============================================================
// FILTER
// ============================================================

function matchesFilter(item) {

    const type =
        getNotificationType(item).key;

    if (currentFilter === "all") {
        return true;
    }

    if (currentFilter === "unread") {
        return item.read !== true;
    }

    if (currentFilter === "students") {
        return type === "student";
    }

    if (currentFilter === "assignments") {
        return type === "assignment";
    }

    if (currentFilter === "earnings") {
        return type === "earnings";
    }

    if (currentFilter === "system") {
        return type === "system";
    }

    return true;

}


// ============================================================
// SEARCH
// ============================================================

function matchesSearch(item) {

    if (!currentSearch) {
        return true;
    }

    const searchable = [

        item.title,
        item.message,
        item.description,
        item.courseName,
        item.type

    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


    return searchable.includes(
        currentSearch.toLowerCase()
    );

}


// ============================================================
// GET FILTERED
// ============================================================

function getFilteredNotifications() {

    return allNotifications.filter(
        item =>
            matchesFilter(item) &&
            matchesSearch(item)
    );

}


// ============================================================
// RENDER
// ============================================================

function renderNotifications() {

    const list =
        $("notificationList");

    const empty =
        $("notificationEmpty");

    const pagination =
        $("notificationPagination");


    if (!list) return;


    const filtered =
        getFilteredNotifications();


    if (!filtered.length) {

        list.innerHTML = "";

        empty?.classList.remove("hidden");

        pagination?.classList.add("hidden");

        return;

    }


    empty?.classList.add("hidden");


    const visible =
        filtered.slice(
            0,
            visibleCount
        );


    list.innerHTML =
        visible
            .map(renderNotification)
            .join("");


    if (
        visibleCount <
        filtered.length
    ) {

        pagination?.classList.remove(
            "hidden"
        );

    } else {

        pagination?.classList.add(
            "hidden"
        );

    }


    refreshIcons();

}


// ============================================================
// RENDER ITEM
// ============================================================

function renderNotification(item) {

    const type =
        getNotificationType(item);

    const unread =
        item.read !== true;


    const title =
        item.title ||
        getDefaultTitle(type.key);


    const message =
        item.message ||
        item.description ||
        "You have a new academy update.";


    return `

        <article
            class="notification-item ${unread ? "unread" : ""}"
            data-id="${escapeHTML(item.id)}"
        >

            <div
                class="notification-icon ${type.key}"
            >

                <i data-lucide="${type.icon}"></i>

            </div>


            <div class="notification-content">

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

                <span class="notification-time">
                    ${formatNotificationDate(
                        item.createdAt
                    )}
                </span>

            </div>


            ${
                unread
                    ? `
                        <span
                            class="notification-unread-dot"
                            title="Unread"
                        ></span>
                    `
                    : ""
            }

        </article>

    `;

}


// ============================================================
// DEFAULT TITLES
// ============================================================

function getDefaultTitle(type) {

    const titles = {

        student:
            "New Student Activity",

        assignment:
            "Assignment Update",

        message:
            "New Student Message",

        earnings:
            "Earnings Update",

        announcement:
            "Academy Announcement",

        system:
            "Academy Update"

    };

    return (
        titles[type] ||
        titles.system
    );

}


// ============================================================
// MARK ONE READ
// ============================================================

async function markNotificationRead(id) {

    const item =
        allNotifications.find(
            notification =>
                notification.id === id
        );

    if (!item || item.read === true) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "notifications",
                id
            ),
            {
                read: true
            }
        );


        item.read = true;

        updateStats();

        renderNotifications();

    } catch (error) {

        console.error(
            "❌ Failed marking notification:",
            error
        );

    }

}


// ============================================================
// MARK ALL READ
// ============================================================

async function markAllRead() {

    if (!currentInstructor) return;


    const unread =
        allNotifications.filter(
            item => item.read !== true
        );


    if (!unread.length) {

        alert(
            "You're already all caught up."
        );

        return;

    }


    const button =
        $("markAllReadBtn");


    try {

        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <i data-lucide="loader-circle"></i>
                Updating...
            `;

            refreshIcons();

        }


        const batch =
            writeBatch(db);


        unread.forEach(item => {

            batch.update(
                doc(
                    db,
                    "notifications",
                    item.id
                ),
                {
                    read: true
                }
            );

        });


        await batch.commit();


        unread.forEach(item => {
            item.read = true;
        });


        updateStats();

        renderNotifications();


    } catch (error) {

        console.error(
            "❌ Failed marking all notifications:",
            error
        );

        alert(
            "Unable to mark notifications as read."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i data-lucide="check-check"></i>
                Mark All Read
            `;

            refreshIcons();

        }

    }

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {


    // FILTERS

    document
        .querySelectorAll(
            ".notification-filter"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".notification-filter"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter ||
                        "all";


                    visibleCount =
                        PAGE_SIZE;


                    renderNotifications();

                }
            );

        });


    // SEARCH

    $("notificationSearch")
        ?.addEventListener(
            "input",
            event => {

                currentSearch =
                    event.target.value
                        .trim();

                visibleCount =
                    PAGE_SIZE;

                renderNotifications();

            }
        );


    // MARK ALL

    $("markAllReadBtn")
        ?.addEventListener(
            "click",
            markAllRead
        );


    // LOAD MORE

    $("loadMoreNotifications")
        ?.addEventListener(
            "click",
            () => {

                visibleCount += PAGE_SIZE;

                renderNotifications();

            }
        );


    // CLICK NOTIFICATION

    $("notificationList")
        ?.addEventListener(
            "click",
            async event => {

                const item =
                    event.target.closest(
                        ".notification-item"
                    );

                if (!item) return;


                const id =
                    item.dataset.id;


                await markNotificationRead(
                    id
                );

            }
        );

}


// ============================================================
// ERROR
// ============================================================

function showNotificationError(error) {

    const list =
        $("notificationList");

    if (!list) return;


    const needsIndex =
        error?.code ===
        "failed-precondition";


    list.innerHTML = `

        <div class="notification-empty">

            <div class="empty-icon">

                <i data-lucide="alert-circle"></i>

            </div>

            <h3>
                Unable to load notifications
            </h3>

            <p>
                ${
                    needsIndex
                        ? "A Firestore index is required for this notification query."
                        : "Something went wrong while loading your notifications."
                }
            </p>

        </div>

    `;


    $("notificationEmpty")
        ?.classList.add("hidden");


    refreshIcons();

}


// ============================================================
// TEXT
// ============================================================

function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value;
    }

}


// ============================================================
// BOOT
// ============================================================

function boot() {

    setupEvents();

    refreshIcons();


    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                console.warn(
                    "⚠️ No authenticated instructor."
                );

                return;

            }


            currentInstructor = {
                uid: user.uid,
                email: user.email
            };


            await loadNotifications();

        }
    );

}


boot();