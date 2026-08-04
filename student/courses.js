import { db } from "../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const coursesGrid =
document.getElementById("coursesGrid");



async function loadCourses(){

    try{

        const q = query(
            collection(db,"courses"),
            where("status","==","Published")
        );

        const snapshot =
        await getDocs(q);


        coursesGrid.innerHTML = "";


        if(snapshot.empty){

            coursesGrid.innerHTML = `

            <div class="loading-card">

                <h2>📚 No Courses Yet</h2>

                <p>
                New courses will appear here soon.
                </p>

            </div>

            `;

            return;

        }


        snapshot.forEach((doc)=>{

            const course =
            doc.data();


            coursesGrid.innerHTML += `

            <div class="course-card">

                <h2>${course.title}</h2>

                <p>
                ${course.description || "No description available."}
                </p>


                <div class="course-meta">

                    <span class="course-tag">
                        👨‍🏫
                        ${course.instructorName || "Spark Stack Academy"}
                    </span>

                    <span class="course-tag">
                        📚
                        ${course.level || "All Levels"}
                    </span>

                </div>


                <button
                onclick="openCourse('${doc.id}')">

                    Continue Learning →

                </button>

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

        coursesGrid.innerHTML = `

        <div class="loading-card">

            <h2>⚠️ Something went wrong</h2>

            <p>
            Unable to load courses.
            Please try again.
            </p>

        </div>

        `;

    }

}



window.openCourse = function(courseId){

    window.location.href =
    `course.html?id=${courseId}`;

};



loadCourses();