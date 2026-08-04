import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const courseForm =
document.getElementById("courseForm");

const draftBtn =
document.getElementById("draftBtn");

const publishBtn =
document.getElementById("publishBtn");


let instructor = null;
let instructorData = null;
let courseStatus = "Draft";
let isSaving = false;



onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href =
        "../login.html";

        return;

    }

    instructor = user;

    try{

        const instructorRef =
        doc(db,"instructors",user.uid);

        const instructorSnap =
        await getDoc(instructorRef);

        if(!instructorSnap.exists()){

            alert("Instructor profile not found.");

            window.location.href =
            "../login.html";

            return;

        }

        instructorData =
        instructorSnap.data();

    }

    catch(error){

        console.error(error);

        alert("Failed to load instructor profile.");

    }

});



draftBtn.addEventListener("click",()=>{

    courseStatus = "Draft";

});



publishBtn.addEventListener("click",()=>{

    courseStatus = "Published";

    courseForm.requestSubmit();

});



courseForm.addEventListener("submit",async(e)=>{

    e.preventDefault();

    if(isSaving){

        return;

    }

    if(!instructor || !instructorData){

        alert("Please wait...");

        return;

    }

    isSaving = true;

    draftBtn.disabled = true;
    publishBtn.disabled = true;

    try{

        await addDoc(

            collection(db,"courses"),

            {

                title:
                title.value.trim(),

                description:
                description.value.trim(),

                category:
                category.value.trim(),

                level:
                level.value,

                duration:
                duration.value.trim(),

                price:
                Number(price.value) || 0,

                thumbnail:
                thumbnail.value.trim(),

                introVideo:
                introVideo.value.trim(),

                instructorId:
                instructor.uid,

                instructorName:
                instructorData.name,

                students:0,

                lessons:0,

                status:
                courseStatus,

                createdAt:
                serverTimestamp()

            }

        );


        await updateDoc(

            doc(db,"instructors",instructor.uid),

            {

                totalCourses:

                (instructorData.totalCourses || 0) + 1

            }

        );


        alert(

            courseStatus === "Published"

            ?

            "🚀 Course published successfully!"

            :

            "💾 Draft saved successfully!"

        );


        window.location.href =
        "courses.html";

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

    finally{

        isSaving = false;

        draftBtn.disabled = false;

        publishBtn.disabled = false;

    }

});