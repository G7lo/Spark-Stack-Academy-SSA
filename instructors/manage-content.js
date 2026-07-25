import { db } from "../js/firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
new URLSearchParams(window.location.search);

const courseId =
params.get("id");


const modulesList =
document.getElementById("modulesList");

const addModuleBtn =
document.getElementById("addModuleBtn");


async function loadModules(){

    const courseRef =
    doc(db,"courses",courseId);

    const courseSnap =
    await getDoc(courseRef);

    if(!courseSnap.exists()){

        modulesList.innerHTML =
        "<p>Course not found.</p>";

        return;

    }

    const course =
    courseSnap.data();

    modulesList.innerHTML = "";

    const modules =
    course.modules || [];

    if(modules.length === 0){

        modulesList.innerHTML =
        "<p>No modules yet.</p>";

        return;

    }

    modules.forEach((module,index)=>{

        modulesList.innerHTML += `

        <div class="module">

            <h2>
                Module ${index+1}
            </h2>

            <p>
                ${module}
            </p>

        </div>

        `;

    });

}


addModuleBtn.addEventListener("click",async()=>{

    const moduleName =
    prompt("Enter module name");

    if(!moduleName) return;

    await updateDoc(
        doc(db,"courses",courseId),
        {

            modules:
            arrayUnion(moduleName)

        }
    );

    loadModules();

});


loadModules();