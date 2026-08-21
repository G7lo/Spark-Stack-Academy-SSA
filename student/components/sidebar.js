// =====================================
// SPARK STACK ACADEMY
// STUDENT SIDEBAR V2 + SUPABASE PLATFORM GATE
// =====================================

import { db } from "../../js/firebase.js";
import { supabase } from "../../js/supabase.js";

console.log("🚀 SSA Sidebar Loaded");
let gateStarted = false;

function startPlatformGate(){
    if(gateStarted) return;
    gateStarted = true;

    const check = async () => {
        const { data, error } = await supabase
            .from("platform_commands")
            .select("command,target,active,reason,expires_at,created_at")
            .in("target", ["student", "all"])
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if(error){
            console.warn("Supabase platform gate unavailable:", error.message);
            return;
        }
        if(!data) return;
        if(data.expires_at && new Date(data.expires_at) <= new Date()) return;

        sessionStorage.setItem("ssaPortalMessage", data.reason || "The Student Portal is temporarily unavailable.");
        if(!location.pathname.endsWith("portal-suspended.html")){
            location.href = "portal-suspended.html";
        }
    };

    check();
    setInterval(check, 30000);
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