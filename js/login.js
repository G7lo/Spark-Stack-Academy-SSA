import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const loginForm =
document.getElementById("loginForm");


const loginBtn =
document.getElementById("loginBtn");




loginForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const email =
document.getElementById("email")
.value.trim();



const password =
document.getElementById("password")
.value;



loginBtn.disabled = true;

loginBtn.textContent =
"Logging in...";



try{


const userCredential =
await signInWithEmailAndPassword(
auth,
email,
password
);



const uid =
userCredential.user.uid;




/* ===========================
   FOUNDER
=========================== */


const founderSnap =
await getDoc(
doc(db,"founders",uid)
);



if(founderSnap.exists()){

window.location.href =
"founder/dashboard.html";

return;

}




/* ===========================
   ADMIN
=========================== */


const adminSnap =
await getDoc(
doc(db,"admins",uid)
);



if(adminSnap.exists()){

window.location.href =
"admin/dashboard.html";

return;

}





/* ===========================
   INSTRUCTOR
=========================== */


const instructorSnap =
await getDoc(
doc(db,"instructors",uid)
);



if(instructorSnap.exists()){


const instructor =
instructorSnap.data();



if(
instructor.status === "Pending"
){

console.log(
"Waiting for instructor approval"
);

}



window.location.href =
"instructors/dashboard.html";


return;

}





/* ===========================
   STUDENT
=========================== */


const studentSnap =
await getDoc(
doc(db,"students",uid)
);



if(studentSnap.exists()){


window.location.href =
"student/dashboard.html";


return;

}





console.error(
"Profile not found"
);



}



catch(error){


console.error(
"LOGIN ERROR:",
error
);



}



finally{


loginBtn.disabled = false;

loginBtn.textContent =
"Login";


}



});