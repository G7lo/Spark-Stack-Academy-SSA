import { db, auth } from "../js/firebase.js";


import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



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

const enrollBtn =
document.getElementById("enrollBtn");


let currentUser = null;


async function checkEnrollment(){

    if(!currentUser){
        return;
    }


    const enrollmentQuery = query(
        collection(db,"enrollments"),
        where("studentId","==",currentUser.uid),
        where("courseId","==",courseId)
    );


    const enrollmentSnapshot =
    await getDocs(enrollmentQuery);



    if(!enrollmentSnapshot.empty){

        enrollBtn.textContent =
        "Continue Learning";


        enrollBtn.onclick = ()=>{

            window.location.href =
            `course-player.html?id=${courseId}`;

        };


    }

}

onAuthStateChanged(auth,async(user)=>{

    if(user){

        currentUser = user;

        await checkEnrollment();

    }

});


async function loadCourse(){


    const courseRef =
    doc(db,"courses",courseId);



    const snapshot =
    await getDoc(courseRef);



    if(snapshot.exists()){


        const data =
        snapshot.data();

const lessonsQuery = query(
    collection(db,"lessons"),
    where("courseId","==",courseId)
);


const lessonsSnapshot =
await getDocs(lessonsQuery);


courseLessons.textContent =
lessonsSnapshot.size;

        courseTitle.textContent =
        data.title;


        courseDescription.textContent =
        data.description;


        courseInstructor.textContent =
data.instructorName;


        courseDuration.textContent =
        data.duration;


        courseLevel.textContent =
        data.level;



    }


}

enrollBtn.addEventListener("click",async()=>{


    if(!currentUser){

        alert("Please login first.");

        return;

    }


    const enrollmentQuery = query(
        collection(db,"enrollments"),
        where("studentId","==",currentUser.uid),
        where("courseId","==",courseId)
    );


    const existingEnrollment =
    await getDocs(enrollmentQuery);



    if(!existingEnrollment.empty){

        window.location.href =
        `course-player.html?id=${courseId}`;

        return;

    }



    const studentSnap =
await getDoc(
    doc(db,"students",currentUser.uid)
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
        student?.name || "SSA Student",

        admissionNo:
        student?.admissionNo || "Pending",

        courseId,

        enrolledAt:
        serverTimestamp(),

        progress:0

    }
);


    alert("🎉 Enrolled successfully!");


    window.location.href =
    `course-player.html?id=${courseId}`;


});
loadCourse();