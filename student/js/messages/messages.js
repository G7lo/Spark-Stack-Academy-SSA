// =====================================
// SPARK STACK ACADEMY
// MESSAGES
// messages.js
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


console.log("💬 Messages Loaded");



// =====================================
// STATE
// =====================================

let currentUser = null;



// =====================================
// DOM
// =====================================

const conversationList =

document.getElementById(
"conversationList"
);


const emptyState =

document.getElementById(
"emptyState"
);



// =====================================
// AUTH
// =====================================

onAuthStateChanged(

auth,

(user)=>{


if(!user){

window.location.href =
"../login.html";

return;

}


currentUser = user;


loadChats();


}

);



// =====================================
// LOAD USER CHATS
// =====================================

function loadChats(){


const chatsRef =

collection(

db,

"chats"

);



const chatsQuery =

query(

chatsRef,

where(
"memberIds",
"array-contains",
currentUser.uid
),

orderBy(

"updatedAt",

"desc"

)

);



onSnapshot(

chatsQuery,

(snapshot)=>{


conversationList.innerHTML = "";



if(snapshot.empty){


emptyState.style.display =
"flex";


return;

}


emptyState.style.display =
"none";



snapshot.forEach(

(doc)=>{


renderConversation(

doc.id,

doc.data()

);


}

);



},

(error)=>{


console.error(

"Chats loading failed:",

error

);


}

);


}




// =====================================
// RENDER CHAT CARD
// =====================================

function renderConversation(

chatId,

chatData

){


const otherUser =

chatData.members?.find(

member =>

member.uid !== currentUser.uid

) || {};



const card =

document.createElement(
"div"
);



card.className =

"conversation-card";



card.innerHTML = `

<div class="conversation-avatar">

<img

src="${

otherUser.photo ||

'../assets/images/default-avatar.png'

}"

>


<span class="online-dot"></span>


</div>



<div class="conversation-info">

<h3>

${

otherUser.name ||

"Spark Stack User"

}

</h3>


<p>

${

chatData.lastMessage ||

"Start a conversation"

}

</p>


</div>



<div class="conversation-meta">


<span class="message-time">

${

formatTime(

chatData.updatedAt

)

}

</span>


</div>


`;



card.onclick = ()=>{


window.location.href =

`chat.html?chatId=${chatId}`;


};



conversationList.appendChild(card);


}





// =====================================
// FORMAT TIME
// =====================================

function formatTime(timestamp){


if(!timestamp){

return "";

}


const date =

timestamp.toDate();



return date.toLocaleDateString(

[],

{

month:"short",

day:"numeric"

}

);


}