/* ===========================
   SSA ADMIN DASHBOARD
=========================== */


import { db } from "../js/firebase.js";


import {

collection,
getDocs,
query,
where,
orderBy,
limit

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===========================
   ELEMENTS
=========================== */


const studentCount =
document.getElementById(
"studentCount"
);


const instructorCount =
document.getElementById(
"instructorCount"
);


const courseCount =
document.getElementById(
"courseCount"
);


const pendingCount =
document.getElementById(
"pendingCount"
);


const recentApplications =
document.getElementById(
"recentApplications"
);





/* ===========================
   LOAD STATS
=========================== */


async function loadStats(){


try{


const studentsSnap =
await getDocs(
collection(
db,
"students"
)
);



const instructorsSnap =
await getDocs(
collection(
db,
"instructors"
)
);



const coursesSnap =
await getDocs(
collection(
db,
"courses"
)
);



const pendingSnap =
await getDocs(
query(
collection(db,"applications"),
where(
"status",
"==",
"Pending"
)
)
);





studentCount.textContent =
studentsSnap.size;



instructorCount.textContent =
instructorsSnap.size;



courseCount.textContent =
coursesSnap.size;



pendingCount.textContent =
pendingSnap.size;



}



catch(error){


console.error(
"Stats loading error:",
error
);


}



}





/* ===========================
   RECENT APPLICATIONS
=========================== */


async function loadApplications(){


try{


const applicationsQuery =
query(

collection(db,"applications"),

orderBy(
"createdAt",
"desc"
),

limit(5)

);



const snapshot =
await getDocs(
applicationsQuery
);



recentApplications.innerHTML="";



if(snapshot.empty){


recentApplications.innerHTML=`

<p>
No applications yet.
</p>

`;

return;


}



snapshot.forEach((doc)=>{


const app =
doc.data();



recentApplications.innerHTML += `


<div class="application-item">


<div>

<strong>

${app.name || "Applicant"}

</strong>


<br>


<small>

${app.program || "Program not selected"}

</small>


</div>



<span>

${app.status || "Pending"}

</span>



</div>


`;



});



}



catch(error){


console.error(
"Applications error:",
error
);



recentApplications.innerHTML=`

<p>
Failed loading applications.
</p>

`;



}



}






/* ===========================
   START
=========================== */


loadStats();

loadApplications();