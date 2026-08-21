import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const configRef = doc(db, "systemConfig", "platform");
const $ = id => document.getElementById(id);

function fmt(ts){ if(!ts) return "—"; const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleString(); }
function stateText(enabled){ return enabled ? "Online" : "Suspended"; }

async function writeCommand(command, details={}){
  try { await addDoc(collection(db,"systemCommandLog"), {command, details, actor:auth.currentUser?.uid||null, createdAt:serverTimestamp()}); } catch(e){ console.error(e); }
}

async function setPortal(portal, enabled){
  const current=(await getDoc(configRef)).data()||{};
  await setDoc(configRef,{...current,[portal]:{...(current[portal]||{}),enabled,updatedAt:serverTimestamp()}},{merge:true});
  await writeCommand(`${enabled?"Enabled":"Suspended"} ${portal} portal`);
}

function render(data={}){
  const student=data.studentPortal?.enabled !== false;
  const instructor=data.instructorPortal?.enabled !== false;
  const lockdown=data.emergencyLockdown === true;
  $("studentState").textContent=stateText(student);
  $("instructorState").textContent=stateText(instructor);
  $("lockdownState").textContent=lockdown?"Active":"Inactive";
  $("studentState").style.color=student?"#16a34a":"#dc2626";
  $("instructorState").style.color=instructor?"#16a34a":"#dc2626";
  $("lockdownState").style.color=lockdown?"#dc2626":"#16a34a";
  $("studentToggle").textContent=student?"Suspend Student Portal":"Restore Student Portal";
  $("instructorToggle").textContent=instructor?"Suspend Instructor Portal":"Restore Instructor Portal";
  $("lockdownToggle").textContent=lockdown?"Deactivate Lockdown":"Activate Lockdown";
  $("studentToggle").classList.toggle("active",!student);
  $("instructorToggle").classList.toggle("active",!instructor);
  $("globalStatus").innerHTML=`<span></span>${lockdown?"Emergency lockdown":(!student||!instructor?"Partial outage":"All systems operational")}`;
  if(data.maintenance?.startAt){ $("scheduleInfo").textContent=`${data.maintenance.target} maintenance: ${fmt(data.maintenance.startAt)} → ${fmt(data.maintenance.endAt)} — ${data.maintenance.message||"Scheduled maintenance"}`; }
  else $("scheduleInfo").textContent="No maintenance window scheduled.";
}

async function toggleLockdown(){
 const snap=await getDoc(configRef); const data=snap.data()||{}; const next=data.emergencyLockdown!==true;
 await setDoc(configRef,{emergencyLockdown:next,updatedAt:serverTimestamp()},{merge:true});
 if(next){ await setDoc(configRef,{studentPortal:{...(data.studentPortal||{}),enabled:false},instructorPortal:{...(data.instructorPortal||{}),enabled:false}},{merge:true}); }
 await writeCommand(next?"Emergency lockdown activated":"Emergency lockdown deactivated");
}

async function scheduleMaintenance(){
 const start=$("maintenanceStart").value, end=$("maintenanceEnd").value;
 if(!start||!end||new Date(end)<=new Date(start)){ alert("Choose a valid start and end time."); return; }
 const maintenance={target:$("maintenanceTarget").value,startAt:new Date(start),endAt:new Date(end),message:$("maintenanceMessage").value.trim()};
 await setDoc(configRef,{maintenance,updatedAt:serverTimestamp()},{merge:true});
 await writeCommand("Maintenance scheduled",maintenance);
}

async function cancelMaintenance(){ await updateDoc(configRef,{maintenance:null,updatedAt:serverTimestamp()}); await writeCommand("Scheduled maintenance cancelled"); }

onAuthStateChanged(auth,async user=>{
 if(!user){ location.href="../login.html"; return; }
 onSnapshot(configRef,s=>render(s.data()||{}));
 onSnapshot(query(collection(db,"systemCommandLog"),orderBy("createdAt","desc"),limit(12)),s=>{
   $("commandLog").innerHTML=s.empty?'<div class="empty">No commands yet.</div>':s.docs.map(d=>{const x=d.data();return `<div class="log-item"><strong>${x.command}</strong><br><span>${fmt(x.createdAt)}</span></div>`}).join("");
 });
 $("studentToggle").onclick=async()=>{const d=(await getDoc(configRef)).data()||{};await setPortal("studentPortal",d.studentPortal?.enabled===false);};
 $("instructorToggle").onclick=async()=>{const d=(await getDoc(configRef)).data()||{};await setPortal("instructorPortal",d.instructorPortal?.enabled===false);};
 $("lockdownToggle").onclick=toggleLockdown;
 $("scheduleBtn").onclick=scheduleMaintenance;
 $("cancelScheduleBtn").onclick=cancelMaintenance;
});
