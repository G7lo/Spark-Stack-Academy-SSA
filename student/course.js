import { db, auth } from "../js/firebase.js";

import {
    doc,
    getDoc,
    addDoc,
    updateDoc,
    increment,
    collection,
    serverTimestamp,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


const params =
new URLSearchParams(window.location.search);

const courseId =
params.get("id");


const courseTitle =
document.getElementById("courseTitle");

const courseDescription =
document.getElementById("courseDescription");

const courseInstructor =
document.getElementById("courseInstructor");

const courseDuration =
document.getElementById("courseDuration");

const courseLessons =
document.getElementById("courseLessons");

const courseLevel =
document.getElementById("courseLevel");

const modulesPreview =
document.getElementById("modulesPreview");

const enrollBtn =
document.getElementById("enrollBtn");


let currentUser = null;



/* ===========================
   VALIDATE COURSE ID
=========================== */

if(!courseId){

    courseTitle.textContent =
    "Course Not Found";

    courseDescription.textContent =
    "No course was selected.";

    enrollBtn.style.display = "none";

    throw new Error("Missing Course ID");

}



/* ===========================
   AUTH
=========================== */

onAuthStateChanged(auth, async(user)=>{

    if(user){

        currentUser = user;

        await checkEnrollment();

    }

});



/* ===========================
   CHECK ENROLLMENT
=========================== */

async function checkEnrollment(){

    if(!currentUser) return;


    const enrollmentQuery = query(

        collection(db,"enrollments"),

        where("studentId","==",currentUser.uid),

        where("courseId","==",courseId)

    );


    const snapshot =
    await getDocs(enrollmentQuery);


    if(!snapshot.empty){

        enrollBtn.textContent =
        "Continue Learning ▶";

        enrollBtn.onclick = ()=>{

            window.location.href =
            `course-player.html?id=${courseId}`;

        };

    }

}



/* ===========================
   LOAD COURSE
=========================== */

async function loadCourse(){

    try{

        const courseRef =
        doc(db,"courses",courseId);

        const snapshot =
        await getDoc(courseRef);


        if(!snapshot.exists()){

            courseTitle.textContent =
            "Course Not Found";

            courseDescription.textContent =
            "This course no longer exists.";

            enrollBtn.style.display =
            "none";

            return;

        }


        const data =
        snapshot.data();


        courseTitle.textContent =
        data.title;

        courseDescription.textContent =
        data.description ||
        "No description available.";

        courseInstructor.textContent =
        data.instructorName ||
        "Spark Stack Academy";

        courseDuration.textContent =
        data.duration ||
        "Self Paced";

        courseLevel.textContent =
        data.level ||
        "Beginner";



        /* LESSON COUNT */

        const lessonsQuery = query(

            collection(db,"lessons"),

            where("courseId","==",courseId)

        );


        const lessonsSnapshot =
        await getDocs(lessonsQuery);


        courseLessons.textContent =
        `${lessonsSnapshot.size} Lessons`;



        /* MODULE PREVIEW */

        const modulesQuery = query(

            collection(db,"modules"),

            where("courseId","==",courseId)

        );


        const modulesSnapshot =
        await getDocs(modulesQuery);


        modulesPreview.innerHTML = "";


        if(modulesSnapshot.empty){

            modulesPreview.innerHTML =

            "<p>No modules yet.</p>";

        }else{

            modulesSnapshot.forEach((doc)=>{

                const module =
                doc.data();

                modulesPreview.innerHTML += `

                <div class="module-card">

                    📘
                    ${module.title}

                </div>

                `;

            });

        }

    }

    catch(error){

        console.error(error);

        courseTitle.textContent =
        "Unable to load course.";

        courseDescription.textContent =
        "Please try again later.";

    }

}



/* ===========================
   ENROLL
=========================== */

enrollBtn.addEventListener("click", async()=>{

    if(!currentUser){

        alert("Please login first.");

        return;

    }


    try{

        enrollBtn.disabled = true;

        enrollBtn.textContent =
        "Enrolling...";


        const enrollmentQuery = query(

            collection(db,"enrollments"),

            where("studentId","==",currentUser.uid),

            where("courseId","==",courseId)

        );


        const existing =
        await getDocs(enrollmentQuery);


        if(!existing.empty){

            window.location.href =
            `course-player.html?id=${courseId}`;

            return;

        }



        const studentSnap =
        await getDoc(

            doc(
                db,
                "students",
                currentUser.uid
            )

        );


        const student =
        studentSnap.exists()

        ? studentSnap.data()

        : {};



        await addDoc(

            collection(db,"enrollments"),

            {

                studentId:
                currentUser.uid,

                studentName:
                student.name ||
                "SSA Student",

                admissionNumber:
student.admissionNumber || "Pending",

                courseId,

                progress:0,

                enrolledAt:
                serverTimestamp()

            }

        );

await updateDoc(

    doc(db,"students",currentUser.uid),

    {

        "stats.coursesEnrolled":
        increment(1)

    }

);
await updateDoc(

    doc(db,"courses",courseId),

    {

        students:
        increment(1)

    }

);

        await addDoc(

            collection(db,"notifications"),

            {

                userId:
                currentUser.uid,

                title:
                "🎉 Enrollment Successful",

                message:
                `You have joined ${courseTitle.textContent}. Start learning now!`,

                type:
                "enrollment",

                read:false,

                createdAt:
                serverTimestamp()

            }

        );


        enrollBtn.textContent =
        "Continue Learning ▶";


        alert(
            "🎉 Enrollment successful!"
        );


        window.location.href =
        `course-player.html?id=${courseId}`;

    }

    catch(error){

        console.error(error);

        alert(
            "Unable to enroll. Please try again."
        );

        enrollBtn.disabled = false;

        enrollBtn.textContent =
        "Enroll Now 🚀";

    }

});



loadCourse();