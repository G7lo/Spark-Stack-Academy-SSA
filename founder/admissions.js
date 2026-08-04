/* ===================================
   SSA FOUNDER OS
   ADMISSIONS MANAGEMENT JS
=================================== */


import { db } from "../js/firebase.js";

import {

collection,
getDocs,
doc,
updateDoc,
addDoc,
serverTimestamp

} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===================================
   ELEMENTS
=================================== */


const applicationsTable =
document.getElementById("applicationsTable");


const pendingCount =
document.getElementById("pendingCount");


const approvedCount =
document.getElementById("approvedCount");


const rejectedCount =
document.getElementById("rejectedCount");


const totalCount =
document.getElementById("totalCount");


const applicationTotal =
document.getElementById("applicationTotal");


const refreshBtn =
document.getElementById("refreshAdmissions");




let applications = [];



/* ===================================
   LOAD APPLICATIONS
=================================== */


async function loadApplications(){


try{


const snapshot =
await getDocs(
collection(db,"applications")
);



applications = [];



snapshot.forEach(item=>{


applications.push({

id:item.id,

...item.data()

});


});



updateStats();


renderApplications();



}

catch(error){

console.error(
"Admissions Error:",
error
);

}


}



/* ===================================
   UPDATE KPI
=================================== */


function updateStats(){


let pending = 0;
let approved = 0;
let rejected = 0;



applications.forEach(app=>{


const status =
app.status?.toLowerCase();



if(status==="pending")
pending++;


if(status==="approved")
approved++;


if(status==="rejected")
rejected++;


});



pendingCount.textContent =
pending;


approvedCount.textContent =
approved;


rejectedCount.textContent =
rejected;


totalCount.textContent =
applications.length;



applicationTotal.textContent =
`${applications.length} Applications`;



}





/* ===================================
   RENDER TABLE
=================================== */


function renderApplications(){


applicationsTable.innerHTML="";



if(applications.length===0){


applicationsTable.innerHTML=`

<tr>

<td colspan="6">

No applications found.

</td>

</tr>

`;


return;

}



applications.forEach(app=>{


applicationsTable.innerHTML += `


<tr>


<td>

<strong>
${app.name || "Unknown"}
</strong>

</td>



<td>

${app.course || "-"}

</td>



<td>

${app.email || "-"}

</td>



<td>

<span class="status ${app.status?.toLowerCase()}">

${app.status || "Pending"}

</span>

</td>



<td>

${formatDate(app.createdAt)}

</td>



<td>


<div class="action-buttons">



<button

class="action-btn approve"

data-id="${app.id}">

✅

</button>



<button

class="action-btn reject"

data-id="${app.id}">

❌

</button>



</div>


</td>


</tr>


`;


});



activateButtons();


}



/* ===================================
   ACTION BUTTONS
=================================== */


function activateButtons(){


document
.querySelectorAll(".approve")
.forEach(btn=>{


btn.onclick=()=>{

approveApplication(
btn.dataset.id
);

};


});



document
.querySelectorAll(".reject")
.forEach(btn=>{


btn.onclick=()=>{

rejectApplication(
btn.dataset.id
);

};


});


}





/* ===================================
   APPROVE APPLICATION
=================================== */


async function approveApplication(id){


const application =
applications.find(
app=>app.id===id
);



if(!application)
return;



const admissionNo =
await generateAdmissionNumber();




await addDoc(

collection(db,"students"),

{


name:
application.name,


email:
application.email,


phone:
application.phone || "",


course:
application.course,


admissionNo,


username:
admissionNo,


password:
admissionNo,


role:
"student",


status:
"Active",


coursesEnrolled:
1,


progress:
0,


certificates:
0,


createdAt:
serverTimestamp()


}


);




await updateDoc(

doc(
db,
"applications",
id
),

{


status:
"Approved",


admissionNo


}


);




alert(

`Admission approved\n${admissionNo}`

);



loadApplications();



}





/* ===================================
   REJECT
=================================== */


async function rejectApplication(id){


await updateDoc(

doc(
db,
"applications",
id
),

{

status:
"Rejected"

}

);



loadApplications();


}





/* ===================================
   ADMISSION NUMBER
=================================== */


async function generateAdmissionNumber(){


const year =
new Date()
.getFullYear();



const snapshot =
await getDocs(
collection(db,"students")
);



const number =
snapshot.size + 1;



return `SSA-${year}-${String(number).padStart(4,"0")}`;


}





/* ===================================
   DATE FORMAT
=================================== */


function formatDate(timestamp){


if(!timestamp)
return "-";


return timestamp
.toDate()
.toLocaleDateString();


}




/* ===================================
   REFRESH
=================================== */


refreshBtn.onclick =
loadApplications;




/* START */

loadApplications();