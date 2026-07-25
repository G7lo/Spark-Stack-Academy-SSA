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


const category =
document.getElementById("category");


const level =
document.getElementById("level");


const duration =
document.getElementById("duration");


const students =
document.getElementById("students");


const status =
document.getElementById("status");




async function loadCourse(){


    if(!courseId){

        alert("No course selected");

        return;

    }



    const courseRef =
    doc(db,"courses",courseId);



    const courseSnap =
    await getDoc(courseRef);



    if(!courseSnap.exists()){

        alert("Course not found");

        return;

    }



    const course =
    courseSnap.data();



    courseTitle.innerText =
    course.title;



    courseDescription.innerText =
    course.description;



    category.innerText =
    course.category;



    level.innerText =
    course.level;



    duration.innerText =
    course.duration;



    students.innerText =
    course.students;



    status.innerText =
    course.status;


}



loadCourse();