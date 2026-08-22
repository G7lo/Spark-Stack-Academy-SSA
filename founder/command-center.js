import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const state = {
    profile: null,
    user: null
};

const $ = id => document.getElementById(id);

function toast(message, type = "success") {
    if (window.showFounderToast) {
        window.showFounderToast(message, type);
        return;
    }

    alert(message);
}

async function requireFounder(user) {
    const snap = await getDoc(doc(db, "profiles", user.uid));

    if (!snap.exists()) {
        throw new Error("Founder profile not found.");
    }

    const profile = snap.data();

    if (profile.role !== "founder") {
        throw new Error("Founder access required.");
    }

    if (profile.status && profile.status !== "active") {
        throw new Error("Founder account is not active.");
    }

    state.profile = profile;
    state.user = user;
}

function controlRef() {
    return doc(db, "platform_controls", "global");
}

function audit(message, action, details = {}) {
    return addDoc(collection(db, "audit_logs"), {
        actor_id: state.user.uid,
        actor_email: state.user.email || "",
        action,
        target_type: "platform",
        target_id: "global",
        details,
        message,
        created_at: serverTimestamp()
    });
}

async function setPortalState(target, suspended) {
    const ref = controlRef();
    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data() : {};

    const next = {
        ...current,
        [target]: {
            ...(current[target] || {}),
            suspended,
            updated_at: serverTimestamp(),
            updated_by: state.user.uid
        },
        updated_at: serverTimestamp()
    };

    await setDoc(ref, next, { merge: true });

    await audit(
        `${target} portal ${suspended ? "suspended" : "restored"}`,
        suspended ? "portal_suspended" : "portal_restored",
        { target }
    );

    toast(
        `${target === "student" ? "Student" : "Instructor"} portal ${
            suspended ? "suspended" : "restored"
        }.`
    );
}

async function setLockdown(active) {
    await setDoc(controlRef(), {
        lockdown: active,
        updated_at: serverTimestamp(),
        updated_by: state.user.uid
    }, { merge: true });

    await audit(
        active ? "Emergency lockdown activated" : "Emergency lockdown lifted",
        active ? "lockdown_enabled" : "lockdown_disabled"
    );

    toast(active ? "Emergency lockdown activated." : "Lockdown lifted.");
}

function renderControls(data = {}) {
    const studentSuspended = !!data.student?.suspended;
    const instructorSuspended = !!data.instructor?.suspended;
    const lockdown = !!data.lockdown;

    $("studentState").textContent =
        studentSuspended ? "Suspended" : "Online";

    $("instructorState").textContent =
        instructorSuspended ? "Suspended" : "Online";

    $("lockdownState").textContent =
        lockdown ? "ACTIVE" : "Inactive";

    $("studentToggle").textContent =
        studentSuspended
            ? "Restore Student Portal"
            : "Suspend Student Portal";

    $("instructorToggle").textContent =
        instructorSuspended
            ? "Restore Instructor Portal"
            : "Suspend Instructor Portal";

    $("lockdownToggle").textContent =
        lockdown
            ? "Lift Lockdown"
            : "Activate Lockdown";

    $("globalStatus").innerHTML =
        lockdown
            ? "<span></span> Emergency Lockdown"
            : studentSuspended || instructorSuspended
                ? "<span></span> Limited Availability"
                : "<span></span> All Systems Online";
}

function listenControls() {
    onSnapshot(controlRef(), snap => {
        renderControls(snap.exists() ? snap.data() : {});
    });
}

function listenAuditLog() {
    const q = query(
        collection(db, "audit_logs"),
        orderBy("created_at", "desc"),
        limit(30)
    );

    onSnapshot(q, snapshot => {
        const log = $("commandLog");

        if (!snapshot.docs.length) {
            log.innerHTML =
                '<div class="empty">No command activity yet.</div>';
            return;
        }

        log.innerHTML = snapshot.docs.map(item => {
            const data = item.data();

            return `
                <div class="command-entry">
                    <strong>${data.message || data.action || "Command executed"}</strong>
                    <small>${data.actor_email || "Founder"} · ${
                        data.created_at?.toDate
                            ? data.created_at.toDate().toLocaleString()
                            : "Just now"
                    }</small>
                </div>
            `;
        }).join("");
    });
}

async function scheduleMaintenance() {
    const target = $("maintenanceTarget").value;
    const start = $("maintenanceStart").value;
    const end = $("maintenanceEnd").value;
    const message = $("maintenanceMessage").value.trim();

    if (!start || !end) {
        toast("Choose both a start and end time.", "error");
        return;
    }

    if (new Date(end) <= new Date(start)) {
        toast("End time must be after start time.", "error");
        return;
    }

    await setDoc(controlRef(), {
        maintenance: {
            active: true,
            target,
            start,
            end,
            message,
            scheduled_by: state.user.uid,
            updated_at: serverTimestamp()
        }
    }, { merge: true });

    await audit(
        "Maintenance window scheduled",
        "maintenance_scheduled",
        { target, start, end, message }
    );

    $("scheduleInfo").textContent =
        `${target} maintenance scheduled from ${start} to ${end}.`;

    toast("Maintenance window scheduled.");
}

async function cancelMaintenance() {
    await setDoc(controlRef(), {
        maintenance: {
            active: false,
            cancelled_at: serverTimestamp(),
            cancelled_by: state.user.uid
        }
    }, { merge: true });

    await audit(
        "Scheduled maintenance cancelled",
        "maintenance_cancelled"
    );

    $("scheduleInfo").textContent =
        "No maintenance window scheduled.";

    toast("Scheduled maintenance cancelled.");
}

function bindEvents() {
    $("studentToggle").onclick = async () => {
        const snap = await getDoc(controlRef());
        const suspended = !!snap.data()?.student?.suspended;
        await setPortalState("student", !suspended);
    };

    $("instructorToggle").onclick = async () => {
        const snap = await getDoc(controlRef());
        const suspended = !!snap.data()?.instructor?.suspended;
        await setPortalState("instructor", !suspended);
    };

    $("lockdownToggle").onclick = async () => {
        const snap = await getDoc(controlRef());
        await setLockdown(!snap.data()?.lockdown);
    };

    $("scheduleBtn").onclick = scheduleMaintenance;
    $("cancelScheduleBtn").onclick = cancelMaintenance;
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace("../login.html");
        return;
    }

    try {
        await requireFounder(user);

        listenControls();
        listenAuditLog();
        bindEvents();

        console.log("🔥 Founder Command Center connected to Firebase.");
    } catch (error) {
        console.error(error);
        toast(error.message, "error");

        setTimeout(() => {
            window.location.replace("../login.html");
        }, 1500);
    }
});
