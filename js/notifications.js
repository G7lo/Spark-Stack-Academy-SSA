// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING ENGINE V1
// notifications.js
// MESSAGE NOTIFICATIONS
// =====================================


import {

auth,
db

} from "../../../js/firebase.js";


import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

collection,
query,
where,
onSnapshot,
orderBy

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"🔔 Notification Engine Loaded"
);



// =====================================
// STATE
// =====================================


let currentUser = null;

let notificationSound = null;




// =====================================
// AUTH
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(!user)

return;



currentUser=user;


startNotificationListener();


});





// =====================================
// SOUND
// =====================================


function playSound(){


if(!notificationSound){


notificationSound = new Audio(

"../assets/sounds/message.mp3"

);


}



notificationSound.play()

.catch(()=>{});


}




// =====================================
// LISTEN FOR NEW MESSAGES
// =====================================


function startNotificationListener(){



const chatsRef =

collection(

db,

"chats"

);



const q =

query(

chatsRef,

where(

"participants",

"array-contains",

currentUser.uid

)

);





onSnapshot(

q,

(snapshot)=>{


snapshot.docChanges()

.forEach(

(change)=>{



if(

change.type === "modified"

){


const chat = change.doc.data();



if(

chat.lastSender !== currentUser.uid

){



showNotification(

chat

);



}


}



});



}


);


}





// =====================================
// SHOW NOTIFICATION
// =====================================


function showNotification(chat){



playSound();



if(

Notification.permission === "granted"

){



new Notification(

"Spark Stack Messages",

{

body:

chat.lastMessage || "New message received",

icon:

"../assets/images/ssa-logo.png"

}

);



}

else{


Notification.requestPermission();


}



}


// =====================================
// REQUEST PERMISSION
// =====================================


window.addEventListener(

"load",

()=>{


if(

"Notification" in window

){


Notification.requestPermission();


}


});