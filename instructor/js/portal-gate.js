import { db } from "../../js/firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onSnapshot(doc(db,"systemConfig","platform"),snap=>{
 const data=snap.data()||{}; const portal=data.instructorPortal||{}; const maintenance=data.maintenance; let blocked=portal.enabled===false||data.emergencyLockdown===true; let message=portal.message||"The Instructor Portal is temporarily unavailable.";
 if(maintenance?.startAt&&maintenance?.endAt){const now=Date.now(),start=maintenance.startAt.toDate().getTime(),end=maintenance.endAt.toDate().getTime();if(now>=start&&now<end&&(maintenance.target==="instructor"||maintenance.target==="all")){blocked=true;message=maintenance.message||message;}}
 if(blocked&&!location.pathname.endsWith("portal-suspended.html")){sessionStorage.setItem("ssaPortalMessage",message);location.href="portal-suspended.html";}
});