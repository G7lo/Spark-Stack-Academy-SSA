// =====================================
// SPARK STACK ACADEMY
// STUDENT PORTAL V1
// MY COURSES CONTROLLER
// PART 1
// =====================================



console.log("🚀 Courses Module Loaded");




// =========================
// FIREBASE IMPORTS
// =========================


import {

    auth,
    db

} from "../../js/firebase.js";



import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import {

    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";







// =========================
// INITIALIZE
// =========================


document.addEventListener(
"DOMContentLoaded",
()=>{


    initializeCourses();


});







// =========================
// START COURSES
// =========================


function initializeCourses(){


    console.log(
        "📚 Initializing Courses..."
    );



    onAuthStateChanged(

        auth,

        async(user)=>{


            if(!user){


                window.location.href =
                "../login.html";


                return;


            }



            console.log(
                "Student:",
                user.uid
            );



            await loadCourses(
                user.uid
            );


        }


    );


}







// =========================
// LOAD STUDENT COURSES
// =========================


async function loadCourses(uid){


    try{

    showCoursesLoading();


        const enrollmentQuery =
query(
    collection(db,"enrollments"),
    where(
        "userId",
        "==",
        uid
    )
);





        const enrollmentSnap =

        await getDocs(
            enrollmentQuery
        );





        console.log(

            "Enrollments:",
            enrollmentSnap.size

        );






        if(
            enrollmentSnap.empty
        ){


            showEmptyCourses();


            updateCourseStats([]);


            return;


        }






        let courses = [];






        for(
            const enrollmentDoc
            of enrollmentSnap.docs

        ){



            const enrollment =

            enrollmentDoc.data();





            const courseId =

            enrollment.courseId;






            if(!courseId)
                continue;







            const courseRef =

            doc(

                db,

                "courses",

                courseId

            );







            const courseSnap =

            await getDoc(
                courseRef
            );







            if(
                courseSnap.exists()
            ){


                courses.push({

                    id:courseId,

                    ...courseSnap.data(),

                    progress:
                    enrollment.progress || 0,


                    status:
                    enrollment.status || "in-progress"


                });


            }



        }






        console.log(

            "Loaded Courses:",
            courses

        );





        const studentSnap = await getDoc(
    doc(db, "students", uid)
);

const student = studentSnap.exists()
    ? studentSnap.data()
    : {};

renderCourses(
    courses,
    student
);



        updateCourseStats(
            courses
        );




    }


    catch(error){


        console.error(

            "Courses loading error:",
            error

        );


    }



}
// =====================================
// RENDER COURSES
// =====================================


function renderCourses(courses, student){


    const container =

    document.getElementById(
        "coursesContainer"
    );



    if(!container)
        return;





    if(courses.length === 0){


        showEmptyCourses();

        return;


    }






    container.innerHTML = "";






    courses.forEach(course=>{



        const progress =

        course.progress || 0;





        container.innerHTML += `


        <div class="course-card">



            <div class="course-image">


                <i data-lucide="book-open"></i>


            </div>





            <div class="course-content">



                <span class="course-status">

                    ${
                    progress >= 100
                    ?
                    "Completed"
                    :
                    "In Progress"
                    }

                </span>





                <h3>

    ${
        course.title ||
        "Untitled Course"
    }

    ${
        student?.premium === true
            ? `<span class="premium-badge" title="SSA Premium Verified">✓</span>`
            : ""
    }

</h3>





                <p>

                    ${
                    course.description ||
                    "Continue your learning journey."

                    }

                </p>







                <div class="course-progress">



                    <div class="progress-track">


                        <span style="
                        width:${progress}%;
                        "></span>


                    </div>



                    <small>

                        ${progress}% Complete

                    </small>



                </div>






                <a href="
                course-player.html?id=${course.id}
                "
                class="continue-btn">


                    ${
                    progress >= 100
                    ?
                    "Review Course"
                    :
                    "Continue Learning"
                    }


                </a>




            </div>



        </div>


        `;



    });






    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }



}








// =====================================
// COURSE STATS
// =====================================


function updateCourseStats(courses){



    let enrolled = courses.length;



    let inProgress = 0;


    let completed = 0;


    let hours = 0;





    courses.forEach(course=>{



        const progress =

        course.progress || 0;




        if(progress >= 100){


            completed++;


        }
        else{


            inProgress++;


        }





        hours +=

        course.hours || 0;



    });








    const enrolledEl =

    document.getElementById(
        "enrolledCount"
    );



    const progressEl =

    document.getElementById(
        "progressCount"
    );



    const completedEl =

    document.getElementById(
        "completedCount"
    );



    const hoursEl =

    document.getElementById(
        "hoursCount"
    );







    if(enrolledEl)

        enrolledEl.textContent =
        enrolled;





    if(progressEl)

        progressEl.textContent =
        inProgress;





    if(completedEl)

        completedEl.textContent =
        completed;





    if(hoursEl)

        hoursEl.textContent =
        hours + "h";



}








// =====================================
// EMPTY STATE
// =====================================


function showEmptyCourses(){


    const container =

    document.getElementById(
        "coursesContainer"
    );



    if(!container)
        return;





    container.innerHTML = `



    <div class="empty-state">


        <i data-lucide="book-open"></i>



        <h3>

            No Courses Yet

        </h3>



        <p>

            Start learning by enrolling into a course.

        </p>




    </div>



    `;





    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }



}
// =====================================
// COURSE SEARCH + ACTIONS
// PART 3
// =====================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    initializeCourseActions();


});





function initializeCourseActions(){



    const exploreBtn =

    document.getElementById(
        "exploreCoursesBtn"
    );



    if(exploreBtn){


        exploreBtn.addEventListener(
        "click",
        ()=>{


            window.location.href =
            "course-library.html";


        });


    }





}
function showCoursesLoading(){


const container =
document.getElementById(
"coursesContainer"
);



if(!container)
return;



container.innerHTML = `

<div class="empty-state">


<i data-lucide="loader"></i>


<h3>
Loading Courses...
</h3>


<p>
Fetching your learning progress
</p>


</div>

`;



if(typeof lucide !== "undefined"){

lucide.createIcons();

}


}