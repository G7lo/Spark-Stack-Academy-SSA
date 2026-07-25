import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href =
        "../login.html";

        return;

    }


    const instructorRef =
    doc(db,"instructors",user.uid);


    const instructorSnap =
    await getDoc(instructorRef);



    if(!instructorSnap.exists()){

        window.location.href =
        "../login.html";

        return;

    }


});

const instructorName =
document.getElementById("instructorName");

const courseTotal =
document.getElementById("courseTotal");

const studentTotal =
document.getElementById("studentTotal");

const rating =
document.getElementById("rating");


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href =
        "login.html";

        return;

    }

    const instructorRef =
    doc(db,"instructors",user.uid);

    const instructorSnap =
    await getDoc(instructorRef);

    if(!instructorSnap.exists()){

        alert("Instructor profile not found.");

        return;

    }

    const data =
    instructorSnap.data();

    instructorName.textContent =
    `Welcome, ${data.name}`;

    courseTotal.textContent =
    data.totalCourses || 0;

    studentTotal.textContent =
    data.totalStudents || 0;

    rating.textContent =
    data.rating || 0;

});