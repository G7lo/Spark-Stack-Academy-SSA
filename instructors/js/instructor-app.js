// ===========================
// SSA INSTRUCTOR APP CORE
// ===========================

import { auth, db } from "../../js/firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
getDoc,
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import "../../js/theme.js";

console.log("SSA INSTRUCTOR APP CONNECTED");



// ===========================
// INITIALIZE
// ===========================

window.addEventListener(
"DOMContentLoaded",
async()=>{

await loadSidebar();

await loadTopbar();

loadInstructor();

highlightActivePage();

});




// ===========================
// LOAD SIDEBAR
// ===========================

async function loadSidebar(){

const css=document.createElement("link");

css.rel="stylesheet";

css.href="components/sidebar.css";

document.head.appendChild(css);

const container=
document.getElementById("sidebarContainer");

if(!container) return;

const res=
await fetch("components/sidebar.html");

console.log(res.status);

container.innerHTML=
await res.text();

if(typeof lucide!=="undefined"){

lucide.createIcons();

}

// NEW 👇

highlightActivePage();

}




// ===========================
// LOAD TOPBAR
// ===========================

async function loadTopbar(){

const css=document.createElement("link");

css.rel="stylesheet";

css.href="components/topbar.css";

document.head.appendChild(css);


const container=
document.getElementById("topbarContainer");

if(!container) return;


const res=
await fetch("components/topbar.html");

container.innerHTML=
await res.text();


if(typeof lucide!=="undefined"){

lucide.createIcons();

}


setupSidebar();

loadNotificationBadge();

}
// ===========================
// LOAD INSTRUCTOR
// ===========================

function loadInstructor(){

onAuthStateChanged(

auth,

async(user)=>{

if(!user){

window.location.href="../login.html";

return;

}

try{

const ref=
doc(
db,
"instructors",
user.uid
);

const snap=
await getDoc(ref);

if(!snap.exists()){

console.log(
"Instructor profile missing"
);

return;

}

const instructor=
snap.data();

updateInstructorUI(
instructor,
user
);

}
catch(error){

console.error(
error
);

}

});

}



// ===========================
// UPDATE UI
// ===========================

function updateInstructorUI(

instructor,
user

){

const name=

instructor.name||

"Instructor";

const email=

user.email||

"";

const initial=

name
.charAt(0)
.toUpperCase();



const nameEl=

document.getElementById(
"instructorName"
);

if(nameEl){

nameEl.textContent=

`Welcome back, ${name} 👋`;

}



const avatar=

document.querySelector(
".instructor-avatar"
);

if(avatar){

avatar.textContent=
initial;

}



const emailEl=

document.getElementById(
"instructorEmail"
);

if(emailEl){

emailEl.textContent=
email;

}

}



// ===========================
// SIDEBAR
// ===========================

function setupSidebar(){

const menuBtn=

document.getElementById(
"menuBtn"
);

const sidebar=

document.querySelector(
".sidebar"
);

const overlay=

document.getElementById(
"sidebarOverlay"
);


if(
!menuBtn||
!sidebar||
!overlay
){

return;

}


menuBtn.onclick=()=>{

sidebar.classList.toggle(
"active"
);

overlay.classList.toggle(
"active"
);

document.body.classList.toggle(
"menu-open"
);

};


overlay.onclick=()=>{

sidebar.classList.remove(
"active"
);

overlay.classList.remove(
"active"
);

document.body.classList.remove(
"menu-open"
);

};


document.addEventListener(

"keydown",

(e)=>{

if(e.key==="Escape"){

overlay.click();

}

}

);

}



// ===========================
// ACTIVE PAGE
// ===========================

function highlightActivePage(){

const current=

window.location.pathname
.split("/")
.pop();

document

.querySelectorAll(
".sidebar-menu a"
)

.forEach(link=>{

const href=

link.getAttribute(
"href"
);

if(href===current){

link.classList.add(
"active"
);

}else{

link.classList.remove(
"active"
);

}

});

}



// ===========================
// NOTIFICATIONS
// ===========================

async function loadNotificationBadge(){

const badge=

document.getElementById(
"notificationCount"
);

if(!badge) return;


onAuthStateChanged(

auth,

async(user)=>{

if(!user){

badge.style.display="none";

return;

}


const q=

query(

collection(
db,
"notifications"
),

where(
"userId",
"==",
user.uid
)

);


const snap=

await getDocs(q);


if(snap.empty){

badge.style.display="none";

}else{

badge.style.display="flex";

badge.textContent=

snap.size;

}

}

);

}



// ===========================
// LOGOUT
// ===========================

document.addEventListener(

"click",

async(e)=>{

const logout=

e.target.closest(
"#logoutBtn,.logout-btn"
);

if(!logout) return;

await signOut(auth);

window.location.href=
"../login.html";

});