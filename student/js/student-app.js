// ===========================
// SSA STUDENT APP CORE
// ===========================

import { auth, db } from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


console.log("SSA STUDENT APP CONNECTED");




// ===========================
// INITIALIZE
// ===========================


window.addEventListener(
"DOMContentLoaded",
()=>{


    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }


    loadStudentData();


    highlightActivePage();


});
// ===========================
// LOAD STUDENT DATA
// ===========================


function loadStudentData(){


    onAuthStateChanged(
    auth,
    async(user)=>{


        if(!user){

            window.location.href="../login.html";

            return;

        }



        try{


            const studentRef =
            doc(
                db,
                "students",
                user.uid
            );



            const studentSnap =
            await getDoc(studentRef);



            if(!studentSnap.exists()){

                console.log(
                    "Student profile missing"
                );

                return;

            }



            const student =
            studentSnap.data();



            updateStudentUI(student);
            loadContinueCourses(user.uid);
            loadStudentStats(student);



        }
        catch(error){


            console.error(
                "Student loading error:",
                error
            );


        }


    });


}
// =====================================
// UPDATE STUDENT UI
// =====================================

function updateStudentUI(student){


    const name =
    student.name || "Student";


    const email =
    student.email || "";



    const initial =
    name
    .charAt(0)
    .toUpperCase();





    // DASHBOARD

    const studentName =
    document.getElementById(
        "studentName"
    );


    const fullName =
    document.getElementById(
        "studentFullName"
    );


    const studentEmail =
    document.getElementById(
        "studentEmail"
    );


    const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );





    if(studentName)
        studentName.textContent = name;



    if(fullName)
        fullName.textContent = name;



    if(studentEmail)
        studentEmail.textContent = email;



    if(profileAvatar)
        profileAvatar.textContent = initial;







    // SIDEBAR

    const sidebarName =
    document.getElementById(
        "sidebarName"
    );


    const sidebarAvatar =
    document.getElementById(
        "sidebarAvatar"
    );



    if(sidebarName)
        sidebarName.textContent = name;



    if(sidebarAvatar)
        sidebarAvatar.textContent = initial;








    // TOPBAR

    const topAvatar =
    document.getElementById(
        "topAvatar"
    );



    if(topAvatar)
        topAvatar.textContent = initial;



}

async function loadContinueCourses(uid){

    const container =
    document.getElementById("continueCourses");


    if(!container) return;


    try{


        const enrollmentQuery =
        query(
            collection(db,"enrollments"),
            where("studentId","==",uid)
        );


        const enrollmentSnap =
        await getDocs(enrollmentQuery);



        if(enrollmentSnap.empty){

            container.innerHTML = `

            <h3>
                No Active Course
            </h3>

            <p>
                Enroll into a course to begin learning.
            </p>

            <a href="courses.html">
                Browse Courses
            </a>

            `;

            return;

        }



        container.innerHTML = "";



        const courses =
        enrollmentSnap.docs.slice(0,2);



        for(const enrollment of courses){


            const enrollmentData =
            enrollment.data();



            const courseSnap =
            await getDoc(
                doc(
                    db,
                    "courses",
                    enrollmentData.courseId
                )
            );


            if(courseSnap.exists()){


                const course =
                courseSnap.data();



                container.innerHTML += `

                <div class="course-mini-card">


                    <h3>
                        ${course.title}
                    </h3>


                    <p>
                        ${enrollmentData.progress}% Complete
                    </p>


                    <a href="course-player.html?id=${courseSnap.id}">
                        Continue Learning
                    </a>


                </div>

                `;


            }

        }


    }
    catch(error){

        console.error(
            "Continue Courses:",
            error
        );

    }

}

function loadStudentStats(student){

    const stats =
    student.stats || {};


    document.getElementById("courseCount")
    .textContent =
    stats.coursesEnrolled || 0;


    document.getElementById("lessonCount")
    .textContent =
    stats.lessonsCompleted || 0;


    document.getElementById("progressPercent")
    .textContent =
    (stats.progress || 0) + "%";


    document.getElementById("certificateCount")
    .textContent =
    stats.certificates || 0;

}