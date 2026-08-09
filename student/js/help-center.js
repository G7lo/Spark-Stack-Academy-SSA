// ============================================
// SPARK STACK ACADEMY
// HELP CENTER ENGINE V1
// ============================================

import { db, auth } from "../../js/firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================
// HELPERS
// ============================================

const $ = (id) =>
    document.getElementById(id);


// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("⚡ Spark Support loading...");

    initFAQ();
    initSearch();
    initKeyboardSearch();
    initSupportModal();
    initQuickActions();

    if (window.lucide) {
        lucide.createIcons();
    }

});


// ============================================
// FAQ ENGINE
// ============================================

function initFAQ() {

    const questions =
        document.querySelectorAll(
            ".faq-question"
        );

    questions.forEach(question => {

        question.addEventListener(
            "click",
            () => {

                const item =
                    question.closest(
                        ".faq-item"
                    );

                if (!item) return;


                const wasActive =
                    item.classList.contains(
                        "active"
                    );


                document
                    .querySelectorAll(
                        ".faq-item.active"
                    )
                    .forEach(active => {

                        if (active !== item) {
                            active.classList.remove(
                                "active"
                            );
                        }

                    });


                item.classList.toggle(
                    "active",
                    !wasActive
                );

            }
        );

    });

}


// ============================================
// SEARCH ENGINE
// ============================================

function initSearch() {

    const search =
        $("helpSearch");

    if (!search) return;


    search.addEventListener(
        "input",
        () => {

            const term =
                search.value
                    .trim()
                    .toLowerCase();


            const faqItems =
                document.querySelectorAll(
                    ".faq-item"
                );


            const guides =
                document.querySelectorAll(
                    ".guide-card"
                );


            let found = false;


            // FAQ SEARCH

            faqItems.forEach(item => {

                const text =
                    item.textContent
                        .toLowerCase();


                const match =
                    !term ||
                    text.includes(term);


                item.style.display =
                    match
                        ? ""
                        : "none";


                if (match && term)
                    found = true;

            });


            // GUIDE SEARCH

            guides.forEach(card => {

                const text =
                    card.textContent
                        .toLowerCase();


                const match =
                    !term ||
                    text.includes(term);


                card.style.display =
                    match
                        ? ""
                        : "none";


                if (match && term)
                    found = true;

            });


            console.log(
                term
                    ? `🔎 Search: ${term}`
                    : "🔎 Search cleared"
            );

        }
    );

}


// ============================================
// KEYBOARD SEARCH
// ============================================

function initKeyboardSearch() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "/" &&
                document.activeElement.tagName !== "INPUT" &&
                document.activeElement.tagName !== "TEXTAREA"
            ) {

                event.preventDefault();

                $("helpSearch")?.focus();

            }

            if (
                event.key === "Escape"
            ) {

                $("helpSearch")?.blur();

            }

        }
    );

}


// ============================================
// SUPPORT MODAL
// ============================================

function initSupportModal() {

    const modal =
        $("supportModal");

    const openBtn =
        $("contactSupportBtn");

    const reportBtn =
        $("reportProblemBtn");

    const closeBtn =
        $("closeSupportModal");

    const backdrop =
        modal?.querySelector(
            ".modal-backdrop"
        );


    if (!modal) return;


    const openModal = () => {

        modal.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";

        setTimeout(() => {

            $("supportSubject")?.focus();

        }, 100);

    };


    const closeModal = () => {

        modal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";

    };


    openBtn?.addEventListener(
        "click",
        openModal
    );


    reportBtn?.addEventListener(
        "click",
        () => {

            openModal();

            setTimeout(() => {

                const subject =
                    $("supportSubject");

                if (subject) {

                    subject.value =
                        "Report a Problem";

                }

            }, 50);

        }
    );


    closeBtn?.addEventListener(
        "click",
        closeModal
    );


    backdrop?.addEventListener(
        "click",
        closeModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "active"
                )
            ) {

                closeModal();

            }

        }
    );

}


// ============================================
// SUPPORT REQUEST
// ============================================

async function submitSupportRequest(event) {

    event.preventDefault();


    const subject =
        $("supportSubject")?.value.trim();

    const message =
        $("supportMessage")?.value.trim();


    if (!subject || !message) {

        alert(
            "Please complete all fields."
        );

        return;

    }


    const user =
        auth.currentUser;


    if (!user) {

        alert(
            "Please log in before contacting support."
        );

        return;

    }


    const submitBtn =
        document.querySelector(
            ".submit-support"
        );


    const originalHTML =
        submitBtn?.innerHTML;


    try {

        if (submitBtn) {

            submitBtn.disabled = true;

            submitBtn.innerHTML =
                "Sending...";

        }


        await addDoc(
            collection(
                db,
                "supportRequests"
            ),
            {

                userId:
                    user.uid,

                email:
                    user.email || "",

                subject,

                message,

                status:
                    "open",

                createdAt:
                    serverTimestamp()

            }
        );


        if (submitBtn) {

            submitBtn.innerHTML =
                "✓ Request Sent";

        }


        setTimeout(() => {

            $("supportModal")
                ?.classList
                .remove("active");

            document.body.style.overflow =
                "";

            $("supportForm")?.reset();


            if (submitBtn) {

                submitBtn.disabled = false;

                submitBtn.innerHTML =
                    originalHTML ||
                    "Send Request";

            }

        }, 1200);


    }

    catch(error) {

        console.error(
            "Support request error:",
            error
        );


        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerHTML =
                originalHTML ||
                "Send Request";

        }


        alert(
            "Something went wrong. Please try again."
        );

    }

}


// ============================================
// QUICK ACTIONS
// ============================================

function initQuickActions() {

    const actions =
        document.querySelectorAll(
            ".help-action"
        );


    actions.forEach(action => {

        action.addEventListener(
            "click",
            () => {

                const category =
                    action.dataset.category;


                if (!category)
                    return;


                const search =
                    $("helpSearch");


                if (search) {

                    search.value =
                        category;

                    search.dispatchEvent(
                        new Event("input")
                    );


                    search.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    search.focus();

                }

            }
        );

    });

}


// ============================================
// FORM LISTENER
// ============================================

const supportForm =
    $("supportForm");


supportForm?.addEventListener(
    "submit",
    submitSupportRequest
);


console.log(
    "🚀 Help Center Engine Loaded"
);