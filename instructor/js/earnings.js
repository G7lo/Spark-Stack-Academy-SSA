// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR EARNINGS ENGINE
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
    getDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// CONFIG
// ============================================================

const DEFAULT_SETTINGS = {
    platformTaxPercent: 0,
    withdrawalFeePercent: 0,
    minimumWithdrawal: 100,
    premiumMonthlyPrice: 999
};


// ============================================================
// STATE
// ============================================================

let currentInstructor = null;
let earningsSettings = {
    ...DEFAULT_SETTINGS
};

let currentBalance = 0;


// ============================================================
// DOM
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// FORMATTERS
// ============================================================

function formatMoney(amount = 0) {

    return `KSh ${Number(amount || 0).toLocaleString(
        "en-KE",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;

}


function formatDate(timestamp) {

    if (!timestamp) return "Recently";

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


// ============================================================
// FIRESTORE SETTINGS
// ============================================================

async function loadEarningsSettings() {

    try {

        const ref =
            doc(
                db,
                "platformSettings",
                "earnings"
            );

        const snap =
            await getDoc(ref);


        if (snap.exists()) {

            earningsSettings = {
                ...DEFAULT_SETTINGS,
                ...snap.data()
            };

        }


        console.log(
            "✓ Earnings settings loaded",
            earningsSettings
        );


    } catch (error) {

        console.error(
            "❌ Failed loading earnings settings:",
            error
        );

    }

}


// ============================================================
// LOAD INSTRUCTOR PROFILE
// ============================================================

async function loadInstructorProfile(uid) {

    const ref =
        doc(
            db,
            "users",
            uid
        );

    const snap =
        await getDoc(ref);


    if (!snap.exists()) {

        throw new Error(
            "Instructor profile not found."
        );

    }


    currentInstructor = {
        uid,
        ...snap.data()
    };


    return currentInstructor;

}


// ============================================================
// LOAD EARNINGS
// ============================================================

async function loadEarnings() {

    if (!currentInstructor) return;


    try {

        const q =
            query(
                collection(db, "instructorEarnings"),
                where(
                    "instructorId",
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


        let total = 0;
        let monthTotal = 0;
        let transactions = [];


        const now = new Date();

        snapshot.forEach(item => {

            const data = item.data();

            const amount =
                Number(data.netAmount || 0);

            total += amount;


            const date =
                data.createdAt?.toDate
                    ? data.createdAt.toDate()
                    : null;


            if (
                date &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
            ) {

                monthTotal += amount;

            }


            transactions.push({
                id: item.id,
                ...data
            });

        });


        currentBalance = total;


        updateMoney(
            "earningsBalance",
            total
        );

        updateMoney(
            "earningsTotal",
            total
        );

        updateMoney(
            "earningsMonth",
            monthTotal
        );


        setText(
            "earningsTransactions",
            transactions.length
        );


        renderTransactions(
            transactions
        );


    } catch (error) {

        console.error(
            "❌ Failed loading earnings:",
            error
        );

        showEarningsError();

    }

}


// ============================================================
// UPDATE MONEY
// ============================================================

function updateMoney(id, amount) {

    const element = $(id);

    if (element) {

        element.textContent =
            formatMoney(amount);

    }

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
// TRANSACTIONS
// ============================================================

function renderTransactions(items) {

    const container =
        $("transactionList");

    if (!container) return;


    if (!items.length) {

        container.innerHTML = `

            <div class="earnings-empty">

                <i data-lucide="receipt"></i>

                <span>
                    No earnings transactions yet.
                </span>

            </div>

        `;

        refreshIcons();

        return;

    }


    container.innerHTML =
        items.slice(0, 20).map(item => {

            const amount =
                Number(item.netAmount || 0);


            return `

                <div class="transaction-item">

                    <div class="transaction-info">

                        <div class="transaction-icon">

                            <i data-lucide="arrow-down-left"></i>

                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    item.description ||
                                    "Course payment"
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    item.createdAt
                                )}
                            </span>

                        </div>

                    </div>


                    <strong class="transaction-amount">

                        +${formatMoney(amount)}

                    </strong>

                </div>

            `;

        }).join("");


    refreshIcons();

}


// ============================================================
// WITHDRAWAL WINDOW
// ============================================================

function openWithdrawalWindow() {

    const modal =
        $("withdrawalModal");

    if (!modal) return;


    const available =
        $("withdrawAvailable");


    if (available) {

        available.textContent =
            formatMoney(currentBalance);

    }


    updateWithdrawalPreview();

    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";

}


function closeWithdrawalWindow() {

    const modal =
        $("withdrawalModal");

    if (!modal) return;


    modal.classList.remove("active");

    document.body.style.overflow =
        "";

}


// ============================================================
// WITHDRAWAL PREVIEW
// ============================================================

function updateWithdrawalPreview() {

    const input =
        $("withdrawAmount");

    if (!input) return;


    const amount =
        Number(input.value || 0);


    const fee =
        calculateWithdrawalFee(amount);


    const receive =
        Math.max(
            amount - fee,
            0
        );


    updateMoney(
        "withdrawFee",
        fee
    );

    updateMoney(
        "withdrawReceive",
        receive
    );

}


// ============================================================
// FEE
// ============================================================

function calculateWithdrawalFee(amount) {

    return (
        Number(amount || 0) *
        Number(
            earningsSettings.withdrawalFeePercent || 0
        ) /
        100
    );

}


// ============================================================
// SUBMIT WITHDRAWAL
// ============================================================

async function submitWithdrawal(event) {

    event.preventDefault();


    if (!currentInstructor) return;


    const amount =
        Number(
            $("withdrawAmount")?.value || 0
        );


    const method =
        $("withdrawMethod")?.value || "";


    const account =
        $("withdrawAccount")?.value.trim() || "";


    const minimum =
        Number(
            earningsSettings.minimumWithdrawal || 100
        );


    if (amount < minimum) {

        alert(
            `Minimum withdrawal is ${formatMoney(minimum)}.`
        );

        return;

    }


    if (amount > currentBalance) {

        alert(
            "Insufficient available balance."
        );

        return;

    }


    if (!method || !account) {

        alert(
            "Please complete your withdrawal details."
        );

        return;

    }


    const fee =
        calculateWithdrawalFee(amount);


    const netAmount =
        Math.max(
            amount - fee,
            0
        );


    const button =
        $("withdrawSubmit");


    try {

        if (button) {

            button.disabled = true;

            button.textContent =
                "Submitting...";

        }


        await addDoc(
            collection(
                db,
                "withdrawalRequests"
            ),
            {

                instructorId:
                    currentInstructor.uid,

                amount,

                withdrawalFee:
                    fee,

                netAmount,

                method,

                account,

                status:
                    "pending",

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "Withdrawal request submitted successfully."
        );


        $("withdrawForm")?.reset();

        closeWithdrawalWindow();


    } catch (error) {

        console.error(
            "❌ Withdrawal failed:",
            error
        );

        alert(
            "Unable to submit withdrawal request."
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Request Withdrawal";

        }

    }

}


// ============================================================
// PREMIUM INSTRUCTOR
// ============================================================

function setupPremiumInstructor() {

    const button =
        $("premiumInstructorBtn");

    if (!button) return;


    const instructor =
        currentInstructor || {};


    const premium =
        instructor.instructorPremium === true ||
        instructor.premiumInstructor === true;


    if (premium) {

        button.textContent =
            "Premium Active";

        button.disabled = true;

        button.classList.add(
            "premium-active"
        );

        return;

    }


    button.addEventListener(
        "click",
        () => {

            const price =
                formatMoney(
                    earningsSettings.premiumMonthlyPrice
                );


            button.addEventListener(
    "click",
    () => {

        window.location.href =
            "payments.html?upgrade=premium";

    }
);

        }
    );

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

    $("withdrawBtn")
        ?.addEventListener(
            "click",
            openWithdrawalWindow
        );


    $("withdrawClose")
        ?.addEventListener(
            "click",
            closeWithdrawalWindow
        );


    $("withdrawCancel")
        ?.addEventListener(
            "click",
            closeWithdrawalWindow
        );


    $("withdrawAmount")
        ?.addEventListener(
            "input",
            updateWithdrawalPreview
        );


    $("withdrawForm")
        ?.addEventListener(
            "submit",
            submitWithdrawal
        );


    $("withdrawalModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "withdrawalModal"
                ) {

                    closeWithdrawalWindow();

                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeWithdrawalWindow();

            }

        }
    );

}


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// ERROR
// ============================================================

function showEarningsError() {

    const list =
        $("transactionList");

    if (!list) return;


    list.innerHTML = `

        <div class="earnings-empty">

            <i data-lucide="alert-circle"></i>

            <span>
                Earnings could not be loaded.
            </span>

        </div>

    `;

    refreshIcons();

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


// ============================================================
// BOOT
// ============================================================

async function boot() {

    setupEvents();

    refreshIcons();


    onAuthStateChanged(
        auth,
        async user => {

            if (!user) return;


            try {

                await loadInstructorProfile(
                    user.uid
                );


                await loadEarningsSettings();


                await loadEarnings();


                setupPremiumInstructor();


                refreshIcons();


                console.log(
                    "✓ Instructor earnings loaded"
                );


            } catch (error) {

                console.error(
                    "❌ Earnings boot failed:",
                    error
                );

            }

        }
    );

}


boot();