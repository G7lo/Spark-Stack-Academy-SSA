const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();
const platformRef = db.doc("systemConfig/platform");

exports.applyScheduledMaintenance = onSchedule("every 5 minutes", async () => {
  const snap = await platformRef.get();
  if (!snap.exists) return;

  const data = snap.data() || {};
  const maintenance = data.maintenance;
  if (!maintenance?.startAt) return;

  const start = maintenance.startAt instanceof Timestamp
    ? maintenance.startAt.toMillis()
    : new Date(maintenance.startAt).getTime();
  const end = maintenance.endAt instanceof Timestamp
    ? maintenance.endAt.toMillis()
    : new Date(maintenance.endAt || 0).getTime();

  const now = Date.now();
  if (now < start || (end && now >= end)) {
    if (maintenance.active === true && end && now >= end) {
      await platformRef.update({
        "maintenance.active": false,
        updatedAt: Timestamp.now()
      });
      await db.collection("systemCommandLog").add({
        command: "Scheduled maintenance ended",
        details: { target: maintenance.target },
        actor: "system",
        createdAt: Timestamp.now()
      });
    }
    return;
  }

  if (maintenance.active === true) return;

  const updates = {
    "maintenance.active": true,
    updatedAt: Timestamp.now()
  };

  if (maintenance.target === "student" || maintenance.target === "all") {
    updates["studentPortal.enabled"] = false;
  }
  if (maintenance.target === "instructor" || maintenance.target === "all") {
    updates["instructorPortal.enabled"] = false;
  }

  await platformRef.update(updates);
  await db.collection("systemCommandLog").add({
    command: "Scheduled maintenance activated",
    details: { target: maintenance.target, message: maintenance.message || "" },
    actor: "system",
    createdAt: Timestamp.now()
  });
});