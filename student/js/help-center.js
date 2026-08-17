// =====================================
// SPARK STACK ACADEMY
// STUDENT HELP CENTER
// help-center.js
// =====================================

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("🛟 Help Center Loaded");


let currentUser = null;


// =====================================
// AUTH
// =====================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }

        currentUser = user;

    }
);


// =====================================
// DOM READY
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeFAQ();

        initializeSearch();

        initializeCategories();

        initializeGuides();

        initializeSupport();

        initializeKeyboard();

        refreshIcons();

    }
);


// =====================================
// FAQ
// =====================================

function initializeFAQ() {

    const questions =
        document.querySelectorAll(
            ".faq-question"
        );


    questions.forEach(
        question => {

            question.addEventListener(
                "click",
                () => {

                    const item =
                        question.closest(
                            ".faq-item"
                        );


                    const isOpen =
                        item.classList.contains(
                            "active"
                        );


                    // Close other FAQs

                    document
                        .querySelectorAll(
                            ".faq-item.active"
                        )
                        .forEach(
                            openItem => {

                                if (
                                    openItem !== item
                                ) {

                                    openItem.classList.remove(
                                        "active"
                                    );

                                    const button =
                                        openItem.querySelector(
                                            ".faq-question"
                                        );

                                    button?.setAttribute(
                                        "aria-expanded",
                                        "false"
                                    );

                                }

                            }
                        );


                    // Toggle current

                    item.classList.toggle(
                        "active",
                        !isOpen
                    );


                    question.setAttribute(
                        "aria-expanded",
                        String(!isOpen)
                    );

                }
            );

        }
    );

}


// =====================================
// SEARCH
// =====================================

function initializeSearch() {

    const search =
        document.getElementById(
            "helpSearch"
        );


    const results =
        document.getElementById(
            "searchResults"
        );


    const faqItems =
        document.querySelectorAll(
            ".faq-item"
        );


    const empty =
        document.getElementById(
            "faqEmpty"
        );


    if (!search) return;


    search.addEventListener(
        "input",
        () => {

            const query =
                search.value
                    .trim()
                    .toLowerCase();


            let matches = 0;


            faqItems.forEach(
                item => {

                    const text =
                        (
                            item.textContent +
                            " " +
                            (
                                item.dataset.search ||
                                ""
                            )
                        ).toLowerCase();


                    const match =
                        !query ||
                        text.includes(query);


                    item.style.display =
                        match
                            ? ""
                            : "none";


                    if (match) {
                        matches++;
                    }

                }
            );


            if (empty) {

                empty.hidden =
                    matches !== 0;

            }


            renderSearchResults(
                query,
                faqItems,
                results
            );

        }
    );

}


// =====================================
// SEARCH RESULTS
// =====================================

function renderSearchResults(
    query,
    faqItems,
    container
) {

    if (!container) return;


    container.innerHTML = "";


    if (!query) return;


    const matches = [];


    faqItems.forEach(
        item => {

            const text =
                (
                    item.textContent +
                    " " +
                    (
                        item.dataset.search ||
                        ""
                    )
                ).toLowerCase();


            if (
                text.includes(query)
            ) {

                const question =
                    item.querySelector(
                        ".faq-question span"
                    );


                if (question) {

                    matches.push(
                        question.textContent.trim()
                    );

                }

            }

        }
    );


    matches
        .slice(0, 5)
        .forEach(
            title => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "help-search-result";


                button.innerHTML = `
                    <strong>${escapeHTML(title)}</strong>
                    <span>View answer</span>
                `;


                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            [...faqItems]
                                .find(
                                    faq => {

                                        const span =
                                            faq.querySelector(
                                                ".faq-question span"
                                            );

                                        return (
                                            span &&
                                            span.textContent.trim() ===
                                            title
                                        );

                                    }
                                );


                        if (item) {

                            item.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });


                            item.classList.add(
                                "active"
                            );


                            item.querySelector(
                                ".faq-question"
                            )?.setAttribute(
                                "aria-expanded",
                                "true"
                            );

                        }


                        container.innerHTML = "";

                    }
                );


                container.appendChild(
                    button
                );

            }
        );

}


// =====================================
// QUICK CATEGORIES
// =====================================

function initializeCategories() {

    const buttons =
        document.querySelectorAll(
            ".help-action"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        button.dataset.category;


                    const faqItems =
                        document.querySelectorAll(
                            ".faq-item"
                        );


                    let found = false;


                    faqItems.forEach(
                        item => {

                            const matches =
                                item.dataset.category ===
                                category;


                            item.style.display =
                                matches
                                    ? ""
                                    : "none";


                            if (matches) {
                                found = true;
                            }

                        }
                    );


                    const faqEmpty =
                        document.getElementById(
                            "faqEmpty"
                        );


                    if (faqEmpty) {

                        faqEmpty.hidden =
                            found;

                    }


                    document
                        .querySelector(
                            ".faq-section"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                }
            );

        }
    );

}


// =====================================
// GUIDES
// =====================================

function initializeGuides() {

    const buttons =
        document.querySelectorAll(
            "[data-guide]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const guide =
                        button.dataset.guide;


                    const messages = {

                        "getting-started":
                            "Start with your Dashboard, explore the Course Library, then enroll in a course to begin learning.",

                        "courses":
                            "Your Courses area lets you continue lessons, track progress and complete assignments.",

                        "achievements":
                            "Complete learning activities to earn XP, level up and unlock achievements and certificates.",

                        "payments":
                            "Payments and Premium subscriptions can be managed from the Payments and Premium sections of your student portal."

                    };


                    alert(
                        messages[guide] ||
                        "This guide is currently being prepared."
                    );

                }
            );

        }
    );

}


// =====================================
// SUPPORT
// =====================================

function initializeSupport() {

    const modal =
        document.getElementById(
            "supportModal"
        );


    const contact =
        document.getElementById(
            "contactSupportBtn"
        );


    const report =
        document.getElementById(
            "reportProblemBtn"
        );


    const close =
        document.getElementById(
            "closeSupportModal"
        );


    const backdrop =
        modal?.querySelector(
            ".modal-backdrop"
        );


    const form =
        document.getElementById(
            "supportForm"
        );


    contact?.addEventListener(
        "click",
        () => {

            openSupportModal(
                "Contact Spark Support"
            );

        }
    );


    report?.addEventListener(
        "click",
        () => {

            openSupportModal(
                "Report a Problem"
            );

        }
    );


    close?.addEventListener(
        "click",
        closeSupportModal
    );


    backdrop?.addEventListener(
        "click",
        closeSupportModal
    );


    form?.addEventListener(
        "submit",
        submitSupportRequest
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeSupportModal();

            }

        }
    );

}


// =====================================
// OPEN SUPPORT MODAL
// =====================================

function openSupportModal(title) {

    const modal =
        document.getElementById(
            "supportModal"
        );


    const subject =
        document.getElementById(
            "supportSubject"
        );


    const modalTitle =
        document.getElementById(
            "supportModalTitle"
        );


    if (!modal) return;


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    if (modalTitle) {

        modalTitle.textContent =
            title;

    }


    if (
        title.includes(
            "Report"
        )
    ) {

        if (subject) {

            subject.value =
                "Report a Problem";

        }

    }


    setTimeout(
        () => {

            subject?.focus();

        },
        100
    );

}


// =====================================
// CLOSE MODAL
// =====================================

function closeSupportModal() {

    const modal =
        document.getElementById(
            "supportModal"
        );


    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


// =====================================
// SUBMIT SUPPORT REQUEST
// =====================================

async function submitSupportRequest(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        alert(
            "Please sign in again before contacting support."
        );

        return;

    }


    const subject =
        document.getElementById(
            "supportSubject"
        )?.value.trim();


    const message =
        document.getElementById(
            "supportMessage"
        )?.value.trim();


    if (
        !subject ||
        !message
    ) {

        alert(
            "Please complete both fields."
        );

        return;

    }


    const submitButton =
        document.querySelector(
            ".submit-support"
        );


    const original =
        submitButton?.innerHTML;


    try {

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Sending...";

        }


        await addDoc(
            collection(
                db,
                "supportRequests"
            ),
            {

                userId:
                    currentUser.uid,

                email:
                    currentUser.email || "",

                subject:
                    subject,

                message:
                    message,

                status:
                    "open",

                source:
                    "student-help-center",

                createdAt:
                    serverTimestamp()

            }
        );


        if (submitButton) {

            submitButton.textContent =
                "Request Sent ✓";

        }


        setTimeout(
            () => {

                closeSupportModal();

                document
                    .getElementById(
                        "supportForm"
                    )
                    ?.reset();

                if (submitButton) {

                    submitButton.innerHTML =
                        original;

                    submitButton.disabled =
                        false;

                }

            },
            1200
        );


    }

    catch (error) {

        console.error(
            "❌ Support request failed:",
            error
        );


        if (submitButton) {

            submitButton.innerHTML =
                original;

            submitButton.disabled =
                false;

        }


        alert(
            "We couldn't send your request. Please try again."
        );

    }

}


// =====================================
// KEYBOARD SHORTCUT
// =====================================

function initializeKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            const target =
                event.target;


            const typing =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA";


            if (
                event.key === "/" &&
                !typing
            ) {

                event.preventDefault();

                document
                    .getElementById(
                        "helpSearch"
                    )
                    ?.focus();

            }

        }
    );

}


// =====================================
// ICON REFRESH
// =====================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof lucide.createIcons ===
            "function"
    ) {

        lucide.createIcons();

    }

}


// =====================================
// SECURITY
// =====================================

function escapeHTML(
    value
) {

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