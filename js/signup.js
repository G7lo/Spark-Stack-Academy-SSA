import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const signupForm =
document.getElementById("signupForm");


const role =
document.getElementById("role");


const instructorFields =
document.getElementById("instructorFields");



/* ===========================
   ROLE SWITCH
=========================== */


role.addEventListener("change",()=>{


    const instructor =
    role.value === "instructor";


    instructorFields.style.display =
    instructor ? "block" : "none";


    document.getElementById("bio").required =
    instructor;


    document.getElementById("expertise").required =
    instructor;


});




/* ===========================
   SIGNUP
=========================== */


signupForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const name =
document.getElementById("name")
.value.trim();



const email =
document.getElementById("email")
.value.trim();



const password =
document.getElementById("password")
.value;



const selectedRole =
role.value;



const bio =
document.getElementById("bio")
?.value.trim() || "";



const expertise =
document.getElementById("expertise")
?.value.trim() || "";




try{


const userCredential =
await createUserWithEmailAndPassword(
auth,
email,
password
);



const uid =
userCredential.user.uid;





/* ===========================
   STUDENT PROFILE
=========================== */


if(selectedRole==="student"){


await setDoc(

doc(
db,
"students",
uid
),

{

name,

email,

role:"student",

status:"Active",

admissionNumber:"Pending",

coursesEnrolled:0,

progress:0,

certificates:0,

createdAt:
serverTimestamp()

}

);


}






/* ===========================
   INSTRUCTOR PROFILE
=========================== */


if(selectedRole==="instructor"){


await setDoc(

doc(
db,
"instructors",
uid
),

{

name,

email,

role:"instructor",

status:"Pending",

verified:false,

bio,

expertise,

totalStudents:0,

totalCourses:0,

rating:0,

createdAt:
serverTimestamp()

}

);


}






console.log(
"Account created successfully"
);



window.location.href =
"login.html";




}


catch(error){


console.error(
"SIGNUP ERROR:",
error
);



console.log(
error.message
);


}



});