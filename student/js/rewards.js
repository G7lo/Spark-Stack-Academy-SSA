// =====================================
// SPARK STACK ACADEMY
// REWARDS SYSTEM
// =====================================

import {

db,
auth

} from "../../js/firebase.js";



import {

doc,
getDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



console.log(
"🏆 Rewards Loaded"
);





let studentData = {};

let badges = [];





onAuthStateChanged(

auth,

async(user)=>{

if(!user){

location.href="login.html";

return;

}

await loadRewards(
user.uid
);

}

);





// =====================================
// LOAD STUDENT
// =====================================

async function loadRewards(uid){

try{

const ref =
doc(
db,
"students",
uid
);

const snap =
await getDoc(ref);

if(!snap.exists()) return;

studentData =
snap.data();

updateHero();

renderBadges();

renderTimeline();

renderLeaderboard();

}

catch(error){

console.error(error);

}

}
// =====================================
// BADGES
// =====================================

function renderBadges(){

const grid =
document.getElementById(
"badgesGrid"
);

if(!grid)
return;



const allBadges = [

{

id:"first_steps",

title:"First Steps",

icon:"🚀",

type:"gold",

description:"Enroll in your first course."

},

{

id:"bookworm",

title:"Bookworm",

icon:"📚",

type:"silver",

description:"Complete 5 lessons."

},

{

id:"coding_ninja",

title:"Coding Ninja",

icon:"💻",

type:"gold",

description:"Complete all coding assignments."

},

{

id:"quiz_master",

title:"Quiz Master",

icon:"🧠",

type:"gold",

description:"Score 100% in a quiz."

},

{

id:"graduate",

title:"Graduate",

icon:"🎓",

type:"gold",

description:"Complete your first course."

},

{

id:"streak7",

title:"7-Day Streak",

icon:"🔥",

type:"bronze",

description:"Learn for 7 consecutive days."

},

{

id:"legend",

title:"Academy Legend",

icon:"👑",

type:"gold",

description:"Unlock every badge."

}

];



grid.innerHTML = "";



allBadges.forEach(badge=>{

const unlocked =
badges.includes(
badge.id
);



grid.innerHTML += `

<div class="badge-card

${unlocked ? badge.type : "locked"}">

<div class="badge-icon">

${badge.icon}

</div>

<h3>

${badge.title}

</h3>

<p>

${badge.description}

</p>

<div class="badge-status

${unlocked ? "unlocked":"locked"}">

${unlocked ? "✅ Unlocked" : "🔒 Locked"}

</div>

</div>

`;

});

}
// =====================================
// ACHIEVEMENT TIMELINE
// =====================================

function renderTimeline(){

const box =
document.getElementById(
"achievementTimeline"
);

if(!box)
return;



const timeline =

studentData.timeline ||

[

{

icon:"🚀",

title:"Welcome to Spark Stack Academy",

date:"Today"

},

{

icon:"📚",

title:"Start your first course",

date:"Ready"

}

];



box.innerHTML = "";



timeline.forEach(item=>{

box.innerHTML += `

<div class="timeline-item">

<div class="timeline-icon">

${item.icon}

</div>

<div>

<h3>

${item.title}

</h3>

<p>

${item.date}

</p>

</div>

</div>

`;

});

}





// =====================================
// LEADERBOARD
// =====================================

function renderLeaderboard(){

const board =
document.getElementById(
"leaderboard"
);

if(!board)
return;



const leaders =

[

{

rank:1,

name:"James",

xp:12450,

emoji:"🥇"

},

{

rank:2,

name:studentData.name || "You",

xp:studentData.xp || 0,

emoji:"🥈"

},

{

rank:3,

name:"Sarah",

xp:9620,

emoji:"🥉"

}

];



board.innerHTML = "";



leaders.forEach(user=>{

board.innerHTML += `

<div class="leader-card">

<div class="rank">

${user.emoji}

</div>

<h3>

${user.name}

</h3>

<div class="points">

${user.xp.toLocaleString()} XP

</div>

</div>

`;

});

}
// =====================================
// LEVEL UP POPUP
// =====================================

function showLevelUp(level){

const modal =
document.getElementById(
"levelUpModal"
);

document.getElementById(
"newLevelText"
).textContent =

`Level ${level} Reached`;

modal.classList.add(
"show"
);

}



document
.getElementById(
"closeLevelUp"
)
?.addEventListener(

"click",

()=>{

document
.getElementById(
"levelUpModal"
)
.classList.remove(
"show"
);

}

);



// Example

// showLevelUp(5);