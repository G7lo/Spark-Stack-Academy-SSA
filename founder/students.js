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

let editingStudentId = null;

const studentModal = document.getElementById("studentModal");
const studentForm = document.getElementById("studentForm");

function normalizedStatus(value="active"){
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}



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
s=>s.status?.toLowerCase()==="active"
).length;



graduatedCount.textContent =
students.filter(
s=>s.status?.toLowerCase()==="graduated"
).length;



suspendedCount.textContent =
students.filter(
s=>s.status?.toLowerCase()==="suspended"
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
data-student-action="edit"
data-id="${student.id}">

👁

</button>

<button
class="action-btn"
data-student-action="toggle-status"
data-id="${student.id}">

${student.status?.toLowerCase() === "suspended" ? "▶" : "⏸"}

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
s.status?.toLowerCase()===value.toLowerCase()
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
(b.createdAt?.toMillis?.() || 0) -
(a.createdAt?.toMillis?.() || 0)
);


}



renderStudents(sorted);


});




/* ===================================
   START
=================================== */


function openStudentModal(student=null){

    editingStudentId = student?.id || null;

    document.querySelector("#studentModal .modal-header h3").textContent =
    student ? "Edit Student" : "Add New Student";

    studentForm.reset();

    if(student){
        document.getElementById("studentName").value = student.name || "";
        document.getElementById("studentEmail").value = student.email || "";
        document.getElementById("studentPhone").value = student.phone || "";
        document.getElementById("studentCourse").value = student.courseName || student.course || "";
        document.getElementById("studentStatus").value = (student.status || "Active").toLowerCase();
    }

    studentModal.classList.add("active");
}

function closeStudentModal(){
    studentModal.classList.remove("active");
    editingStudentId = null;
}

document.getElementById("addStudentBtn")?.addEventListener("click",()=>openStudentModal());
document.getElementById("closeStudentModal")?.addEventListener("click",closeStudentModal);
studentModal?.addEventListener("click",(event)=>{
    if(event.target === studentModal) closeStudentModal();
});

studentForm?.addEventListener("submit",async(event)=>{
    event.preventDefault();

    const record = {
        name:document.getElementById("studentName").value.trim(),
        email:document.getElementById("studentEmail").value.trim(),
        phone:document.getElementById("studentPhone").value.trim(),
        courseName:document.getElementById("studentCourse").value.trim(),
        course:document.getElementById("studentCourse").value.trim(),
        status:normalizedStatus(document.getElementById("studentStatus").value),
        updatedAt:serverTimestamp()
    };

    try{
        if(editingStudentId){
            await updateDoc(doc(db,"students",editingStudentId),record);
        }else{
            await addDoc(collection(db,"students"),{
                ...record,
                admissionNumber:generateAdmissionNumber(students.length),
                role:"student",
                progress:0,
                createdAt:serverTimestamp()
            });
        }
        closeStudentModal();
        await loadStudents();
    }catch(error){
        console.error("Saving student failed",error);
        alert("Unable to save this student.");
    }
});

tableBody?.addEventListener("click",async(event)=>{
    const button = event.target.closest("[data-student-action]");
    if(!button) return;
    const student = students.find(item=>item.id === button.dataset.id);
    if(!student) return;
    if(button.dataset.studentAction === "edit"){
        openStudentModal(student);
        return;
    }
    const nextStatus = student.status?.toLowerCase() === "suspended" ? "Active" : "Suspended";
    try{
        await updateDoc(doc(db,"students",student.id),{status:nextStatus,updatedAt:serverTimestamp()});
        await loadStudents();
    }catch(error){
        console.error("Updating student status failed",error);
        alert("Unable to update this student.");
    }
});

document.getElementById("exportStudentsBtn")?.addEventListener("click",()=>{
    const rows = [["Name","Email","Phone","Course","Status","Admission Number"]];
    students.forEach(student=>rows.push([student.name || "",student.email || "",student.phone || "",student.courseName || student.course || "",student.status || "",student.admissionNumber || ""]));
    const csv = rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    link.download = "spark-stack-students.csv";
    link.click();
    URL.revokeObjectURL(link.href);
});

loadStudents();
