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

        container.innerHTML += `

<div class="course-card">

    <h2>
        ${course.title}
    </h2>


    <p>
        ${course.description || "No description available."}
    </p>



    <div class="course-meta">

        <span>
            📚 ${course.category || "Course"}
        </span>


        <span>
            👨‍🎓 ${course.students || 0} Students
        </span>


    </div>



    <div class="course-actions">


        <a 
        href="manage-course.html?id=${doc.id}"
        class="manage-btn">

            Manage

        </a>



        <a
        href="edit-course.html?id=${doc.id}"
        class="edit-btn">

            Edit

        </a>


    </div>


</div>

`;

    });

});


window.manageCourse = function(courseId){

    window.location.href =
    `manage-course.html?id=${courseId}`;

};
window.editCourse = function(courseId){

    window.location.href =
    `edit-course.html?id=${courseId}`;

};