import { auth } from "../../../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getMessages, sendMessage, subscribeToMessages, markConversationRead, getProfileByFirebaseUid, getConversationPeople, createChatPresence, touchLastSeen } from "../../../js/messaging-service.js";

const params = new URLSearchParams(location.search);
const chatId = params.get("conversation") || params.get("chatId");
const messagesBox = document.getElementById("chatMessages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatName = document.getElementById("chatName");
const chatStatus = document.getElementById("chatStatus");
const chatAvatar = document.getElementById("chatAvatar");
const onlineDot = document.getElementById("onlineDot");
const typingIndicator = document.getElementById("typingIndicator");
const backBtn = document.getElementById("backBtn");

let firebaseUser = null;
let profile = null;
let peer = null;
let unsubscribeMessages = null;
let presence = null;
let typingHideTimer = null;

const escapeHTML = value => String(value ?? "").replace(/[&<>\"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[char]));
const toast = (message, type = "error") => window.SSA?.toast?.(message, type) || console.warn(message);

function formatLastSeen(value) {
  if (!value) return "Offline";
  const time = new Date(value);
  const diff = Date.now() - time.getTime();
  if (diff < 60000) return "Last seen just now";
  if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `Last seen ${Math.floor(diff / 3600000)}h ago`;
  return `Last seen ${time.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function setPeerStatus(online, lastSeen) {
  onlineDot?.classList.toggle("is-online", online);
  onlineDot?.classList.toggle("is-offline", !online);
  if (chatStatus) chatStatus.textContent = online ? "Online" : formatLastSeen(lastSeen);
}

function showTyping() {
  typingIndicator?.classList.remove("hidden");
  clearTimeout(typingHideTimer);
  typingHideTimer = setTimeout(() => typingIndicator?.classList.add("hidden"), 2600);
}

function renderMessage(message) {
  const mine = message.sender_id === profile.id;
  const element = document.createElement("div");
  element.className = mine ? "message sent" : "message received";
  const seenLabel = mine ? `<span class="message-read" aria-label="Message status">✓✓</span>` : "";
  element.innerHTML = `<div class="message-text">${escapeHTML(message.body)}</div><div class="message-meta"><time class="message-time">${new Date(message.created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</time>${seenLabel}</div>`;
  messagesBox.appendChild(element);
}

async function loadChat() {
  profile = await getProfileByFirebaseUid(firebaseUser.uid);
  const people = await getConversationPeople(chatId);
  peer = people.find(person => person.id !== profile.id) || people[0];
  if (!peer) throw new Error("This conversation is unavailable.");

  if (chatName) chatName.textContent = peer.username ? `@${peer.username}` : (peer.full_name || "User");
  if (chatAvatar && peer.avatar_url) chatAvatar.src = peer.avatar_url;
  setPeerStatus(false, peer.last_seen_at);

  const messages = await getMessages(chatId);
  messagesBox.innerHTML = "";
  messages.forEach(renderMessage);
  messagesBox.scrollTop = messagesBox.scrollHeight;
  await markConversationRead({ conversationId: chatId, userId: profile.id });
  await touchLastSeen(profile.id);

  unsubscribeMessages?.();
  unsubscribeMessages = subscribeToMessages(chatId, message => {
    renderMessage(message);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    if (message.sender_id !== profile.id) markConversationRead({ conversationId: chatId, userId: profile.id }).catch(() => {});
  });

  presence?.stop?.();
  presence = createChatPresence(chatId, profile, {
    onSync(state) {
      const entries = Object.values(state).flat();
      const peerPresence = entries.find(entry => entry.user_id === peer.id);
      setPeerStatus(Boolean(peerPresence), peer.last_seen_at);
    },
    onTyping(payload) {
      if (payload?.typing) showTyping();
      else typingIndicator?.classList.add("hidden");
    }
  });
}

async function send() {
  const body = input?.value.trim();
  if (!body || !chatId || !profile) return;
  sendBtn.disabled = true;
  try {
    presence?.setTyping(false);
    await sendMessage({ conversationId: chatId, senderId: profile.id, body });
    input.value = "";
    input.style.height = "auto";
    input.focus();
  } catch (error) {
    console.error("Message send failed:", error);
    toast("We couldn't send that message. Check your connection and try again.");
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn?.addEventListener("click", send);
input?.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
  presence?.setTyping(Boolean(input.value.trim()));
});
input?.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); }
});
backBtn?.addEventListener("click", () => history.length > 1 ? history.back() : (location.href = "messages.html"));

onAuthStateChanged(auth, async current => {
  if (!current) { location.href = "../../login.html"; return; }
  firebaseUser = current;
  if (!chatId) { location.href = "messages.html"; return; }
  try { await loadChat(); }
  catch (error) {
    console.error("Chat loading failed:", error);
    messagesBox.innerHTML = `<div class="empty-state"><h2>Messages are temporarily unavailable</h2><p>We couldn't load this conversation. Please try again.</p></div>`;
    toast("We couldn't load this conversation. Please try again.");
  }
});

window.addEventListener("beforeunload", () => { unsubscribeMessages?.(); presence?.stop?.(); if (profile?.id) touchLastSeen(profile.id); });
