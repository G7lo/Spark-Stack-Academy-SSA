import { db } from "../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
    auth
} from "../js/firebase.js";


const coursesContainer =
document.getElementById("coursesContainer");


async function loadCourses(){

    const q = query(
        collection(db,"courses"),
        where("status","==","Published")
    );


    const snapshot =
    await getDocs(q);


    coursesContainer.innerHTML = "";


    snapshot.forEach((doc)=>{

        const course =
        doc.data();


        coursesContainer.innerHTML += `

        <div class="course-card">

            <h3>${course.title}</h3>

            <p>${course.description}</p>

            <span>${course.level}</span>

            <p>${course.duration}</p>

            <div class="course-actions">

    <button onclick="viewCourse('${doc.id}')">
        View Course
    </button>

    <button onclick="enrollCourse('${doc.id}','${course.title}')">
        Enroll
    </button>

</div>

        </div>

        `;


    });

}


loadCourses();

window.viewCourse = function(courseId){

    window.location.href =
    `course.html?id=${courseId}`;

};
window.enrollCourse = async function(courseId, courseTitle){

    const user = auth.currentUser;


    if(!user){

        alert("Please login first");
        return;

    }


    try{

        await addDoc(
            collection(db,"enrollments"),
            {

                studentId:user.uid,

                courseId:courseId,

                courseTitle:courseTitle,

                progress:0,

                status:"active",

                enrolledAt:
                serverTimestamp()

            }
        );


        alert("🎓 Enrolled successfully!");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

};