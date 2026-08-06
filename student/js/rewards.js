// =====================================
// SPARK STACK ACADEMY
// REWARD ENGINE
// rewards.js
// =====================================


import {

db

} from "../../../js/firebase.js";


import {

doc,
getDoc,
updateDoc,
arrayUnion,
increment,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {

showAchievement

} from "./achievement-popup.js";


import {
showLevelUp
}
from "./level-popup.js";


console.log("🎁 Reward Engine Loaded");





export async function giveReward(

userId,

amount,

reason

){


try{


const userRef = doc(

db,

"users",

userId

);



const snap = await getDoc(userRef);



if(!snap.exists()){

console.log("User not found");

return;

}



const data = snap.data();


// ===============================
// LEVEL CHECK
// ===============================

const oldLevel =
Math.floor((data.xp || 0) / 250) + 1;


const newLevel =
Math.floor(((data.xp || 0) + amount) / 250) + 1;



let updates = {

xp: increment(amount),

lastReward:{

reason:reason,

amount:amount,

time:serverTimestamp()

}

};

let unlockedBadge = null;

// ===============================
// BADGE CHECKS
// ===============================


if(

reason === "course_complete" &&

!(data.badges || []).includes("first_course")

){


updates.badges = arrayUnion(
"first_course"
);


unlockedBadge = {

name:"First Steps",

icon:"🌱"

};


}





if(

reason === "project_submit" &&

!(data.badges || []).includes("coder")

){


updates.badges = arrayUnion(
"coder"
);


unlockedBadge = {

name:"Code Builder",

icon:"💻"

};


}





if(

(data.streak || 0) >= 7 &&

!(data.badges || []).includes("streak")

){


updates.badges = arrayUnion(
"streak"
);


unlockedBadge = {

name:"Consistency Flame",

icon:"🔥"

};


}





await updateDoc(

userRef,

updates

);


if(newLevel > oldLevel){


let rank =
"Builder";


if(newLevel >=10){

rank="Elite Architect";

}
else if(newLevel >=5){

rank="Innovator";

}


showLevelUp(

newLevel,

rank

);


}


// ===============================
// SHOW CELEBRATION
// ===============================


if(unlockedBadge){


showAchievement(

unlockedBadge.name,

unlockedBadge.icon,

amount

);


}





console.log(

`🎉 +${amount} XP awarded`

);


}



catch(error){


console.error(

"Reward failed:",

error

);


}


}