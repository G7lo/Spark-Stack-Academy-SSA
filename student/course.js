import { db } from "../js/firebase.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



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
        data.instructor;


        courseDuration.textContent =
        data.duration;


        courseLessons.textContent =
        data.lessons;


        courseLevel.textContent =
        data.level;



    }


}


loadCourse();