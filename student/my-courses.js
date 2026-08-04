import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const coursesGrid =
document.getElementById("coursesGrid");


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";

        return;

    }

    loadCourses(user.uid);

});


async function loadCourses(userId){

    coursesGrid.innerHTML = "";

    const enrollmentsQuery = query(
        collection(db,"enrollments"),
        where("studentId","==",userId)
    );

    const enrollmentsSnapshot =
    await getDocs(enrollmentsQuery);

    if(enrollmentsSnapshot.empty){

        coursesGrid.innerHTML = `

        <div class="loading-card">

            <h2>No Courses Yet 📚</h2>

            <p>
            Browse courses and enroll to start learning.
            </p>

        </div>

        `;

        return;

    }


    for(const enrollment of enrollmentsSnapshot.docs){

        const enrolled =
        enrollment.data();

        const courseSnap =
        await getDoc(
            doc(db,"courses",enrolled.courseId)
        );

        if(!courseSnap.exists()) continue;

        const course =
        courseSnap.data();

        const progress =
        enrolled.progress || 0;

        coursesGrid.innerHTML += `

        <div class="course-card">

            <h2>
                ${course.title}
            </h2>

            <p>
                👨‍🏫 ${course.instructorName || "Spark Stack Academy"}
            </p>

            <p>
                📚 ${course.level || "All Levels"}
            </p>

            <p class="progress-label">

                ${progress}% Complete

            </p>

            <div class="progress-bar">

                <div
                class="progress-fill"
                style="width:${progress}%">

                </div>

            </div>

            <button
            onclick="continueCourse('${enrolled.courseId}')">

                Continue Learning

            </button>

        </div>

        `;

    }

}


window.continueCourse = function(courseId){

    window.location.href =
    `course-player.html?id=${courseId}`;

};