// ============================================================
// SPARK STACK ACADEMY
// INSTRUCTOR PROFILE ENGINE
// ============================================================

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let currentProfile = null;
let selectedAvatar = null;


// ============================================================
// DOM HELPER
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// TEXT HELPER
// ============================================================

function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value ?? "";
    }

}


// ============================================================
// INPUT HELPER
// ============================================================

function setValue(id, value) {

    const element = $(id);

    if (element) {
        element.value = value ?? "";
    }

}


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfile(uid) {

    const ref = doc(
        db,
        "users",
        uid
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {

        currentProfile = {
            uid,
            displayName: currentUser?.displayName || "Instructor",
            email: currentUser?.email || ""
        };

    } else {

        currentProfile = {
            uid,
            ...snap.data()
        };

    }


    renderProfile();

}


// ============================================================
// RENDER PROFILE
// ============================================================

function renderProfile() {

    if (!currentProfile) return;


    const name =
        currentProfile.displayName ||
        currentProfile.name ||
        currentUser?.displayName ||
        "Instructor";


    const email =
        currentProfile.email ||
        currentUser?.email ||
        "";


    setText(
        "profileName",
        name
    );

    setText(
        "profileEmail",
        email
    );


    setValue(
        "displayName",
        name
    );

    setValue(
        "profileEmailInput",
        email
    );

    setValue(
        "phoneNumber",
        currentProfile.phoneNumber
    );

    setValue(
        "location",
        currentProfile.location
    );

    setValue(
        "headline",
        currentProfile.headline
    );

    setValue(
        "bio",
        currentProfile.bio
    );

    setValue(
        "expertise",
        currentProfile.expertise
    );


    renderAvatar(name);


    setupProStatus();

}


// ============================================================
// AVATAR
// ============================================================

function renderAvatar(name) {

    const avatar =
        $("profileAvatar");

    if (!avatar) return;


    const photo =
        currentProfile?.photoURL ||
        currentProfile?.avatarURL ||
        currentUser?.photoURL;


    if (photo) {

        avatar.innerHTML = `
            <img
                src="${escapeHTML(photo)}"
                alt="Instructor"
            >
        `;

        avatar.classList.add("has-image");

        return;

    }


    const initial =
        String(name || "I")
            .trim()
            .charAt(0)
            .toUpperCase();


    avatar.textContent =
        initial || "I";

    avatar.classList.remove("has-image");

}


// ============================================================
// AVATAR PREVIEW
// ============================================================

function handleAvatarChange(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;


    if (!file.type.startsWith("image/")) {

        alert("Please select an image.");

        return;

    }


    if (file.size > 5 * 1024 * 1024) {

        alert("Image must be smaller than 5MB.");

        return;

    }


    selectedAvatar = file;


    const reader =
        new FileReader();


    reader.onload = event => {

        const avatar =
            $("profileAvatar");

        if (!avatar) return;


        avatar.innerHTML = `
            <img
                src="${event.target.result}"
                alt="Profile preview"
            >
        `;

        avatar.classList.add("has-image");

    };


    reader.readAsDataURL(file);

}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile() {

    if (!currentUser) return;


    const button =
        $("saveProfileBtn");


    const profileData = {

        displayName:
            $("displayName")?.value.trim() || "",

        phoneNumber:
            $("phoneNumber")?.value.trim() || "",

        location:
            $("location")?.value.trim() || "",

        headline:
            $("headline")?.value.trim() || "",

        bio:
            $("bio")?.value.trim() || "",

        expertise:
            $("expertise")?.value.trim() || "",

        updatedAt:
            serverTimestamp()

    };


    try {

        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <i data-lucide="loader-circle"></i>
                Saving...
            `;

            refreshIcons();

        }


        /*
         * Avatar upload will be connected to
         * Firebase Storage when Storage is enabled.
         */

        if (selectedAvatar) {

            console.log(
                "Avatar selected:",
                selectedAvatar.name
            );

            /*
             * Temporary:
             * Profile preview works immediately.
             * Storage upload can be connected later.
             */

        }


        await setDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            profileData,
            {
                merge: true
            }
        );


        currentProfile = {
            ...currentProfile,
            ...profileData
        };


        renderProfile();


        alert(
            "Profile updated successfully."
        );


    } catch (error) {

        console.error(
            "❌ Failed saving profile:",
            error
        );

        alert(
            "Unable to save your profile."
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i data-lucide="save"></i>
                Save Changes
            `;

            refreshIcons();

        }

    }

}


// ============================================================
// PRO STATUS
// ============================================================

function setupProStatus() {

    const premium =
        currentProfile?.instructorPremium === true ||
        currentProfile?.premiumInstructor === true ||
        currentProfile?.instructorPro === true;


    const badge =
        $("premiumBadge");

    const status =
        $("proStatusText");

    const link =
        $("profileProLink");


    if (premium) {

        badge?.classList.remove("hidden");

        setText(
            "proStatusText",
            "Instructor Pro is active on your account."
        );


        if (link) {

            link.innerHTML = `
                <i data-lucide="badge-check"></i>
                Pro Active
            `;

            link.href = "pro.html";

        }


    } else {

        badge?.classList.add("hidden");

        setText(
            "proStatusText",
            "Upgrade to unlock premium instructor features."
        );

    }


    refreshIcons();

}


// ============================================================
// TEACHING STATS
// ============================================================

async function loadTeachingStats(uid) {

    try {

        const coursesQuery =
            query(
                collection(db, "courses"),
                where(
                    "instructorId",
                    "==",
                    uid
                )
            );


        const coursesSnapshot =
            await getDocs(coursesQuery);


        let students = new Set();
        let completions = 0;


        coursesSnapshot.forEach(courseDoc => {

            const data =
                courseDoc.data();


            if (Array.isArray(data.studentIds)) {

                data.studentIds.forEach(
                    id => students.add(id)
                );

            }


            if (
                typeof data.completions ===
                "number"
            ) {

                completions +=
                    data.completions;

            }

        });


        setText(
            "profileCourses",
            coursesSnapshot.size
        );

        setText(
            "profileStudents",
            students.size
        );

        setText(
            "profileCompletions",
            completions
        );


        const rating =
            Number(
                currentProfile?.rating || 0
            );


        setText(
            "profileRating",
            rating
                ? rating.toFixed(1)
                : "0.0"
        );


    } catch (error) {

        console.error(
            "❌ Failed loading teaching stats:",
            error
        );

    }

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

    $("saveProfileBtn")
        ?.addEventListener(
            "click",
            saveProfile
        );


    $("changeAvatarBtn")
        ?.addEventListener(
            "click",
            () => {

                $("avatarInput")?.click();

            }
        );


    $("avatarInput")
        ?.addEventListener(
            "change",
            handleAvatarChange
        );

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
// HTML SAFETY
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// BOOT
// ============================================================

function boot() {

    setupEvents();

    refreshIcons();


    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                console.warn(
                    "⚠️ No authenticated instructor."
                );

                return;

            }


            try {

                currentUser = user;


                await loadProfile(
                    user.uid
                );


                await loadTeachingStats(
                    user.uid
                );


                refreshIcons();


                console.log(
                    "✓ Instructor profile loaded"
                );


            } catch (error) {

                console.error(
                    "❌ Profile boot failed:",
                    error
                );

            }

        }
    );

}


boot();