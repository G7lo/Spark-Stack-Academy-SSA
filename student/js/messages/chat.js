// =====================================
// SPARK STACK ACADEMY
// CHAT
// chat.js
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
getDoc,
collection,
query,
orderBy,
onSnapshot,
addDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
uploadFile
} from "./uploads.js";

console.log("💬 Chat Loaded");


// =====================================
// STATE
// =====================================

let currentUser = null;

let chatId = null;

let unsubscribe = null;



// =====================================
// DOM
// =====================================

const chatName =
document.getElementById("chatName");


const chatAvatar =
document.getElementById("chatAvatar");


const chatStatus =
document.getElementById("chatStatus");


const chatMessages =
document.getElementById("chatMessages");


const messageInput =
document.getElementById("messageInput");


const sendButton =
document.getElementById("sendBtn");



// =====================================
// GET CHAT ID
// =====================================

const params =
new URLSearchParams(
window.location.search
);


chatId =
params.get("chatId");


if(!chatId){

console.error(
"No chat ID provided"
);

window.location.href =
"messages.html";

}



// =====================================
// AUTH
// =====================================

onAuthStateChanged(

auth,

async(user)=>{


if(!user){

window.location.href =
"../login.html";

return;

}


currentUser = user;


await loadChat();


loadMessages();


}

);



// =====================================
// LOAD CHAT INFO
// =====================================

async function loadChat(){


try{


const chatRef =
doc(

db,

"chats",

chatId

);



const snap =
await getDoc(chatRef);



if(!snap.exists()){

alert(
"This chat no longer exists"
);

window.location.href =
"messages.html";

return;

}



const chatData =
snap.data();



const otherUser =

chatData.members?.find(

member =>
member.uid !== currentUser.uid

) || {};



if(chatName){

chatName.textContent =

otherUser.name ||

"Spark Stack User";

}



if(chatAvatar){

chatAvatar.src =

otherUser.photo ||

"../assets/images/default-avatar.png";

}



if(chatStatus){

chatStatus.textContent =

otherUser.online

?

"Online"

:

"Offline";

}



}


catch(error){

console.error(
"Loading chat failed:",
error
);

}


}



// =====================================
// LOAD MESSAGES
// =====================================

function loadMessages(){


if(unsubscribe){

unsubscribe();

}



const messagesRef =

collection(

db,

"chats",

chatId,

"messages"

);



const messagesQuery =

query(

messagesRef,

orderBy(

"timestamp",

"asc"

)

);



unsubscribe =

onSnapshot(

messagesQuery,

(snapshot)=>{


if(!chatMessages)
return;



chatMessages.innerHTML = "";



snapshot.forEach(

(doc)=>{


renderMessage(
doc.data()
);


}

);



chatMessages.scrollTop =

chatMessages.scrollHeight;



},


(error)=>{


console.error(

"Message listener error:",

error

);


}

);


}



// =====================================
// RENDER MESSAGE
// =====================================

function renderMessage(message){


const div = document.createElement(
"div"
);


const isMine =

message.senderId === currentUser.uid;



div.className =

isMine

?

"message sent"

:

"message received";



let content = "";



// TEXT MESSAGE

if(message.text){

content += `

<div class="message-text">

${message.text}

</div>

`;

}



// IMAGE MESSAGE

if(

message.fileUrl &&

message.fileType?.startsWith("image")

){

content += `

<img

src="${message.fileUrl}"

class="chat-image"

alt="image"

/>

`;

}



// FILE MESSAGE

if(

message.fileUrl &&

!message.fileType?.startsWith("image")

){

content += `

<a

href="${message.fileUrl}"

target="_blank"

class="chat-file">

📎 ${message.fileName}

</a>

`;

}



div.innerHTML = `

${content}


<div class="message-time">

${formatTime(message.timestamp)}

</div>

`;



chatMessages.appendChild(div);


}


// =====================================
// FORMAT TIME
// =====================================

function formatTime(timestamp){


if(!timestamp){

return "";

}



const date =

timestamp.toDate

?

timestamp.toDate()

:

new Date(timestamp);



return date.toLocaleTimeString(

[],

{

hour:"2-digit",

minute:"2-digit"

}

);


}



// =====================================
// SEND MESSAGE
// =====================================

sendButton?.addEventListener(

"click",

async()=>{


await sendMessage();


await uploadFile();


}

);



messageInput?.addEventListener(

"keydown",

(event)=>{


if(event.key === "Enter"){

event.preventDefault();

sendMessage();

}


}

);




async function sendMessage(){


const text =

messageInput.value.trim();




if(!currentUser || !chatId){

return;

}




try{


await addDoc(

collection(

db,

"chats",

chatId,

"messages"

),

{

senderId:

currentUser.uid,


text,


timestamp:

serverTimestamp(),


seen:false


}

);



messageInput.value = "";



}


catch(error){


console.error(

"Send message failed:",

error

);


}


}