import { db } from "../js/firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");

const courseTitle =
document.getElementById("courseTitle");

const editTitle =
document.getElementById("editTitle");

const editDescription =
document.getElementById("editDescription");

const editCategory =
document.getElementById("editCategory");

const editLevel =
document.getElementById("editLevel");

const editDuration =
document.getElementById("editDuration");

const editStatus =
document.getElementById("editStatus");

const students =
document.getElementById("students");

const editBtn =
document.getElementById("editCourseBtn");

const saveBtn =
document.getElementById("saveCourseBtn");

const contentBtn =
document.getElementById("contentBtn");


const fields = [

    editTitle,
    editDescription,
    editCategory,
    editLevel,
    editDuration,
    editStatus

];


function setEditing(enabled){

    fields.forEach(field=>{

        field.disabled = !enabled;

    });

    editBtn.style.display =
    enabled ? "none" : "inline-flex";

    saveBtn.style.display =
    enabled ? "inline-flex" : "none";

}


async function loadCourse(){

    if(!courseId){

        alert("No course selected.");

        return;

    }

    try{

        const courseSnap =
        await getDoc(
            doc(db,"courses",courseId)
        );

        if(!courseSnap.exists()){

            alert("Course not found.");

            return;

        }

        const course =
        courseSnap.data();

        courseTitle.textContent =
        course.title || "Manage Course";

        editTitle.value =
        course.title || "";

        editDescription.value =
        course.description || "";

        editCategory.value =
        course.category || "";

        editLevel.value =
        course.level || "Beginner";

        editDuration.value =
        course.duration || "";

        editStatus.value =
        course.status || "Draft";

        students.textContent =
        course.students || 0;

        setEditing(false);

    }

    catch(error){

        console.error(error);

        alert("Failed to load course.");

    }

}


editBtn.addEventListener("click",()=>{

    setEditing(true);

});


saveBtn.addEventListener("click",async()=>{

    try{

        await updateDoc(

            doc(db,"courses",courseId),

            {

                title:
                editTitle.value.trim(),

                description:
                editDescription.value.trim(),

                category:
                editCategory.value.trim(),

                level:
                editLevel.value,

                duration:
                editDuration.value.trim(),

                status:
                editStatus.value

            }

        );

        courseTitle.textContent =
        editTitle.value;

        setEditing(false);

        alert("✅ Course updated successfully!");

    }

    catch(error){

        console.error(error);

        alert("Failed to update course.");

    }

});


contentBtn.addEventListener("click",()=>{

    window.location.href =
    `manage-content.html?id=${courseId}`;

});


loadCourse();