// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING CONTROLLER V1
// MAIN ENGINE
// =====================================


import {

auth

} from "../../js/firebase.js";



import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import {

loadConversations,
setCurrentUser

} from "./chat.js";



import {

initPresence,

setPresenceUser

} from "./presence.js";



import {
initTyping,
setTypingUser
} from "./typing.js";

import {

initUploads

} from "./uploads.js";

console.log(
"💬 Messages System Started"
);




// =====================================
// GLOBAL STATE
// =====================================


let currentUser = null;





// =====================================
// AUTH LISTENER
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(!user){


console.log(

"User not logged in"

);


return;


}



currentUser = user;



console.log(

"Active User:",

user.uid

);



// Share user with modules

setCurrentUser(

user

);

setTypingUser(user);

setPresenceUser(user);

// Start systems

loadConversations();


initPresence();


initTyping();

initUploads();

}

);