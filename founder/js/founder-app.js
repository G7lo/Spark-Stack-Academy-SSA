// ============================================================
// SPARK STACK ACADEMY — FOUNDER APP CORE V3
// Shared shell: sidebar + topbar + founder session
// ============================================================

import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const APP_BASE = new URL("../", import.meta.url);
const cache = new Map();
const $ = (id) => document.getElementById(id);
function asset(path){ return new URL(path, APP_BASE).href; }

async function fetchComponent(path){
  const url=asset(path); if(cache.has(url)) return cache.get(url);
  const response=await fetch(url,{cache:"force-cache"});
  if(!response.ok) throw new Error(`Failed to load ${path} (${response.status})`);
  const html=await response.text(); cache.set(url,html); return html;
}

function loadCSS(path){
  const url=asset(path);
  if(document.querySelector(`link[data-founder-css="${url}"]`)) return;
  const link=document.createElement("link"); link.rel="stylesheet"; link.dataset.founderCss=url; link.href=url;
  document.head.appendChild(link);
}

async function mountComponent(containerId,htmlPath,cssPath){
  const container=$(containerId); if(!container) return false;
  try{ loadCSS(cssPath); container.innerHTML=await fetchComponent(htmlPath); window.lucide?.createIcons(); return true; }
  catch(error){ console.error(`[Founder Core] ${htmlPath}`,error); return false; }
}

async function mountShell(){
  loadCSS("components/founder-theme.css");
  const [sidebarReady,topbarReady]=await Promise.all([
    mountComponent("sidebarContainer","components/sidebar.html","components/sidebar.css"),
    mountComponent("topbarContainer","components/topbar.html","components/topbar.css")
  ]);
  if(sidebarReady) highlightActivePage();
  if(sidebarReady||topbarReady){ setupSidebar(); setupTopbar(); window.lucide?.createIcons(); }
}

function setupSidebar(){
  const menuBtn=$("menuBtn"),sidebar=document.querySelector(".sidebar"),overlay=$("sidebarOverlay");
  if(!menuBtn||!sidebar||!overlay) return;
  const close=()=>{sidebar.classList.remove("active","open");overlay.classList.remove("active");document.body.classList.remove("menu-open");};
  menuBtn.onclick=()=>{sidebar.classList.toggle("active");sidebar.classList.toggle("open");overlay.classList.toggle("active");document.body.classList.toggle("menu-open");};
  overlay.onclick=close; sidebar.querySelectorAll("a").forEach(link=>link.addEventListener("click",close));
}

function setupTopbar(){
  $("themeBtn")?.addEventListener("click",()=>document.body.classList.toggle("dark-mode"));
  $("notificationsBtn")?.addEventListener("click",event=>{event.stopPropagation();$("notificationDropdown")?.classList.toggle("active");});
  document.addEventListener("click",event=>{const dropdown=$("notificationDropdown");if(dropdown&&!event.target.closest(".notification-wrapper"))dropdown.classList.remove("active");});
  $("viewAllNotifications")?.addEventListener("click",()=>{window.location.href=asset("notifications.html");});
  initGlobalSearch();
}

function initGlobalSearch(){
  const input=$("globalSearch"),results=$("searchResults"); if(!input||!results)return;
  const pages=[["Dashboard","dashboard.html"],["Command Center","command-center.html"],["Students","students.html"],["Courses","courses.html"],["Instructors","instructors.html"],["Analytics","analytics.html"],["Revenue","revenue.html"],["Payments","payments.html"],["Announcements","announcements.html"],["Notifications","notifications.html"],["Monetization","monetization.html"],["Platform Control","platform-settings.html"],["Academy Setup","academy-profile.html"],["Security & Maintenance","security.html"],["Settings","settings.html"]];
  input.addEventListener("input",()=>{const value=input.value.trim().toLowerCase();results.innerHTML="";if(!value){results.style.display="none";return;}const matches=pages.filter(([title])=>title.toLowerCase().includes(value));matches.forEach(([title,path])=>{const item=document.createElement("button");item.type="button";item.className="search-result";item.textContent=title;item.onclick=()=>window.location.href=asset(path);results.appendChild(item);});results.style.display=matches.length?"block":"none";});
}

function highlightActivePage(){
  const current=window.location.pathname.split("/").pop()||"dashboard.html";
  document.querySelectorAll(".sidebar-menu a").forEach(link=>{const href=(link.getAttribute("href")||"").split("/").pop();link.classList.toggle("active",href===current);});
}

function loadFounderProfile(uid){
  const cached=sessionStorage.getItem("founderProfile");
  if(cached){try{updateFounderUI(JSON.parse(cached));}catch{sessionStorage.removeItem("founderProfile");}}
  getDoc(doc(db,"founder",uid)).then(snapshot=>{if(!snapshot.exists())return;const founder=snapshot.data();sessionStorage.setItem("founderProfile",JSON.stringify(founder));updateFounderUI(founder);}).catch(error=>console.warn("Founder profile unavailable:",error));
}

function updateFounderUI(founder={}){const name=founder.name||"Founder";if($("profileName"))$("profileName").textContent=name;if($("profileAvatar"))$("profileAvatar").textContent=name.charAt(0).toUpperCase();if($("profileRole"))$("profileRole").textContent=founder.role||"Founder";if($("aiStatusText"))$("aiStatusText").textContent=`Online • ${name}'s Assistant`;window.founderData=founder;}

function loadNotifications(uid){
  const base=query(collection(db,"notifications"),where("userId","==",uid));
  onSnapshot(base,snapshot=>{const unread=snapshot.docs.filter(item=>item.data().read===false).length;const badge=$("notificationCount");if(badge){badge.textContent=unread;badge.style.display=unread?"flex":"none";}},error=>console.warn("Notification badge unavailable:",error));
  const list=$("topNotificationsList");if(!list)return;
  onSnapshot(query(base,orderBy("createdAt","desc"),limit(5)),snapshot=>{list.innerHTML="";let unread=0;if(snapshot.empty){list.innerHTML='<p class="empty-notifications">No new notifications</p>';if($("dropdownUnread"))$("dropdownUnread").textContent="0";return;}snapshot.forEach(item=>{const data=item.data();if(data.read===false)unread++;const row=document.createElement("div");row.className="top-notification-item";row.innerHTML=`<div class="top-notification-icon">🔔</div><div class="top-notification-content"><h4>${escapeText(data.title||"Notification")}</h4><p>${escapeText(data.message||"")}</p></div>`;list.appendChild(row);});if($("dropdownUnread"))$("dropdownUnread").textContent=unread;},error=>console.warn("Notification feed unavailable:",error));
}
function escapeText(value){const div=document.createElement("div");div.textContent=String(value);return div.innerHTML;}

document.addEventListener("click",async event=>{const logout=event.target.closest("#logoutBtn");if(!logout)return;try{await signOut(auth);sessionStorage.removeItem("founderProfile");window.location.href=asset("../login.html");}catch(error){console.error("Logout failed:",error);}});

async function boot(){await mountShell();onAuthStateChanged(auth,user=>{if(!user){window.location.href=asset("../login.html");return;}loadFounderProfile(user.uid);loadNotifications(user.uid);});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
