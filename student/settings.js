import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===========================
// ELEMENTS
// ===========================

const nameInput =
document.getElementById("fullName");

const emailInput =
document.getElementById("email");

const admissionInput =
document.getElementById("admissionNumber");

const bioInput =
document.getElementById("bio");


const saveBtn =
document.getElementById("saveProfileBtn");

const resetBtn =
document.getElementById("resetPasswordBtn");

const logoutBtn =
document.getElementById("logoutBtn");


const darkMode =
document.getElementById("darkMode");

// Stats

const coursesCount =
document.getElementById("coursesCount");

const lessonsCount =
document.getElementById("lessonsCount");

const certificateCount =
document.getElementById("certificateCount");

const progressCount =
document.getElementById("progressCount");



let currentUser = null;



// ===========================
// AUTH CHECK
// ===========================

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="../login.html";

        return;

    }


    currentUser = user;


    await loadStudent();


});



// ===========================
// LOAD STUDENT DATA
// ===========================

async function loadStudent(){


try{


const studentRef =
doc(
db,
"students",
currentUser.uid
);


const snapshot =
await getDoc(studentRef);



if(!snapshot.exists()){

console.log("Student document not found");

return;

}



const data =
snapshot.data();



nameInput.value =
data.name || "";

emailInput.value =
currentUser.email || "";

admissionInput.value =
data.admissionNumber || "Pending";

bioInput.value =
data.bio || "";



// Stats

const stats =
data.stats || {};

coursesCount.textContent =
stats.coursesEnrolled || 0;

lessonsCount.textContent =
stats.lessonsCompleted || 0;

certificateCount.textContent =
stats.certificates || 0;

progressCount.textContent =
`${stats.progress || 0}%`;



}

catch(error){

console.error(
"Loading student failed:",
error
);

}


}



// ===========================
// SAVE PROFILE
// ===========================

saveBtn.addEventListener(
"click",
async()=>{


try{


await updateDoc(

doc(
db,
"students",
currentUser.uid
),

{

name:
nameInput.value.trim(),

bio:
bioInput.value.trim()

}

);


alert(
"✅ Profile updated!"
);


}

catch(error){

console.error(error);

alert(
"❌ Update failed"
);

}


});



// ===========================
// PASSWORD RESET
// ===========================

resetBtn.addEventListener(
"click",
async()=>{


try{


await sendPasswordResetEmail(

auth,

currentUser.email

);


alert(
"📩 Password reset email sent"
);


}

catch(error){

console.error(error);

alert(error.message);

}


});



// ===========================
// LOGOUT
// ===========================

logoutBtn.addEventListener(
"click",
async()=>{


await signOut(auth);


window.location.href =
"../login.html";


});
// ===========================
// THEME SWITCH
// ===========================

if(darkMode){


darkMode.checked =
localStorage.getItem("theme") === "dark";



darkMode.addEventListener(
"change",
()=>{


if(darkMode.checked){


localStorage.setItem(
"theme",
"dark"
);


document.body.classList.add(
"dark"
);


}

else{


localStorage.setItem(
"theme",
"light"
);


document.body.classList.remove(
"dark"
);


}


});


}