import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DEFAULT_LIMIT = 50;
let stop = null;
let lastIds = new Set();
let audioContext = null;

export function startNotificationRuntime({
  userId,
  role = null,
  courseIds = [],
  onChange = () => {},
  onNew = () => {},
  maxResults = DEFAULT_LIMIT
} = {}) {
  stop?.();
  if (!userId) return () => {};

  const queries = [
    query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(maxResults)),
    query(collection(db, "notifications"), where("recipientId", "==", userId), orderBy("createdAt", "desc"), limit(maxResults))
  ];

  if (role) {
    queries.push(query(collection(db, "notifications"), where("audience", "==", "role"), where("role", "==", role), orderBy("createdAt", "desc"), limit(maxResults)));
  }

  queries.push(query(collection(db, "notifications"), where("audience", "==", "all"), orderBy("createdAt", "desc"), limit(maxResults)));

  for (const courseId of courseIds.slice(0, 10)) {
    if (!courseId) continue;
    queries.push(query(collection(db, "notifications"), where("audience", "==", "course"), where("courseId", "==", courseId), orderBy("createdAt", "desc"), limit(maxResults)));
  }

  const unsubscribers = queries.map(notificationQuery => onSnapshot(notificationQuery, () => emit()));

  let latest = [];
  function emit() {
    Promise.all(queries.map(notificationQuery => import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ getDocs }) => getDocs(notificationQuery))))
      .then(snapshots => {
        const map = new Map();
        snapshots.forEach(snapshot => snapshot.docs.forEach(item => map.set(item.id, { id: item.id, ...item.data() })));
        latest = [...map.values()].sort((a, b) => time(b.createdAt) - time(a.createdAt)).slice(0, maxResults);
        const newItems = latest.filter(item => !lastIds.has(item.id));
        lastIds = new Set(latest.map(item => item.id));
        onChange(latest);
        newItems.forEach(item => onNew(item));
      })
      .catch(error => console.warn("Notification runtime read failed:", error));
  }

  emit();
  stop = () => unsubscribers.forEach(unsubscribe => unsubscribe());
  return stop;
}

export async function markNotificationsRead(notifications = []) {
  const unread = notifications.filter(item => !item.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach(item => batch.update(doc(db, "notifications", item.id), { read: true, readAt: new Date() }));
  await batch.commit();
}

export function playNotificationSound({ priority = "normal" } = {}) {
  if (localStorage.getItem("ssa_notification_sound") === "off") return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = priority === "high" ? 880 : 660;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.17);
  } catch (_) {}
}

export function setNotificationSound(enabled) {
  localStorage.setItem("ssa_notification_sound", enabled ? "on" : "off");
}

export function notificationTime(value) {
  const ms = time(value);
  if (!ms) return "Just now";
  const minutes = Math.floor((Date.now() - ms) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(ms).toLocaleDateString("en-KE");
}

function time(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return new Date(value).getTime() || 0;
}
