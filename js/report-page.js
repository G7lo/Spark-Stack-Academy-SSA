import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { submitReport, subscribeToMyReports } from "./reports.js";

const $ = id => document.getElementById(id);
const form = $("reportForm");
const result = $("reportResult");
const list = $("myReports");

function escapeHTML(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderReports(items) {
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<div class="report-empty">No reports submitted yet.</div>';
    return;
  }
  list.innerHTML = items.map(report => `
    <article class="report-history-item">
      <div><strong>${escapeHTML(report.reportId || report.id)}</strong><span>${escapeHTML(report.title || "Report")}</span></div>
      <span class="report-status ${escapeHTML(report.status || "pending")}">${escapeHTML(report.status || "pending")}</span>
      ${report.feedback ? `<p>${escapeHTML(report.feedback)}</p>` : ""}
    </article>
  `).join("");
}

onAuthStateChanged(auth, user => {
  if (!user) return;
  subscribeToMyReports(user.uid, renderReports);
});

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Submitting...";
  if (result) result.textContent = "";

  try {
    const report = await submitReport({
      title: $("reportTitle")?.value,
      description: $("reportDescription")?.value,
      category: $("reportCategory")?.value || "general",
      type: $("reportType")?.value || "platform",
      priority: $("reportPriority")?.value || "medium",
      reportedUserId: $("reportedUserId")?.value.trim() || null,
      courseId: $("courseId")?.value.trim() || null,
      metadata: { portal: location.pathname.includes("instructor") ? "instructor" : "student" }
    });
    form.reset();
    if (result) result.innerHTML = `<strong>Report submitted.</strong><br>Your case ID is <b>${escapeHTML(report.reportId)}</b>. Keep this ID for follow-up.`;
  } catch (error) {
    if (result) result.textContent = error.message || "Unable to submit report.";
  } finally {
    button.disabled = false;
    button.textContent = "Submit Report";
  }
});
