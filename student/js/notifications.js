// =====================================
// SPARK STACK ACADEMY
// STUDENT NOTIFICATIONS ENGINE V2
// notifications.js
// =====================================

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
    onSnapshot,
    doc,
    updateDoc,
    writeBatch,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("🔔 SSA Notifications Engine Loaded");


// =====================================
// STATE
// =====================================

let allNotifications = [];

let activeFilter = "all";

let activeSort = "newest";

let unsubscribe = null;


// =====================================
// AUTH
// =====================================

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    startNotificationListener(user.uid);

});


// =====================================
// REALTIME LISTENER
// =====================================

function startNotificationListener(userId) {

    if (unsubscribe) {

        unsubscribe();

    }


    const notificationsRef =
        collection(
            db,
            "notifications"
        );


    const notificationsQuery = query(

        notificationsRef,

        where(
            "userId",
            "==",
            userId
        ),

        orderBy(
            "createdAt",
            "desc"
        ),

        limit(100)

    );


    unsubscribe = onSnapshot(

        notificationsQuery,

        (snapshot) => {

            allNotifications = snapshot.docs.map(
                notificationDoc => ({

                    id:
                        notificationDoc.id,

                    ...notificationDoc.data()

                })
            );


            renderEverything();

        },


        (error) => {

            console.error(
                "🔔 Notification listener failed:",
                error
            );

        }

    );

}


// =====================================
// RENDER EVERYTHING
// =====================================

function renderEverything() {

    updateUnreadCount();

    renderDropdown();

    renderFullPage();

    refreshIcons();

}


// =====================================
// UNREAD COUNT
// =====================================

function updateUnreadCount() {

    const unread =
        allNotifications.filter(
            notification =>
                notification.read !== true
        ).length;


    const badge =
        document.getElementById(
            "notificationCount"
        );


    if (badge) {

        badge.textContent =
            unread > 99
                ? "99+"
                : unread;


        badge.style.display =
            unread > 0
                ? "flex"
                : "none";

    }


    const unreadTotal =
        document.getElementById(
            "unreadNotifications"
        );


    if (unreadTotal) {

        unreadTotal.textContent =
            unread;

    }


    const total =
        document.getElementById(
            "totalNotifications"
        );


    if (total) {

        total.textContent =
            allNotifications.length;

    }

}


// =====================================
// TOPBAR DROPDOWN
// =====================================

function renderDropdown() {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) return;


    const latest =
        [...allNotifications]
            .sort(
                (a, b) =>
                    getTime(b.createdAt) -
                    getTime(a.createdAt)
            )
            .slice(0, 5);


    if (!latest.length) {

        list.innerHTML = `

            <div class="notification-empty">

                <i data-lucide="bell-off"></i>

                <p>
                    No new notifications
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = "";


    latest.forEach(notification => {

        const item =
            document.createElement("div");


        item.className =
            `notification-item ${
                notification.read
                    ? ""
                    : "unread"
            }`;


        item.innerHTML = `

            <div class="notification-icon">

                <i data-lucide="${
                    notification.icon ||
                    getIcon(notification.type)
                }"></i>

            </div>


            <div class="notification-content">

                <strong>
                    ${escapeHTML(
                        notification.title ||
                        "Academy Update"
                    )}
                </strong>

                <p>
                    ${escapeHTML(
                        notification.message ||
                        ""
                    )}
                </p>

                <small>
                    ${formatTime(
                        notification.createdAt
                    )}
                </small>

            </div>

        `;


        item.addEventListener(
            "click",
            () => {

                markAsRead(
                    notification.id
                );


                if (
                    notification.link
                ) {

                    window.location.href =
                        notification.link;

                }

            }
        );


        list.appendChild(item);

    });


    // VIEW ALL

    const viewAll =
        document.createElement("a");


    viewAll.href =
        "notifications.html";


    viewAll.className =
        "view-all-notifications";


    viewAll.innerHTML = `

        View all notifications

        <i data-lucide="arrow-right"></i>

    `;


    list.appendChild(viewAll);

}


// =====================================
// FULL PAGE
// =====================================

function renderFullPage() {

    const list =
        document.getElementById(
            "notificationsList"
        );


    const empty =
        document.getElementById(
            "notificationsEmpty"
        );


    if (!list) return;


    let filtered =
        [...allNotifications];


    // FILTER

    if (activeFilter === "unread") {

        filtered =
            filtered.filter(
                notification =>
                    notification.read !== true
            );

    }


    else if (
        activeFilter !== "all"
    ) {

        filtered =
            filtered.filter(
                notification =>
                    notification.type ===
                    activeFilter
            );

    }


    // SORT

    filtered.sort(
        (a, b) => {

            const first =
                getTime(
                    a.createdAt
                );

            const second =
                getTime(
                    b.createdAt
                );


            return activeSort === "newest"
                ? second - first
                : first - second;

        }
    );


    list.innerHTML = "";


    if (!filtered.length) {

        list.style.display =
            "none";

        if (empty) {

            empty.style.display =
                "block";

        }

        return;

    }


    list.style.display =
        "flex";


    if (empty) {

        empty.style.display =
            "none";

    }


    filtered.forEach(
        notification => {

            const card =
                document.createElement("article");


            card.className =
                `notification-card ${
                    notification.read
                        ? ""
                        : "unread"
                }`;


            card.dataset.type =
                notification.type ||
                "general";


            card.innerHTML = `

                <div class="notification-card-icon">

                    <i data-lucide="${
                        notification.icon ||
                        getIcon(
                            notification.type
                        )
                    }"></i>

                </div>


                <div class="notification-card-content">

                    <h3>
                        ${escapeHTML(
                            notification.title ||
                            "Academy Update"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            notification.message ||
                            ""
                        )}
                    </p>

                    <span class="notification-time">

                        ${formatTime(
                            notification.createdAt
                        )}

                    </span>

                </div>


                <div class="notification-card-action">

                    <i data-lucide="chevron-right"></i>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    markAsRead(
                        notification.id
                    );


                    if (
                        notification.link
                    ) {

                        window.location.href =
                            notification.link;

                    }

                }
            );


            list.appendChild(card);

        }
    );

}


// =====================================
// FILTER BUTTONS
// =====================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".notification-filter"
            );


        if (!button) return;


        document
            .querySelectorAll(
                ".notification-filter"
            )
            .forEach(
                item =>
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


        renderFullPage();

        refreshIcons();

    }
);


// =====================================
// SORT
// =====================================

document.addEventListener(
    "change",
    event => {

        if (
            event.target.id !==
            "notificationSort"
        ) return;


        activeSort =
            event.target.value ||
            "newest";


        renderFullPage();

        refreshIcons();

    }
);


// =====================================
// MARK ALL AS READ
// =====================================

document.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "#markAllReadBtn, #markNotificationsRead"
            );


        if (!button) return;


        const unread =
            allNotifications.filter(
                notification =>
                    notification.read !== true
            );


        if (!unread.length) return;


        try {

            const batch =
                writeBatch(db);


            unread.forEach(
                notification => {

                    batch.update(

                        doc(
                            db,
                            "notifications",
                            notification.id
                        ),

                        {
                            read: true
                        }

                    );

                }
            );


            await batch.commit();

        }

        catch (error) {

            console.error(
                "Unable to mark notifications:",
                error
            );

        }

    }
);


// =====================================
// MARK ONE AS READ
// =====================================

async function markAsRead(id) {

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

    }

    catch (error) {

        console.error(
            "Unable to mark notification:",
            error
        );

    }

}


// =====================================
// ICONS
// =====================================

function getIcon(type) {

    const icons = {

        announcement: "megaphone",

        course: "book-open",

        payment: "credit-card",

        premium: "crown",

        achievement: "trophy",

        certificate: "award",

        message: "message-circle",

        general: "bell"

    };


    return icons[type] ||
        "bell";

}


// =====================================
// TIME
// =====================================

function getTime(timestamp) {

    if (!timestamp)
        return 0;


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        return timestamp
            .toDate()
            .getTime();

    }


    return new Date(
        timestamp
    ).getTime() || 0;

}


function formatTime(timestamp) {

    const time =
        getTime(timestamp);


    if (!time)
        return "Just now";


    const diff =
        Date.now() - time;


    const minutes =
        Math.floor(
            diff / 60000
        );


    if (minutes < 1)
        return "Just now";


    if (minutes < 60)
        return `${minutes}m ago`;


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24)
        return `${hours}h ago`;


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7)
        return `${days}d ago`;


    return new Date(
        time
    ).toLocaleDateString();

}


// =====================================
// SECURITY
// =====================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================
// LUCIDE
// =====================================

function refreshIcons() {

    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();

    }

}