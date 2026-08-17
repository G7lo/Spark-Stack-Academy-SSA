// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR PAYMENTS ENGINE
// ============================================================

console.log("🔥 INSTRUCTOR PAYMENTS JS LOADED");

import {
    db
} from "../../js/firebase.js";

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let payments = [];
let currentFilter = "all";
let currentSearch = "";


// ============================================================
// DOM
// ============================================================

const paymentList =
    document.getElementById("paymentList");

const paymentEmpty =
    document.getElementById("paymentEmpty");

const searchInput =
    document.getElementById("paymentSearch");

const filters =
    document.querySelectorAll(".payment-filter");


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(amount = 0) {

    return `KSh ${Number(amount || 0).toLocaleString()}`;

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) return "—";

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


// ============================================================
// STATUS
// ============================================================

function normalizeStatus(status) {

    return String(status || "pending")
        .toLowerCase()
        .replace(/\s+/g, "");

}


// ============================================================
// LOAD PAYMENTS
// ============================================================

function loadPayments() {

    const instructor =
        window.currentInstructor;

    if (!instructor?.uid) {

        console.warn(
            "⏳ Waiting for instructor..."
        );

        setTimeout(loadPayments, 500);

        return;

    }


    const paymentsRef =
        collection(
            db,
            "payments"
        );


    const paymentsQuery =
        query(
            paymentsRef,
            where(
                "instructorId",
                "==",
                instructor.uid
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(
        paymentsQuery,

        snapshot => {

            payments =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );


            updateStats();

            renderPayments();

            console.log(
                `✓ Loaded ${payments.length} payments`
            );

        },

        error => {

            console.error(
                "❌ Failed loading payments:",
                error
            );

            renderError();

        }
    );

}


// ============================================================
// UPDATE STATS
// ============================================================

function updateStats() {

    const successful =
        payments.filter(
            payment =>
                normalizeStatus(
                    payment.status
                ) === "successful"
        );

    const pending =
        payments.filter(
            payment =>
                normalizeStatus(
                    payment.status
                ) === "pending"
        );


    const totalAmount =
        successful.reduce(
            (sum, payment) =>
                sum + Number(
                    payment.amount || 0
                ),
            0
        );


    const pendingAmount =
        pending.reduce(
            (sum, payment) =>
                sum + Number(
                    payment.amount || 0
                ),
            0
        );


    setText(
        "totalPayments",
        formatMoney(totalAmount)
    );


    setText(
        "successfulPayments",
        formatMoney(totalAmount)
    );


    setText(
        "pendingPayments",
        formatMoney(pendingAmount)
    );


    setText(
        "paymentTransactions",
        payments.length
    );

}


// ============================================================
// FILTER + SEARCH
// ============================================================

function getFilteredPayments() {

    return payments.filter(payment => {

        const status =
            normalizeStatus(
                payment.status
            );


        const matchesFilter =
            currentFilter === "all" ||
            status === currentFilter;


        const search =
            currentSearch.trim().toLowerCase();


        if (!search) {

            return matchesFilter;

        }


        const text = [

            payment.courseName,

            payment.studentName,

            payment.reference,

            payment.email,

            payment.transactionId

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return (
            matchesFilter &&
            text.includes(search)
        );

    });

}


// ============================================================
// RENDER PAYMENTS
// ============================================================

function renderPayments() {

    const filtered =
        getFilteredPayments();


    if (!filtered.length) {

        paymentList.innerHTML = "";

        paymentEmpty.classList.remove(
            "hidden"
        );

        refreshIcons();

        return;

    }


    paymentEmpty.classList.add(
        "hidden"
    );


    paymentList.innerHTML =
        filtered.map(
            createPaymentHTML
        ).join("");


    refreshIcons();

}


// ============================================================
// PAYMENT HTML
// ============================================================

function createPaymentHTML(payment) {

    const status =
        normalizeStatus(
            payment.status
        );


    const courseName =
        escapeHTML(
            payment.courseName ||
            "Course Payment"
        );


    const student =
        escapeHTML(
            payment.studentName ||
            payment.email ||
            "Student"
        );


    const reference =
        escapeHTML(
            payment.reference ||
            payment.transactionId ||
            payment.id
        );


    const amount =
        formatMoney(
            payment.amount || 0
        );


    return `

        <div class="payment-row">

            <div class="payment-course">

                <div class="payment-course-icon">

                    <i data-lucide="book-open"></i>

                </div>

                <div>

                    <strong>
                        ${courseName}
                    </strong>

                    <span>
                        ${student}
                    </span>

                </div>

            </div>


            <div class="payment-meta">

                <strong>
                    ${reference}
                </strong>

                <span>
                    ${formatDate(payment.createdAt)}
                </span>

            </div>


            <div class="payment-amount">

                ${amount}

            </div>


            <div>

                <span class="payment-status ${status}">

                    ${capitalize(status)}

                </span>

            </div>


            <div class="payment-meta">

                <span>
                    ${payment.currency || "KES"}
                </span>

            </div>

        </div>

    `;

}


// ============================================================
// FILTER BUTTONS
// ============================================================

filters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filters.forEach(
                item =>
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


            renderPayments();

        }
    );

});


// ============================================================
// SEARCH
// ============================================================

searchInput?.addEventListener(
    "input",
    event => {

        currentSearch =
            event.target.value;

        renderPayments();

    }
);


// ============================================================
// PRO UPGRADE
// ============================================================

function setupProUpgrade() {

    const buttons = [

        document.getElementById(
            "upgradeProBtn"
        ),

        document.getElementById(
            "proBannerBtn"
        )

    ];


    buttons.forEach(button => {

        button?.addEventListener(
            "click",
            () => {

                openProUpgrade();

            }
        );

    });

}


// ============================================================
// OPEN PRO UPGRADE
// ============================================================

function openProUpgrade() {

    console.log(
        "👑 Opening Instructor Pro..."
    );


    /*
        IMPORTANT:

        Do NOT mark the instructor as Pro
        here.

        The backend/payment system must
        confirm the subscription first.
    */


    window.location.href =
        "pro.html";

}


// ============================================================
// ERROR
// ============================================================

function renderError() {

    paymentList.innerHTML = `

        <div class="payment-loading">

            <div class="empty-icon">

                <i data-lucide="triangle-alert"></i>

            </div>

            <strong>
                Unable to load payments
            </strong>

            <span>
                Please try again later.
            </span>

        </div>

    `;


    refreshIcons();

}


// ============================================================
// HELPERS
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


function escapeHTML(value) {

    return String(value)
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


// ============================================================
// WAIT FOR AUTH
// ============================================================

function waitForInstructor() {

    if (window.currentInstructor?.uid) {

        loadPayments();

        return;

    }


    setTimeout(
        waitForInstructor,
        300
    );

}


// ============================================================
// BOOT
// ============================================================

setupProUpgrade();

waitForInstructor();

console.log(
    "✓ Instructor Payments engine ready"
);