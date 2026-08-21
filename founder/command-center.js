import { auth } from "../js/firebase.js";

const FN_URL = "https://nlnwllpisbqgbeluhdbr.supabase.co/functions/v1/platform-command";
const $ = id => document.getElementById(id);

function fmt(value){
  if(!value) return "—";
  return new Date(value).toLocaleString();
}

function stateText(enabled){ return enabled ? "Online" : "Suspended"; }

async function callCommand(action, payload = {}){
  const user = auth.currentUser;
  if(!user) throw new Error("Founder session expired. Please sign in again.");

  const token = await user.getIdToken(true);
  const response = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ action, ...payload })
  });

  const result = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(result.error || "Command failed.");
  return result;
}

function render(data = {}){
  const student = data.studentPortal !== false;
  const instructor = data.instructorPortal !== false;
  const lockdown = data.emergencyLockdown === true;

  $("studentState").textContent = stateText(student);
  $("instructorState").textContent = stateText(instructor);
  $("lockdownState").textContent = lockdown ? "Active" : "Inactive";

  $("studentState").style.color = student ? "#16a34a" : "#dc2626";
  $("instructorState").style.color = instructor ? "#16a34a" : "#dc2626";
  $("lockdownState").style.color = lockdown ? "#dc2626" : "#16a34a";

  $("studentToggle").textContent = student ? "Suspend Student Portal" : "Restore Student Portal";
  $("instructorToggle").textContent = instructor ? "Suspend Instructor Portal" : "Restore Instructor Portal";
  $("lockdownToggle").textContent = lockdown ? "Deactivate Lockdown" : "Activate Lockdown";

  $("studentToggle").classList.toggle("active", !student);
  $("instructorToggle").classList.toggle("active", !instructor);

  $("globalStatus").innerHTML = `<span></span>${lockdown ? "Emergency lockdown" : (!student || !instructor ? "Partial outage" : "All systems operational")}`;

  const maintenance = data.maintenance;
  if(maintenance){
    $("scheduleInfo").textContent = `${maintenance.target} maintenance: ${fmt(maintenance.starts_at)} → ${fmt(maintenance.ends_at)} — ${maintenance.message || "Scheduled maintenance"}`;
  } else {
    $("scheduleInfo").textContent = "No maintenance window scheduled.";
  }
}

function renderLog(items = []){
  $("commandLog").innerHTML = items.length
    ? items.map(x => `<div class="log-item"><strong>${x.action || x.command}</strong><br><span>${fmt(x.created_at)}</span></div>`).join("")
    : '<div class="empty">No commands yet.</div>';
}

async function refresh(){
  const data = await callCommand("status");
  render(data);
  renderLog(data.logs || []);
}

async function setPortal(portal){
  const current = await callCommand("status");
  const enabled = portal === "student" ? current.studentPortal : current.instructorPortal;
  await callCommand("set_portal", {
    target: portal,
    enabled: !enabled,
    reason: `${!enabled ? "Restored" : "Suspended"} from Founder Command Center`
  });
  await refresh();
}

async function toggleLockdown(){
  const current = await callCommand("status");
  await callCommand("lockdown", { enabled: !current.emergencyLockdown, reason: "Founder Command Center emergency control" });
  await refresh();
}

async function scheduleMaintenance(){
  const start = $("maintenanceStart").value;
  const end = $("maintenanceEnd").value;
  if(!start || !end || new Date(end) <= new Date(start)){
    alert("Choose a valid start and end time.");
    return;
  }

  await callCommand("schedule_maintenance", {
    target: $("maintenanceTarget").value,
    starts_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    message: $("maintenanceMessage").value.trim() || "SSA is temporarily offline for scheduled maintenance."
  });

  await refresh();
}

async function cancelMaintenance(){
  await callCommand("cancel_maintenance");
  await refresh();
}

async function boot(){
  if(!auth.currentUser){
    location.href = "../login.html";
    return;
  }

  $("studentToggle").onclick = () => setPortal("student").catch(e => alert(e.message));
  $("instructorToggle").onclick = () => setPortal("instructor").catch(e => alert(e.message));
  $("lockdownToggle").onclick = () => toggleLockdown().catch(e => alert(e.message));
  $("scheduleBtn").onclick = () => scheduleMaintenance().catch(e => alert(e.message));
  $("cancelScheduleBtn").onclick = () => cancelMaintenance().catch(e => alert(e.message));

  try { await refresh(); }
  catch(e){
    console.error(e);
    $("globalStatus").innerHTML = `<span></span>Command service unavailable`;
    $("scheduleInfo").textContent = e.message;
  }
}

auth.onAuthStateChanged(user => {
  if(!user) location.href = "../login.html";
  else boot();
});
