import { db } from "../js/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
new URLSearchParams(window.location.search);

const courseId =
params.get("id");


const modulesList =
document.getElementById("modulesList");

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



addModuleBtn.addEventListener("click",()=>{

    moduleModal.classList.remove("hidden");

    moduleTitle.focus();

});



cancelModuleBtn.addEventListener("click",()=>{

    closeModal();

});



moduleModal.addEventListener("click",(e)=>{

    if(e.target===moduleModal){

        closeModal();

    }

});



function closeModal(){

    moduleModal.classList.add("hidden");

    moduleTitle.value="";

    moduleDescription.value="";

}



saveModuleBtn.addEventListener("click",async()=>{

    const title =
    moduleTitle.value.trim();

    const description =
    moduleDescription.value.trim();

    if(title===""){

        alert("Enter a module title.");

        return;

    }

    try{

        await addDoc(

            collection(db,"modules"),

            {

                courseId,

                title,

                description,

                createdAt:
                serverTimestamp()

            }

        );

        closeModal();

        loadModules();

    }

    catch(error){

        console.error(error);

        alert("Failed to create module.");

    }

});



async function loadModules(){

    modulesList.innerHTML="";

    const q =
    query(

        collection(db,"modules"),

        where("courseId","==",courseId),

        orderBy("createdAt")

    );

    const snapshot =
    await getDocs(q);

    if(snapshot.empty){

        modulesList.innerHTML=`

        <div class="empty-state">

            <h3>

            📂 No modules yet

            </h3>

            <p>

            Click "Add Module" to begin building your course.

            </p>

        </div>

        `;

        return;

    }

    snapshot.forEach(moduleDoc=>{

        const module =
        moduleDoc.data();

        modulesList.innerHTML += `

        <div class="module-card">

            <div class="module-header">

                <div>

                    <h2>

                    📂 ${module.title}

                    </h2>

                    <p>

                    ${module.description || ""}

                    </p>

                </div>

                <button
                class="lesson-btn"
                onclick="addLesson('${moduleDoc.id}')">

                ➕ Add Lesson

                </button>

            </div>

            <div
            id="lessons-${moduleDoc.id}"
            class="lessons-list">

            </div>

        </div>

        `;

        loadLessons(moduleDoc.id);

    });

}



async function loadLessons(moduleId){

    const container =
    document.getElementById(`lessons-${moduleId}`);

    if(!container){

        return;

    }

    const q =
    query(

        collection(db,"lessons"),

        where("moduleId","==",moduleId)

    );

    const snapshot =
    await getDocs(q);

    if(snapshot.empty){

        container.innerHTML=`

        <p class="no-lessons">

        No lessons yet.

        </p>

        `;

        return;

    }

    snapshot.forEach(doc=>{

        const lesson =
        doc.data();

        container.innerHTML += `

        <div class="lesson-item">

            ▶ ${lesson.title}

        </div>

        `;

    });

}



window.addLesson = function(moduleId){

    window.location.href =
    `add-lesson.html?course=${courseId}&module=${moduleId}`;

};



loadModules();