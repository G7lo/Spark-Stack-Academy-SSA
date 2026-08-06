// =====================================
// SPARK STACK ACADEMY
// NEW CHAT
// new-chat.js
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
getDocs,
addDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("👥 New Chat Loaded");



// =====================================
// STATE
// =====================================

let currentUser = null;

let users = [];



// =====================================
// DOM
// =====================================

const searchInput =

document.getElementById(
"searchUsers"
);


const userList =

document.getElementById(
"userList"
);


const noUsers =

document.getElementById(
"noUsers"
);


const backBtn =

document.getElementById(
"backBtn"
);



// =====================================
// BACK BUTTON
// =====================================

backBtn?.addEventListener(

"click",

()=>{


window.location.href =
"messages.html";


}

);



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


await loadUsers();


}

);



// =====================================
// LOAD USERS
// =====================================

async function loadUsers(){


try{


const usersRef =

collection(

db,

"users"

);



const snapshot =

await getDocs(usersRef);



users = [];



snapshot.forEach(

(doc)=>{


const data = doc.data();



if(doc.id !== currentUser.uid){


users.push({

id:doc.id,

...data

});


}


}

);



renderUsers(users);


}


catch(error){


console.error(

"Loading users failed:",

error

);


}


}



// =====================================
// SEARCH USERS
// =====================================

searchInput?.addEventListener(

"input",

()=>{


const value =

searchInput.value

.toLowerCase()

.trim();



const filtered =

users.filter(

(user)=>{


const name =

user.name

?.toLowerCase()

|| "";



const email =

user.email

?.toLowerCase()

|| "";



return (

name.includes(value)

||

email.includes(value)

);


}

);



renderUsers(filtered);


}

);



// =====================================
// RENDER USERS
// =====================================

function renderUsers(list){


userList.innerHTML = "";



if(list.length === 0){


noUsers.style.display =
"flex";


return;


}



noUsers.style.display =
"none";



list.forEach(

(user)=>{


const card =

document.createElement(
"div"
);



card.className =
"user-card";



card.innerHTML = `

<img

src="${

user.photo ||

"../assets/images/default-avatar.png"

}"

>



<div class="user-info">

<h3>

${user.name || "Unknown User"}

</h3>


<p>

${user.email || ""}

</p>


</div>


<span class="user-role">

${user.role || "Student"}

</span>

`;



card.addEventListener(

"click",

async()=>{


card.classList.add(
"loading"
);



await createChat(user);



}

);



userList.appendChild(card);


}

);


}




// =====================================
// CREATE OR OPEN CHAT
// =====================================

async function createChat(user){


try{


// CHECK EXISTING CHATS

const chatsRef = collection(

db,

"chats"

);



const snapshot = await getDocs(

chatsRef

);



let existingChat = null;



snapshot.forEach(

(doc)=>{


const data = doc.data();



const members =

data.members || [];



const hasCurrentUser =

members.some(

member =>

member.uid === currentUser.uid

);



const hasSelectedUser =

members.some(

member =>

member.uid === user.id

);



if(

hasCurrentUser &&

hasSelectedUser

){

existingChat = doc.id;

}



}

);




// OPEN EXISTING CHAT

if(existingChat){


window.location.href =

`chat.html?chatId=${existingChat}`;


return;

}





// CREATE NEW CHAT


const chatRef =

await addDoc(

collection(

db,

"chats"

),

{

members:[

{

uid:currentUser.uid,

name:

currentUser.displayName ||

"Spark Stack User",

photo:

currentUser.photoURL || ""

},

{

uid:user.id,

name:

user.name ||

"Unknown User",

photo:

user.photo ||

""

}

],


memberIds:[

currentUser.uid,

user.id

],


lastMessage:"",


createdAt:

serverTimestamp(),


updatedAt:

serverTimestamp()


}

);



window.location.href =

`chat.html?chatId=${chatRef.id}`;



}


catch(error){


console.error(

"Chat creation failed:",

error

);


}


}