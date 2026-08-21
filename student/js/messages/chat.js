import { auth } from "../../../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markConversationRead
} from "../../../js/messaging-service.js";

const params = new URLSearchParams(location.search);
const chatId = params.get("conversation") || params.get("chatId");

const messagesBox = document.getElementById("chatMessages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let user = null;
let unsubscribe = null;

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[char]));

function renderMessage(message) {
  const mine = message.sender_id === user.uid;

  const element = document.createElement("div");

  element.className = mine
    ? "message sent"
    : "message received";

  element.innerHTML = `
    <div class="message-text">
      ${escapeHTML(message.body)}
    </div>

    <div class="message-time">
      ${new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}
    </div>
  `;

  messagesBox.appendChild(element);
}

async function loadChat() {
  const messages = await getMessages(chatId);

  messagesBox.innerHTML = "";

  messages.forEach(renderMessage);

  messagesBox.scrollTop = messagesBox.scrollHeight;

  await markConversationRead({
    conversationId: chatId,
    userId: user.uid
  });

  unsubscribe?.();

  unsubscribe = subscribeToMessages(
    chatId,
    message => {
      renderMessage(message);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
  );
}

async function send() {
  const body = input.value.trim();

  if (!body || !chatId || !user) return;

  sendBtn.disabled = true;

  try {
    await sendMessage({
      conversationId: chatId,
      senderId: user.uid,
      body
    });

    input.value = "";
    input.focus();

  } catch (error) {

    console.error("Message send failed:", error);

    alert("Couldn't send your message. Please try again.");

  } finally {

    sendBtn.disabled = false;

  }
}

sendBtn?.addEventListener("click", send);

input?.addEventListener("keydown", event => {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    send();

  }

});

onAuthStateChanged(auth, async current => {

  if (!current) {

    location.href = "../../login.html";

    return;

  }

  user = current;

  if (!chatId) {

    location.href = "messages.html";

    return;

  }

  try {

    await loadChat();

  } catch (error) {

    console.error("Chat loading failed:", error);

    messagesBox.innerHTML = `
      <div class="empty-state">
        <h2>Messages are temporarily unavailable</h2>
        <p>Please refresh and try again.</p>
      </div>
    `;

  }

});

window.addEventListener(
  "beforeunload",
  () => unsubscribe?.()
);
