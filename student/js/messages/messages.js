// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING ENGINE V1
// messages.js
// MAIN CONTROLLER
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
onSnapshot

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"💬 Messages Controller Loaded"
);



// =====================================
// STATE
// =====================================


let currentUser = null;

let conversations = [];

let activeChat = null;




// =====================================
// DOM
// =====================================


const conversationList =

document.getElementById(
"conversationList"
);



const emptyChat =

document.querySelector(
".empty-chat"
);




// =====================================
// AUTH
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(!user){

console.log(
"No logged in user"
);

return;

}



currentUser = user;


console.log(

"Messaging user:",

user.uid

);



loadConversations();



});





// =====================================
// LOAD USER CHATS
// =====================================


function loadConversations(){


const chatsRef =

collection(

db,

"chats"

);



const chatsQuery =

query(

chatsRef,

orderBy(

"updatedAt",

"desc"

)

);



onSnapshot(

chatsQuery,

(snapshot)=>{


conversationList.innerHTML = "";


conversations = [];



snapshot.forEach(

(doc)=>{


const chat = {


id:doc.id,

...doc.data()

};



if(

chat.participants?.includes(

currentUser.uid

)

){


conversations.push(chat);


renderConversation(chat);


}



});



console.log(

"Chats loaded:",

conversations.length

);



}

);


}




// =====================================
// RENDER CHAT CARD
// =====================================


function renderConversation(chat){



const div =

document.createElement(

"div"

);



div.className =

"conversation-card";



div.innerHTML = `


<div class="conversation-avatar">

<img src="${
chat.avatar ||
"../assets/images/ssa-logo.png"

}">

</div>



<div class="conversation-info">

<h4>

${

chat.name ||

"Spark Stack User"

}

</h4>


<p>

${

chat.lastMessage ||

"Start conversation"

}

</p>


</div>


`;




div.onclick = ()=>{


openConversation(chat);



};



conversationList.appendChild(div);



}




// =====================================
// OPEN CHAT
// =====================================


function openConversation(chat){


activeChat = chat;



if(emptyChat){

emptyChat.style.display="none";

}



window.dispatchEvent(

new CustomEvent(

"openChat",

{

detail:chat

}

)

);



}