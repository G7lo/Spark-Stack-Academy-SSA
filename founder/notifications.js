import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const state = { user: null, notifications: [], filter: "all" };
const roleForTarget = { students: "student", instructors: "instructor", admins: "admin" };

function timeAgo(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : timestamp ? new Date(timestamp) : new Date();
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  return minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : date.toLocaleDateString();
}

function showToast(message, type = "success") {
  const toast = document.createElement("div"); toast.className = `founder-toast ${type}`; toast.textContent = message;
  document.body.appendChild(toast); setTimeout(() => toast.remove(), 3500);
}

function visibleNotifications() {
  const search = $("notificationSearch")?.value.trim().toLowerCase() || "";
  const priority = $("notificationPriority")?.value || "all";
  return state.notifications.filter((item) => {
    const typeMatch = state.filter === "all" || item.type === state.filter;
    const priorityMatch = priority === "all" || item.priority === priority;
    const text = `${item.title || ""} ${item.message || ""}`.toLowerCase();
    return typeMatch && priorityMatch && (!search || text.includes(search));
  });
}

function renderNotifications() {
  const list = $("notificationList"); if (!list) return;
  const items = visibleNotifications(); list.replaceChildren();
  if (!items.length) { list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><h3>No notifications found</h3><p>New academy activity will appear here.</p></div>'; return; }
  items.forEach((item) => {
    const card = document.createElement("article"); card.className = `notification-card ${item.read ? "" : "unread"}`;
    const icon = document.createElement("div"); icon.className = "notification-icon"; icon.textContent = item.priority === "critical" ? "🚨" : item.type === "payment" ? "💳" : "🔔";
    const content = document.createElement("div"); content.className = "notification-content";
    const top = document.createElement("div"); top.className = "notification-top";
    const title = document.createElement("h3"); title.className = "notification-title"; title.textContent = item.title || "Academy update";
    const time = document.createElement("span"); time.className = "notification-time"; time.textContent = timeAgo(item.createdAt);
    const message = document.createElement("p"); message.className = "notification-message"; message.textContent = item.message || "";
    const footer = document.createElement("div"); footer.className = "notification-footer";
    const type = document.createElement("span"); type.className = "notification-type"; type.textContent = item.type || "system";
    const actions = document.createElement("div"); actions.className = "notification-actions";
    if (!item.read) { const read = document.createElement("button"); read.className = "read-btn"; read.textContent = "Mark read"; read.addEventListener("click", () => markRead(item.id)); actions.append(read); }
    top.append(title, time); footer.append(type, actions); content.append(top, message, footer); card.append(icon, content); list.append(card);
  });
}

function renderSummary() {
  const total = state.notifications.length; const unread = state.notifications.filter((item) => !item.read).length;
  const financial = state.notifications.filter((item) => item.type === "payment" || item.type === "wallet").length;
  const security = state.notifications.filter((item) => item.type === "security").length;
  $("totalNotifications").textContent = total.toLocaleString(); $("unreadNotifications").textContent = unread.toLocaleString(); $("financialNotifications").textContent = financial.toLocaleString(); $("securityNotifications").textContent = security.toLocaleString();
  const critical = state.notifications.filter((item) => item.priority === "critical" && !item.read); const criticalList = $("criticalList");
  if (criticalList) { criticalList.replaceChildren(); if (!critical.length) { criticalList.textContent = "✅ No critical alerts."; } else { critical.forEach((item) => { const line = document.createElement("p"); line.textContent = `${item.title}: ${item.message}`; criticalList.append(line); }); } }
  renderNotifications();
}

async function markRead(id) { try { await updateDoc(doc(db, "notifications", id), { read: true, readAt: serverTimestamp() }); } catch { showToast("Could not update this notification.", "error"); } }
async function markAllRead() { const unread = state.notifications.filter((item) => !item.read); if (!unread.length) return; try { const batch = writeBatch(db); unread.forEach((item) => batch.update(doc(db, "notifications", item.id), { read: true, readAt: serverTimestamp() })); await batch.commit(); showToast("All notifications marked as read."); } catch { showToast("Could not update notifications.", "error"); } }

async function sendBroadcast() {
  const target = $("broadcastTarget").value; const priority = $("broadcastPriority").value; const title = $("broadcastTitle").value.trim(); const message = $("broadcastMessage").value.trim();
  if (!title || !message) { showToast("Add both a broadcast title and message.", "error"); return; }
  const button = $("sendBroadcast"); button.disabled = true; button.textContent = "Sending…";
  try {
    const broadcast = { title, message, target, priority, channels: ["in-app", "announcement"], status: "sent", sentBy: state.user.uid, sentAt: serverTimestamp() };
    const [broadcastRef] = await Promise.all([
      addDoc(collection(db, "broadcasts"), broadcast),
      addDoc(collection(db, "announcements"), { title, message, category: "System", audience: target === "all" ? "Everyone" : target[0].toUpperCase() + target.slice(1), priority, important: priority !== "normal", pinned: priority === "critical", push: true, email: false, popup: priority === "critical", status: "published", createdAt: serverTimestamp(), createdBy: state.user.uid })
    ]);
    const users = await getDocs(collection(db, "users"));
    const recipients = users.docs.filter((entry) => target === "all" || entry.data().role === roleForTarget[target]);
    for (let index = 0; index < recipients.length; index += 450) {
      const batch = writeBatch(db);
      recipients.slice(index, index + 450).forEach((entry) => batch.set(doc(collection(db, "notifications")), { userId: entry.id, title, message, type: "broadcast", priority, read: false, broadcastId: broadcastRef.id, createdAt: serverTimestamp() }));
      await batch.commit();
    }
    $("broadcastTitle").value = ""; $("broadcastMessage").value = ""; showToast(`Broadcast sent to ${recipients.length.toLocaleString()} recipient${recipients.length === 1 ? "" : "s"}.`);
  } catch (error) { console.error("Broadcast failed", error); showToast("Broadcast could not be sent. Please try again.", "error"); }
  finally { button.disabled = false; button.textContent = "📨 Send Announcement"; }
}

function bindControls() {
  document.querySelectorAll(".filter-btn").forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.filter; document.querySelectorAll(".filter-btn").forEach((item) => item.classList.toggle("active", item === button)); renderNotifications(); }));
  $("notificationSearch")?.addEventListener("input", renderNotifications); $("notificationPriority")?.addEventListener("change", renderNotifications);
  $("markAllRead")?.addEventListener("click", markAllRead); $("refreshNotifications")?.addEventListener("click", () => showToast("Notifications are live and up to date.")); $("sendBroadcast")?.addEventListener("click", sendBroadcast);
}

onAuthStateChanged(auth, (user) => {
  if (!user) return; state.user = user; bindControls();
  const feed = query(collection(db, "notifications"), where("userId", "==", user.uid));
  onSnapshot(feed, (snapshot) => { state.notifications = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); renderSummary(); }, (error) => { console.error("Notifications unavailable", error); showToast("Notifications are temporarily unavailable.", "error"); });
  const status = $("notificationFirestoreStatus"); if (status) status.textContent = "Connected";
});

window.addEventListener("DOMContentLoaded", () => window.lucide?.createIcons());
