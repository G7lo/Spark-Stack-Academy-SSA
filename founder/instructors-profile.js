/* ===================================
   SSA FOUNDER OS
   INSTRUCTOR PROFILE JS
=================================== */


import { db } from "../js/firebase.js";


import {

doc,
getDoc,
updateDoc,
collection,
query,
where,
getDocs,
increment

}

from 
"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



/* ===================================
   GET INSTRUCTOR ID
=================================== */


const params =
new URLSearchParams(
window.location.search
);


const instructorId =
params.get("id");



if(!instructorId){

console.error(
"No instructor ID found"
);

}



/* ===================================
   DOM ELEMENTS
=================================== */


const profileAvatar =
document.getElementById(
"profileAvatar"
);


const profileName =
document.getElementById(
"profileName"
);


const profileExpertise =
document.getElementById(
"profileExpertise"
);


const profileStatus =
document.getElementById(
"profileStatus"
);



const courseCount =
document.getElementById(
"courseCount"
);


const studentCount =
document.getElementById(
"studentCount"
);


const ratingCount =
document.getElementById(
"ratingCount"
);


const joinedDate =
document.getElementById(
"joinedDate"
);



const coursesGrid =
document.getElementById(
"coursesGrid"
);



/* ===================================
   LOAD INSTRUCTOR
=================================== */


async function loadInstructor(){


try{


const instructorRef =
doc(
db,
"instructors",
instructorId
);



const snapshot =
await getDoc(
instructorRef
);



if(!snapshot.exists()){


console.error(
"Instructor does not exist"
);


return;


}



const instructor =
snapshot.data();




/* HEADER */


profileAvatar.textContent =

instructor.name
?
instructor.name
.charAt(0)
.toUpperCase()

:
"?";



profileName.textContent =
instructor.name || "Unknown";



profileExpertise.textContent =
instructor.expertise || 
"No expertise";



profileStatus.textContent =

instructor.status === "active"

?
"🟢 Active"

:
"🔴 " + instructor.status;






/* INFORMATION */


document.getElementById(
"infoName"
).textContent =
instructor.name || "--";



document.getElementById(
"infoEmail"
).textContent =
instructor.email || "--";



document.getElementById(
"infoExpertise"
).textContent =
instructor.expertise || "--";



document.getElementById(
"infoBio"
).textContent =
instructor.bio ||
"No biography added";



document.getElementById(
"infoStatus"
).textContent =
instructor.status || "--";






/* STATS */


ratingCount.textContent =
instructor.rating || 0;



if(instructor.createdAt){


joinedDate.textContent =

instructor.createdAt
.toDate()
.toLocaleDateString();


}



await loadCourses();



}
catch(error){


console.error(
"Loading instructor failed:",
error
);


}



}
/* ===================================
   LOAD ASSIGNED COURSES
=================================== */


async function loadCourses(){


try{


const q = query(

collection(
db,
"courses"
),

where(
"instructorId",
"==",
instructorId
)

);



const snapshot =
await getDocs(q);



let totalStudents = 0;



courseCount.textContent =
snapshot.size;



coursesGrid.innerHTML = "";



if(snapshot.empty){


coursesGrid.innerHTML = `

<div class="course-card glass-card">

<p>
No courses assigned yet.
</p>

</div>

`;


studentCount.textContent = 0;


return;


}




snapshot.forEach(courseDoc=>{


const course =
courseDoc.data();



totalStudents +=
course.students || 0;



coursesGrid.innerHTML += `

<div class="course-card glass-card">


<div class="course-image">


<img 
src="${
course.thumbnail ||
'../assets/images/course-placeholder.jpg'
}"

onerror="
this.src='../assets/images/course-placeholder.jpg'
"

>


<span class="course-status">

${course.status || "Draft"}

</span>


</div>



<div class="course-body">


<h3>

${course.title || "Untitled Course"}

</h3>



<p>

${
course.description ||
"No description available"
}

</p>




<div class="course-meta">


<span>

📂 ${
course.category ||
"General"
}

</span>



<span>

🎯 ${
course.level ||
"Beginner"
}

</span>


</div>




<div class="course-stats">


<div>

<strong>

${
course.students || 0
}

</strong>


<small>
Students
</small>


</div>



<div>

<strong>

${
course.lessons || 0
}

</strong>


<small>
Lessons
</small>


</div>



<div>

<strong>

${
course.modules?.length || 0
}

</strong>


<small>
Modules
</small>


</div>


</div>




<div class="course-footer">


<span class="price">

KSh ${
course.price || 0
}

</span>



<button 
class="action-btn"
onclick="
location.href='courses.html?id=${courseDoc.id}'
">

View

</button>


</div>


</div>


</div>


`;



});



studentCount.textContent =
totalStudents;



loadStudentSummary();



}
catch(error){


console.error(
"Course loading error:",
error
);


}


}





/* ===================================
   STUDENT SUMMARY
=================================== */


async function loadStudentSummary(){



const studentsList =
document.getElementById(
"studentsList"
);



if(!studentsList)
return;



studentsList.innerHTML = "";



const q =
query(

collection(
db,
"courses"
),

where(
"instructorId",
"==",
instructorId
)

);



const snapshot =
await getDocs(q);



if(snapshot.empty){


studentsList.innerHTML =
"No students assigned yet.";


return;


}




snapshot.forEach(courseDoc=>{


const course =
courseDoc.data();



studentsList.innerHTML += `


<div class="student-row">


<div>


<h4>

${course.title}

</h4>



<p>

👨‍🎓 ${
course.students || 0
}

students enrolled

</p>



</div>



<span>

${course.status}

</span>


</div>


`;



});



}






/* ===================================
   PROFILE TABS
=================================== */


const tabs =
document.querySelectorAll(
".tab-btn"
);



const contents =
document.querySelectorAll(
".tab-content"
);



tabs.forEach(tab=>{


tab.addEventListener(
"click",
()=>{


tabs.forEach(btn=>

btn.classList.remove(
"active"
)

);



contents.forEach(content=>

content.classList.remove(
"active"
)

);




tab.classList.add(
"active"
);



const target =
document.getElementById(
tab.dataset.tab + "Tab"
);



if(target){

target.classList.add(
"active"
);

}



}

);


});
/* ===================================
   EDIT INSTRUCTOR
=================================== */


const editBtn =
document.getElementById(
"editInstructorBtn"
);


const editModal =
document.getElementById(
"editModal"
);


const closeEdit =
document.getElementById(
"closeEditModal"
);


const editForm =
document.getElementById(
"editInstructorForm"
);



if(editBtn){


editBtn.onclick = ()=>{


editModal.classList.add(
"active"
);


};


}



if(closeEdit){


closeEdit.onclick = ()=>{


editModal.classList.remove(
"active"
);


};


}





if(editForm){


editForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{


await updateDoc(

doc(
db,
"instructors",
instructorId
),

{


name:
editName.value,


email:
editEmail.value,


expertise:
editExpertise.value,


bio:
editBio.value,


status:
editStatus.value


}

);



alert(
"Instructor updated successfully"
);



editModal.classList.remove(
"active"
);



loadInstructor();



}
catch(error){


console.error(
"Update failed:",
error
);


}



});


}







/* ===================================
   ASSIGN COURSE SYSTEM
=================================== */


const assignBtn =
document.getElementById(
"assignCourseBtn"
);



const assignModal =
document.getElementById(
"assignCourseModal"
);



const closeAssign =
document.getElementById(
"closeAssignModal"
);



const courseSelect =
document.getElementById(
"courseSelect"
);



const assignForm =
document.getElementById(
"assignCourseForm"
);






async function loadAvailableCourses(){



if(!courseSelect)
return;



courseSelect.innerHTML =

`
<option>
Loading courses...
</option>
`;



try{


const snapshot =
await getDocs(
collection(
db,
"courses"
)
);



courseSelect.innerHTML="";



let found = false;



snapshot.forEach(courseDoc=>{


const course =
courseDoc.data();



// Only courses without instructor

if(
!course.instructorId
){


found=true;


courseSelect.innerHTML += `

<option value="${courseDoc.id}">

${course.title}

</option>

`;


}



});



if(!found){


courseSelect.innerHTML =

`
<option>
No available courses
</option>

`;

}



}
catch(error){


console.error(
"Course fetch failed:",
error
);


}



}





if(assignBtn){


assignBtn.onclick = ()=>{


assignModal.classList.add(
"active"
);


loadAvailableCourses();



};


}




if(closeAssign){


closeAssign.onclick = ()=>{


assignModal.classList.remove(
"active"
);


};


}






if(assignForm){


assignForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const courseId =
courseSelect.value;



if(!courseId)
return;



try{



await updateDoc(

doc(
db,
"courses",
courseId
),

{


instructorId:
instructorId,


instructorName:
profileName.textContent


}

);




await updateDoc(

doc(
db,
"instructors",
instructorId
),

{


totalCourses:
increment(1)


}

);




alert(
"Course assigned successfully 🔥"
);



assignModal.classList.remove(
"active"
);



loadInstructor();



}
catch(error){


console.error(
"Assignment failed:",
error
);


}



});


}







/* ===================================
   START APPLICATION
=================================== */


loadInstructor();