import { db } from "../js/firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
new URLSearchParams(window.location.search);

const courseId =
params.get("course");

const moduleId =
params.get("module");


const lessonForm =
document.getElementById("lessonForm");

let isSaving = false;



lessonForm.addEventListener("submit",async(e)=>{

    e.preventDefault();

    if(isSaving){

        return;

    }

    if(!courseId || !moduleId){

        alert("Invalid lesson information.");

        return;

    }

    isSaving = true;

    const submitBtn =
    lessonForm.querySelector("button[type='submit']");

    submitBtn.disabled = true;

    try{

        await addDoc(

            collection(db,"lessons"),

            {

                courseId,

                moduleId,

                title:
                lessonTitle.value.trim(),

                video:
                videoUrl.value.trim(),

                duration:
                duration.value.trim(),

                notes:
                notes.value.trim(),

                resource:
                resource.value.trim(),

                freePreview:
                freePreview.checked,

                order:
                Number(lessonOrder.value) || 1,

                createdAt:
                serverTimestamp()

            }

        );

        alert("🎉 Lesson added successfully!");

        window.location.href =
        `manage-content.html?id=${courseId}`;

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

    finally{

        isSaving = false;

        submitBtn.disabled = false;

    }

});