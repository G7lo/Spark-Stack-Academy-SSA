// =====================================
// SPARK STACK ACADEMY
// ONLINE PRESENCE ENGINE V1
// =====================================


import {

db

} from "../../js/firebase.js";



import {

doc,
setDoc,
serverTimestamp,
onSnapshot

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"🟢 Presence Module Loaded"
);





// =====================================
// STATE
// =====================================


let currentUser = null;





// =====================================
// INITIALIZE
// =====================================


export function initPresence(){


console.log(

"Presence system ready"

);



startPresence();


}







// =====================================
// SET USER
// =====================================


export function setPresenceUser(user){


currentUser = user;


}







// =====================================
// START PRESENCE
// =====================================


function startPresence(){


if(!currentUser)

return;



const userRef =

doc(

db,

"users",

currentUser.uid

);





// Online

setDoc(

userRef,

{


online:true,


lastSeen:

serverTimestamp()



},

{

merge:true

}

);





// Offline

window.addEventListener(

"beforeunload",

()=>{


setDoc(

userRef,

{


online:false,


lastSeen:

serverTimestamp()



},

{

merge:true

}

);



}

);



}


// =====================================
// LISTEN USER PRESENCE
// =====================================


export function listenUserPresence(uid){



const userRef =

doc(

db,

"users",

uid

);





return onSnapshot(

userRef,

(snapshot)=>{


if(!snapshot.exists())

return;



const data =

snapshot.data();





updatePresenceUI(

data

);



}

);



}







// =====================================
// UPDATE HEADER UI
// =====================================


function updatePresenceUI(data){



const statusText =

document.getElementById(

"chatStatus"

);



const indicator =

document.getElementById(

"onlineIndicator"

);





if(!statusText || !indicator)

return;







if(data.online){



statusText.textContent =

"Online";



indicator.style.background =

"#22c55e";



}

else{



statusText.textContent =

getLastSeen(

data.lastSeen

);



indicator.style.background =

"#94a3b8";



}



}







// =====================================
// LAST SEEN FORMAT
// =====================================


function getLastSeen(timestamp){



if(!timestamp)

return "Offline";



const date =

timestamp.toDate();



const diff =

Date.now()

-

date.getTime();





const minutes =

Math.floor(

diff / 60000

);





if(minutes < 1)

return "Last seen just now";





if(minutes < 60)

return `Last seen ${minutes}m ago`;





const hours =

Math.floor(

minutes / 60

);





return `Last seen ${hours}h ago`;



}