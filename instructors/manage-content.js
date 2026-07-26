import { db } from "../js/firebase.js";

import{
collection,
doc,
getDoc,
getDocs,
addDoc,
serverTimestamp,
query,
where,
deleteDoc,
updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
new URLSearchParams(window.location.search);

const courseId =
params.get("id");


/* ------------------------
DOM
-------------------------*/

const modulesList =
document.getElementById("modulesList");

const moduleCount =
document.getElementById("moduleCount");

const lessonCount =
document.getElementById("lessonCount");

const addModuleBtn =
document.getElementById("addModuleBtn");

const moduleModal =
document.getElementById("moduleModal");

const moduleTitle =
document.getElementById("moduleTitle");

const moduleDescription =
document.getElementById("moduleDescription");

const saveModuleBtn =
document.getElementById("saveModuleBtn");

const cancelModuleBtn =
document.getElementById("cancelModuleBtn");

const toast =
document.getElementById("toast");


let modules = [];

let lessons = [];



/* ------------------------
Toast
-------------------------*/

function showToast(message){

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}



/* ------------------------
Modal
-------------------------*/

function openModal(){

    moduleModal.classList.remove("hidden");

    moduleTitle.focus();

}

function closeModal(){

    moduleModal.classList.add("hidden");

    moduleTitle.value="";

    moduleDescription.value="";

}



addModuleBtn.onclick =
openModal;

cancelModuleBtn.onclick =
closeModal;


moduleModal.onclick=(e)=>{

    if(e.target===moduleModal){

        closeModal();

    }

};



/* ------------------------
Load Course
-------------------------*/

async function loadCourse(){

const snap =
await getDoc(
doc(db,"courses",courseId)
);

if(!snap.exists()){

modulesList.innerHTML=`

<div class="empty-state">

<h3>

Course not found

</h3>

</div>

`;

return;

}

document.title =
`${snap.data().title} | Manage Content`;

}




/* ------------------------
Load Modules
-------------------------*/

async function loadModules(){

modulesList.innerHTML="";

modules=[];
lessons=[];

const modulesQuery=
query(
collection(db,"modules"),
where("courseId","==",courseId)
);

const modulesSnapshot=
await getDocs(modulesQuery);

if(modulesSnapshot.empty){

moduleCount.textContent="0";
lessonCount.textContent="0";

modulesList.innerHTML=`

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

for(const moduleDoc of modulesSnapshot.docs){

const module={

id:moduleDoc.id,

...moduleDoc.data()

};

modules.push(module);

const lessonsQuery=
query(
collection(db,"lessons"),
where("moduleId","==",module.id)
);

const lessonsSnapshot=
await getDocs(lessonsQuery);

const moduleLessons=[];

lessonsSnapshot.forEach(doc=>{

const lesson={

id:doc.id,

...doc.data()

};

moduleLessons.push(lesson);

lessons.push(lesson);

});

renderModule(
module,
moduleLessons
);

}

moduleCount.textContent=
modules.length;

lessonCount.textContent=
lessons.length;

}



/* ------------------------
Render Module
-------------------------*/

function renderModule(
module,
moduleLessons
){

const card=
document.createElement("div");

card.className="module-card";

let lessonsHTML="";

if(moduleLessons.length===0){

lessonsHTML=`

<div class="lesson-item">

No lessons yet.

</div>

`;

}else{

moduleLessons.forEach(lesson=>{

lessonsHTML+=`

<div class="lesson-item">

<div>

<strong>

▶ ${lesson.title}

</strong>

<br>

<small>

${lesson.duration || ""}

</small>

</div>

<div>

<button
class="secondary-btn"
onclick="editLesson('${lesson.id}')">

✏

</button>

<button
class="secondary-btn"
onclick="deleteLesson('${lesson.id}')">

🗑

</button>

</div>

</div>

`;

});

}

card.innerHTML=`

<div class="module-header">

<div>

<h2>

📂 ${module.title}

</h2>

<p>

${module.description || ""}

</p>

</div>

<div>

<button
class="lesson-btn"
onclick="addLesson('${module.id}')">

➕ Lesson

</button>

<button
class="secondary-btn"
onclick="editModule('${module.id}')">

✏

</button>

<button
class="secondary-btn"
onclick="deleteModule('${module.id}')">

🗑

</button>

</div>

</div>

<div class="lessons-list">

${lessonsHTML}

</div>

`;

modulesList.appendChild(card);

}
/* ------------------------
Add Lesson
-------------------------*/

window.addLesson=function(moduleId){

window.location.href=
`add-lesson.html?course=${courseId}&module=${moduleId}`;

};



/* ------------------------
Edit Module
-------------------------*/

window.editModule=function(moduleId){

const module=
modules.find(m=>m.id===moduleId);

if(!module) return;

moduleTitle.value=
module.title;

moduleDescription.value=
module.description || "";

openModal();

saveModuleBtn.onclick=async()=>{

await updateDoc(

doc(db,"modules",moduleId),

{

title:
moduleTitle.value.trim(),

description:
moduleDescription.value.trim()

}

);

closeModal();

showToast("✅ Module updated");

saveModuleBtn.onclick=null;

saveModuleBtn.onclick=createModule;

loadModules();

};

};



/* ------------------------
Create Module Function
-------------------------*/

async function createModule(){

const title=
moduleTitle.value.trim();

if(title===""){

showToast("Enter module title");

return;

}

await addDoc(

collection(db,"modules"),

{

courseId,

title,

description:
moduleDescription.value.trim(),

createdAt:
serverTimestamp()

}

);

closeModal();

showToast("✅ Module created");

loadModules();

}

saveModuleBtn.onclick=createModule;



/* ------------------------
Delete Module
-------------------------*/

window.deleteModule=async(moduleId)=>{

if(!confirm("Delete this module?")){

return;

}

await deleteDoc(
doc(db,"modules",moduleId)
);

showToast("🗑 Module deleted");

loadModules();

};



/* ------------------------
Edit Lesson
-------------------------*/

window.editLesson=function(lessonId){

window.location.href=
`edit-lesson.html?id=${lessonId}`;

};



/* ------------------------
Delete Lesson
-------------------------*/

window.deleteLesson=async(lessonId)=>{

if(!confirm("Delete this lesson?")){

return;

}

await deleteDoc(
doc(db,"lessons",lessonId)
);

showToast("🗑 Lesson deleted");

loadModules();

};



/* ------------------------
Start
-------------------------*/

loadCourse();

loadModules();