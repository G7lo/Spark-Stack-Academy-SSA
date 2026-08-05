// =====================================
// SPARK STACK ACADEMY
// ASSIGNMENT DETAILS CONTROLLER
// =====================================

import {

    db,
    auth

} from "../../js/firebase.js";



import {

    doc,
    getDoc,
    setDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";





const params =
new URLSearchParams(
window.location.search
);



const assignmentId =
params.get("id");



let assignmentData = null;





onAuthStateChanged(

auth,

async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    await loadAssignment();

    await loadSubmission(user.uid);

}

);





// ==============================
// LOAD ASSIGNMENT
// ==============================

async function loadAssignment(){

    const ref = doc(

        db,

        "assignments",

        assignmentId

    );



    const snap =
    await getDoc(ref);



    if(!snap.exists()){

        alert("Assignment not found.");

        return;

    }



    assignmentData = snap.data();



    renderAssignment();

}
// ==============================
// RENDER PAGE
// ==============================

function renderAssignment(){

document.getElementById(
"assignmentTitle"
).textContent =
assignmentData.title;



document.getElementById(
"assignmentCourse"
).textContent =
assignmentData.courseName;



document.getElementById(
"assignmentInstructions"
).textContent =
assignmentData.instructions;





const resources =
document.getElementById(
"assignmentResources"
);

resources.innerHTML="";



(assignmentData.resources || []).forEach(item=>{

resources.innerHTML += `

<div class="resource-item">

📄 ${item.name}

</div>

`;

});

}
// ==============================
// LOAD SUBMISSION
// ==============================

async function loadSubmission(uid){

const ref =
doc(

db,

"submissions",

`${assignmentId}_${uid}`

);



const snap =
await getDoc(ref);



if(!snap.exists())
return;



const submission =
snap.data();



document.getElementById(
"submissionNotes"
).value =
submission.notes || "";



document.getElementById(
"gradeBox"
).innerHTML = `

<div class="grade-score">

${submission.grade ?? "--"}

</div>

<p class="feedback">

${submission.feedback || "Waiting for grading."}

</p>

`;

}