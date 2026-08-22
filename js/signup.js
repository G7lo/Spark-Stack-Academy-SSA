// Spark Stack Academy — Clerk Signup UI
import { getClerk } from "./clerk-client.js";
import { getCurrentProfile, provisionAccount } from "./supabase-auth.js";

const form = document.getElementById("signupForm");
const card = document.querySelector(".login-card");
const loader = document.getElementById("authLoader");
const loaderText = document.getElementById("loaderText");
const toastContainer = document.getElementById("toastContainer");

function toast(message, type = "success") {
    if (!toastContainer) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    const text = document.createElement("strong");
    text.textContent = message;
    el.appendChild(text);
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function loading(message = "Creating your secure account...") {
    loader?.classList.add("active");
    if (loaderText) loaderText.textContent = message;
}

function hideLoading() {
    loader?.classList.remove("active");
}

async function finishSignup(clerk, role, bio, expertise) {
    if (!clerk?.isSignedIn || !clerk.user) return;

    loading("Finishing your Spark Stack Academy setup...");

    try {
        await provisionAccount({ role, bio, expertise });
        const profile = await getCurrentProfile();
        if (!profile) throw new Error("Your profile could not be created.");

        toast("Account created successfully! 🎉", "success");
        setTimeout(() => window.location.replace("login.html"), 900);
    } catch (error) {
        console.error("Clerk provisioning error:", error);
        hideLoading();
        toast(error.message || "Account setup failed. Please try again.", "error");
        await clerk.signOut().catch(() => {});
    }
}

async function init() {
    try {
        const clerk = await getClerk();

        if (clerk.isSignedIn) {
            window.location.replace("student/dashboard.html");
            return;
        }

        if (form) form.style.display = "none";

        const panel = document.createElement("section");
        panel.className = "ssa-clerk-signup-panel";
        panel.innerHTML = `
            <div class="ssa-role-picker">
                <label for="ssaRole">Account type</label>
                <select id="ssaRole">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                </select>
            </div>
            <div id="ssaInstructorFields" class="ssa-instructor-fields" hidden>
                <label for="ssaBio">Professional bio</label>
                <textarea id="ssaBio" rows="3" placeholder="Tell us briefly about yourself"></textarea>
                <label for="ssaExpertise">Area of expertise</label>
                <input id="ssaExpertise" type="text" placeholder="e.g. Web Development">
            </div>
            <div class="ssa-legal-note">
                By creating an account, you agree to our
                <a href="terms.html">Terms &amp; Conditions</a> and
                <a href="privacy.html">Privacy Policy</a>.
            </div>
            <div id="ssaClerkSignup"></div>
        `;
        card?.appendChild(panel);

        const role = panel.querySelector("#ssaRole");
        const instructorFields = panel.querySelector("#ssaInstructorFields");
        const bio = panel.querySelector("#ssaBio");
        const expertise = panel.querySelector("#ssaExpertise");
        const mount = panel.querySelector("#ssaClerkSignup");

        const mountSignup = () => {
            mount.innerHTML = "";
            instructorFields.hidden = role.value !== "instructor";
            clerk.mountSignUp(mount, {
                unsafeMetadata: {
                    role: role.value,
                    bio: role.value === "instructor" ? bio.value.trim() : "",
                    expertise: role.value === "instructor" ? expertise.value.trim() : ""
                },
                signInUrl: "/login.html",
                fallbackRedirectUrl: "/login.html",
                appearance: {
                    options: {
                        termsPageUrl: "/terms.html"
                    }
                }
            });
        };

        role.addEventListener("change", mountSignup);
        mountSignup();

        clerk.addListener(({ user }) => {
            if (user) {
                finishSignup(
                    clerk,
                    user.unsafeMetadata?.role === "instructor" ? "instructor" : "student",
                    user.unsafeMetadata?.bio || "",
                    user.unsafeMetadata?.expertise || ""
                );
            }
        });
    } catch (error) {
        console.error("Clerk initialization error:", error);
        hideLoading();
        toast(error.message || "Authentication is temporarily unavailable.", "error");
    }
}

init();
