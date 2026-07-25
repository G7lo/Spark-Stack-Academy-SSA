import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const coursesContainer =
document.getElementById("coursesContainer");


const createCourseBtn =
document.getElementById("createCourseBtn");


createCourseBtn.addEventListener("click",()=>{

    window.location.href =
    "create-course.html";

});


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href =
        "login.html";

        return;

    }

    const q = query(
        collection(db,"courses"),
        where("instructorId","==",user.uid)
    );

    const snapshot =
    await getDocs(q);

    coursesContainer.innerHTML = "";

    if(snapshot.empty){

        coursesContainer.innerHTML = `
            <p>You haven't created any courses yet.</p>
        `;

        return;
    }

    snapshot.forEach((doc)=>{

        const course = doc.data();

        coursesContainer.innerHTML += `

        <div class="course-card">

            <h2>${course.title}</h2>

            <p>${course.description}</p>

            <span class="status">
                ${course.status}
            </span>

            <p>👨‍🎓 ${course.students || 0} Students</p>

            <button
                onclick="manageCourse('${doc.id}')">
                Manage
            </button>

        </div>

        `;

    });

});


window.manageCourse = function(courseId){

    window.location.href =
    `manage-course.html?id=${courseId}`;

};