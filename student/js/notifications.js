import { auth } from "../../js/firebase.js";
import {
  startNotificationRuntime,
  markNotificationRead,
  markAllNotificationsRead,
  notificationTime
} from "../../js/notification-runtime.js";

let notifications = [];

const iconFor = type => ({
  payment_success: "credit-card",
  course: "book-open",
  lesson: "play-circle",
  assignment: "clipboard-list",
  quiz: "help-circle",
  achievement: "trophy",
  certificate: "award",
  report_feedback: "message-circle",
  announcement: "megaphone",
  premium: "crown"
}[type] || "bell");

const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function render() {
  const unread = notifications.filter(item => !item.read_at);
  const badge = document.getElementById("notificationCount");
  if (badge) {
    badge.textContent = unread.length > 99 ? "99+" : unread.length;
    badge.style.display = unread.length ? "flex" : "none";
  }

  const list = document.getElementById("notificationList");
  if (list) {
    const latest = notifications.slice(0, 5);
    list.innerHTML = latest.length ? latest.map(item => `
      <div class="notification-item ${item.read_at ? "" : "unread"}" data-notification-id="${escapeHTML(item.id)}">
        <div class="notification-icon"><i data-lucide="${iconFor(item.type)}"></i></div>
        <div class="notification-content">
          <strong>${escapeHTML(item.title)}</strong>
          <p>${escapeHTML(item.message)}</p>
          <small>${notificationTime(item.created_at)}</small>
        </div>
      </div>`).join("") : `
      <div class="notification-empty"><i data-lucide="bell-off"></i><p>No new notifications</p></div>`;
  }

  const full = document.getElementById("notificationsList");
  if (full) {
    full.innerHTML = notifications.length ? notifications.map(item => `
      <article class="notification-card ${item.read_at ? "" : "unread"}" data-notification-id="${escapeHTML(item.id)}">
        <div class="notification-card-icon"><i data-lucide="${iconFor(item.type)}"></i></div>
        <div class="notification-card-content">
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.message)}</p>
          <span class="notification-time">${notificationTime(item.created_at)}</span>
        </div>
        <div class="notification-card-action"><i data-lucide="chevron-right"></i></div>
      </article>`).join("") : "";
  }

  if (window.lucide) window.lucide.createIcons();
}

window.addEventListener("ssa:notifications", event => {
  notifications = event.detail || [];
  render();
});

document.addEventListener("click", event => {
  const item = event.target.closest("[data-notification-id]");
  if (item) {
    const id = item.dataset.notificationId;
    markNotificationRead(id).catch(error => console.warn("Notification read failed:", error));
    const notification = notifications.find(x => x.id === id);
    if (notification?.action_url) window.location.href = notification.action_url;
  }

  if (event.target.closest("#markNotificationsRead, #markAllReadBtn")) {
    markAllNotificationsRead().catch(error => console.warn("Mark all read failed:", error));
  }
});

if (auth.currentUser) startNotificationRuntime();
else auth.onAuthStateChanged(user => { if (user) startNotificationRuntime(); });
