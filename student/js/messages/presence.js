// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING ENGINE V1
// presence.js
// ONLINE STATUS SYSTEM
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
setDoc,
updateDoc,
serverTimestamp,
onSnapshot

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"🟢 Presence Engine Loaded"
);




// =====================================
// STATE
// =====================================


let currentUser = null;

let heartbeat = null;




// =====================================
// AUTH
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(!user)

return;



currentUser=user;


setOnline();


startHeartbeat();



});





// =====================================
// SET USER ONLINE
// =====================================


async function setOnline(){


const userStatusRef =

doc(

db,

"users",

currentUser.uid

);



await updateDoc(

userStatusRef,

{


online:true,


lastSeen:

serverTimestamp()


}

);



}




// =====================================
// HEARTBEAT
// =====================================


function startHeartbeat(){



heartbeat = setInterval(()=>{


setOnline();



},30000);



}





// =====================================
// SET OFFLINE
// =====================================


window.addEventListener(

"beforeunload",

()=>{


if(!currentUser)

return;



const userStatusRef =

doc(

db,

"users",

currentUser.uid

);



updateDoc(

userStatusRef,

{


online:false,


lastSeen:

serverTimestamp()


}

);


}

);





// =====================================
// WATCH USER STATUS
// =====================================


export function watchPresence(uid, callback){



const userRef =

doc(

db,

"users",

uid

);



return onSnapshot(

userRef,

(snapshot)=>{


if(snapshot.exists()){


callback(

snapshot.data()

);


}



});


}