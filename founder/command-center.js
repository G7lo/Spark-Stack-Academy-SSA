import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, setDoc, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const state = { user:null, profile:null };
const $ = id => document.getElementById(id);
const toast = (m,t="success") => window.showFounderToast ? window.showFounderToast(m,t) : alert(m);
const controlRef = () => doc(db,"platform_controls","global");

async function requireFounder(user){
 const s=await getDoc(doc(db,"founder",user.uid));
 if(!s.exists()) throw Error("Founder profile not found.");
 const p=s.data();
 if(p.role && p.role!=="founder") throw Error("Founder access required.");
 if(p.status && p.status!=="active") throw Error("Founder account is not active.");
 state.user=user; state.profile=p;
}

async function audit(message,action,details={}){
 return addDoc(collection(db,"audit_logs"),{actor_id:state.user.uid,actor_email:state.user.email||"",action,target_type:"platform",target_id:"global",details,message,created_at:serverTimestamp()});
}

async function setPortalState(target,suspended){
 const s=await getDoc(controlRef()), current=s.exists()?s.data():{};
 await setDoc(controlRef(),{...current,[target]:{...(current[target]||{}),suspended,updated_at:serverTimestamp(),updated_by:state.user.uid},updated_at:serverTimestamp()},{merge:true});
 await audit(`${target} portal ${suspended?"suspended":"restored"}`,suspended?"portal_suspended":"portal_restored",{target});
 toast(`${target==="student"?"Student":"Instructor"} portal ${suspended?"suspended":"restored"}.`);
}

async function setLockdown(active){
 await setDoc(controlRef(),{lockdown:active,updated_at:serverTimestamp(),updated_by:state.user.uid},{merge:true});
 await audit(active?"Emergency lockdown activated":"Emergency lockdown lifted",active?"lockdown_enabled":"lockdown_disabled");
 toast(active?"Emergency lockdown activated.":"Lockdown lifted.");
}

function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleString();}
function renderMaintenance(m){
 const el=$("scheduleInfo"); if(!el)return;
 if(!m?.scheduled){el.textContent="No maintenance window scheduled.";return;}
 const s=new Date(m.start).getTime(),e=new Date(m.end).getTime(),now=Date.now();
 if(!Number.isFinite(s)||!Number.isFinite(e)){el.textContent="Invalid maintenance schedule.";return;}
 const target=m.target==="all"?"Student + Instructor":m.target==="student"?"Student Portal":"Instructor Portal";
 const status=now>=e?"Expired":now>=s?"LIVE NOW":"Scheduled";
 el.innerHTML=`<strong>${status}</strong> · ${target}<br>${formatDate(m.start)} → ${formatDate(m.end)}<br><span>${m.message||"Scheduled maintenance."}</span>`;
}

function renderControls(d={}){
 const ss=!!d.student?.suspended,is=!!d.instructor?.suspended,lock=!!d.lockdown;
 $("studentState").textContent=ss?"Suspended":"Online";
 $("instructorState").textContent=is?"Suspended":"Online";
 $("lockdownState").textContent=lock?"ACTIVE":"Inactive";
 $("studentToggle").textContent=ss?"Restore Student Portal":"Suspend Student Portal";
 $("instructorToggle").textContent=is?"Restore Instructor Portal":"Suspend Instructor Portal";
 $("lockdownToggle").textContent=lock?"Lift Lockdown":"Activate Lockdown";
 $("globalStatus").innerHTML=lock?"<span></span> Emergency Lockdown":ss||is?"<span></span> Limited Availability":"<span></span> All Systems Online";
 renderMaintenance(d.maintenance);
}

function listenControls(){onSnapshot(controlRef(),s=>renderControls(s.exists()?s.data():{}));}
function listenAuditLog(){
 const q=query(collection(db,"audit_logs"),orderBy("created_at","desc"),limit(30));
 onSnapshot(q,s=>{
  const log=$("commandLog");
  if(!s.docs.length){log.innerHTML='<div class="empty">No command activity yet.</div>';return;}
  log.innerHTML=s.docs.map(x=>{const d=x.data();return `<div class="command-entry"><strong>${d.message||d.action||"Command executed"}</strong><small>${d.actor_email||"Founder"} · ${d.created_at?.toDate?d.created_at.toDate().toLocaleString():"Just now"}</small></div>`}).join("");
 });
}

async function scheduleMaintenance(){
 const target=$("maintenanceTarget").value,start=$("maintenanceStart").value,end=$("maintenanceEnd").value,message=$("maintenanceMessage").value.trim();
 if(!start||!end) throw Error("Choose both a start and end time.");
 const s=new Date(start),e=new Date(end);
 if(!Number.isFinite(s.getTime())||!Number.isFinite(e.getTime())) throw Error("Please enter valid maintenance dates.");
 if(e<=s) throw Error("End time must be after start time.");
 if(e<=new Date()) throw Error("Maintenance must end in the future.");
 const maintenance={scheduled:true,target,start:s.toISOString(),end:e.toISOString(),message:message||"SSA is temporarily offline for scheduled maintenance.",scheduled_by:state.user.uid,scheduled_by_email:state.user.email||"",scheduled_at:serverTimestamp()};
 await setDoc(controlRef(),{maintenance,updated_at:serverTimestamp(),updated_by:state.user.uid},{merge:true});
 await audit("Maintenance window scheduled","maintenance_scheduled",{target,start:maintenance.start,end:maintenance.end,message:maintenance.message});
 renderMaintenance(maintenance); toast("Maintenance window scheduled successfully.");
}

async function cancelMaintenance(){
 await setDoc(controlRef(),{maintenance:{scheduled:false,cancelled_at:serverTimestamp(),cancelled_by:state.user.uid},updated_at:serverTimestamp(),updated_by:state.user.uid},{merge:true});
 await audit("Scheduled maintenance cancelled","maintenance_cancelled");
 $("scheduleInfo").textContent="No maintenance window scheduled."; toast("Scheduled maintenance cancelled.");
}

function bindEvents(){
 $("studentToggle").onclick=async()=>{try{const s=await getDoc(controlRef());await setPortalState("student",!s.data()?.student?.suspended)}catch(e){toast(e.message,"error")}};
 $("instructorToggle").onclick=async()=>{try{const s=await getDoc(controlRef());await setPortalState("instructor",!s.data()?.instructor?.suspended)}catch(e){toast(e.message,"error")}};
 $("lockdownToggle").onclick=async()=>{try{const s=await getDoc(controlRef());await setLockdown(!s.data()?.lockdown)}catch(e){toast(e.message,"error")}};
 $("scheduleBtn").onclick=async()=>{try{$("scheduleBtn").disabled=true;await scheduleMaintenance()}catch(e){toast(e.message,"error")}finally{$("scheduleBtn").disabled=false}};
 $("cancelScheduleBtn").onclick=async()=>{try{$("cancelScheduleBtn").disabled=true;await cancelMaintenance()}catch(e){toast(e.message,"error")}finally{$("cancelScheduleBtn").disabled=false}};
}

onAuthStateChanged(auth,async user=>{
 if(!user){window.location.replace("../login.html");return;}
 try{await requireFounder(user);listenControls();listenAuditLog();bindEvents();console.log("🔥 Founder Command Center connected to Firebase.");}
 catch(e){console.error(e);toast(e.message,"error");setTimeout(()=>window.location.replace("../login.html"),1500);}
});
