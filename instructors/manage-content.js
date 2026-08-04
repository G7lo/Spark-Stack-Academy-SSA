// ===========================
// SSA MANAGE CONTENT
// INSTRUCTOR PORTAL
// ===========================


import { db } from "../js/firebase.js";

import {

collection,
doc,
getDoc,
getDocs,
addDoc,
serverTimestamp,
query,
where,
deleteDoc,
updateDoc,
orderBy

}

from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";




// ===========================
// COURSE ID
// ===========================


const params =
new URLSearchParams(
window.location.search
);


const courseId =
params.get("id");



if(!courseId){

alert("Course ID missing");

window.location.href =
"courses.html";

}



// ===========================
// DOM ELEMENTS
// ===========================


const modulesList =
document.getElementById(
"modulesList"
);


const moduleCount =
document.getElementById(
"moduleCount"
);


const lessonCount =
document.getElementById(
"lessonCount"
);


const addModuleBtn =
document.getElementById(
"addModuleBtn"
);



const moduleModal =
document.getElementById(
"moduleModal"
);



const moduleTitle =
document.getElementById(
"moduleTitle"
);



const moduleDescription =
document.getElementById(
"moduleDescription"
);



const saveModuleBtn =
document.getElementById(
"saveModuleBtn"
);



const cancelModuleBtn =
document.getElementById(
"cancelModuleBtn"
);



const toast =
document.getElementById(
"toast"
);





let modules = [];

let lessons = [];




// ===========================
// TOAST
// ===========================


function showToast(message){


if(!toast) return;



toast.textContent =
message;



toast.classList.add(
"show"
);



setTimeout(()=>{


toast.classList.remove(
"show"
);



},3000);


}




// ===========================
// MODAL CONTROL
// ===========================


function openModal(){


moduleModal.classList.remove(
"hidden"
);



moduleTitle.focus();


}




function closeModal(){


moduleModal.classList.add(
"hidden"
);



moduleTitle.value="";


moduleDescription.value="";


}




addModuleBtn.onclick =
openModal;



cancelModuleBtn.onclick =
closeModal;




moduleModal.onclick =
(e)=>{


if(e.target === moduleModal){

closeModal();

}


};




// ===========================
// LOAD COURSE
// ===========================


async function loadCourse(){


try{


const courseSnap =
await getDoc(

doc(
db,
"courses",
courseId
)

);



if(!courseSnap.exists()){


modulesList.innerHTML = `

<div class="empty-state">

<h3>
Course not found
</h3>

</div>

`;

return;


}



document.title =

`${courseSnap.data().title} | Manage Content`;



}

catch(error){


console.error(
"Course loading error:",
error
);


}



}
// ===========================
// LOAD MODULES
// ===========================


async function loadModules(){


try{


modulesList.innerHTML = "";

modules = [];

lessons = [];



const modulesQuery = query(

collection(
db,
"modules"
),

where(
"courseId",
"==",
courseId
)

);



const modulesSnapshot =
await getDocs(
modulesQuery
);



if(modulesSnapshot.empty){


moduleCount.textContent =
"0";


lessonCount.textContent =
"0";



modulesList.innerHTML = `

<div class="empty-state">

<h3>
📂 No Modules Yet
</h3>

<p>
Create your first learning module.
</p>

</div>

`;

return;


}




// SORT MODULES

const moduleDocs =
modulesSnapshot.docs.sort(

(a,b)=>{


const first =
a.data().createdAt?.seconds || 0;


const second =
b.data().createdAt?.seconds || 0;


return first - second;


}

);





for(const moduleDoc of moduleDocs){



const module = {


id:
moduleDoc.id,


...moduleDoc.data()


};



modules.push(
module
);





const lessonsQuery =
query(

collection(
db,
"lessons"
),

where(
"moduleId",
"==",
module.id
)

);




const lessonsSnapshot =
await getDocs(
lessonsQuery
);



const moduleLessons = [];





lessonsSnapshot.forEach(
(lessonDoc)=>{


const lesson = {


id:
lessonDoc.id,


...lessonDoc.data()


};



moduleLessons.push(
lesson
);



lessons.push(
lesson
);



}

);





renderModule(
module,
moduleLessons
);



}




moduleCount.textContent =
modules.length;



lessonCount.textContent =
lessons.length;




}

catch(error){


console.error(
"LOAD MODULE ERROR:",
error
);



showToast(
"Failed loading modules"
);


}



}






// ===========================
// RENDER MODULE
// ===========================


function renderModule(
module,
moduleLessons
){



const card =
document.createElement(
"div"
);



card.className =
"module-card";





let lessonsHTML = "";




if(moduleLessons.length === 0){


lessonsHTML = `


<div class="lesson-item">


<div>

<strong>
No lessons yet
</strong>


<p>
Add lessons to this module
</p>


</div>


</div>


`;



}

else{



moduleLessons.forEach(
(lesson)=>{


lessonsHTML += `


<div class="lesson-item">


<div>


<strong>

▶ ${lesson.title || "Untitled Lesson"}

</strong>



<br>


<small>

${lesson.duration || "No duration"}

</small>


</div>




<div>


<button

class="lesson-btn"

onclick="editLesson('${lesson.id}')"

>

✏

</button>




<button

class="secondary-btn"

onclick="deleteLesson('${lesson.id}')"

>

🗑

</button>



</div>



</div>



`;



}

);



}





card.innerHTML = `


<div class="module-header">


<div>


<h2>

📂 ${module.title}

</h2>


<p>

${module.description || "No description"}

</p>


</div>




<div>


<button

class="lesson-btn"

onclick="addLesson('${module.id}')"

>

➕ Lesson

</button>



<button

class="secondary-btn"

onclick="editModule('${module.id}')"

>

✏

</button>




<button

class="secondary-btn"

onclick="deleteModule('${module.id}')"

>

🗑

</button>



</div>



</div>





<div class="lessons-list">


${lessonsHTML}


</div>



`;





modulesList.appendChild(
card
);



}
// ===========================
// ADD LESSON
// ===========================


window.addLesson = function(moduleId){


window.location.href =

`add-lesson.html?course=${courseId}&module=${moduleId}`;


};




// ===========================
// CREATE MODULE
// ===========================


async function createModule(){


const title =
moduleTitle.value.trim();



const description =
moduleDescription.value.trim();




if(!title){


showToast(
"Enter module title"
);


return;


}




try{


await addDoc(

collection(
db,
"modules"
),

{


courseId,


title,


description,


createdAt:
serverTimestamp()


}

);



closeModal();


showToast(
"✅ Module created"
);



loadModules();



}

catch(error){


console.error(
"Create module:",
error
);



showToast(
"Failed creating module"
);


}



}




saveModuleBtn.onclick =
createModule;






// ===========================
// EDIT MODULE
// ===========================


window.editModule =
function(moduleId){



const module =
modules.find(
(item)=>item.id === moduleId
);



if(!module)
return;




moduleTitle.value =
module.title;



moduleDescription.value =
module.description || "";





openModal();




saveModuleBtn.onclick =
async ()=>{



try{


await updateDoc(

doc(
db,
"modules",
moduleId
),

{


title:
moduleTitle.value.trim(),


description:
moduleDescription.value.trim()


}


);



closeModal();



showToast(
"✅ Module updated"
);



saveModuleBtn.onclick =
createModule;



loadModules();



}

catch(error){


console.error(
"Update module:",
error
);



showToast(
"Update failed"
);


}



};



};







// ===========================
// DELETE MODULE
// ===========================


window.deleteModule =
async function(moduleId){



if(
!confirm(
"Delete module and all lessons?"
)

)

return;





try{


// delete lessons first


const lessonQuery =
query(

collection(
db,
"lessons"
),

where(
"moduleId",
"==",
moduleId
)

);




const lessonSnap =
await getDocs(
lessonQuery
);





for(
const lesson of lessonSnap.docs
){


await deleteDoc(

doc(
db,
"lessons",
lesson.id
)

);


}






await deleteDoc(

doc(
db,
"modules",
moduleId

)

);





showToast(
"🗑 Module deleted"
);



loadModules();



}

catch(error){


console.error(
"Delete module:",
error
);



showToast(
"Delete failed"
);



}



};






// ===========================
// EDIT LESSON
// ===========================


window.editLesson =
function(lessonId){


window.location.href =

`edit-lesson.html?id=${lessonId}`;


};






// ===========================
// DELETE LESSON
// ===========================


window.deleteLesson =
async function(lessonId){



if(
!confirm(
"Delete this lesson?"
)

)

return;





try{


await deleteDoc(

doc(
db,
"lessons",
lessonId
)

);




showToast(
"🗑 Lesson deleted"
);



loadModules();



}

catch(error){


console.error(
"Delete lesson:",
error
);



showToast(
"Delete failed"
);



}



};






// ===========================
// START APP
// ===========================


loadCourse();

loadModules();