// =====================================
// SPARK STACK ACADEMY
// STUDENT PORTAL V1
// STUDENT APP CORE
// =====================================



// =========================
// FIREBASE IMPORTS
// =========================


import {
    auth,
    db
} from "../../js/firebase.js";

import {
    loadSidebar,
    updateSidebar
} from "../components/sidebar.js";


import {
    loadTopbar,
    updateTopbar
} from "../components/topbar.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import {

    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";






console.log(
    "🚀 SSA Student Portal V1 Connected"
);







// =========================
// INITIALIZATION
// =========================


document.addEventListener(
"DOMContentLoaded",
()=>{


    initializeStudentPortal();


});







// =========================
// START APPLICATION
// =========================

async function initializeStudentPortal(){

    await loadSidebar();

highlightActivePage();

    await loadTopbar();

    lucide.createIcons();

    updateDate();

    checkAuthentication();

}

// =========================
// DATE DISPLAY
// =========================


function updateDate(){


    const dateElement =
    document.getElementById(
        "todayDate"
    );



    if(!dateElement)
        return;



    const today =
    new Date();



    dateElement.textContent =
    today.toLocaleDateString(
        "en-US",
        {
            weekday:"long",
            month:"short",
            day:"numeric"
        }
    );


}







// =========================
// AUTH CHECK
// =========================


function checkAuthentication(){



    onAuthStateChanged(

        auth,

        async(user)=>{



            if(!user){


                window.location.href =
                "../login.html";


                return;


            }



            console.log(
                "Logged in:",
                user.email
            );


            await loadStudentProfile(
                user.uid
            );



        }

    );



}
// =====================================
// LOAD STUDENT PROFILE
// =====================================


async function loadStudentProfile(uid){


    try{


        const studentRef =
        doc(
            db,
            "students",
            uid
        );



        const studentSnap =
        await getDoc(studentRef);





        if(!studentSnap.exists()){


            console.warn(
                "Student profile not found"
            );


            return;


        }





        const student =
        studentSnap.data();




        console.log(
            "Student Profile:",
            student
        );





        updateDashboardUI(
            student
        );



await Promise.all([
    loadContinueCourses(uid),
    loadAnnouncements(),
    loadMessagesPreview(uid)
]);

loadGamification(student);

    }

    catch(error){


        console.error(
            "Profile loading error:",
            error
        );


    }


}








// =====================================
// UPDATE DASHBOARD UI
// =====================================


function updateDashboardUI(student){



    const name =
    student.name ||
    student.fullName ||
    "Student";



    const email =
    student.email ||
    "";



    const initial =
    name
    .charAt(0)
    .toUpperCase();






    // =========================
    // WELCOME NAME
    // =========================


    const studentName =
    document.getElementById(
        "studentName"
    );


    if(studentName){


        studentName.textContent =
        name;


    }






    // =========================
    // PROFILE CARD
    // =========================


    const fullName =
    document.getElementById(
        "studentFullName"
    );


    const studentEmail =
    document.getElementById(
        "studentEmail"
    );


    const avatar =
    document.getElementById(
        "profileAvatar"
    );




    if(fullName)
        fullName.textContent = name;



    if(studentEmail)
        studentEmail.textContent = email;



    if(avatar)
        avatar.textContent = initial;







    // =========================
    // ADMISSION NUMBER
    // =========================


    const admission =
    document.getElementById(
        "studentAdmission"
    );



    if(admission){


        admission.textContent =
        "Admission: " +
        (
            student.admissionNumber ||
            "Pending"
        );


    }






    // =========================
    // STATISTICS
    // =========================


    const stats =
    student.stats || {};




    const courseCount =
    document.getElementById(
        "courseCount"
    );


    const lessonCount =
    document.getElementById(
        "lessonCount"
    );


    const progress =
    document.getElementById(
        "progressPercent"
    );


    const certificates =
    document.getElementById(
        "certificateCount"
    );






    if(courseCount)

        courseCount.textContent =
        stats.coursesEnrolled || 0;




    if(lessonCount)

        lessonCount.textContent =
        stats.lessonsCompleted || 0;




    if(progress)

        progress.textContent =
        (
            stats.progress || 0
        )
        + "%";




    if(certificates)

        certificates.textContent =
        stats.certificates || 0;




    updateProgressBar(
        stats.progress || 0
    );

// =========================
// TOPBAR + SIDEBAR DATA
// =========================

updateSidebar(student);

updateTopbar(student);

}
// =====================================
// LOAD CONTINUE LEARNING COURSES
// =====================================


async function loadContinueCourses(uid){



    const container =
    document.getElementById(
        "continueCourses"
    );



    if(!container)
        return;





    try{


        const enrollmentQuery =
        query(

            collection(
                db,
                "enrollments"
            ),

            where(
                "studentId",
                "==",
                uid
            )

        );





        const enrollmentSnap =
        await getDocs(
            enrollmentQuery
        );







        if(
            enrollmentSnap.empty
        ){


            container.innerHTML = `


            <div class="course-card">


                <div class="loading-icon">

                    <i data-lucide="book-open"></i>

                </div>



                <h3>

                    No Active Courses

                </h3>



                <p>

                    Enroll into a course and start learning.

                </p>



                <a href="courses.html">

                    Browse Courses

                </a>


            </div>


            `;



            lucide.createIcons();


            return;


        }







        container.innerHTML = "";







        for(
            const enrollment 
            of enrollmentSnap.docs
        ){



            const enrollmentData =
            enrollment.data();






            const courseId =
            enrollmentData.courseId;






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
                !courseSnap.exists()
            )
                continue;







            const course =
            courseSnap.data();






            const progress =
            enrollmentData.progress || 0;







            container.innerHTML += `


            <div class="course-card">



                <div class="course-header">


                    <div class="loading-icon">


                        <i data-lucide="play-circle"></i>


                    </div>



                    <span>

                        ${progress}% Complete

                    </span>



                </div>





                <h3>

                    ${course.title || "Course"}

                </h3>





                <p>

                    ${
                    course.description ||
                    "Continue your learning journey."
                    }

                </p>






                <div class="course-progress">


                    <div>


                        <span
                        style="
                        width:${progress}%
                        ">
                        </span>


                    </div>



                </div>







                <a 
                href="course-player.html?id=${courseId}"
                class="continue-btn">


                    Continue Learning


                </a>





            </div>


            `;



        }






        lucide.createIcons();



    }


    catch(error){



        console.error(

            "Courses loading error:",
            error

        );



        container.innerHTML = `


        <p>

            Failed to load courses.

        </p>


        `;


    }



}







// =====================================
// UPDATE PROGRESS BAR
// =====================================


function updateProgressBar(value){



    const text =
    document.getElementById(
        "overallProgress"
    );



    const bar =
    document.getElementById(
        "progressBarFill"
    );




    if(text)

        text.textContent =
        value + "%";





    if(bar)

        bar.style.width =
        value + "%";



}
// =====================================
// SIDEBAR ACTIVE LINK
// =====================================


function highlightActivePage(){


    const currentPage =
    window.location.pathname
    .split("/")
    .pop();



    const links =
    document.querySelectorAll(
        ".sidebar-link"
    );



    links.forEach(link=>{


        const href =
        link.getAttribute(
            "href"
        );



        if(
            href === currentPage
        ){


            link.classList.add(
                "active"
            );


        }


    });



}






// =====================================
// GLOBAL ERROR HANDLER
// =====================================


window.addEventListener(
"error",
(event)=>{


    console.error(
        "SSA Portal Error:",
        event.error
    );


});


// =====================================
// GAMIFICATION SYSTEM
// =====================================


function loadGamification(student){


    const xp =
    student.xp || 0;


    const level =
    student.level || 1;


    const streak =
    student.streak || 0;


    const badges =
    student.badges || [];



    const xpText =
    document.getElementById(
        "studentXP"
    );


    const levelText =
    document.getElementById(
        "studentLevel"
    );


    const streakText =
    document.getElementById(
        "streakDays"
    );


    const badgeText =
    document.getElementById(
        "badgeCount"
    );


    const xpBar =
    document.getElementById(
        "xpProgress"
    );




    if(xpText)
        xpText.textContent = xp;



    if(levelText)
        levelText.textContent = level;



    if(streakText)
        streakText.textContent =
        streak + " Days";



    if(badgeText)
        badgeText.textContent =
        badges.length + " Badges";




    // XP calculation

    const levelXP =
    1000;


    const percentage =
    Math.min(
        (xp / levelXP) * 100,
        100
    );



    if(xpBar)

        xpBar.style.width =
        percentage + "%";



}

// =====================================
// ANNOUNCEMENTS
// =====================================


async function loadAnnouncements(){


const container =
document.getElementById(
    "announcementPreview"
);


if(!container)
return;



try{


const q =
query(

collection(
db,
"announcements"
),

orderBy(
"createdAt",
"desc"
),

limit(3)

);



const snap =
await getDocs(q);



if(snap.empty){

container.innerHTML =
`
<p>No announcements yet.</p>
`;

return;

}




container.innerHTML="";



snap.forEach(doc=>{


const data =
doc.data();



container.innerHTML +=
`

<div class="announcement-item">

<h4>
${data.title || "Announcement"}
</h4>

<p>
${data.message || ""}
</p>

</div>

`;


});



}



catch(error){

console.error(
"Announcements:",
error
);

}


}

// =====================================
// MESSAGE PREVIEW
// =====================================


async function loadMessagesPreview(uid){


const container =
document.getElementById(
"messagePreview"
);



if(!container)
return;



try{


const q =
query(

collection(
db,
"messages"
),

where(
"receiverId",
"==",
uid
),

orderBy(
"createdAt",
"desc"
),

limit(3)

);



const snap =
await getDocs(q);



if(snap.empty){

container.innerHTML =
`
<p>
No new messages.
</p>
`;

return;

}




container.innerHTML="";



snap.forEach(doc=>{


const msg =
doc.data();



container.innerHTML +=
`

<div class="message-item">

<strong>
${msg.senderName || "Student"}
</strong>

<p>
${msg.text}
</p>

</div>

`;


});



}

catch(error){


console.error(
"Messages:",
error
);


}



}

// =====================================
// FINAL READY CHECK
// =====================================


console.log(
    "%cSpark Stack Academy Student Portal V1 Ready 🚀",
    "color:#2979FF;font-size:16px;font-weight:bold;"
);