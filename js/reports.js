import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const REPORT_PREFIX = "SSA-RPT";

function makeReportId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${REPORT_PREFIX}-${stamp}-${random}`;
}

export async function submitReport({
  title,
  description,
  category = "general",
  type = "platform",
  priority = "medium",
  reportedUserId = null,
  reportedUserName = null,
  courseId = null,
  courseName = null,
  metadata = {}
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to submit a report.");
  if (!title?.trim() || !description?.trim()) {
    throw new Error("Report title and description are required.");
  }

  const reportId = makeReportId();
  const payload = {
    reportId,
    title: title.trim(),
    description: description.trim(),
    category,
    type,
    priority,
    status: "pending",
    reporterId: user.uid,
    reporterName: user.displayName || null,
    reporterEmail: user.email || null,
    reportedUserId,
    reportedUserName,
    courseId,
    courseName,
    metadata,
    moderatorNotes: "",
    feedback: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, "reports"), payload);

  // Notify both leadership roles. Notification creation is intentionally
  // non-blocking so a notification failure never prevents report submission.
  const notification = {
    title: `🚩 New Report ${reportId}`,
    message: `${user.displayName || user.email || "A user"} submitted a ${priority} priority report: ${title.trim()}.`,
    type: "report",
    priority: priority === "critical" ? "high" : "normal",
    audience: "role",
    role: "admin",
    recipientId: null,
    userId: null,
    senderId: user.uid,
    metadata: { reportId, category, type, courseId },
    read: false,
    createdAt: serverTimestamp()
  };

  try {
    const batch = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await batch.addDoc(batch.collection(db, "notifications"), notification);
    await batch.addDoc(batch.collection(db, "notifications"), { ...notification, role: "founder" });
  } catch (error) {
    console.warn("Report notification failed:", error);
  }

  return { id: ref.id, reportId };
}

export async function getReport(reportId) {
  if (!reportId) return null;
  const snapshot = await getDoc(doc(db, "reports", reportId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function subscribeToMyReports(userId, callback) {
  if (!userId) return () => {};
  const reportsQuery = query(
    collection(db, "reports"),
    where("reporterId", "==", userId)
  );
  return onSnapshot(reportsQuery, snapshot => {
    const reports = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt));
    callback(reports);
  });
}

export async function reviewReport({
  reportId,
  status,
  feedback = "",
  moderatorNotes = "",
  reviewedBy = null
}) {
  if (!reportId) throw new Error("reportId is required.");
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");

  const reportRef = doc(db, "reports", reportId);
  const reportSnapshot = await getDoc(reportRef);
  if (!reportSnapshot.exists()) throw new Error("Report not found.");

  const report = reportSnapshot.data();
  const finalStatus = ["pending", "reviewing", "resolved", "dismissed", "closed"].includes(status)
    ? status
    : "reviewing";

  await updateDoc(reportRef, {
    status: finalStatus,
    feedback: feedback.trim(),
    moderatorNotes: moderatorNotes.trim(),
    reviewedBy: reviewedBy || user.uid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  if (report.reporterId) {
    try {
      const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      await addDoc(collection(db, "notifications"), {
        title: `📋 Report ${report.reportId || reportId} updated`,
        message: feedback.trim() || `Your report has been moved to ${finalStatus}.`,
        type: "report",
        priority: "normal",
        audience: "user",
        recipientId: report.reporterId,
        userId: report.reporterId,
        senderId: user.uid,
        metadata: { reportId: report.reportId || reportId, status: finalStatus },
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.warn("Reporter feedback notification failed:", error);
    }
  }

  return getReport(reportId);
}

function timestamp(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return new Date(value).getTime() || 0;
}
