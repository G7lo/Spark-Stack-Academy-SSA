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



const instructorName =
document.getElementById("instructorName");

const courseTotal =
document.getElementById("courseTotal");

const studentTotal =
document.getElementById("studentTotal");

const rating =
document.getElementById("rating");

const recentCourses =
document.getElementById("recentCourses");

const performanceList =
document.getElementById("performanceList");




onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="../login.html";

        return;

    }



    try{


        // Load instructor profile

        const instructorRef =
        doc(db,"instructors",user.uid);



        const instructorSnap =
        await getDoc(instructorRef);



        if(!instructorSnap.exists()){

            alert("Instructor profile not found.");

            return;

        }



        const instructorData =
        instructorSnap.data();



        instructorName.textContent =
        `Welcome, ${instructorData.name} 👋`;



        rating.textContent =
        instructorData.rating || "0.0";




        // Load instructor courses

        const coursesQuery =
        query(

            collection(db,"courses"),

            where(
                "instructorId",
                "==",
                user.uid
            )

        );



        const coursesSnapshot =
        await getDocs(coursesQuery);



        courseTotal.textContent =
        coursesSnapshot.size;



        let totalStudents = 0;



        recentCourses.innerHTML = "";

        performanceList.innerHTML = "";




        if(coursesSnapshot.empty){


            recentCourses.innerHTML = `

            <p>
            No courses created yet 🚀
            </p>

            `;


            performanceList.innerHTML = `

            <p>
            No performance data yet.
            </p>

            `;


        }



        else{


            for(const courseDoc of coursesSnapshot.docs){



                const data =
                courseDoc.data();



                const courseId =
                courseDoc.id;



                // Get enrollments

                const enrollmentQuery =
                query(

                    collection(db,"enrollments"),

                    where(
                        "courseId",
                        "==",
                        courseId
                    )

                );



                const enrollmentSnapshot =
                await getDocs(enrollmentQuery);



                const enrolledStudents =
                enrollmentSnapshot.size;



                totalStudents +=
                enrolledStudents;



                let totalProgress = 0;



                enrollmentSnapshot.forEach((student)=>{


                    totalProgress +=
                    student.data().progress || 0;


                });



                let averageProgress = 0;



                if(enrolledStudents > 0){


                    averageProgress =
                    Math.round(
                        totalProgress /
                        enrolledStudents
                    );


                }




                // Recent courses

                recentCourses.innerHTML += `

                <div class="course-preview">


                    <h3>
                    ${data.title}
                    </h3>


                    <p>
                    ${data.status}
                    </p>


                </div>

                `;




                // Performance

                performanceList.innerHTML += `

                <div class="performance-card">


                    <div class="performance-header">


                        <h3>
                        ${data.title}
                        </h3>


                        <span>
                        ${enrolledStudents} Students
                        </span>


                    </div>



                    <div class="progress-bar">


                        <div class="progress-fill"
                        style="width:${averageProgress}%">
                        </div>


                    </div>



                    <p>
                    Average Completion:
                    ${averageProgress}%
                    </p>



                </div>

                `;


            }


        }




        studentTotal.textContent =
        totalStudents;



    }


    catch(error){


        console.error(
            "Dashboard Error:",
            error
        );


        alert(
            "Failed loading dashboard."
        );


    }



});