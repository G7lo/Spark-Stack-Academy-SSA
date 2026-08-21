// =====================================
// SPARK STACK ACADEMY
// STUDENT SIDEBAR V2 + PLATFORM GATE
// =====================================

import { db } from "../../js/firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🚀 SSA Sidebar Loaded");
let gateStarted = false;

function startPlatformGate(){
    if(gateStarted) return;
    gateStarted = true;
    onSnapshot(doc(db,"systemConfig","platform"), snap=>{
        const data=snap.data()||{};
        const portal=data.studentPortal||{};
        const maintenance=data.maintenance;
        const lockdown=data.emergencyLockdown===true;
        let blocked=portal.enabled===false||lockdown;
        let message=portal.message||"The Student Portal is temporarily unavailable.";
        if(maintenance?.startAt && maintenance?.endAt){
            const now=Date.now();
            const start=maintenance.startAt.toDate().getTime();
            const end=maintenance.endAt.toDate().getTime();
            const target=maintenance.target;
            if(now>=start&&now<end&&(target==="student"||target==="all")){ blocked=true; message=maintenance.message||message; }
        }
        if(blocked&&!location.pathname.endsWith("portal-suspended.html")){
            sessionStorage.setItem("ssaPortalMessage",message);
            location.href="portal-suspended.html";
        }
    },err=>console.error("Platform gate error:",err));
}

export async function loadSidebar(){
    startPlatformGate();
    const container=document.getElementById("sidebarContainer");
    if(!container)return;
    try{
        const response=await fetch(new URL("./sidebar.html",import.meta.url));
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        container.innerHTML=await response.text();
        initializeSidebar();
        if(typeof lucide!=="undefined")lucide.createIcons();
    }catch(error){console.error("Sidebar loading failed:",error);}
}

function initializeSidebar(){
    const logoutBtn=document.getElementById("logoutBtn");
    if(logoutBtn){
        logoutBtn.addEventListener("click",async()=>{
            const {auth}=await import("../../js/firebase.js");
            const {signOut}=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            await signOut(auth);
            window.location.href="/login.html";
        });
    }
}

export function updateSidebar(student){
    const name=student.name||student.fullName||"Student";
    const initial=name.charAt(0).toUpperCase();
    const sidebarName=document.getElementById("sidebarName");
    const sidebarAvatar=document.getElementById("sidebarAvatar");
    const sidebarLevel=document.getElementById("sidebarLevel");
    if(sidebarName){sidebarName.innerHTML=`${name}${student.premium===true?`<span class="premium-badge" title="SSA Premium Verified">✓</span>`:""}`;}
    if(sidebarAvatar)sidebarAvatar.textContent=initial;
    if(sidebarLevel)sidebarLevel.textContent=student.level||1;
}