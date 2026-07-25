import { db, auth } from "../js/firebase.js";


import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



const params =
new URLSearchParams(window.location.search);


const courseId =
params.get("id");



const courseTitle =
document.getElementById("courseTitle");


const courseDescription =
document.getElementById("courseDescription");


const courseInstructor =
document.getElementById("courseInstructor");


const courseDuration =
document.getElementById("courseDuration");


const courseLessons =
document.getElementById("courseLessons");


const courseLevel =
document.getElementById("courseLevel");

const enrollBtn =
document.getElementById("enrollBtn");


let currentUser = null;


onAuthStateChanged(auth,(user)=>{

    if(user){

        currentUser = user;

    }

});


async function loadCourse(){


    const courseRef =
    doc(db,"courses",courseId);



    const snapshot =
    await getDoc(courseRef);



    if(snapshot.exists()){


        const data =
        snapshot.data();



        courseTitle.textContent =
        data.title;


        courseDescription.textContent =
        data.description;


        courseInstructor.textContent =
data.instructorName;


        courseDuration.textContent =
        data.duration;


        courseLessons.textContent =
        data.lessons;


        courseLevel.textContent =
        data.level;



    }


}

enrollBtn.addEventListener("click",async()=>{


    if(!currentUser){

        alert("Please login first.");

        return;

    }


    await addDoc(
        collection(db,"enrollments"),
        {

            studentId:
            currentUser.uid,

            courseId,

            enrolledAt:
            serverTimestamp(),

            progress:0

        }
    );


    alert("🎉 Enrolled successfully!");


    window.location.href =
    `course-player.html?id=${courseId}`;


});
loadCourse();