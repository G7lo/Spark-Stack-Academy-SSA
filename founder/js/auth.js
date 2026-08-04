// ==========================================
// FOUNDER OS AUTH GUARD
// ==========================================

import { auth, db } from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



onAuthStateChanged(

auth,

async(user)=>{


if(!user){

window.location.href =
"../login.html";

return;

}



window.currentUser = user;



// Load founder profile

const userRef =
doc(
db,
"users",
user.uid
);



const userSnap =
await getDoc(userRef);



if(userSnap.exists()){


const founderData =
userSnap.data();



if(
founderData.role !== "founder" &&
founderData.role !== "admin"
){

window.location.href =
"../dashboard.html";

return;

}



window.currentFounder =
founderData;



document.dispatchEvent(
new Event("founderLoaded")
);


}
else{


window.location.href =
"../login.html";


}



console.log(
"✅ Founder authenticated"
);



}

);