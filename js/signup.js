// ============================================
// SPARK STACK ACADEMY
// signup.js
// PART 1 - IMPORTS & INITIALIZATION
// ============================================

import {
    auth,
    db
} from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================
// DOM ELEMENTS
// ============================================

const signupForm = document.getElementById("signupForm");

const nameInput = document.getElementById("name");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const confirmPasswordInput =
document.getElementById("confirmPassword");

const roleSelect =
document.getElementById("role");

const bioInput =
document.getElementById("bio");

const expertiseInput =
document.getElementById("expertise");

const termsCheckbox =
document.getElementById("terms");

const signupBtn =
document.getElementById("signupBtn");

const googleSignupBtn =
document.getElementById("googleSignup");

const instructorFields =
document.getElementById("instructorFields");

const strengthBar =
document.getElementById("strengthBar");

const strengthText =
document.getElementById("strengthText");

const loader =
document.getElementById("authLoader");

const loaderText =
document.getElementById("loaderText");

const toastContainer =
document.getElementById("toastContainer");

// ============================================
// GOOGLE PROVIDER
// ============================================

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
    prompt: "select_account"
});

// ============================================
// LOADER
// ============================================

function showLoader(message = "Creating your account...") {

    loader.classList.add("active");

    loaderText.textContent = message;

}

function hideLoader() {

    loader.classList.remove("active");

}

// ============================================
// TOAST
// ============================================

function showToast(message, type = "success") {

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <strong>${message}</strong>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform = "translateX(40px)";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3500);

}

// ============================================
// VALIDATORS
// ============================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

function hasUpperCase(password) {

    return /[A-Z]/.test(password);

}

function hasLowerCase(password) {

    return /[a-z]/.test(password);

}

function hasNumber(password) {

    return /\d/.test(password);

}

function hasMinimumLength(password) {

    return password.length >= 8;

}

// ============================================
// PASSWORD RULE ITEMS
// ============================================

const ruleLength =
document.getElementById("ruleLength");

const ruleUpper =
document.getElementById("ruleUpper");

const ruleLower =
document.getElementById("ruleLower");

const ruleNumber =
document.getElementById("ruleNumber");
// ============================================
// PART 2 - UI INTERACTIONS
// ============================================

// Toggle Password Visibility

document.querySelectorAll(".toggle-password")
.forEach(toggle => {

    toggle.addEventListener("click", () => {

        const target =
        document.getElementById(
            toggle.dataset.target
        );

        if (target.type === "password") {

            target.type = "text";

            toggle.classList.remove("fa-eye");
            toggle.classList.add("fa-eye-slash");

        } else {

            target.type = "password";

            toggle.classList.remove("fa-eye-slash");
            toggle.classList.add("fa-eye");

        }

    });

});

// ============================================
// PASSWORD STRENGTH
// ============================================

function updatePasswordStrength() {

    const password = passwordInput.value;

    let score = 0;

    ruleLength.classList.remove("valid");
    ruleUpper.classList.remove("valid");
    ruleLower.classList.remove("valid");
    ruleNumber.classList.remove("valid");

    if (hasMinimumLength(password)) {

        score++;
        ruleLength.classList.add("valid");

    }

    if (hasUpperCase(password)) {

        score++;
        ruleUpper.classList.add("valid");

    }

    if (hasLowerCase(password)) {

        score++;
        ruleLower.classList.add("valid");

    }

    if (hasNumber(password)) {

        score++;
        ruleNumber.classList.add("valid");

    }

    switch (score) {

        case 0:

            strengthBar.style.width = "0%";
            strengthBar.style.background = "#EF4444";
            strengthText.textContent = "Enter a password.";
            break;

        case 1:

            strengthBar.style.width = "25%";
            strengthBar.style.background = "#EF4444";
            strengthText.textContent = "Weak password";
            break;

        case 2:

            strengthBar.style.width = "50%";
            strengthBar.style.background = "#F59E0B";
            strengthText.textContent = "Fair password";
            break;

        case 3:

            strengthBar.style.width = "75%";
            strengthBar.style.background = "#3B82F6";
            strengthText.textContent = "Good password";
            break;

        case 4:

            strengthBar.style.width = "100%";
            strengthBar.style.background = "#22C55E";
            strengthText.textContent = "Strong password";
            break;

    }

}

// Live Password Check

passwordInput.addEventListener(
    "input",
    updatePasswordStrength
);

// ============================================
// CONFIRM PASSWORD
// ============================================

confirmPasswordInput.addEventListener("input", () => {

    if (
        confirmPasswordInput.value === ""
    ) {

        confirmPasswordInput.style.borderColor = "";

        return;

    }

    if (
        confirmPasswordInput.value ===
        passwordInput.value
    ) {

        confirmPasswordInput.style.borderColor =
        "#22C55E";

    } else {

        confirmPasswordInput.style.borderColor =
        "#EF4444";

    }

});

// ============================================
// ROLE TOGGLE
// ============================================

roleSelect.addEventListener("change", () => {

    if (roleSelect.value === "instructor") {

        instructorFields.style.display = "block";

    } else {

        instructorFields.style.display = "none";

        bioInput.value = "";

        expertiseInput.value = "";

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
// BUTTON LOADING STATE
// ============================================

function disableButtons() {

    signupBtn.disabled = true;

    googleSignupBtn.disabled = true;

}

function enableButtons() {

    signupBtn.disabled = false;

    googleSignupBtn.disabled = false;

}
// ============================================
// PART 3 - EMAIL SIGN UP
// ============================================

signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const fullName = nameInput.value.trim();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    const confirmPassword =
    confirmPasswordInput.value;

    const role = roleSelect.value;

    const bio = bioInput.value.trim();

    const expertise =
    expertiseInput.value.trim();

    // ==========================
    // VALIDATION
    // ==========================

    if (!fullName) {

        showToast(
            "Please enter your full name.",
            "error"
        );

        return;

    }

    if (!isValidEmail(email)) {

        showToast(
            "Please enter a valid email.",
            "error"
        );

        return;

    }

    if (
        !hasMinimumLength(password) ||
        !hasUpperCase(password) ||
        !hasLowerCase(password) ||
        !hasNumber(password)
    ) {

        showToast(
            "Password does not meet the minimum requirements.",
            "error"
        );

        return;

    }

    if (password !== confirmPassword) {

        showToast(
            "Passwords do not match.",
            "error"
        );

        return;

    }

    if (!role) {

        showToast(
            "Select an account type.",
            "error"
        );

        return;

    }

    if (!termsCheckbox.checked) {

        showToast(
            "You must accept the Terms & Conditions.",
            "warning"
        );

        return;

    }

    try {

        disableButtons();

        showLoader("Creating your account...");

        // ==========================
        // FIREBASE AUTH
        // ==========================

        const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user =
        userCredential.user;

        // ==========================
        // UPDATE DISPLAY NAME
        // ==========================

        await updateProfile(user, {

            displayName: fullName

        });

        // ==========================
        // SAVE TO FIRESTORE
        // ==========================

        await setDoc(
            doc(db, "users", user.uid),
            {

                uid: user.uid,

                fullName,

                email,

                role,

                bio:
                    role === "instructor"
                    ? bio
                    : "",

                expertise:
                    role === "instructor"
                    ? expertise
                    : "",

                profilePhoto: "",

                verified: false,

                active: true,

                createdAt:
                serverTimestamp(),

                lastLogin:
                serverTimestamp()

            }
        );

        showToast(
            "Account created successfully!",
            "success"
        );

        setTimeout(() => {

            hideLoader();

            if (role === "student") {

                window.location.href =
                "student/dashboard.html";

            } else {

                window.location.href = "login.html";

            }

        }, 1800);

    } catch (error) {

        hideLoader();

        enableButtons();

        switch (error.code) {

            case "auth/email-already-in-use":

                showToast(
                    "This email is already registered.",
                    "error"
                );

                break;

            case "auth/invalid-email":

                showToast(
                    "Invalid email address.",
                    "error"
                );

                break;

            case "auth/weak-password":

                showToast(
                    "Choose a stronger password.",
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
// PART 4 - GOOGLE SIGN UP & INITIALIZATION
// ============================================

// Google Authentication

googleSignupBtn.addEventListener("click", async () => {

    try {

        disableButtons();

        showLoader("Signing in with Google...");

        const result = await signInWithPopup(
            auth,
            provider
        );

        const user = result.user;

        // Save user profile (merge prevents overwrite)

        await setDoc(
            doc(db, "users", user.uid),
            {
            // ==========================
// CREATE STUDENT PROFILE
// ==========================

if(role === "student"){

    await setDoc(
        doc(db, "students", user.uid),
        {

            uid: user.uid,

            name: fullName,

            email,

            level: 1,

            xp: 0,

            streak: 0,

            badges: [],

            stats: {

                coursesEnrolled: 0,

                lessonsCompleted: 0,

                progress: 0,

                certificates: 0

            },

            admissionNumber: "Pending",

            createdAt: serverTimestamp()

        }
    );

}

                uid: user.uid,

                fullName:
                    user.displayName || "",

                email:
                    user.email || "",

                role: "student",

                bio: "",

                expertise: "",

                profilePhoto:
                    user.photoURL || "",

                verified: user.emailVerified,

                active: true,

                provider: "google",

                createdAt:
                    serverTimestamp(),

                lastLogin:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );

        showToast(
            "Welcome to Spark Stack Academy!",
            "success"
        );

        setTimeout(() => {

            hideLoader();

            window.location.href = "login.html";

        }, 1500);

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

            default:

                showToast(
                    error.message,
                    "error"
                );

        }

    }

});

// ============================================
// INITIALIZATION
// ============================================

// Focus first field

window.addEventListener("load", () => {

    nameInput.focus();

    hideLoader();

});

// Enter key submits naturally

document.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        const active =
        document.activeElement;

        if (
            active &&
            active.tagName !== "TEXTAREA"
        ) {

            signupForm.requestSubmit();

        }

    }

});

// Keep lastLogin updated after successful auth
// (Optional if you later use auth state listeners)

auth.onAuthStateChanged?.((user) => {

    if (user) {

        console.log(
            `Signed in as ${user.email}`
        );

    }

});

// ============================================
// END OF FILE
// ============================================

console.log(
    "%cSpark Stack Academy Signup Ready 🚀",
    "color:#0B2D5C;font-size:16px;font-weight:bold;"
);