// =====================================
// SPARK STACK ACADEMY
// STUDENT ANNOUNCEMENTS
// announcements.js
// =====================================

import {
    db,
    auth
} from "../../js/firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================
// START
// =====================================

console.log("📢 Announcements Module Loaded");


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAnnouncements();

    }
);


// =====================================
// LOAD ANNOUNCEMENTS
// =====================================

function loadAnnouncements() {

    const container =
        document.getElementById(
            "announcementsContainer"
        );


    if (!container) {

        console.error(
            "Announcements container not found"
        );

        return;
    }


    const announcementsRef =
        collection(
            db,
            "announcements"
        );


    const announcementsQuery =
        query(
            announcementsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(

        announcementsQuery,

        (snapshot) => {

            console.log(
                "📢 Announcements:",
                snapshot.size
            );


            if (snapshot.empty) {

                showEmptyState(
                    container
                );

                return;
            }


            container.innerHTML = "";


            snapshot.forEach(
                (announcementDoc) => {

                    const announcement =
                        announcementDoc.data();


                    renderAnnouncement(
                        container,
                        announcement
                    );

                }
            );


            if (window.lucide) {

                lucide.createIcons();

            }

        },


        (error) => {

            console.error(
                "❌ Announcements loading failed:",
                error
            );


            showError(
                container
            );

        }

    );

}


// =====================================
// RENDER ANNOUNCEMENT
// =====================================

function renderAnnouncement(
    container,
    announcement
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "announcement-card";


    const title =
        announcement.title ||
        "Academy Announcement";


    const message =
        announcement.message ||
        "No announcement message available.";


    const category =
        announcement.category ||
        "General";


    const author =
        announcement.author ||
        "Spark Stack Academy";


    const date =
        formatDate(
            announcement.createdAt
        );


    card.innerHTML = `

        <div class="announcement-card-header">

            <div>

                <h3>
                    ${escapeHTML(title)}
                </h3>

            </div>


            <span class="announcement-category">

                ${escapeHTML(category)}

            </span>

        </div>


        <p class="announcement-message">

            ${escapeHTML(message)}

        </p>


        <div class="announcement-footer">

            <span class="announcement-author">

                <i data-lucide="user"></i>

                ${escapeHTML(author)}

            </span>


            <span class="announcement-date">

                <i data-lucide="calendar"></i>

                ${date}

            </span>

        </div>

    `;


    container.appendChild(
        card
    );

}


// =====================================
// EMPTY STATE
// =====================================

function showEmptyState(
    container
) {

    container.innerHTML = `

        <div class="announcement-empty">

            <i data-lucide="megaphone"></i>

            <h3>
                No Announcements Yet
            </h3>

            <p>
                There are no academy announcements
                available right now.
            </p>

        </div>

    `;


    if (window.lucide) {

        lucide.createIcons();

    }

}


// =====================================
// ERROR STATE
// =====================================

function showError(
    container
) {

    container.innerHTML = `

        <div class="announcement-empty">

            <i data-lucide="alert-circle"></i>

            <h3>
                Unable to Load Announcements
            </h3>

            <p>
                Something went wrong while
                fetching academy updates.
            </p>

        </div>

    `;


    if (window.lucide) {

        lucide.createIcons();

    }

}


// =====================================
// DATE FORMATTER
// =====================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "Recently";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


        return date.toLocaleDateString(
            "en-KE",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }

    catch {

        return "Recently";

    }

}


// =====================================
// BASIC HTML ESCAPE
// =====================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}