// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING ENGINE V1
// typing.js
// TYPING INDICATOR SYSTEM
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
deleteDoc,
collection,
onSnapshot,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"⌨️ Typing Engine Loaded"
);




// =====================================
// STATE
// =====================================


let currentUser = null;

let activeChatId = null;

let typingTimer = null;

let typing = false;



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
// AUTH
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(user){

currentUser=user;

}


});





// =====================================
// RECEIVE ACTIVE CHAT
// =====================================


window.addEventListener(

"openChat",

(e)=>{


activeChatId =

e.detail.id;



listenTyping();



});





// =====================================
// INPUT LISTENER
// =====================================


messageInput?.addEventListener(

"input",

()=>{


if(!activeChatId)

return;



startTyping();



clearTimeout(typingTimer);



typingTimer = setTimeout(()=>{


stopTyping();


},2500);



});






// =====================================
// START TYPING
// =====================================


async function startTyping(){



if(typing)

return;



typing=true;



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



if(!typing)

return;



typing=false;



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
// LISTEN TYPING
// =====================================


function listenTyping(){



const typingRef =

collection(

db,

"chats",

activeChatId,

"typing"

);



onSnapshot(

typingRef,

(snapshot)=>{


let someoneTyping=false;



snapshot.forEach(

(docSnap)=>{


if(

docSnap.id !== currentUser.uid

){


someoneTyping=true;


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



});


}