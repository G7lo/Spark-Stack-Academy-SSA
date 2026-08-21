import { findUsers, getMyConversations, getMessages, sendMessage, markConversationRead, subscribeToMessages } from "./messaging-service.js";

export function initMessagingUI({ root, userId, userRole }) {
  if (!root || !userId) return;
  root.innerHTML = `<div class="ssa-chat"><aside class="ssa-chat-list"></aside><section class="ssa-chat-main"><div class="ssa-chat-empty">Select a conversation</div></section></div>`;
  const list = root.querySelector(".ssa-chat-list");
  const main = root.querySelector(".ssa-chat-main");

  let activeId = null;
  let unsubscribe = null;

  const escape = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  async function load() {
    const rows = await getMyConversations(userId);
    list.innerHTML = rows.length ? rows.map(row => `<button class="ssa-chat-item" data-id="${row.conversation_id}"><strong>${escape(row.conversations?.title || "Conversation")}</strong><small>${escape(row.conversations?.last_message_at || "")}</small></button>`).join("") : `<div class="ssa-chat-empty">No conversations yet.</div>`;
    list.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => open(button.dataset.id)));
  }

  async function open(id) {
    activeId = id;
    if (unsubscribe) unsubscribe();
    const messages = await getMessages(id);
    main.innerHTML = `<div class="ssa-chat-messages">${messages.map(renderMessage).join("")}</div><form class="ssa-chat-compose"><input autocomplete="off" placeholder="Write a message…" maxlength="4000"/><button>Send</button></form>`;
    const messageBox = main.querySelector(".ssa-chat-messages");
    messageBox.scrollTop = messageBox.scrollHeight;
    await markConversationRead({ conversationId: id, userId });
    unsubscribe = subscribeToMessages(id, message => {
      messageBox.insertAdjacentHTML("beforeend", renderMessage(message));
      messageBox.scrollTop = messageBox.scrollHeight;
    });
    main.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();
      const input = event.currentTarget.querySelector("input");
      const body = input.value.trim();
      if (!body) return;
      input.disabled = true;
      try { await sendMessage({ conversationId: id, senderId: userId, body }); input.value = ""; }
      catch (error) { console.error("Messaging error:", error); }
      finally { input.disabled = false; input.focus(); }
    });
  }

  function renderMessage(message) {
    const own = message.sender_id === userId;
    return `<article class="ssa-message ${own ? "own" : "incoming"}"><div>${escape(message.body)}</div><time>${new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></article>`;
  }

  load().catch(error => { console.error("Messaging load error:", error); main.innerHTML = `<div class="ssa-chat-empty">Messaging is temporarily unavailable.</div>`; });

  return { refresh: load, destroy: () => unsubscribe?.() };
}
