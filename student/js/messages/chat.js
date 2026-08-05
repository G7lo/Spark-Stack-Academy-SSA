// =====================================
// SPARK STACK ACADEMY
// CHAT ENGINE V1
// =====================================


import {

db

} from "../../js/firebase.js";



import {

collection,
doc,
onSnapshot,
query,
orderBy,
addDoc,
updateDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {

setTypingChat

} from "./typing.js";


import {

listenUserPresence

} from "./presence.js";


import {

getSelectedFile,
getFileData

} from "./uploads.js";


console.log(
"💬 Chat Module Loaded"
);




// =====================================
// STATE
// =====================================


let currentUser = null;

let activeChatId = null;

let unsubscribeMessages = null;

let conversations = [];





// =====================================
// DOM
// =====================================


const conversationList =

document.getElementById(
"conversationList"
);



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







// =====================================
// SET USER
// =====================================


export function setCurrentUser(user){


currentUser = user;


}







// =====================================
// LOAD CONVERSATIONS
// =====================================


export function loadConversations(){



if(!currentUser)

return;



const chatsRef =

collection(

db,

"chats"

);




const q =

query(

chatsRef,

orderBy(

"updatedAt",

"desc"

)

);





onSnapshot(

q,

(snapshot)=>{


if(!conversationList)

return;



conversationList.innerHTML = "";



conversations = [];



snapshot.forEach(

(docSnap)=>{


const chat = {


id:

docSnap.id,


...docSnap.data()


};




if(

chat.participants?.includes(

currentUser.uid

)

){


conversations.push(chat);



renderConversation(

chat

);



}



});


}

);


}

// =====================================
// RENDER CONVERSATION
// =====================================


function renderConversation(chat){


const div = document.createElement(
"div"
);



div.className =
"conversation-card";



if(chat.id === activeChatId){

div.classList.add(
"active"
);

}




const user =
getOtherParticipant(chat);





div.innerHTML = `

<div class="conversation-avatar">

<img

src="${
user.photo ||
"../assets/images/default-avatar.png"
}"

>

</div>



<div class="conversation-info">

<h4>

${

user.name ||

"Spark Stack User"

}

</h4>


<p>

${

chat.lastMessage ||

"No messages yet"

}

</p>


</div>


${
chat.unread

?

`

<div class="unread-count">

${chat.unread}

</div>

`

:

""

}

`;





div.onclick = ()=>{


openChat(

chat.id,

chat

);


};





conversationList.appendChild(
div
);



}








// =====================================
// GET OTHER USER
// =====================================


function getOtherParticipant(chat){



let user = {

name:
"Unknown",

photo:
""

};





if(chat.members){



const found =

chat.members.find(

member =>

member.uid !== currentUser.uid

);



if(found){

user = found;

}


}



return user;


}







// =====================================
// OPEN CHAT
// =====================================


function openChat(chatId, chat){



activeChatId = chatId;


setTypingChat(chatId);



updateChatHeader(
chat
);

const user = getOtherParticipant(chat);

listenUserPresence(
user.uid
);

if(unsubscribeMessages){

unsubscribeMessages();

}







const messagesRef =

collection(

db,

"chats",

chatId,

"messages"

);





const q =

query(

messagesRef,

orderBy(

"timestamp",

"asc"

)

);





unsubscribeMessages =

onSnapshot(

q,

(snapshot)=>{


chatMessages.innerHTML = "";




snapshot.forEach(

(messageDoc)=>{


const message = {


id:

messageDoc.id,


...messageDoc.data()


};



renderMessage(
message
);


});




scrollToBottom();



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



div.className = "message";





if(message.senderId === currentUser.uid){

div.classList.add(
"sent"
);


}

else{


div.classList.add(
"received"
);


}






let attachmentHTML = "";





if(message.attachment){



if(

message.attachment.category === "image"

){


attachmentHTML = `


<img

src="${message.attachment.url || ''}"

class="chat-image"

alt="image"

>


`;



}



else{


attachmentHTML = `


<div class="file-card">


📎

${message.attachment.name}


</div>


`;



}



}







div.innerHTML = `


<div class="message-content">


${message.text || ""}


${attachmentHTML}


</div>



<span class="message-time">


${formatTime(message.timestamp)}


</span>


`;





chatMessages.appendChild(div);



}


// =====================================
// SCROLL
// =====================================


function scrollToBottom(){


chatMessages.scrollTop =

chatMessages.scrollHeight;


}






// =====================================
// FORMAT TIME
// =====================================


function formatTime(timestamp){


if(!timestamp)

return "Sending...";



return timestamp
.toDate()
.toLocaleTimeString(

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

sendMessage

);






messageInput?.addEventListener(

"keydown",

(e)=>{


if(

e.key === "Enter"

&&

!e.shiftKey

){


e.preventDefault();


sendMessage();


}


}

);







async function sendMessage(){



async function sendMessage(){


const text =

messageInput.value.trim();



const file =

getSelectedFile();



if(!text && !file)

return;



if(!activeChatId)

return;





if(!text)

return;




if(!activeChatId){


console.log(

"No active conversation"

);


return;


}







try{



const messagesRef =

collection(

db,

"chats",

activeChatId,

"messages"

);






// Add message

const messageData = {


senderId:

currentUser.uid,


text:text || "",


timestamp:

serverTimestamp(),


read:false



};





if(file){



messageData.attachment =

getFileData(file);



}





await addDoc(

messagesRef,

messageData

);







// Update conversation preview

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






// Clear input

messageInput.value = "";





}



catch(error){



console.error(

"Send message failed:",

error

);



}



}