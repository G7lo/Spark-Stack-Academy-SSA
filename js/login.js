// ============================================
// SPARK STACK ACADEMY
// login.js
// PART 1 - IMPORTS & INITIALIZATION
// ============================================

import {
    auth,
    db
} from "./firebase.js";

import {
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    browserLocalPersistence,
    browserSessionPersistence,
    setPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================
// DOM ELEMENTS
// ============================================

const loginForm =
document.getElementById("loginForm");

const emailInput =
document.getElementById("email");

const passwordInput =
document.getElementById("password");

const rememberMe =
document.getElementById("rememberMe");

const loginBtn =
document.getElementById("loginBtn");

const googleLoginBtn =
document.getElementById("googleLogin");

const loader =
document.getElementById("authLoader");

const loaderText =
document.getElementById("loaderText");

const toastContainer =
document.getElementById("toastContainer");

const forgotPasswordBtn =
document.getElementById("forgotPassword");

const resetModal =
document.getElementById("resetModal");

const resetEmail =
document.getElementById("resetEmail");

const sendResetBtn =
document.getElementById("sendReset");

const cancelResetBtn =
document.getElementById("cancelReset");

// ============================================
// GOOGLE PROVIDER
// ============================================

const provider = new GoogleAuthProvider();

provider.setCustomParameters({

    prompt: "select_account"

});

// ============================================
// DASHBOARD ROUTES
// ============================================

const DASHBOARDS = {

    founder: "./founder/dashboard.html",

    admin: "./admin/dashboard.html",

    instructor: "./instructor/dashboard.html",

    student: "./student/dashboard.html"

};

// ============================================
// LOADER
// ============================================

function showLoader(

    message = "Signing you in..."

) {

    loader.classList.add("active");

    loaderText.textContent = message;

}

function hideLoader() {

    loader.classList.remove("active");

}

// ============================================
// TOASTS
// ============================================

function showToast(

    message,

    type = "success"

) {

    const toast =
    document.createElement("div");

    toast.className =
    `toast ${type}`;

    toast.innerHTML = `

        <strong>${message}</strong>

    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
        "translateX(40px)";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3500);

}

// ============================================
// HELPERS
// ============================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    .test(email);

}

function redirectByRole(role) {

    switch (role) {

        case "founder":

            window.location.href =
            DASHBOARDS.founder;

            break;

        case "admin":

            window.location.href =
            DASHBOARDS.admin;

            break;

        case "instructor":

            window.location.href =
            DASHBOARDS.instructor;

            break;

        case "student":

            window.location.href =
            DASHBOARDS.student;

            break;

        default:

            showToast(

                "Unknown account role.",

                "error"

            );

            hideLoader();

    }

}
// ============================================
// PART 2 - UI INTERACTIONS
// ============================================

// Show / Hide Password

document.querySelectorAll(".toggle-password")
.forEach(toggle => {

    toggle.addEventListener("click", () => {

        const input =
        document.getElementById(
            toggle.dataset.target
        );

        if (input.type === "password") {

            input.type = "text";

            toggle.classList.remove("fa-eye");
            toggle.classList.add("fa-eye-slash");

        } else {

            input.type = "password";

            toggle.classList.remove("fa-eye-slash");
            toggle.classList.add("fa-eye");

        }

    });

});

// ============================================
// REMEMBER ME
// ============================================

rememberMe.checked =
localStorage.getItem("rememberMe") === "true";

if (localStorage.getItem("savedEmail")) {

    emailInput.value =
    localStorage.getItem("savedEmail");

}

rememberMe.addEventListener("change", () => {

    localStorage.setItem(
        "rememberMe",
        rememberMe.checked
    );

    if (!rememberMe.checked) {

        localStorage.removeItem("savedEmail");

    }

});

// ============================================
// BUTTON STATES
// ============================================

function disableButtons() {

    loginBtn.disabled = true;

    googleLoginBtn.disabled = true;

}

function enableButtons() {

    loginBtn.disabled = false;

    googleLoginBtn.disabled = false;

}

// ============================================
// RESET PASSWORD MODAL
// ============================================

forgotPasswordBtn.addEventListener("click", (e) => {

    e.preventDefault();

    resetEmail.value = emailInput.value;

    resetModal.classList.add("active");

    resetEmail.focus();

});

cancelResetBtn.addEventListener("click", () => {

    resetModal.classList.remove("active");

});

resetModal.addEventListener("click", (e) => {

    if (e.target === resetModal) {

        resetModal.classList.remove("active");

    }

});

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================

sendResetBtn.addEventListener("click", async () => {

    const email =
    resetEmail.value.trim();

    if (!email) {

        showToast(
            "Enter your email address.",
            "warning"
        );

        return;

    }

    if (!isValidEmail(email)) {

        showToast(
            "Enter a valid email address.",
            "error"
        );

        return;

    }

    try {

        showLoader(
            "Sending password reset link..."
        );

        await sendPasswordResetEmail(
            auth,
            email
        );

        hideLoader();

        resetModal.classList.remove("active");

        showToast(
            "Password reset link sent successfully.",
            "success"
        );

    } catch (error) {

        hideLoader();

        switch (error.code) {

            case "auth/user-not-found":

                showToast(
                    "No account found with that email.",
                    "error"
                );

                break;

            case "auth/invalid-email":

                showToast(
                    "Invalid email address.",
                    "error"
                );

                break;

            default:

                showToast(
                    error.message,
                    "error"
                );

        }

    }

});

// ============================================
// SCROLL TO TOP
// ============================================

const scrollBtn =
document.getElementById("scrollTopBtn");

if (scrollBtn) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 250) {

            scrollBtn.classList.add("show");

        } else {

            scrollBtn.classList.remove("show");

        }

    });

    scrollBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}
// ============================================
// PART 3 - EMAIL/PASSWORD LOGIN
// ============================================

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
    emailInput.value.trim();

    const password =
    passwordInput.value;

    if (!email || !password) {

        showToast(
            "Please enter your email and password.",
            "warning"
        );

        return;

    }

    if (!isValidEmail(email)) {

        showToast(
            "Please enter a valid email address.",
            "error"
        );

        return;

    }

    try {

        disableButtons();

        showLoader("Signing you in...");

        // ==========================
        // REMEMBER ME
        // ==========================

        const persistence =
        rememberMe.checked
            ? browserLocalPersistence
            : browserSessionPersistence;

        await setPersistence(
            auth,
            persistence
        );

        if (rememberMe.checked) {

            localStorage.setItem(
                "savedEmail",
                email
            );

        } else {

            localStorage.removeItem(
                "savedEmail"
            );

        }

        // ==========================
        // FIREBASE LOGIN
        // ==========================

        const credential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user =
        credential.user;

        // ==========================
        // GET USER PROFILE
        // ==========================

        const userRef =
        doc(db, "users", user.uid);

        const userSnap =
        await getDoc(userRef);

        if (!userSnap.exists()) {

            hideLoader();

            enableButtons();

            showToast(
                "User profile not found.",
                "error"
            );

            return;

        }

        const userData =
        userSnap.data();

        // Optional account status check

        if (userData.active === false) {

            hideLoader();

            enableButtons();

            showToast(
                "This account has been disabled.",
                "error"
            );

            return;

        }

        // ==========================
        // UPDATE LAST LOGIN
        // ==========================

        await updateDoc(userRef, {

            lastLogin:
            serverTimestamp()

        });

        showToast(
            `Welcome back, ${userData.fullName}!`,
            "success"
        );

        // ==========================
        // ROLE REDIRECT
        // ==========================

        setTimeout(() => {

            redirectByRole(
                userData.role
            );

        }, 1200);

    } catch (error) {

        hideLoader();

        enableButtons();

        switch (error.code) {

            case "auth/invalid-credential":

            case "auth/wrong-password":

                showToast(
                    "Incorrect email or password.",
                    "error"
                );

                break;

            case "auth/user-not-found":

                showToast(
                    "Account not found.",
                    "error"
                );

                break;

            case "auth/invalid-email":

                showToast(
                    "Invalid email address.",
                    "error"
                );

                break;

            case "auth/too-many-requests":

                showToast(
                    "Too many attempts. Please try again later.",
                    "warning"
                );

                break;

            case "auth/network-request-failed":

                showToast(
                    "Network error. Check your internet connection.",
                    "error"
                );

                break;

            default:

                showToast(
                    error.message,
                    "error"
                );

        }

    }

});
// ============================================
// PART 4 - GOOGLE LOGIN & INITIALIZATION
// ============================================

googleLoginBtn.addEventListener("click", async () => {

    try {

        disableButtons();

        showLoader("Signing in with Google...");

        await setPersistence(
            auth,
            rememberMe.checked
                ? browserLocalPersistence
                : browserSessionPersistence
        );

        const result =
        await signInWithPopup(
            auth,
            provider
        );

        const user =
        result.user;

        const userRef =
        doc(db, "users", user.uid);

        const userSnap =
        await getDoc(userRef);

        // =====================================
        // FIRST GOOGLE LOGIN
        // =====================================

        if (!userSnap.exists()) {

            await setDoc(userRef, {

                uid: user.uid,

                fullName:
                user.displayName || "",

                email:
                user.email || "",

                role: "student",

                profilePhoto:
                user.photoURL || "",

                bio: "",

                expertise: "",

                provider: "google",

                verified:
                user.emailVerified,

                active: true,

                createdAt:
                serverTimestamp(),

                lastLogin:
                serverTimestamp()

            });

            showToast(
                "Welcome to Spark Stack Academy!",
                "success"
            );

            setTimeout(() => {

                redirectByRole("student");

            }, 1200);

            return;

        }

        // =====================================
        // EXISTING USER
        // =====================================

        const userData =
        userSnap.data();

        if (userData.active === false) {

            hideLoader();

            enableButtons();

            showToast(
                "This account has been disabled.",
                "error"
            );

            return;

        }

        await updateDoc(userRef, {

            lastLogin:
            serverTimestamp()

        });

        showToast(
            `Welcome back, ${userData.fullName}!`,
            "success"
        );

        setTimeout(() => {

            redirectByRole(
                userData.role
            );

        }, 1200);

    } catch (error) {

        hideLoader();

        enableButtons();

        switch (error.code) {

            case "auth/popup-closed-by-user":

                showToast(
                    "Google sign in cancelled.",
                    "warning"
                );

                break;

            case "auth/cancelled-popup-request":

                showToast(
                    "Another sign in request is already running.",
                    "warning"
                );

                break;

            case "auth/network-request-failed":

                showToast(
                    "Check your internet connection.",
                    "error"
                );

                break;

            default:

                showToast(
                    error.message,
                    "error"
                );

        }

    }

});

// ============================================
// PAGE INITIALIZATION
// ============================================

window.addEventListener("load", () => {

    hideLoader();

    emailInput.focus();

});

// ============================================
// ENTER KEY SUPPORT
// ============================================

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        resetModal.classList.remove("active");

    }

});

// ============================================
// READY
// ============================================

console.log(
    "%cSpark Stack Academy Login Ready 🚀",
    "color:#0B2D5C;font-size:16px;font-weight:bold;"
);