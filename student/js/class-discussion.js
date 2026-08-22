import { supabase } from "../../js/supabase.js";
import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getProfileByFirebaseUid } from "../../js/messaging-service.js";

const state = { profile: null, courseId: null, lessonId: null, channel: null };
const $ = (s, root = document) => root.querySelector(s);

function params() {
  const p = new URLSearchParams(location.search);
  return { courseId: p.get("courseId") || p.get("id"), lessonId: p.get("lessonId") || p.get("lesson") };
}

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function toast(message, type = "info") {
  if (window.ssaToast) window.ssaToast(message, type);
  else if (window.showToast) window.showToast(message, type);
}

function ensureMarkup() {
  if ($("#ssa-class-discussion")) return $("#ssa-class-discussion");
  const host = document.createElement("section");
  host.id = "ssa-class-discussion";
  host.className = "ssa-class-discussion";
  host.innerHTML = `
    <div class="ssa-discussion-head">
      <div><span class="ssa-discussion-kicker">LEARNING COMMUNITY</span><h2>Class Discussion</h2><p>Ask questions, share ideas and learn with your classmates.</p></div>
      <span class="ssa-discussion-live"><i></i> Live discussion</span>
    </div>
    <div class="ssa-discussion-list" id="ssaDiscussionList"><div class="ssa-discussion-empty">Loading discussion…</div></div>
    <form class="ssa-discussion-composer" id="ssaDiscussionForm">
      <textarea id="ssaDiscussionInput" maxlength="4000" rows="3" placeholder="Ask a question or share something useful…"></textarea>
      <div class="ssa-discussion-compose-row"><span>Be respectful and keep the discussion course-related.</span><button type="submit">Post comment</button></div>
    </form>`;
  const anchor = document.querySelector(".course-player-content, .course-content, main") || document.body;
  anchor.appendChild(host);
  return host;
}

async function load() {
  if (!state.courseId || !state.profile) return;
  const request = supabase.from("class_discussions").select("id,course_id,lesson_id,author_id,body,created_at,profiles(username,full_name,avatar_url,role)").eq("course_id", state.courseId).is("deleted_at", null).order("created_at", { ascending: true }).limit(100);
  const { data, error } = state.lessonId ? await request.eq("lesson_id", state.lessonId) : await request;
  if (error) throw error;
  render(data || []);
}

function render(rows) {
  const list = $("#ssaDiscussionList");
  if (!list) return;
  if (!rows.length) { list.innerHTML = `<div class="ssa-discussion-empty"><strong>Start the conversation.</strong><span>Be the first student to ask a question or share an insight.</span></div>`; return; }
  list.innerHTML = rows.map(row => {
    const person = row.profiles || {};
    const name = person.username ? `@${person.username}` : (person.full_name || "Student");
    const initial = escapeHTML((person.full_name || person.username || "S").charAt(0).toUpperCase());
    return `<article class="ssa-discussion-item"><div class="ssa-discussion-avatar">${initial}</div><div class="ssa-discussion-body"><div class="ssa-discussion-meta"><strong>${escapeHTML(name)}</strong><span>${escapeHTML(person.role || "student")}</span><time>${escapeHTML(formatTime(row.created_at))}</time></div><p>${escapeHTML(row.body).replaceAll("\n", "<br>")}</p></div></article>`;
  }).join("");
  list.scrollTop = list.scrollHeight;
}

async function post(body) {
  const text = String(body || "").trim();
  if (!text) return;
  if (text.length > 4000) return toast("Your comment is too long.", "warning");
  const { error } = await supabase.from("class_discussions").insert({ course_id: state.courseId, lesson_id: state.lessonId || null, author_id: state.profile.id, body: text });
  if (error) throw error;
}

function subscribe() {
  if (state.channel) supabase.removeChannel(state.channel);
  state.channel = supabase.channel(`class-discussion:${state.courseId}:${state.lessonId || "course"}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "class_discussions", filter: `course_id=eq.${state.courseId}` }, load)
    .subscribe();
}

async function boot(user) {
  if (!user || !location.pathname.includes("course-player")) return;
  Object.assign(state, params());
  if (!state.courseId) return;
  try {
    state.profile = await getProfileByFirebaseUid(user.uid);
    ensureMarkup();
    $("#ssaDiscussionForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#ssaDiscussionInput");
      const button = $("#ssaDiscussionForm button");
      button.disabled = true;
      try { await post(input.value); input.value = ""; toast("Comment posted.", "success"); } catch (error) { console.error(error); toast("We couldn't post that comment. Please try again.", "error"); } finally { button.disabled = false; }
    });
    await load();
    subscribe();
  } catch (error) {
    console.error("Class discussion failed:", error);
    const list = $("#ssaDiscussionList");
    if (list) list.innerHTML = `<div class="ssa-discussion-empty">Discussion is temporarily unavailable.</div>`;
  }
}

onAuthStateChanged(auth, boot);
