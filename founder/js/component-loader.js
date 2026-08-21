/* ==========================================================
   SPARK STACK FOUNDER OS — COMPONENT LOADER
   Supports the current Founder shell and older page containers.
========================================================== */

const componentCache = new Map();

async function loadComponent(elementId, file, cssFile){
  const container = document.getElementById(elementId);
  if(!container) return false;

  try{
    let html = componentCache.get(file);
    if(!html){
      const response = await fetch(file, {cache:"no-store"});
      if(!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
      html = await response.text();
      componentCache.set(file, html);
    }

    container.innerHTML = html;

    if(cssFile && !document.querySelector(`link[data-founder-component="${cssFile}"]`)){
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = cssFile;
      style.dataset.founderComponent = cssFile;
      document.head.appendChild(style);
    }

    return true;
  }catch(error){
    console.error("Founder component error:", error);
    return false;
  }
}

function initMobileSidebar(){
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if(!menuBtn || !sidebar || !overlay) return;

  const close = () => {
    sidebar.classList.remove("active","open");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");
  };

  menuBtn.onclick = () => {
    const open = !sidebar.classList.contains("active") && !sidebar.classList.contains("open");
    sidebar.classList.toggle("active", open);
    overlay.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open);
  };

  overlay.onclick = close;
  document.querySelectorAll(".sidebar-menu a").forEach(link => link.addEventListener("click", close));
}

function normalizePath(path){
  return (path || "").split("?")[0].split("#")[0].replace(/^\.\//,"");
}

function highlightActivePage(){
  const current = normalizePath(window.location.pathname.split("/").pop() || "dashboard.html");
  document.querySelectorAll(".sidebar-menu a").forEach(link => {
    const href = normalizePath(link.getAttribute("href"));
    const target = href.split("/").pop();
    link.classList.toggle("active", target === current);
  });
}

async function bootFounderComponents(){
  const sidebarId = document.getElementById("sidebarContainer") ? "sidebarContainer" : (document.getElementById("sidebar") ? "sidebar" : null);
  const topbarId = document.getElementById("topbarContainer") ? "topbarContainer" : (document.getElementById("topbar") ? "topbar" : null);

  const sidebarLoaded = sidebarId && await loadComponent(sidebarId, "components/sidebar.html", "components/sidebar.css");
  const topbarLoaded = topbarId && await loadComponent(topbarId, "components/topbar.html", "components/topbar.css");

  if(sidebarLoaded) highlightActivePage();
  if(window.lucide?.createIcons) window.lucide.createIcons();
  if(sidebarLoaded || topbarLoaded) initMobileSidebar();

  document.dispatchEvent(new Event("componentsLoaded"));
}

document.addEventListener("DOMContentLoaded", bootFounderComponents);
