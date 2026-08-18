// ============================================================
// SPARK STACK ACADEMY
// ADMIN / MODERATOR SETTINGS ENGINE
// ============================================================

console.log("🔥🔥🔥 SETTINGS JS LOADED 🔥🔥🔥");

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged,
    updatePassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentUser = null;

const SETTINGS_KEY = "ssa_moderator_settings";


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const defaultSettings = {

    notifyReports: true,
    notifyCritical: true,
    notifyAnnouncements: true,
    notifyEmail: true,

    criticalEscalation: true,
    reviewReminders: true,

    defaultReportPriority: "medium",

    defaultAnnouncementAudience: "all-users",
    allowBroadcasts: true,
    allowUrgentBroadcasts: false,

    appearanceTheme: "system",
    tableDensity: "comfortable",

    timezone: "Africa/Nairobi",
    currency: "KES",
    dateFormat: "DD/MM/YYYY",
    itemsPerPage: "25"

};


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initSettings();

});


// ============================================================
// INITIALIZE
// ============================================================

function initSettings() {

    setupNavigation();

    setupButtons();

    setupToggles();

    setupAppearance();

    setupResetButtons();

    setupPasswordModal();

    loadLocalSettings();

    loadUser();

    refreshIcons();

}


// ============================================================
// SETTINGS NAVIGATION
// ============================================================

function setupNavigation() {

    const navItems =
        document.querySelectorAll(".settings-nav-item");

    const panels =
        document.querySelectorAll(".settings-section");


    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const section =
                item.dataset.settingsSection;

            if (!section) return;


            // Active nav

            navItems.forEach(nav => {

                nav.classList.remove("active");

            });

            item.classList.add("active");


            // Active panel

            panels.forEach(panel => {

                panel.classList.remove("active");

            });


            const target =
                document.querySelector(
                    `[data-settings-panel="${section}"]`
                );


            if (target) {

                target.classList.add("active");

            }


            // Remember last section

            localStorage.setItem(
                "ssa_settings_section",
                section
            );


            refreshIcons();

        });

    });


    // Restore previous section

    const savedSection =
        localStorage.getItem(
            "ssa_settings_section"
        );


    if (savedSection) {

        const savedNav =
            document.querySelector(
                `[data-settings-section="${savedSection}"]`
            );

        if (savedNav) {

            savedNav.click();

        }

    }

}


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

    document
        .getElementById("saveAccountBtn")
        ?.addEventListener(
            "click",
            saveAccount
        );


    document
        .getElementById("saveModerationBtn")
        ?.addEventListener(
            "click",
            saveModeration
        );


    document
        .getElementById("saveCommunicationBtn")
        ?.addEventListener(
            "click",
            saveCommunication
        );


    document
        .getElementById("saveAppearanceBtn")
        ?.addEventListener(
            "click",
            saveAppearance
        );


    document
        .getElementById("saveSystemBtn")
        ?.addEventListener(
            "click",
            saveSystem
        );


    document
        .getElementById("signOutEverywhereBtn")
        ?.addEventListener(
            "click",
            signOutEverywhere
        );


    document
        .getElementById("dangerRevokeSessionsBtn")
        ?.addEventListener(
            "click",
            signOutEverywhere
        );


    document
        .getElementById("changePasswordBtn")
        ?.addEventListener(
            "click",
            openPasswordModal
        );

}


// ============================================================
// TOGGLES
// ============================================================

function setupToggles() {

    const toggles = [

        "notifyReports",
        "notifyCritical",
        "notifyAnnouncements",
        "notifyEmail",

        "criticalEscalation",
        "reviewReminders",

        "allowBroadcasts",
        "allowUrgentBroadcasts"

    ];


    toggles.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) return;


        element.addEventListener(
            "change",
            saveAllSettings
        );

    });

}


// ============================================================
// APPEARANCE
// ============================================================

function setupAppearance() {

    document
        .getElementById("appearanceTheme")
        ?.addEventListener(
            "change",
            event => {

                applyTheme(event.target.value);

                saveAllSettings();

            }
        );


    document
        .getElementById("tableDensity")
        ?.addEventListener(
            "change",
            saveAllSettings
        );

}


// ============================================================
// LOAD USER
// ============================================================

function loadUser() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                console.warn(
                    "⚠️ No authenticated moderator."
                );

                return;

            }


            currentUser = user;


            const email =
                document.getElementById(
                    "settingsEmail"
                );

            const profileEmail =
                document.getElementById(
                    "settingsProfileEmail"
                );


            if (email) {

                email.value =
                    user.email || "";

            }


            if (profileEmail) {

                profileEmail.textContent =
                    user.email || "—";

            }


            await loadModeratorProfile(user);

            await loadFirestoreSettings(user);

        }
    );

}


// ============================================================
// LOAD MODERATOR PROFILE
// ============================================================

async function loadModeratorProfile(user) {

    try {

        const ref =
            doc(db, "users", user.uid);

        const snapshot =
            await getDoc(ref);


        if (!snapshot.exists()) return;


        const data =
            snapshot.data();


        const name =
            data.displayName ||
            data.name ||
            user.displayName ||
            "Administrator";


        const nameInput =
            document.getElementById(
                "settingsName"
            );

        const profileName =
            document.getElementById(
                "settingsProfileName"
            );

        const avatar =
            document.getElementById(
                "settingsAvatar"
            );


        if (nameInput) {

            nameInput.value = name;

        }


        if (profileName) {

            profileName.textContent = name;

        }


        if (avatar) {

            avatar.textContent =
                name.charAt(0).toUpperCase();

        }

    } catch (error) {

        console.error(
            "❌ Profile load error:",
            error
        );

    }

}


// ============================================================
// SAVE ACCOUNT
// ============================================================

async function saveAccount() {

    if (!currentUser) {

        notify("You are not signed in.", "error");

        return;

    }


    const nameInput =
        document.getElementById(
            "settingsName"
        );


    const name =
        nameInput?.value.trim();


    if (!name) {

        notify(
            "Please enter a display name.",
            "error"
        );

        return;

    }


    try {

        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                displayName: name,
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );


        document
            .getElementById(
                "settingsProfileName"
            )
            ?.replaceChildren(
                document.createTextNode(name)
            );


        const avatar =
            document.getElementById(
                "settingsAvatar"
            );


        if (avatar) {

            avatar.textContent =
                name.charAt(0).toUpperCase();

        }


        notify(
            "Account updated successfully.",
            "success"
        );

    } catch (error) {

        console.error(error);

        notify(
            "Unable to save account.",
            "error"
        );

    }

}


// ============================================================
// LOAD FIRESTORE SETTINGS
// ============================================================

async function loadFirestoreSettings(user) {

    try {

        const ref =
            doc(
                db,
                "moderatorSettings",
                user.uid
            );


        const snapshot =
            await getDoc(ref);


        if (!snapshot.exists()) return;


        const settings =
            snapshot.data();


        applySettings(
            {
                ...defaultSettings,
                ...settings
            }
        );

    } catch (error) {

        console.error(
            "❌ Settings load error:",
            error
        );

    }

}


// ============================================================
// SAVE ALL SETTINGS
// ============================================================

async function saveAllSettings() {

    const settings =
        collectSettings();


    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );


    if (!currentUser) return;


    try {

        await setDoc(
            doc(
                db,
                "moderatorSettings",
                currentUser.uid
            ),
            {
                ...settings,
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "❌ Settings save error:",
            error
        );

    }

}


// ============================================================
// COLLECT SETTINGS
// ============================================================

function collectSettings() {

    return {

        notifyReports:
            getChecked("notifyReports"),

        notifyCritical:
            getChecked("notifyCritical"),

        notifyAnnouncements:
            getChecked("notifyAnnouncements"),

        notifyEmail:
            getChecked("notifyEmail"),

        criticalEscalation:
            getChecked("criticalEscalation"),

        reviewReminders:
            getChecked("reviewReminders"),

        allowBroadcasts:
            getChecked("allowBroadcasts"),

        allowUrgentBroadcasts:
            getChecked("allowUrgentBroadcasts"),


        defaultReportPriority:
            getValue(
                "defaultReportPriority",
                "medium"
            ),

        defaultAnnouncementAudience:
            getValue(
                "defaultAnnouncementAudience",
                "all-users"
            ),

        appearanceTheme:
            getValue(
                "appearanceTheme",
                "system"
            ),

        tableDensity:
            getValue(
                "tableDensity",
                "comfortable"
            ),

        timezone:
            getValue(
                "settingsTimezone",
                "Africa/Nairobi"
            ),

        currency:
            getValue(
                "settingsCurrency",
                "KES"
            ),

        dateFormat:
            getValue(
                "settingsDateFormat",
                "DD/MM/YYYY"
            ),

        itemsPerPage:
            getValue(
                "itemsPerPage",
                "25"
            )

    };

}


// ============================================================
// APPLY SETTINGS
// ============================================================

function applySettings(settings) {

    Object.keys(settings).forEach(key => {

        const element =
            document.getElementById(
                key
            );


        if (!element) return;


        if (element.type === "checkbox") {

            element.checked =
                Boolean(settings[key]);

        } else {

            element.value =
                settings[key];

        }

    });


    applyTheme(
        settings.appearanceTheme
    );

}


// ============================================================
// LOCAL SETTINGS
// ============================================================

function loadLocalSettings() {

    try {

        const saved =
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (!saved) return;


        const settings =
            JSON.parse(saved);


        applySettings(settings);

    } catch (error) {

        console.warn(
            "⚠️ Local settings could not load."
        );

    }

}


// ============================================================
// MODERATION
// ============================================================

async function saveModeration() {

    await saveAllSettings();

    notify(
        "Moderation preferences saved.",
        "success"
    );

}


// ============================================================
// COMMUNICATION
// ============================================================

async function saveCommunication() {

    await saveAllSettings();

    notify(
        "Communication preferences saved.",
        "success"
    );

}


// ============================================================
// APPEARANCE
// ============================================================

async function saveAppearance() {

    applyTheme(
        getValue(
            "appearanceTheme",
            "system"
        )
    );

    await saveAllSettings();

    notify(
        "Appearance saved.",
        "success"
    );

}


// ============================================================
// SYSTEM
// ============================================================

async function saveSystem() {

    await saveAllSettings();

    notify(
        "System preferences saved.",
        "success"
    );

}


// ============================================================
// THEME
// ============================================================

function applyTheme(theme) {

    const body =
        document.body;


    body.classList.remove(
        "theme-light",
        "theme-dark"
    );


    if (theme === "dark") {

        body.classList.add(
            "theme-dark"
        );

    }


    if (theme === "light") {

        body.classList.add(
            "theme-light"
        );

    }

}


// ============================================================
// PASSWORD MODAL
// ============================================================

function setupPasswordModal() {

    const modal =
        document.getElementById(
            "changePasswordModal"
        );


    document
        .getElementById(
            "closePasswordModal"
        )
        ?.addEventListener(
            "click",
            closePasswordModal
        );


    document
        .getElementById(
            "cancelPasswordBtn"
        )
        ?.addEventListener(
            "click",
            closePasswordModal
        );


    modal
        ?.querySelector(
            ".admin-modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closePasswordModal
        );


    document
        .getElementById(
            "changePasswordForm"
        )
        ?.addEventListener(
            "submit",
            handlePasswordChange
        );

}


// ============================================================
// OPEN PASSWORD MODAL
// ============================================================

function openPasswordModal() {

    const modal =
        document.getElementById(
            "changePasswordModal"
        );


    if (!modal) return;


    modal.classList.remove(
        "hidden"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


// ============================================================
// CLOSE PASSWORD MODAL
// ============================================================

function closePasswordModal() {

    const modal =
        document.getElementById(
            "changePasswordModal"
        );


    if (!modal) return;


    modal.classList.add(
        "hidden"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document
        .getElementById(
            "changePasswordForm"
        )
        ?.reset();

}


// ============================================================
// PASSWORD CHANGE
// ============================================================

async function handlePasswordChange(event) {

    event.preventDefault();


    if (!currentUser) {

        notify(
            "You are not signed in.",
            "error"
        );

        return;

    }


    const newPassword =
        document.getElementById(
            "newPassword"
        )?.value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value;


    if (newPassword !== confirmPassword) {

        notify(
            "Passwords do not match.",
            "error"
        );

        return;

    }


    if (newPassword.length < 8) {

        notify(
            "Password must contain at least 8 characters.",
            "error"
        );

        return;

    }


    try {

        await updatePassword(
            currentUser,
            newPassword
        );


        closePasswordModal();


        notify(
            "Password updated successfully.",
            "success"
        );

    } catch (error) {

        console.error(error);


        notify(
            "Password update failed. You may need to sign in again first.",
            "error"
        );

    }

}


// ============================================================
// SIGN OUT EVERYWHERE
// ============================================================

async function signOutEverywhere() {

    const confirmed =
        confirm(
            "Sign out this account from the current session?"
        );


    if (!confirmed) return;


    try {

        await signOut(auth);

        notify(
            "Signed out successfully.",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 700);

    } catch (error) {

        console.error(error);

        notify(
            "Unable to sign out.",
            "error"
        );

    }

}


// ============================================================
// RESET SETTINGS
// ============================================================

function setupResetButtons() {

    document
        .getElementById(
            "resetSettingsBtn"
        )
        ?.addEventListener(
            "click",
            resetPreferences
        );


    document
        .getElementById(
            "dangerResetPreferencesBtn"
        )
        ?.addEventListener(
            "click",
            resetPreferences
        );

}


// ============================================================
// RESET
// ============================================================

async function resetPreferences() {

    const confirmed =
        confirm(
            "Reset all console preferences to their defaults?"
        );


    if (!confirmed) return;


    applySettings(
        defaultSettings
    );


    localStorage.removeItem(
        SETTINGS_KEY
    );


    await saveAllSettings();


    notify(
        "Preferences restored to defaults.",
        "success"
    );

}


// ============================================================
// HELPERS
// ============================================================

function getChecked(id) {

    return Boolean(
        document.getElementById(id)?.checked
    );

}


function getValue(id, fallback) {

    return (
        document.getElementById(id)?.value ||
        fallback
    );

}


// ============================================================
// NOTIFICATION
// ============================================================

function notify(message, type = "success") {

    let container =
        document.getElementById(
            "settingsToastContainer"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "settingsToastContainer";

        container.className =
            "admin-toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");


    toast.className =
        `admin-toast ${type}`;


    toast.innerHTML = `

        <i data-lucide="${
            type === "error"
                ? "circle-alert"
                : "circle-check"
        }"></i>

        <span>${escapeHtml(message)}</span>

    `;


    container.appendChild(
        toast
    );


    refreshIcons();


    setTimeout(() => {

        toast.classList.add(
            "leaving"
        );


        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}


// ============================================================
// SAFE HTML
// ============================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}


// ============================================================
// LUCIDE
// ============================================================

function refreshIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons === "function"
    ) {

        window.lucide.createIcons();

    }

}


// ============================================================
// END
// ============================================================

console.log(
    "✅ Moderator settings engine ready."
);