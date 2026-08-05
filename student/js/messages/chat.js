// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING ENGINE V1
// chat.js
// CHAT WINDOW ENGINE
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
orderBy,
onSnapshot,
addDoc,
doc,
updateDoc,
serverTimestamp,
getDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

watchPresence

} from "./presence.js";

console.log(
"💬 Chat Engine Loaded"
);



// =====================================
// STATE
// =====================================


let currentUser = null;

let activeChatId = null;

let unsubscribeMessages = null;



// =====================================
// DOM
// =====================================


const chatMessages =

document.getElementById(
"chatMessages"
);



const messageInput =

document.getElementById(
"messageInput"
);



const sendButton =

document.getElementById(
"sendMessageBtn"
);



const chatName =

document.getElementById(
"chatName"
);



const chatAvatar =

document.getElementById(
"chatAvatar"
);




// =====================================
// AUTH CHECK
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(!user)

return;



currentUser = user;



});




// =====================================
// RECEIVE CHAT EVENT
// =====================================


window.addEventListener(

"openChat",

(e)=>{


const chat = e.detail;



activeChatId = chat.id;



updateHeader(chat);

watchPresence(

chat.uid,

(status)=>{


const chatStatus =

document.getElementById(
"chatStatus"
);



if(status.online){

chatStatus.textContent="Online";

}

else{

chatStatus.textContent="Offline";

}


});

loadMessages();



}

);




// =====================================
// UPDATE HEADER
// =====================================


function updateHeader(chat){


chatName.textContent =

chat.name ||

"Spark Stack User";



chatAvatar.src =

chat.avatar ||

"../assets/images/ssa-logo.png";


}




// =====================================
// LOAD MESSAGES REALTIME
// =====================================


function loadMessages(){



if(!activeChatId)

return;



if(unsubscribeMessages){

unsubscribeMessages();

}




const messagesRef =

collection(

db,

"chats",

activeChatId,

"messages"

);



const messagesQuery =

query(

messagesRef,

orderBy(

"createdAt",

"asc"

)

);



unsubscribeMessages =

onSnapshot(

messagesQuery,

(snapshot)=>{


chatMessages.innerHTML="";



snapshot.forEach(

(docSnap)=>{


const message = {


id:docSnap.id,

...docSnap.data()

};



renderMessage(message);

if(
message.senderId !== currentUser.uid &&
!message.read
){

updateDoc(

doc(
db,
"chats",
activeChatId,
"messages",
message.id
),

{

read:true,

status:"read"

}

);

}

});



scrollBottom();



}

);


}




// =====================================
// RENDER MESSAGE
// =====================================


function renderMessage(message){



const div =

document.createElement(

"div"

);



div.className="message";



if(

message.senderId === currentUser.uid

){


div.classList.add(
"sent"
);


}

else{


div.classList.add(
"received"
);


}




div.innerHTML = `


<div>

${

message.text ||

""

}

</div>


<span class="message-time">

${formatTime(message.createdAt)}

${

message.senderId === currentUser.uid

?

message.status === "read"

?

" 🔵✓✓"

:

" ✓✓"

:""

}

</span>


`;



chatMessages.appendChild(div);


}




// =====================================
// SEND MESSAGE
// =====================================


sendButton?.addEventListener(

"click",

sendMessage

);



messageInput?.addEventListener(

"keydown",

(e)=>{


if(

e.key==="Enter"

&&

!e.shiftKey

){


e.preventDefault();

sendMessage();

}


});






async function sendMessage(){



const text =

messageInput.value.trim();



if(!text || !activeChatId)

return;



await addDoc(

collection(

db,

"chats",

activeChatId,

"messages"

),



{
    senderId: currentUser.uid,

    text:text,

    createdAt:serverTimestamp(),

    status:"sent",

    read:false
}


);





await updateDoc(

doc(

db,

"chats",

activeChatId

),

{


lastMessage:text,


updatedAt:

serverTimestamp()


}

);



messageInput.value="";


}




// =====================================
// SCROLL
// =====================================


function scrollBottom(){


chatMessages.scrollTop =

chatMessages.scrollHeight;


}





// =====================================
// TIME FORMAT
// =====================================


function formatTime(timestamp){


if(!timestamp)

return "";



return timestamp
.toDate()
.toLocaleTimeString([],{

hour:"2-digit",

minute:"2-digit"

});


}