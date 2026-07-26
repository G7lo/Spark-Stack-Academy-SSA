import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const studentName =
document.getElementById("studentName");

const studentLevel =
document.getElementById("studentLevel");

const studentAdmission =
document.getElementById("studentAdmission");

const courseCount =
document.getElementById("courseCount");

const progressCount =
document.getElementById("progressCount");

const certificateCount =
document.getElementById("certificateCount");

const continueLearning =
document.getElementById("continueLearning");

const progressList =
document.getElementById("progressList");


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";

        return;

    }

    try{

        const studentRef =
        doc(db,"students",user.uid);

        const studentSnap =
        await getDoc(studentRef);

        if(!studentSnap.exists()){

            window.location.href="../login.html";

            return;

        }

        const student =
        studentSnap.data();

        studentName.textContent =
        student.name || "SSA Student";

        studentLevel.textContent =
        student.level || "SSA Learner";


studentAdmission.textContent =
`Admission No: ${student.admissionNo || "Not Assigned"}`;

        /* -----------------------------
           ENROLLMENTS
        ------------------------------ */

        const enrollmentsQuery =
        query(
            collection(db,"enrollments"),
            where("studentId","==",user.uid)
        );

        const enrollmentsSnapshot =
        await getDocs(enrollmentsQuery);

        courseCount.textContent =
        `${enrollmentsSnapshot.size} Enrolled`;


        let totalProgress = 0;

        const courses = [];

        enrollmentsSnapshot.forEach((doc)=>{

            const data =
            doc.data();

            totalProgress +=
            data.progress || 0;

            courses.push(data);

        });


        const averageProgress =
        courses.length > 0
        ?

        Math.round(
        totalProgress /
        courses.length
        )

        :

        0;


        progressCount.textContent =
        `${averageProgress}% Complete`;


        /* -----------------------------
           CERTIFICATES
        ------------------------------ */

        const certificatesQuery =
        query(
            collection(db,"certificates"),
            where("studentId","==",user.uid)
        );

        const certificatesSnapshot =
        await getDocs(certificatesQuery);

        certificateCount.textContent =
        `${certificatesSnapshot.size} Earned`;


        /* -----------------------------
           CONTINUE LEARNING
        ------------------------------ */

        continueLearning.innerHTML="";

        if(courses.length===0){

            continueLearning.innerHTML=`

            <div class="empty-state">

            No courses started yet 🚀

            </div>

            `;

        }else{

            for(const course of courses){

                const courseSnap =
                await getDoc(
                    doc(db,"courses",course.courseId)
                );

                if(courseSnap.exists()){

                    const data =
                    courseSnap.data();

                    continueLearning.innerHTML+=`

                    <div class="course-mini-card">

                        <h3>

                        ${data.title}

                        </h3>

                        <button
                        onclick="openCourse('${course.courseId}')">

                        Continue Learning

                        </button>

                    </div>

                    `;

                }

            }

        }


        /* -----------------------------
           PROGRESS SECTION
        ------------------------------ */

        progressList.innerHTML=`

        <div class="progress-card">

            <h3>

            Overall Progress

            </h3>

            <div class="progress-bar">

                <div
                class="progress-fill"

                style="width:${averageProgress}%">

                </div>

            </div>

            <span>

            ${averageProgress}% Complete

            </span>

        </div>

        `;

    }

    catch(error){

        console.error(error);

    }

});


window.openCourse=function(id){

    window.location.href=
    `course-player.html?id=${id}`;

};