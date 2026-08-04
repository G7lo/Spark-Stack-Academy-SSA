/* ===================================
   FOUNDER DASHBOARD
=================================== */

import "./js/founder-app.js";

import { db } from "../js/firebase.js";

import {
collection,
onSnapshot,
query,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===================================
   KPI ELEMENTS
=================================== */

const studentCount =
document.getElementById("studentCount");

const instructorCount =
document.getElementById("instructorCount");

const enrollmentCount =
document.getElementById("enrollmentCount");

const revenueCount =
document.getElementById("revenueCount");

const activityFeed =
document.getElementById("activityFeed");

const founderInsight =
document.getElementById("founderInsight");

/* ===================================
   STUDENTS
=================================== */

onSnapshot(
collection(db,"students"),
(snapshot)=>{

studentCount.textContent =
snapshot.size.toLocaleString();

});

/* ===================================
   INSTRUCTORS
=================================== */

onSnapshot(
collection(db,"instructors"),
(snapshot)=>{

instructorCount.textContent =
snapshot.size.toLocaleString();

});

/* ===================================
   ENROLLMENTS
=================================== */

onSnapshot(
collection(db,"enrollments"),
(snapshot)=>{

enrollmentCount.textContent =
snapshot.size.toLocaleString();

});

/* ===================================
   REVENUE
=================================== */

onSnapshot(
collection(db,"payments"),
(snapshot)=>{

let total=0;

snapshot.forEach(doc=>{

const payment=doc.data();

total+=payment.amount||0;

});

revenueCount.textContent=
"$"+total.toLocaleString();

});

/* ===================================
   RECENT ACTIVITY
=================================== */

const activityQuery=query(

collection(db,"activity"),

orderBy("createdAt","desc"),

limit(8)

);

onSnapshot(activityQuery,(snapshot)=>{

activityFeed.innerHTML="";

if(snapshot.empty){

activityFeed.innerHTML=`

<div class="empty-state">

<div class="empty-icon">📡</div>

<h4>No Recent Activity</h4>

<p>Activity will appear here.</p>

</div>

`;

return;

}

snapshot.forEach(doc=>{

const item=doc.data();

activityFeed.innerHTML+=`

<div class="activity-item">

<div class="activity-icon">

${item.icon||"✨"}

</div>

<div>

<h4>${item.title}</h4>

<small>${item.message}</small>

</div>

</div>

`;

});

});

/* ===================================
   SPARK AI
=================================== */

const insights=[

"Everything is running smoothly.",

"Admissions are growing steadily.",

"Student engagement remains healthy.",

"Revenue trends look positive.",

"No critical issues detected."

];

let index=0;

setInterval(()=>{

founderInsight.textContent=

insights[index];

index++;

if(index>=insights.length){

index=0;

}

},10000);

console.log("🚀 Founder Dashboard Ready");