// =====================================
// SPARK STACK ACADEMY
// ACHIEVEMENTS
// achievements.js
// =====================================


import {

auth,
db

} from "../../../js/firebase.js";


import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

doc,
getDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("🏆 Achievements Loaded");



// =====================================
// DOM
// =====================================


const studentLevel =
document.getElementById("studentLevel");


const studentXP =
document.getElementById("studentXP");


const xpProgress =
document.getElementById("xpProgress");


const streakDays =
document.getElementById("streakDays");


const studentRank =
document.getElementById("studentRank");


const badgeContainer =
document.getElementById("badgeContainer");


const recentUnlocks =
document.getElementById("recentUnlocks");


const featuredBadgeName =
document.getElementById("featuredBadgeName");




// =====================================
// BADGE DATABASE
// =====================================


const badges = {


first_course:{

name:"First Steps",

icon:"🌱"

},


coder:{

name:"Code Builder",

icon:"💻"

},


streak:{

name:"Consistency Flame",

icon:"🔥"

},


certificate:{

name:"Certified Builder",

icon:"🎓"

},


elite:{

name:"Elite Architect",

icon:"👑"

}


};




// =====================================
// AUTH
// =====================================


onAuthStateChanged(

auth,

async(user)=>{


if(!user){

window.location.href="../login.html";

return;

}


loadAchievements(user.uid);


}

);






// =====================================
// LOAD DATA
// =====================================


async function loadAchievements(uid){


try{


const userRef = doc(

db,

"users",

uid

);


const snap = await getDoc(userRef);



if(!snap.exists()){

console.log("No profile found");

return;

}



const data = snap.data();



const xp = data.xp || 0;

const level =
Math.floor(xp / 250) + 1;



const nextXP =
level * 250;



studentXP.textContent = xp;



studentLevel.textContent =

`Level ${level} Builder`;



xpProgress.style.width =

`${(xp / nextXP) * 100}%`;





// STREAK


streakDays.textContent =

data.streak || 0;





// RANK


if(level >= 10){

studentRank.textContent =
"Elite Architect";

}

else if(level >=5){

studentRank.textContent =
"Innovator";

}

else if(level >=3){

studentRank.textContent =
"Builder";

}

else{

studentRank.textContent =
"Beginner";

}





loadBadges(

data.badges || []

);



}

catch(error){

console.error(

"Achievements error:",

error

);

}


}






// =====================================
// BADGES
// =====================================


function loadBadges(userBadges){


badgeContainer.innerHTML="";



Object.keys(badges).forEach(

(id)=>{


const badge = badges[id];


const unlocked =

userBadges.includes(id);



const card = document.createElement(
"div"
);



card.className =

unlocked

?

"badge-card"

:

"badge-card badge-locked";



card.innerHTML = `

<div class="badge-icon">

${

unlocked

?

badge.icon

:

"🔒"

}

</div>


<h4>

${badge.name}

</h4>

`;



badgeContainer.appendChild(card);



if(unlocked && !featuredBadgeName.textContent){

featuredBadgeName.textContent =
badge.name;

}


}

);


}