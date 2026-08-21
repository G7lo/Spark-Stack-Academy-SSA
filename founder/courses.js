import { supabase } from "../js/supabase.js";

const $ = (id) => document.getElementById(id);
let courses = [];
let filteredCourses = [];
let unsubscribe = null;

const state = { search: "", status: "all", sort: "latest" };

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price, currency) {
  if (price === null || price === undefined || price === "") return "Price not set";
  const amount = Number(price);
  if (!Number.isFinite(amount)) return `${escapeHtml(price)} ${escapeHtml(currency || "")}`.trim();
  return `${escapeHtml(currency || "KES")} ${amount.toLocaleString()}`;
}

function statusLabel(status) {
  return String(status || "unknown").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function updateStats() {
  $("totalCourses").textContent = courses.length;
  $("publishedCourses").textContent = courses.filter(c => c.status === "published").length;
  $("draftCourses").textContent = courses.filter(c => c.status === "draft").length;
  $("archivedCourses").textContent = courses.filter(c => c.status === "archived").length;
}

function applyFilters() {
  const q = state.search.trim().toLowerCase();
  filteredCourses = courses.filter((course) => {
    const matchesSearch = !q || `${course.title || ""} ${course.description || ""}`.toLowerCase().includes(q);
    const matchesStatus = state.status === "all" || course.status === state.status;
    return matchesSearch && matchesStatus;
  });

  filteredCourses.sort((a, b) => {
    if (state.sort === "alphabetical") return String(a.title || "").localeCompare(String(b.title || ""));
    const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
    const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
    return state.sort === "oldest" ? aDate - bDate : bDate - aDate;
  });

  renderCourses();
}

function renderCourses() {
  $("loadingGrid").hidden = true;
  $("emptyState").hidden = filteredCourses.length !== 0;
  $("coursesGrid").hidden = filteredCourses.length === 0;

  $("coursesGrid").innerHTML = filteredCourses.map((course) => `
    <article class="course-card">
      <div class="course-card-top">
        <span class="status ${escapeHtml(course.status || "unknown")}">${escapeHtml(statusLabel(course.status))}</span>
        <button class="icon-btn" type="button" data-view="${escapeHtml(course.id)}" aria-label="View course"><i data-lucide="arrow-up-right"></i></button>
      </div>
      <div class="course-icon"><i data-lucide="book-open"></i></div>
      <h3>${escapeHtml(course.title || "Untitled course")}</h3>
      <p>${escapeHtml(course.description || "No description provided.")}</p>
      <div class="course-meta">
        <span><i data-lucide="badge-dollar-sign"></i>${formatPrice(course.price, course.currency)}</span>
        <span><i data-lucide="calendar"></i>${formatDate(course.updated_at || course.created_at)}</span>
      </div>
    </article>
  `).join("");

  window.lucide?.createIcons();
}

function openDrawer(course) {
  $("drawerContent").innerHTML = `
    <div class="drawer-icon"><i data-lucide="book-open"></i></div>
    <h3>${escapeHtml(course.title || "Untitled course")}</h3>
    <p>${escapeHtml(course.description || "No description provided.")}</p>
    <dl>
      <div><dt>Status</dt><dd>${escapeHtml(statusLabel(course.status))}</dd></div>
      <div><dt>Price</dt><dd>${formatPrice(course.price, course.currency)}</dd></div>
      <div><dt>Instructor ID</dt><dd>${escapeHtml(course.instructor_id || "Unassigned")}</dd></div>
      <div><dt>Created</dt><dd>${formatDate(course.created_at)}</dd></div>
      <div><dt>Updated</dt><dd>${formatDate(course.updated_at)}</dd></div>
      <div><dt>Course ID</dt><dd class="mono">${escapeHtml(course.id)}</dd></div>
    </dl>
  `;
  $("courseDrawer").classList.add("open");
  $("courseDrawer").setAttribute("aria-hidden", "false");
  window.lucide?.createIcons();
}

async function loadCourses() {
  $("loadingGrid").hidden = false;
  $("coursesGrid").hidden = true;
  $("emptyState").hidden = true;
  $("errorState").hidden = true;
  $("dataStatus").textContent = "Loading…";

  try {
    const { data, error } = await supabase.from("courses").select("id,title,description,instructor_id,price,currency,status,created_at,updated_at").order("updated_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    courses = data || [];
    updateStats();
    $("dataStatus").textContent = `${courses.length} real record${courses.length === 1 ? "" : "s"}`;
    applyFilters();
  } catch (error) {
    console.error("Courses load failed:", error);
    $("loadingGrid").hidden = true;
    $("errorState").hidden = false;
    $("errorMessage").textContent = error.message || "Unable to load course records.";
    $("dataStatus").textContent = "Unavailable";
  }
}

async function startRealtime() {
  await loadCourses();
  unsubscribe?.();
  unsubscribe = supabase.channel("founder-courses-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, loadCourses)
    .subscribe();
}

function bindEvents() {
  $("courseSearch").addEventListener("input", (e) => { state.search = e.target.value; applyFilters(); });
  $("statusFilter").addEventListener("change", (e) => { state.status = e.target.value; applyFilters(); });
  $("sortCourses").addEventListener("change", (e) => { state.sort = e.target.value; applyFilters(); });
  $("retryBtn").addEventListener("click", loadCourses);
  $("closeDrawer").addEventListener("click", () => $("courseDrawer").classList.remove("open"));
  $("drawerBackdrop").addEventListener("click", () => $("courseDrawer").classList.remove("open"));
  $("coursesGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    const course = courses.find(c => c.id === button.dataset.view);
    if (course) openDrawer(course);
  });
}

async function boot() {
  bindEvents();
  await startRealtime();
}

boot();
