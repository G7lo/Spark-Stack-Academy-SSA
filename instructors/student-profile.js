import { db } from "../js/firebase.js";

import {
doc,
getDoc,
collection,
query,
where,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const params =
new URLSearchParams(window.location.search);


const studentId =
params.get("id");



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



async function loadStudent(){


if(!studentId){

console.log("Missing student id");
return;

}


try{


const studentSnap =
await getDoc(
doc(db,"students",studentId)
);



if(!studentSnap.exists()){

console.log("Student missing");
return;

}



const student =
studentSnap.data();



studentName.textContent =
student.name || "Student";


studentEmail.textContent =
student.email || "";


studentAdmission.textContent =
"Admission: " +
(student.admissionNumber || "Pending");


studentStatus.textContent =
student.status || "Active";





const enrollQuery =
query(

collection(db,"enrollments"),

where(
"studentId",
"==",
studentId
)

);



const enrollSnap =
await getDocs(enrollQuery);



coursesList.innerHTML="";



let totalProgress=0;



for(const enrollment of enrollSnap.docs){


const data =
enrollment.data();



totalProgress +=
data.progress || 0;



const courseSnap =
await getDoc(

doc(
db,
"courses",
data.courseId
)

);



if(courseSnap.exists()){


const course =
courseSnap.data();



coursesList.innerHTML += `


<div class="course-item">


<div class="course-info">


<h3>

${course.title}

</h3>


<p>

${course.category || "Course"}

</p>


</div>



<div class="progress-box">


<div class="progress-bar">


<div class="progress-fill"

style="width:${data.progress || 0}%">

</div>


</div>


<div class="progress-text">

${data.progress || 0}% Complete

</div>


</div>


</div>


`;

}


}



courseCount.textContent =
enrollSnap.size;



const average =
enrollSnap.size
?
Math.round(
totalProgress / enrollSnap.size
)
:
0;


averageProgress.textContent =
average + "%";



}

catch(error){

console.error(
"Student profile error:",
error
);

}


}



loadStudent();