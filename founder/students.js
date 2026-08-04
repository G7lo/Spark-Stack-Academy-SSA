/* ===================================
   SSA FOUNDER OS
   STUDENTS MANAGEMENT
=================================== */


import { db } from "../js/firebase.js";

import {

collection,
getDocs,
addDoc,
doc,
updateDoc,
query,
orderBy,
serverTimestamp

} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===================================
   ELEMENTS
=================================== */


const tableBody =
document.getElementById("studentsTableBody");


const studentCount =
document.getElementById("studentCount");


const activeCount =
document.getElementById("activeStudentCount");


const newCount =
document.getElementById("newStudentCount");


const graduatedCount =
document.getElementById("graduatedCount");


const suspendedCount =
document.getElementById("suspendedCount");


const completionRate =
document.getElementById("completionRate");


const totalText =
document.getElementById("studentTotal");


const searchInput =
document.getElementById("studentSearch");


const statusFilter =
document.getElementById("statusFilter");


const sortSelect =
document.getElementById("sortStudents");



let students = [];



/* ===================================
   GENERATE ADMISSION NUMBER
=================================== */


function generateAdmissionNumber(index){


const year =
new Date().getFullYear();


const number =
String(index + 1)
.padStart(4,"0");


return `SSA-${year}-${number}`;


}



/* ===================================
   LOAD STUDENTS
=================================== */


async function loadStudents(){


try{


const snap =
await getDocs(
collection(db,"students")
);



students=[];



snap.forEach(doc=>{


students.push({

id:doc.id,

...doc.data()

});


});



updateStats();


renderStudents(students);



}
catch(error){

console.error(
"Loading students failed",
error
);

}



}




/* ===================================
   STATS
=================================== */


function updateStats(){


studentCount.textContent =
students.length;



activeCount.textContent =
students.filter(
s=>s.status==="Active"
).length;



graduatedCount.textContent =
students.filter(
s=>s.status==="Graduated"
).length;



suspendedCount.textContent =
students.filter(
s=>s.status==="Suspended"
).length;



const currentMonth =
new Date()
.getMonth();



newCount.textContent =
students.filter(s=>{


if(!s.createdAt)
return false;


return (
s.createdAt.toDate()
.getMonth()
===
currentMonth
);


}).length;



let progress = 0;


students.forEach(s=>{

progress +=
s.progress || 0;

});


completionRate.textContent =
students.length
?
Math.round(
progress / students.length
)
+"%"
:
"0%";



totalText.textContent =
`${students.length} Students`;



}





/* ===================================
   RENDER TABLE
=================================== */


function renderStudents(data){



tableBody.innerHTML="";



if(!data.length){


tableBody.innerHTML=`

<tr>

<td colspan="8"
class="empty-state">

<div class="empty-content">

<div class="empty-icon">
🎓
</div>

<h3>
No Students Found
</h3>

<p>
Approved students will appear here.
</p>

</div>

</td>

</tr>

`;

return;

}




data.forEach(student=>{



const admission =
student.admissionNumber ||
"Pending";



tableBody.innerHTML += `


<tr>


<td>


<div class="student-info">


<div class="student-avatar">

${student.name
?.charAt(0)
.toUpperCase()}


</div>


<div class="student-details">


<strong>
${student.name}
</strong>


<small>
${admission}
</small>


</div>


</div>


</td>



<td>

${student.courseName || "Not Assigned"}

</td>



<td>

${student.email || "--"}

</td>



<td>

${student.phone || "--"}

</td>



<td>

<span class="status ${student.status?.toLowerCase()}">

${student.status || "Pending"}

</span>


</td>



<td>


<div class="progress">


<div class="progress-bar">

<div class="progress-fill"

style="width:${student.progress || 0}%">

</div>


</div>


<span>

${student.progress || 0}%

</span>


</div>


</td>



<td>

${
student.createdAt
?
student.createdAt
.toDate()
.toLocaleDateString()
:
"--"
}


</td>



<td>


<div class="action-buttons">


<button 
class="action-btn view"
onclick="viewStudent('${student.id}')">

👁

</button>


</div>


</td>



</tr>


`;

});


}




/* ===================================
   SEARCH
=================================== */


searchInput?.addEventListener(
"input",
()=>{


const value =
searchInput.value
.toLowerCase();



const filtered =
students.filter(s=>

s.name
?.toLowerCase()
.includes(value)

||

s.email
?.toLowerCase()
.includes(value)

||

s.admissionNumber
?.toLowerCase()
.includes(value)

);



renderStudents(filtered);


});




/* ===================================
   STATUS FILTER
=================================== */


statusFilter?.addEventListener(
"change",
()=>{


const value =
statusFilter.value;



if(!value){

renderStudents(students);

return;

}



renderStudents(

students.filter(
s=>
s.status===value
)

);


});




/* ===================================
   SORT
=================================== */


sortSelect?.addEventListener(
"change",
()=>{


let sorted =
[...students];



if(sortSelect.value==="name"){


sorted.sort(
(a,b)=>
a.name.localeCompare(b.name)
);


}



if(sortSelect.value==="newest"){


sorted.sort(
(a,b)=>
b.createdAt-a.createdAt
);


}



renderStudents(sorted);


});




/* ===================================
   START
=================================== */


loadStudents();