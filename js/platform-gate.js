import { supabase } from "./supabase.js";

const MAINTENANCE_PATH = "../maintenance.html";
const PUBLIC_PATHS = ["maintenance.html", "login.html", "signup.html", "index.html"];

function isPublicPage(){
  const name = location.pathname.split("/").pop() || "index.html";
  return PUBLIC_PATHS.includes(name);
}

function targetForPath(){
  const path = location.pathname.toLowerCase();
  if(path.includes("/student/")) return "student";
  if(path.includes("/instructor/")) return "instructor";
  return null;
}

function showGate({ title, message, endsAt }){
  if(document.getElementById("ssa-platform-gate")) return;
  const el = document.createElement("div");
  el.id = "ssa-platform-gate";
  el.innerHTML = `
    <style>
      #ssa-platform-gate{position:fixed;inset:0;z-index:2147483647;background:#061329;color:#fff;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,sans-serif}
      #ssa-platform-gate .box{width:min(560px,100%);padding:42px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:linear-gradient(145deg,#0b2144,#07162e);box-shadow:0 30px 100px rgba(0,0,0,.45);text-align:center}
      #ssa-platform-gate .icon{font-size:48px;margin-bottom:16px}#ssa-platform-gate h1{margin:0 0 12px;font-size:30px}#ssa-platform-gate p{color:#a9b8ce;line-height:1.7;margin:10px 0}
      #ssa-platform-gate .time{margin-top:20px;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:13px;color:#d9e3f2}
    </style>
    <div class="box"><div class="icon">⚡</div><h1>${title}</h1><p>${message}</p>${endsAt ? `<div class="time">Expected return: ${new Date(endsAt).toLocaleString()}</div>` : ""}</div>
  `;
  document.body.appendChild(el);
}

async function checkPlatform(){
  if(isPublicPage()) return;
  const target = targetForPath();
  if(!target) return;

  const { data, error } = await supabase
    .from("platform_commands")
    .select("command,target,active,reason,expires_at,created_at")
    .eq("target", target)
    .eq("active", true)
    .order("created_at", { ascending:false })
    .limit(1)
    .maybeSingle();

  if(error){ console.warn("SSA platform gate unavailable:", error.message); return; }
  if(!data) return;
  if(data.expires_at && new Date(data.expires_at) <= new Date()) return;

  showGate({
    title: "Platform temporarily unavailable",
    message: data.reason || `The ${target} portal is temporarily unavailable while SSA performs maintenance.`,
    endsAt: data.expires_at
  });
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", checkPlatform);
else checkPlatform();

setInterval(checkPlatform, 30000);
