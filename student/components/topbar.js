import { auth, db } from "../js/firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded",()=>{

const css=document.createElement("link");

css.rel="stylesheet";

css.href="components/topbar.css";

document.head.appendChild(css);

const container=
document.getElementById("topbarContainer");

if(!container) return;

fetch("components/topbar.html")

.then(res=>res.text())

.then(html=>{

container.innerHTML=html;

if(typeof lucide!=="undefined"){

lucide.createIcons();

}

setupMenu();

loadNotificationBadge();

});

});

function setupMenu(){

const menuBtn=
document.getElementById("menuBtn");

const sidebar=
document.querySelector(".sidebar");

if(!menuBtn||!sidebar) return;

menuBtn.addEventListener("click",()=>{

const overlay=
document.getElementById("sidebarOverlay");

sidebar.classList.toggle("active");

if(overlay){

overlay.classList.toggle("active");

}

});

const overlay=
document.getElementById("sidebarOverlay");

if(overlay){

overlay.addEventListener("click",()=>{

sidebar.classList.remove("active");

overlay.classList.remove("active");

});

}

}

async function loadNotificationBadge(){

const badge=
document.getElementById("notificationCount");

if(!badge) return;

onAuthStateChanged(auth,async(user)=>{

if(!user){

badge.style.display="none";

return;

}

const q=query(

collection(db,"notifications"),

where("userId","==",user.uid)

);

const snap=await getDocs(q);

if(snap.empty){

badge.style.display="none";

}else{

badge.style.display="flex";

badge.textContent=snap.size;

}

});

}