import { db, auth } from "../firebase.js";

import {
collection,
getDocs,
query,
where,
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const studentsTable =
document.getElementById("studentsTable");


const totalStudents =
document.getElementById("totalStudents");

const totalCourses =
document.getElementById("totalCourses");

const activeStudents =
document.getElementById("activeStudents");



let studentsData = [];



// ============================
// LOAD INSTRUCTOR STUDENTS
// ============================

async function loadStudents(){

const user = auth.currentUser;

if(!user) return;


try{


studentsData = [];


const coursesQuery = query(

collection(db,"courses"),

where(
"instructorId",
"==",
user.uid
)

);


const coursesSnapshot =
await getDocs(coursesQuery);



for(const courseDoc of coursesSnapshot.docs){


const courseData =
courseDoc.data();



const enrollmentQuery = query(

collection(db,"enrollments"),

where(
"courseId",
"==",
courseDoc.id
)

);



const enrollmentSnapshot =
await getDocs(enrollmentQuery);



for(const enrollmentDoc of enrollmentSnapshot.docs){


const enrollment =
enrollmentDoc.data();



const studentRef =
doc(
    db,
    "students",
    enrollment.studentId
);

console.log("Student found:", studentSnap.exists());

console.log(
"Student data:",
studentSnap.data()
);


const studentSnap =
await getDoc(studentRef);



if(studentSnap.exists()){


const student =
studentSnap.data();



studentsData.push({

id:studentSnap.id,

admissionNumber:
student.admissionNumber || "Pending",

name:
student.name,

email:
student.email,

courses:[

{

title:
courseData.title,

progress:
enrollment.progress || 0

}

],

status:
student.status || "Active"


});


}


}


}



renderStudents(studentsData);



}

catch(error){

console.error(
"Loading students error:",
error
);

}


}



// ============================
// DISPLAY TABLE
// ============================


function renderStudents(students){


studentsTable.innerHTML="";


let coursesCount=0;



students.forEach((student,index)=>{


coursesCount += student.courses.length;



const coursesHTML =
student.courses
.map(course=>`

<div class="course-item">

${course.title}

</div>

`)
.join("");



studentsTable.innerHTML += `

<tr>


<td>
${index+1}
</td>


<td>
${student.admissionNumber}
</td>


<td>

<strong>
${student.name}
</strong>

<br>

<small>
${student.email}
</small>

</td>



<td>

<div class="course-list">

${coursesHTML}

</div>

</td>



<td>

<span class="status active">

${student.status}

</span>

</td>



<td>

<button 
class="view-btn"
onclick="viewStudent('${student.id}')">

View

</button>

</td>


</tr>

`;



});



totalStudents.textContent =
students.length;


totalCourses.textContent =
coursesCount;


activeStudents.textContent =
students.filter(
s=>s.status==="Active"
).length;



}



// ============================
// SEARCH
// ============================


document
.getElementById("searchStudent")
.addEventListener(
"input",
(e)=>{


const value =
e.target.value.toLowerCase();



const filtered =
studentsData.filter(student=>

student.name
.toLowerCase()
.includes(value)

||

student.admissionNumber
.toLowerCase()
.includes(value)

);



renderStudents(filtered);


});




// ============================
// VIEW STUDENT
// ============================


window.viewStudent =
function(id){

window.location.href =
`student-profile.html?id=${id}`;

};



// WAIT FOR AUTH

auth.onAuthStateChanged(
(user)=>{

if(user){

loadStudents();

}

});