// ============================================
// SPARK STACK ACADEMY
// SIGNUP CONTROLLER V2
// FIREBASE AUTH + SUPABASE BACKEND PROVISIONING
// ============================================

import { auth, db } from "./firebase.js";

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

const signupForm = document.getElementById("signupForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const roleSelect = document.getElementById("role");
const bioInput = document.getElementById("bio");
const expertiseInput = document.getElementById("expertise");
const termsCheckbox = document.getElementById("terms");
const signupBtn = document.getElementById("signupBtn");
const googleSignupBtn = document.getElementById("googleSignup");
const instructorFields = document.getElementById("instructorFields");
const toastContainer = document.getElementById("toastContainer");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const PROVISION_URL = "https://nlnwllpisbqgbeluhdbr.supabase.co/functions/v1/provision-account";

function showLoader(message) {
    if (!loader) return;
    loader.classList.add("active");
    if (loaderText) loaderText.textContent = message;
}

function hideLoader() {
    if (loader) loader.classList.remove("active");
}

function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>${escapeHtml(message)}</strong>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(40px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function hasUpperCase(password) { return /[A-Z]/.test(password); }
function hasLowerCase(password) { return /[a-z]/.test(password); }
function hasNumber(password) { return /\d/.test(password); }
function hasMinimumLength(password) { return password.length >= 8; }

function disableButtons() {
    if (signupBtn) signupBtn.disabled = true;
    if (googleSignupBtn) googleSignupBtn.disabled = true;
}

function enableButtons() {
    if (signupBtn) signupBtn.disabled = false;
    if (googleSignupBtn) googleSignupBtn.disabled = false;
}

async function provisionSupabaseAccount({ firebaseUid, email = "", fullName = "", role = "student", avatarUrl = "" }) {
    if (!firebaseUid) throw new Error("Missing Firebase UID.");
    const user = auth.currentUser;
    if (!user || user.uid !== firebaseUid) throw new Error("Firebase session is unavailable. Please try again.");
    const token = await user.getIdToken(true);
    const response = await fetch(PROVISION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ firebaseUid, email, fullName, role, avatarUrl })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.error || "Supabase account provisioning failed.");
    return result;
}

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fullName = nameInput?.value.trim() || "";
        const email = emailInput?.value.trim() || "";
        const password = passwordInput?.value || "";
        const confirmPassword = confirmPasswordInput?.value || "";
        const role = roleSelect?.value || "";
        const bio = bioInput?.value.trim() || "";
        const expertise = expertiseInput?.value.trim() || "";

        if (!fullName) return showToast("Enter your full name", "error");
        if (!isValidEmail(email)) return showToast("Enter a valid email", "error");
        if (!hasMinimumLength(password) || !hasUpperCase(password) || !hasLowerCase(password) || !hasNumber(password)) return showToast("Password must contain uppercase, lowercase, number and 8 characters", "error");
        if (password !== confirmPassword) return showToast("Passwords do not match", "error");
        if (!role) return showToast("Select account type", "error");
        if (termsCheckbox && !termsCheckbox.checked) return showToast("Accept Terms & Conditions", "warning");

        try {
            disableButtons();
            showLoader("Creating account...");
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const user = credential.user;
            await updateProfile(user, { displayName: fullName });

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, fullName, email, role,
                bio: role === "instructor" ? bio : "",
                expertise: role === "instructor" ? expertise : "",
                profilePhoto: "", active: true, verified: false,
                createdAt: serverTimestamp(), lastLogin: serverTimestamp()
            });

            if (role === "student") {
                await setDoc(doc(db, "students", user.uid), {
                    uid: user.uid, name: fullName, email, level: 1, xp: 0, streak: 0, badges: [],
                    stats: { coursesEnrolled: 0, lessonsCompleted: 0, progress: 0, certificates: 0 },
                    admissionNumber: "Pending", createdAt: serverTimestamp()
                });
            }

            await provisionSupabaseAccount({ firebaseUid: user.uid, email, fullName, role, avatarUrl: user.photoURL || "" });
            showToast("Account created successfully! Please sign in.", "success");
            setTimeout(() => { hideLoader(); window.location.href = "login.html"; }, 1500);
        } catch (error) {
            console.error("Signup Error:", error);
            hideLoader(); enableButtons();
            showToast(error.message || "Signup failed.", "error");
        }
    });
}

if (googleSignupBtn) {
    googleSignupBtn.addEventListener("click", async () => {
        // Google signup must follow the same legal-consent requirement as email signup.
        if (termsCheckbox && !termsCheckbox.checked) {
            showToast("Please accept the Terms & Conditions and Privacy Policy before continuing.", "warning");
            termsCheckbox.focus();
            return;
        }

        try {
            disableButtons();
            showLoader("Signing in with Google...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const role = "student";
            const fullName = user.displayName || "Student";
            const email = user.email || "";
            const avatarUrl = user.photoURL || "";

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, fullName, email, role, bio: "", expertise: "",
                profilePhoto: avatarUrl, active: true, verified: user.emailVerified,
                provider: "google", createdAt: serverTimestamp(), lastLogin: serverTimestamp()
            }, { merge: true });

            await setDoc(doc(db, "students", user.uid), {
                uid: user.uid, name: fullName, email, level: 1, xp: 0, streak: 0, badges: [],
                stats: { coursesEnrolled: 0, lessonsCompleted: 0, progress: 0, certificates: 0 },
                admissionNumber: "Pending", createdAt: serverTimestamp()
            }, { merge: true });

            await provisionSupabaseAccount({ firebaseUid: user.uid, email, fullName, role, avatarUrl });
            showToast("Account created successfully! Please sign in.", "success");
            setTimeout(() => { hideLoader(); window.location.href = "login.html"; }, 1500);
        } catch (error) {
            console.error("Google Signup Error:", error);
            hideLoader(); enableButtons();
            showToast(error.message || "Google signup failed.", "error");
        }
    });
}

console.log("🚀 SSA Signup Controller Loaded");
console.log("✅ Google Signup Ready");

document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
        const target = document.getElementById(toggle.dataset.target);
        if (!target) return;
        if (target.type === "password") {
            target.type = "text";
            toggle.classList.remove("fa-eye"); toggle.classList.add("fa-eye-slash");
        } else {
            target.type = "password";
            toggle.classList.remove("fa-eye-slash"); toggle.classList.add("fa-eye");
        }
    });
});

if (roleSelect) {
    roleSelect.addEventListener("change", () => {
        const instructor = roleSelect.value === "instructor";
        if (instructorFields) instructorFields.style.display = instructor ? "block" : "none";
        if (!instructor) {
            if (bioInput) bioInput.value = "";
            if (expertiseInput) expertiseInput.value = "";
        }
    });
}

if (passwordInput) {
    passwordInput.addEventListener("input", () => {
        let score = 0;
        if (hasMinimumLength(passwordInput.value)) score++;
        if (hasUpperCase(passwordInput.value)) score++;
        if (hasLowerCase(passwordInput.value)) score++;
        if (hasNumber(passwordInput.value)) score++;
        if (strengthBar) strengthBar.style.width = `${score * 25}%`;
        if (strengthText) strengthText.textContent = ["Enter password", "Weak", "Fair", "Good", "Strong"][score];
    });
}
