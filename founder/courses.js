import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
const coursesRef = collection(db, "courses");
let courses = [];
let filteredCourses = [];
let instructors = [];
let categoryChart = null;
let revenueChart = null;

const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const number = value => Number(value) || 0;
const money = value => `$${number(value).toLocaleString()}`;
const titleCase = value => String(value || "").replace(/(^|[-_\s])([a-z])/g, (_, p, c) => `${p}${c.toUpperCase()}`);
const initials = name => String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0].toUpperCase()).join("") || "?";
const dateValue = value => value?.toDate ? value.toDate().getTime() : new Date(value || 0).getTime();
const notify = (message, type = "success") => window.showFounderToast ? window.showFounderToast(message, type) : alert(message);

function safeImage(url){
    return url && /^https?:\/\//i.test(url) ? url : "https://placehold.co/900x500/eef4ff/2563eb?text=SSA+Course";
}

function currentTutor(course){
    return course.tutorName || instructors.find(i => i.id === course.instructorId)?.name || "Unassigned";
}

function applyFilters(){
    const search = ($("courseSearch")?.value || "").trim().toLowerCase();
    const status = $("statusFilter")?.value || "all";
    const category = $("categoryFilter")?.value || "all";
    const tutor = $("tutorFilter")?.value || "all";
    const level = $("levelFilter")?.value || "all";
    const sort = $("sortCourses")?.value || "latest";

    filteredCourses = courses.filter(course => {
        const tutorName = currentTutor(course);
        const haystack = [course.title, course.description, course.category, tutorName].map(v => String(v || "").toLowerCase()).join(" ");
        return (!search || haystack.includes(search)) &&
            (status === "all" || String(course.status || "draft").toLowerCase() === status) &&
            (category === "all" || course.category === category) &&
            (tutor === "all" || String(course.instructorId || "") === tutor) &&
            (level === "all" || String(course.level || "") === level);
    });

    filteredCourses.sort((a,b) => {
        if(sort === "popular") return number(b.totalStudents) - number(a.totalStudents);
        if(sort === "rating") return number(b.rating) - number(a.rating);
        if(sort === "alphabetical") return String(a.title || "").localeCompare(String(b.title || ""));
        return dateValue(b.createdAt || b.created_at) - dateValue(a.createdAt || a.created_at);
    });

    renderCourses();
}

function renderCourses(){
    const grid = $("coursesGrid");
    const empty = $("emptyState");
    if(!grid || !empty) return;
    grid.innerHTML = filteredCourses.map(createCourseCard).join("");
    empty.hidden = filteredCourses.length !== 0;
    grid.style.display = filteredCourses.length ? "grid" : "none";
    refreshIcons();
}

function createCourseCard(course){
    const status = String(course.status || "draft").toLowerCase();
    const tutor = currentTutor(course);
    const nextStatus = status === "published" ? "draft" : "published";
    return `<article class="course-card">
        <div class="course-thumbnail">
            <img src="${esc(safeImage(course.thumbnail))}" alt="${esc(course.title || "Course")}" loading="lazy" onerror="this.src='https://placehold.co/900x500/eef4ff/2563eb?text=SSA+Course'">
            <span class="course-status ${esc(status)}">${esc(titleCase(status))}</span>
            <button class="course-menu-btn" data-menu-id="${esc(course.id)}" aria-label="Course actions"><i class="fas fa-ellipsis-vertical"></i></button>
            <div class="course-menu" id="menu-${esc(course.id)}">
                <button class="menu-item" data-action="view" data-id="${esc(course.id)}"><i class="fas fa-eye"></i> View Details</button>
                <button class="menu-item" data-action="feature" data-id="${esc(course.id)}"><i class="fas fa-star"></i> ${course.featured ? "Unfeature" : "Feature"}</button>
                <button class="menu-item" data-action="status" data-id="${esc(course.id)}" data-status="${nextStatus}"><i class="fas fa-power-off"></i> ${status === "published" ? "Unpublish" : "Publish"}</button>
                ${status !== "archived" ? `<button class="menu-item warning" data-action="archive" data-id="${esc(course.id)}"><i class="fas fa-box-archive"></i> Archive</button>` : ""}
            </div>
        </div>
        <div class="course-content">
            <div class="course-category"><span>${esc(course.category || "General")}</span><strong>⭐ ${number(course.rating).toFixed(1)}</strong></div>
            <h3>${esc(course.title || "Untitled Course")}</h3>
            <p class="course-description">${esc(course.description || "No description available.")}</p>
            <div class="course-tutor"><div class="tutor-avatar">${esc(initials(tutor))}</div><div><strong>${esc(tutor)}</strong><small>${esc(course.level || "Course Tutor")}</small></div></div>
            <div class="course-stats"><div><i class="fas fa-users"></i><span>${number(course.totalStudents)} Students</span></div><div><i class="fas fa-book-open"></i><span>${number(course.lessonCount)} Lessons</span></div><div><i class="fas fa-dollar-sign"></i><span>${money(course.revenue)}</span></div></div>
            <div class="course-footer"><strong class="course-price">${esc(course.price ?? "Free")}</strong><button class="view-course-btn" data-action="view" data-id="${esc(course.id)}">View Course</button></div>
        </div>
    </article>`;
}

function updateStats(){
    $("totalCourses").textContent = courses.length;
    $("publishedCourses").textContent = courses.filter(c => String(c.status || "draft").toLowerCase() === "published").length;
    $("draftCourses").textContent = courses.filter(c => String(c.status || "draft").toLowerCase() === "draft").length;
    $("archivedCourses").textContent = courses.filter(c => String(c.status || "draft").toLowerCase() === "archived").length;
    $("totalStudents").textContent = courses.reduce((sum,c) => sum + number(c.totalStudents), 0).toLocaleString();
    $("totalRevenue").textContent = money(courses.reduce((sum,c) => sum + number(c.revenue), 0));
    const rated = courses.filter(c => number(c.rating) > 0);
    $("averageRating").textContent = rated.length ? (rated.reduce((sum,c) => sum + number(c.rating), 0) / rated.length).toFixed(1) : "0.0";
    $("totalTutors").textContent = new Set(courses.map(c => c.instructorId || currentTutor(c)).filter(Boolean)).size;
}

function populateFilters(){
    const category = $("categoryFilter");
    const tutor = $("tutorFilter");
    const oldCategory = category.value;
    const oldTutor = tutor.value;
    category.innerHTML = `<option value="all">All Categories</option>` + [...new Set(courses.map(c => c.category).filter(Boolean))].sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    tutor.innerHTML = `<option value="all">All Tutors</option>` + instructors.map(i => `<option value="${esc(i.id)}">${esc(i.name || i.email || "Instructor")}</option>`).join("");
    category.value = [...category.options].some(o => o.value === oldCategory) ? oldCategory : "all";
    tutor.value = [...tutor.options].some(o => o.value === oldTutor) ? oldTutor : "all";
}

function renderAnalytics(){
    const popular = [...courses].sort((a,b) => number(b.totalStudents) - number(a.totalStudents)).slice(0,5);
    const rated = [...courses].filter(c => number(c.rating) > 0).sort((a,b) => number(b.rating) - number(a.rating)).slice(0,5);
    const list = (items, metric) => items.length ? items.map(c => `<div class="analytics-row"><div><strong>${esc(c.title || "Untitled")}</strong><small>${esc(currentTutor(c))}</small></div><b>${metric(c)}</b></div>`).join("") : `<div class="analytics-empty">No data available yet.</div>`;
    $("popularCourses").innerHTML = list(popular, c => `${number(c.totalStudents).toLocaleString()} students`);
    $("ratedCourses").innerHTML = list(rated, c => `⭐ ${number(c.rating).toFixed(1)}`);
}

function renderCharts(){
    if(typeof Chart === "undefined") return;
    const categoryCanvas = $("categoryChart");
    const revenueCanvas = $("courseRevenueChart");
    if(!categoryCanvas || !revenueCanvas) return;
    categoryChart?.destroy(); revenueChart?.destroy();
    const categories = {};
    courses.forEach(c => { const key = c.category || "General"; categories[key] = (categories[key] || 0) + 1; });
    categoryChart = new Chart(categoryCanvas, {type:"doughnut",data:{labels:Object.keys(categories),datasets:[{data:Object.values(categories),backgroundColor:["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626"]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}}}});
    const top = [...courses].sort((a,b) => number(b.revenue) - number(a.revenue)).slice(0,10);
    revenueChart = new Chart(revenueCanvas, {type:"bar",data:{labels:top.map(c => String(c.title || "Untitled").slice(0,18)),datasets:[{label:"Revenue",data:top.map(c => number(c.revenue)),backgroundColor:"#2563eb",borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}}}});
}

function openDrawer(courseId){
    const course = courses.find(c => c.id === courseId);
    if(!course) return;
    const drawer = $("courseDrawer");
    $("drawerContent").innerHTML = `<div class="drawer-profile">
        <img class="drawer-cover" src="${esc(safeImage(course.thumbnail))}" alt="${esc(course.title || "Course")}">
        <span class="course-status ${esc(String(course.status || "draft"))}">${esc(titleCase(course.status || "draft"))}</span>
        <h2 class="drawer-title">${esc(course.title || "Untitled Course")}</h2>
        <p class="drawer-description">${esc(course.description || "No description available.")}</p>
        <div class="drawer-meta">
            <div class="meta-card"><span>Category</span><strong>${esc(course.category || "General")}</strong></div>
            <div class="meta-card"><span>Level</span><strong>${esc(course.level || "Not set")}</strong></div>
            <div class="meta-card"><span>Students</span><strong>${number(course.totalStudents).toLocaleString()}</strong></div>
            <div class="meta-card"><span>Lessons</span><strong>${number(course.lessonCount)}</strong></div>
            <div class="meta-card"><span>Rating</span><strong>⭐ ${number(course.rating).toFixed(1)}</strong></div>
            <div class="meta-card"><span>Revenue</span><strong>${money(course.revenue)}</strong></div>
        </div>
        <div class="drawer-tutor"><div class="tutor-avatar">${esc(initials(currentTutor(course)))}</div><div><h4>${esc(currentTutor(course))}</h4><p>Assigned instructor</p></div></div>
        <label class="drawer-instructor-control"><span>Assigned instructor</span><select id="courseInstructorSelect"><option value="">Unassigned</option>${instructors.map(i => `<option value="${esc(i.id)}" ${course.instructorId === i.id ? "selected" : ""}>${esc(i.name || i.email || "Instructor")}</option>`).join("")}</select></label>
        <div class="drawer-actions"><button class="secondary-btn" data-drawer-action="assign" data-id="${esc(course.id)}"><i class="fas fa-user-check"></i> Save Instructor</button><button class="secondary-btn" data-drawer-action="status" data-id="${esc(course.id)}" data-status="${String(course.status || "draft") === "published" ? "draft" : "published"}"><i class="fas fa-power-off"></i> ${String(course.status || "draft") === "published" ? "Unpublish" : "Publish"}</button><button class="primary-btn" data-drawer-action="feature" data-id="${esc(course.id)}"><i class="fas fa-star"></i> ${course.featured ? "Unfeature" : "Feature"}</button><button class="warning-btn" data-drawer-action="archive" data-id="${esc(course.id)}"><i class="fas fa-box-archive"></i> Archive</button></div>
    </div>`;
    drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); $("drawerBackdrop").classList.add("open"); refreshIcons();
}

function closeDrawer(){ $("courseDrawer")?.classList.remove("open"); $("courseDrawer")?.setAttribute("aria-hidden","true"); $("drawerBackdrop")?.classList.remove("open"); }

async function updateCourse(courseId, data, message){
    try { await updateDoc(doc(db,"courses",courseId), {...data, updatedAt:serverTimestamp()}); notify(message); }
    catch(error){ console.error(error); notify(error.message || "Unable to update course.", "error"); }
}

async function toggleFeature(id){ const course = courses.find(c => c.id === id); if(course) await updateCourse(id,{featured:!course.featured},course.featured ? "Course unfeatured." : "Course featured."); }
async function setStatus(id,status){ await updateCourse(id,{status},`Course ${status === "published" ? "published" : "unpublished"}.`); closeDrawer(); }
async function archive(id){ if(!confirm("Archive this course?")) return; await updateCourse(id,{status:"archived"},"Course archived."); closeDrawer(); }
async function assignInstructor(id){ const select=$("courseInstructorSelect"); if(!select) return; const instructor=instructors.find(i=>i.id===select.value); await updateCourse(id,{instructorId:instructor?.id || null,tutorName:instructor?.name || instructor?.email || "Unassigned"},"Instructor assignment saved."); closeDrawer(); }

function exportCSV(){
    if(!courses.length){ notify("No courses to export.","error"); return; }
    const headers=["Title","Category","Tutor","Level","Students","Lessons","Revenue","Rating","Status","Featured"];
    const quote=value => `"${String(value ?? "").replace(/"/g,'""')}"`;
    const rows=courses.map(c=>[c.title,c.category,currentTutor(c),c.level,number(c.totalStudents),number(c.lessonCount),number(c.revenue),number(c.rating).toFixed(1),c.status,c.featured?"Yes":"No"].map(quote).join(","));
    const blob=new Blob([[headers.map(quote).join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="ssa-courses-report.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function refreshIcons(){ if(window.lucide?.createIcons) window.lucide.createIcons(); }

function bindEvents(){
    ["courseSearch","statusFilter","categoryFilter","tutorFilter","levelFilter","sortCourses"].forEach(id => $(id)?.addEventListener(id === "courseSearch" ? "input" : "change", applyFilters));
    $("exportCourses")?.addEventListener("click", exportCSV);
    $("closeDrawer")?.addEventListener("click", closeDrawer);
    $("drawerBackdrop")?.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", e => { if(e.key === "Escape") { document.querySelectorAll(".course-menu").forEach(m=>m.classList.remove("open")); closeDrawer(); } });
    document.addEventListener("click", async e => {
        const menuButton=e.target.closest(".course-menu-btn");
        if(menuButton){ e.stopPropagation(); document.querySelectorAll(".course-menu").forEach(m=>m.classList.remove("open")); $("menu-"+menuButton.dataset.menuId)?.classList.toggle("open"); return; }
        const action=e.target.closest("[data-action]");
        if(action){ e.stopPropagation(); document.querySelectorAll(".course-menu").forEach(m=>m.classList.remove("open")); const id=action.dataset.id; if(action.dataset.action==="view") openDrawer(id); if(action.dataset.action==="feature") await toggleFeature(id); if(action.dataset.action==="status") await setStatus(id,action.dataset.status); if(action.dataset.action==="archive") await archive(id); return; }
        const drawerAction=e.target.closest("[data-drawer-action]");
        if(drawerAction){ const id=drawerAction.dataset.id; if(drawerAction.dataset.drawerAction==="assign") await assignInstructor(id); if(drawerAction.dataset.drawerAction==="feature") await toggleFeature(id); if(drawerAction.dataset.drawerAction==="status") await setStatus(id,drawerAction.dataset.status); if(drawerAction.dataset.drawerAction==="archive") await archive(id); return; }
        if(!e.target.closest(".course-menu")) document.querySelectorAll(".course-menu").forEach(m=>m.classList.remove("open"));
    });
}

async function loadInstructors(){
    try { const snap=await getDocs(collection(db,"instructors")); instructors=snap.docs.map(d=>({id:d.id,...d.data()})).filter(i=>String(i.status||"").toLowerCase()!=="suspended"); }
    catch(error){ console.error("Instructor load failed:",error); instructors=[]; }
}

function subscribeCourses(){
    onSnapshot(coursesRef, snap => {
        courses=snap.docs.map(d=>({id:d.id,...d.data()}));
        populateFilters(); updateStats(); renderAnalytics(); renderCharts(); applyFilters(); $("loadingGrid").style.display="none";
    }, error => { console.error("Course Load Error:",error); $("loadingGrid").style.display="none"; notify("Unable to load courses from Firestore.","error"); });
}

onAuthStateChanged(auth, async user => {
    if(!user){ location.href="../login.html"; return; }
    bindEvents();
    await loadInstructors();
    subscribeCourses();
});