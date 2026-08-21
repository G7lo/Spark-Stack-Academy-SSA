// ===================================
// SPARK STACK ACADEMY
// INSTRUCTORS MANAGEMENT
// CORE ENGINE V1
// ===================================


import { db } from "../js/firebase.js";


import {
collection,
addDoc,
getDocs,
query,
orderBy,
serverTimestamp,
doc,
getDoc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log("🚀 Instructors Module Initialized");



// ===================================
// ELEMENTS
// ===================================


const instructorTable =
document.getElementById(
"instructorsTableBody"
);


const instructorModal =
document.getElementById(
"instructorModal"
);


const addInstructorBtn =
document.getElementById(
"addInstructorBtn"
);


const closeInstructorModal =
document.getElementById(
"closeInstructorModal"
);


const instructorForm =
document.getElementById(
"instructorForm"
);

let editingInstructorId = null;

// ===================================
// LOAD COURSES
// ===================================

async function loadCourses(){

const courseSelect =
document.getElementById(
"instructorCourses"
);


if(!courseSelect) return;


courseSelect.innerHTML = "";


try{


const snapshot =
await getDocs(
collection(db,"courses")
);



snapshot.forEach(doc=>{


const course =
doc.data();



const option =
document.createElement("option");


option.value =
doc.id;


option.textContent =
course.title;



courseSelect.appendChild(
option
);



});


}

catch(error){

console.error(
"Loading courses failed:",
error
);

}


}

// ===================================
// OPEN MODAL
// ===================================


async function openInstructorModal(instructor=null){

editingInstructorId = instructor?.id || null;

await loadCourses();

instructorForm.reset();

document.querySelector("#instructorModal .modal-header h3").textContent =
instructor ? "Edit Instructor" : "Add Instructor";

if(instructor){

document.getElementById("instructorName").value = instructor.name || "";
document.getElementById("instructorEmail").value = instructor.email || "";
document.getElementById("instructorPhone").value = instructor.phone || "";
document.getElementById("instructorSpecialization").value = instructor.specialization || "";
document.getElementById("instructorBio").value = instructor.bio || "";
document.getElementById("instructorStatus").value = instructor.status || "active";

Array.from(document.getElementById("instructorCourses").options).forEach(option=>{
option.selected = (instructor.courses || []).includes(option.value);
});

}

instructorModal.classList.add("active");

}

addInstructorBtn?.addEventListener("click",()=>openInstructorModal());




// ===================================
// CLOSE MODAL
// ===================================


closeInstructorModal?.addEventListener(
"click",
()=>{

instructorModal.classList.remove(
"active"
);

editingInstructorId = null;

});




// CLOSE OUTSIDE CLICK

instructorModal?.addEventListener(
"click",
(e)=>{

if(e.target === instructorModal){

instructorModal.classList.remove(
"active"
);

editingInstructorId = null;

}

});





// ===================================
// ADD INSTRUCTOR
// ===================================


instructorForm?.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const instructor = {


name:
document.getElementById(
"instructorName"
).value.trim(),



email:
document.getElementById(
"instructorEmail"
).value.trim(),



phone:
document.getElementById(
"instructorPhone"
).value.trim(),



specialization:
document.getElementById(
"instructorSpecialization"
).value.trim(),



bio:
document.getElementById(
"instructorBio"
).value.trim(),



status:
document.getElementById(
"instructorStatus"
).value,

role:"instructor",

permissions:{
    canCreateCourse:true,
    canEditOwnCourses:true,
    canUploadMaterials:true,
    canCreateAssignments:true,
    canGradeStudents:true,
    canViewAssignedStudents:true,

    canManageRevenue:false,
    canAccessFounderData:false,
    canManageAcademySettings:false
},

courses:
Array.from(

document.getElementById(
"instructorCourses"
).selectedOptions

).map(option=>option.value),



createdAt:
serverTimestamp()


};



try{


if(editingInstructorId){

const { createdAt, ...updates } = instructor;

await updateDoc(
doc(db,"instructors",editingInstructorId),
{...updates,updatedAt:serverTimestamp()}

);

}else{

await addDoc(

collection(
db,
"instructors"
),

instructor

);

}



alert(
editingInstructorId ? "Instructor updated successfully 🚀" : "Instructor added successfully 🚀"
);



instructorForm.reset();



instructorModal.classList.remove(
"active"
);

editingInstructorId = null;



loadInstructors();



}


catch(error){


console.error(
"Adding instructor failed:",
error
);


}



});






// ===================================
// LOAD INSTRUCTORS
// ===================================


async function loadInstructors(){


try{


const q =
query(

collection(
db,
"instructors"
),

orderBy(
"createdAt",
"desc"
)

);



const snapshot =
await getDocs(q);



instructorTable.innerHTML="";



if(snapshot.empty){


instructorTable.innerHTML = `

<tr>

<td colspan="8"
class="empty-state">

<div class="empty-content">

<div class="empty-icon">
👨‍🏫
</div>

<h3>
No Instructors Found
</h3>

<p>
Add instructors to manage your academy team.
</p>

</div>

</td>

</tr>

`;


return;


}




snapshot.forEach(doc=>{


const data =
doc.data();



instructorTable.innerHTML += `


<tr>


<td>

<div class="instructor-info">


<div class="instructor-avatar">

${data.name?.charAt(0) || "I"}

</div>



<div class="instructor-details">


<span class="instructor-name">

${data.name}

</span>


<span class="instructor-specialization">

${data.specialization || "N/A"}

</span>


</div>


</div>


</td>



<td>

${data.specialization || "-"}

</td>



<td>

${data.courses?.length || 0}

</td>



<td>

0

</td>



<td>

${data.email}

</td>



<td>

<span class="status ${data.status}">

${data.status}

</span>

</td>



<td>

Recent

</td>



<td>

<div class="action-buttons">

<button
class="action-btn view-instructor"
data-id="${doc.id}">
👁️
</button>

<button
class="action-btn edit-instructor"
data-id="${doc.id}">
✏️
</button>

<button
class="action-btn delete-instructor"
data-id="${doc.id}">
🗑️
</button>

</div>

</td>


</tr>


`;


});



updateStats(snapshot);



}


catch(error){

console.error(
"Loading instructors failed:",
error
);

}


}






// ===================================
// UPDATE KPI
// ===================================


function updateStats(snapshot){


const instructors =
snapshot.docs.map(
doc=>doc.data()
);



document.getElementById(
"instructorCount"
).textContent =
instructors.length;



document.getElementById(
"activeInstructorCount"
).textContent =

instructors.filter(

i=>i.status==="active"

).length;



document.getElementById(
"suspendedInstructorCount"
).textContent =

instructors.filter(

i=>i.status==="suspended"

).length;



}



document.addEventListener("click", async (e) => {

    // View
    if (e.target.closest(".view-instructor")) {

        const id = e.target.closest(".view-instructor").dataset.id;

        window.location.href =
        `instructors-profile.html?id=${id}`;
    }

    // Edit
    if (e.target.closest(".edit-instructor")) {

        const id = e.target.closest(".edit-instructor").dataset.id;

        const snapshot = await getDoc(doc(db,"instructors",id));

        if(snapshot.exists()){

            openInstructorModal({id:snapshot.id,...snapshot.data()});

        }
    }

    // Delete
    if (e.target.closest(".delete-instructor")) {

        const id = e.target.closest(".delete-instructor").dataset.id;

        const confirmDelete =
        confirm("Suspend this instructor? Their record will remain available for review.");

        if(!confirmDelete) return;

        await updateDoc(doc(db,"instructors",id),{

            status:"suspended",

            updatedAt:serverTimestamp()

        });

        await loadInstructors();
    }

});


// ===================================
// START
// ===================================

loadCourses();

loadInstructors();
