import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let instructor = null;
let authReady = false;


onAuthStateChanged(auth,(user)=>{

    if(!user){

        window.location.href = "login.html";

        return;

    }


    instructor = user;

    authReady = true;

});

const courseForm =
document.getElementById("courseForm");

const draftBtn =
document.getElementById("draftBtn");

const publishBtn =
document.getElementById("publishBtn");

let courseStatus = "Draft";

draftBtn.addEventListener("click",()=>{

    courseStatus = "Draft";

});

publishBtn.addEventListener("click",()=>{

    courseStatus = "Published";

    courseForm.requestSubmit();

});

courseForm.addEventListener("submit",async(e)=>{

    e.preventDefault();

    if(!authReady || !instructor){

    alert("Authentication still loading. Try again.");

    return;

}
const instructorRef =
doc(db, "instructors", instructor.uid);

const instructorSnap =
await getDoc(instructorRef);

const instructorData =
instructorSnap.data();
    await addDoc(collection(db,"courses"),{

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

    });

    alert("🎉 Course saved successfully!");

    window.location.href =
    "courses.html";

});