import { db } from "../firebase.js";

import {
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// GET STUDENT ID

const params =
new URLSearchParams(window.location.search);


const studentId =
params.get("id");



// ELEMENTS

const studentName =
document.getElementById("studentName");

const studentEmail =
document.getElementById("studentEmail");

const studentAdmission =
document.getElementById("studentAdmission");

const courseCount =
document.getElementById("courseCount");

const averageProgress =
document.getElementById("averageProgress");

const studentStatus =
document.getElementById("studentStatus");

const coursesList =
document.getElementById("coursesList");



// LOAD PROFILE

async function loadStudent(){


if(!studentId){

console.log("No student selected");

return;

}



try{


const studentRef =
doc(db,"students",studentId);


const snapshot =
await getDoc(studentRef);



if(!snapshot.exists()){

console.log("Student not found");

return;

}



const student =
snapshot.data();



studentName.textContent =
student.name || "Unknown Student";


studentEmail.textContent =
student.email || "";


studentAdmission.textContent =
"Admission: " +
(student.admissionNumber || "Pending");



studentStatus.textContent =
student.status || "Active";



const courses =
student.courses || [];



courseCount.textContent =
courses.length;



let totalProgress = 0;



coursesList.innerHTML = "";



courses.forEach(course=>{


totalProgress +=
course.progress || 0;



coursesList.innerHTML += `

<div class="course-box">


<h3>
${course.title}
</h3>


<p>
Progress: ${course.progress || 0}%
</p>



<div class="progress-bar">

<div 
class="progress-fill"
style="width:${course.progress || 0}%">

</div>

</div>


</div>

`;


});



const average =
courses.length
?
Math.round(totalProgress / courses.length)
:
0;



averageProgress.textContent =
average + "%";



}


catch(error){

console.log(
"Profile loading error:",
error
);

}


}



loadStudent();