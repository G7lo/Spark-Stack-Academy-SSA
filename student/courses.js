import { db } from "../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const coursesGrid =
document.getElementById("coursesGrid");


async function loadCourses(){

    const q = query(
        collection(db,"courses"),
        where("status","==","Published")
    );


    const snapshot =
    await getDocs(q);


    coursesGrid.innerHTML = "";


    if(snapshot.empty){

        coursesGrid.innerHTML = `

        <p>
        No courses available yet.
        </p>

        `;

        return;

    }


    snapshot.forEach((doc)=>{

        const course =
        doc.data();


        coursesGrid.innerHTML += `

        <div class="course-card">

            <h2>
            ${course.title}
            </h2>


            <p>
            ${course.description}
            </p>


            <p>
            👨‍🏫 ${course.instructorName || "Spark Stack Academy"}
            </p>


            <p>
            📚 ${course.level}
            </p>


            <button
onclick="openCourse('${doc.id}')">

View Course

</button>


        </div>

        `;

    });


}



window.openCourse = function(courseId){

    window.location.href =
    `course.html?id=${courseId}`;

};



loadCourses();