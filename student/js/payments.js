// =====================================
// SPARK STACK ACADEMY
// STUDENT PAYMENTS ENGINE
// Fast Premium Checkout
// =====================================

import {
    auth,
    db
} from "../../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("💳 Student Payments Engine Loaded");


// =====================================
// STATE
// =====================================

let currentUser = null;
let selectedCourseId = null;
let selectedCourse = null;
let paymentsListener = null;


// =====================================
// URL
// =====================================

const urlParams = new URLSearchParams(
    window.location.search
);

selectedCourseId =
    urlParams.get("courseId");


// =====================================
// DOM
// =====================================

const totalPaid =
    document.getElementById("totalPaid");

const balanceElement =
    document.getElementById("balance");

const paymentStatus =
    document.getElementById("paymentStatus");

const transactionList =
    document.getElementById("transactionList");

const courseList =
    document.getElementById("courseList");

const backBtn =
    document.getElementById("backBtn");


// =====================================
// BACK BUTTON
// =====================================

backBtn?.addEventListener("click", () => {

    window.location.href =
        "dashboard.html";

});


// =====================================
// AUTH
// =====================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;
    }

    currentUser = user;

    /*
     * IMPORTANT:
     * Load checkout first.
     * Payment history comes afterward.
     */

    if (selectedCourseId) {

        await loadCheckoutCourse();

    } else {

        await loadStudentCourses();

    }

    // Background operation.
    loadPaymentHistory();

});


// =====================================
// FAST COURSE CHECKOUT
// =====================================

async function loadCheckoutCourse() {

    showCourseLoading();

    try {

        const courseRef =
            doc(
                db,
                "courses",
                selectedCourseId
            );

        const snapshot =
            await getDoc(courseRef);

        if (!snapshot.exists()) {

            showCourseError(
                "This course could not be found."
            );

            return;
        }

        selectedCourse = {
            id: snapshot.id,
            ...snapshot.data()
        };

        renderCheckoutCourse(
            selectedCourse
        );

    }

    catch (error) {

        console.error(
            "Course loading failed:",
            error
        );

        showCourseError(
            "Unable to load this course."
        );

    }

}


// =====================================
// RENDER CHECKOUT
// =====================================

function renderCheckoutCourse(course) {

    const title =
        escapeHTML(
            course.title ||
            "Premium Course"
        );

    const price =
        Number(course.price || 0);

    courseList.innerHTML = `

        <div class="course-card payment-checkout-card">

            <div class="checkout-course-info">

                <span class="checkout-badge">
                    PREMIUM COURSE
                </span>

                <h3>
                    ${title}
                </h3>

                <p>
                    Unlock full access to this course.
                </p>

            </div>

            <div class="checkout-price">

                <span>
                    Course fee
                </span>

                <strong>
                    KSh ${price.toLocaleString()}
                </strong>

            </div>

            <button
                type="button"
                class="pay-btn"
                id="payCourseBtn"
            >
                Pay KSh ${price.toLocaleString()}
            </button>

        </div>

    `;


    const payButton =
        document.getElementById(
            "payCourseBtn"
        );


    payButton?.addEventListener(
        "click",
        () => {

            initializePayment(
                course,
                price,
                payButton
            );

        }
    );

}


// =====================================
// PAYMENT INITIALIZATION
// =====================================

async function initializePayment(
    course,
    amount,
    button
) {

    if (!currentUser) {

        alert(
            "Please sign in before making a payment."
        );

        return;
    }


    if (!amount || amount <= 0) {

        alert(
            "This course does not have a valid price."
        );

        return;
    }


    // Prevent double clicks.

    button.disabled = true;

    button.dataset.originalText =
        button.textContent;

    button.textContent =
        "Starting secure checkout...";


    try {

        /*
         * Supabase Edge Function
         *
         * No localhost.
         * No secret keys in browser.
         */

        const supabaseUrl =
            "https://nlnwllpisbqgbeluhdbr.supabase.co";


        const functionUrl =
            `${supabaseUrl}/functions/v1/create-payment`;


        const response =
            await fetch(
                functionUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        userId:
                            currentUser.uid,

                        email:
                            currentUser.email,

                        courseId:
                            course.id,

                        course:
                            course.title,

                        amount:
                            Number(amount),

                        currency:
                            "KES"

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Payment initialization failed."
            );

        }


        /*
         * Your Edge Function should return
         * the Pesapal checkout URL.
         */

        const checkoutUrl =
            data.redirect_url ||
            data.authorization_url ||
            data.checkout_url;


        if (!checkoutUrl) {

            throw new Error(
                "No checkout URL was returned."
            );

        }


        // Redirect immediately.

        window.location.assign(
            checkoutUrl
        );

    }

    catch (error) {

        console.error(
            "Payment initialization error:",
            error
        );


        alert(
            error.message ||
            "Unable to start payment. Please try again."
        );


        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            "Pay Now";

    }

}


// =====================================
// PAYMENT HISTORY
// =====================================

function loadPaymentHistory() {

    if (!currentUser) return;


    try {

        const paymentsRef =
            collection(
                db,
                "payments"
            );


        const paymentsQuery =
            query(

                paymentsRef,

                where(
                    "userId",
                    "==",
                    currentUser.uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                )

            );


        /*
         * Realtime history runs AFTER
         * checkout UI is already available.
         */

        paymentsListener =
            onSnapshot(

                paymentsQuery,

                snapshot => {

                    let paid = 0;

                    transactionList.innerHTML =
                        "";


                    if (snapshot.empty) {

                        transactionList.innerHTML = `

                            <div class="empty-payment">

                                No transactions yet.

                            </div>

                        `;

                        updatePaymentSummary(0);

                        return;
                    }


                    snapshot.forEach(
                        paymentDoc => {

                            const payment =
                                paymentDoc.data();


                            if (
                                normalizeStatus(
                                    payment.status
                                ) === "success"
                            ) {

                                paid +=
                                    Number(
                                        payment.amount || 0
                                    );

                            }


                            renderTransaction(
                                payment
                            );

                        }
                    );


                    updatePaymentSummary(
                        paid
                    );

                },

                error => {

                    console.error(
                        "Payment history error:",
                        error
                    );

                    /*
                     * Don't break checkout
                     * if history fails.
                     */

                    if (transactionList) {

                        transactionList.innerHTML = `

                            <div class="empty-payment">

                                Payment history is
                                temporarily unavailable.

                            </div>

                        `;

                    }

                }

            );

    }

    catch (error) {

        console.error(
            "Payment history setup failed:",
            error
        );

    }

}


// =====================================
// PAYMENT SUMMARY
// =====================================

function updatePaymentSummary(
    paid
) {

    if (totalPaid) {

        totalPaid.textContent =
            `KSh ${Number(paid).toLocaleString()}`;

    }


    if (paymentStatus) {

        paymentStatus.textContent =
            paid > 0
                ? "Payments recorded"
                : "No payments yet";

    }

}


// =====================================
// STUDENT COURSES
// =====================================

async function loadStudentCourses() {

    showCourseLoading();


    /*
     * If this page is opened without
     * ?courseId=..., we simply show a
     * useful message instead of doing
     * unnecessary enrollment queries.
     */

    courseList.innerHTML = `

        <div class="empty-payment">

            Select a course to continue
            with payment.

        </div>

    `;

}


// =====================================
// TRANSACTION RENDER
// =====================================

function renderTransaction(
    payment
) {

    if (!transactionList) return;


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "transaction-card";


    const course =
        escapeHTML(
            payment.course ||
            payment.courseName ||
            "Academy Payment"
        );


    const method =
        escapeHTML(
            payment.method ||
            "Payment"
        );


    const status =
        normalizeStatus(
            payment.status
        );


    const amount =
        Number(
            payment.amount || 0
        );


    card.innerHTML = `

        <div>

            <h3>
                ${course}
            </h3>

            <p>
                ${method}
            </p>

        </div>

        <div>

            <h3>
                KSh ${amount.toLocaleString()}
            </h3>

            <span class="${status}">
                ${capitalize(status)}
            </span>

        </div>

    `;


    transactionList.appendChild(
        card
    );

}


// =====================================
// LOADING STATE
// =====================================

function showCourseLoading() {

    if (!courseList) return;


    courseList.innerHTML = `

        <div class="payment-loading">

            <div class="payment-loader"></div>

            <p>
                Loading secure checkout...
            </p>

        </div>

    `;

}


// =====================================
// ERROR STATE
// =====================================

function showCourseError(
    message
) {

    if (!courseList) return;


    courseList.innerHTML = `

        <div class="empty-payment">

            <strong>
                ${escapeHTML(message)}
            </strong>

        </div>

    `;

}


// =====================================
// HELPERS
// =====================================

function normalizeStatus(
    status
) {

    return String(
        status || "pending"
    )
        .toLowerCase()
        .replace(/\s+/g, "");

}


function capitalize(
    value
) {

    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function escapeHTML(
    value
) {

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


// =====================================
// CLEANUP
// =====================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            typeof paymentsListener ===
            "function"
        ) {

            paymentsListener();

        }

    }
);


console.log(
    "⚡ Fast Student Payments Engine Ready"
);