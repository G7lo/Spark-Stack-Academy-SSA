// =====================================
// SPARK STACK ACADEMY
// TYPING ENGINE V1
// =====================================


import {

db

} from "../../js/firebase.js";



import {

collection,
doc,
onSnapshot,
setDoc,
deleteDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"✍️ Typing Module Loaded"
);





// =====================================
// STATE
// =====================================


let currentUser = null;

let activeChatId = null;

let typingTimeout = null;

let isTyping = false;

let unsubscribeTyping = null;





// =====================================
// DOM
// =====================================


const messageInput =

document.getElementById(
"messageInput"
);


const typingIndicator =

document.getElementById(
"typingIndicator"
);






// =====================================
// INITIALIZE
// =====================================


export function initTyping(){



console.log(

"Typing system ready"

);



messageInput?.addEventListener(

"input",

()=>{


if(!activeChatId)

return;



startTyping();



clearTimeout(

typingTimeout

);



typingTimeout =

setTimeout(()=>{


stopTyping();



},2000);



}

);


}






// =====================================
// SET USER
// =====================================


export function setTypingUser(user){


currentUser = user;


}






// =====================================
// SET ACTIVE CHAT
// =====================================


export function setTypingChat(chatId){


activeChatId = chatId;


listenTyping();


}


// =====================================
// START TYPING
// =====================================


async function startTyping(){


if(

isTyping ||

!currentUser ||

!activeChatId

)

return;



isTyping = true;



await setDoc(

doc(

db,

"chats",

activeChatId,

"typing",

currentUser.uid

),

{


name:

currentUser.displayName ||

"Student",


typing:true,


updatedAt:

serverTimestamp()



}

);


}






// =====================================
// STOP TYPING
// =====================================


async function stopTyping(){



if(

!isTyping ||

!currentUser ||

!activeChatId

)

return;




isTyping = false;



await deleteDoc(

doc(

db,

"chats",

activeChatId,

"typing",

currentUser.uid

)

);



}







// =====================================
// LISTEN FOR OTHER USER
// =====================================


function listenTyping(){



if(unsubscribeTyping){

unsubscribeTyping();

}



if(!activeChatId)

return;





const typingRef =

collection(

db,

"chats",

activeChatId,

"typing"

);





unsubscribeTyping =

onSnapshot(

typingRef,

(snapshot)=>{


let someoneTyping = false;





snapshot.forEach(

(docSnap)=>{


if(

docSnap.id !== currentUser.uid

){


someoneTyping = true;


}



});






if(typingIndicator){



typingIndicator.style.display =

someoneTyping

?

"flex"

:

"none";



}



}

);



}