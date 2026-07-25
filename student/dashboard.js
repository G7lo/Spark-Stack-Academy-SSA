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

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href =
        "../login.html";

        return;

    }


    const studentRef =
    doc(db,"students",user.uid);


    const studentSnap =
    await getDoc(studentRef);



    if(!studentSnap.exists()){

        window.location.href =
        "../login.html";

        return;

    }


});


const studentName =
document.getElementById("studentName");


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


    if(user){


const userRef = doc(db,"students",user.uid);


        const snapshot =
await getDoc(userRef);



        if(snapshot.exists()){


            const data =
            snapshot.data();

const enrollmentsQuery =
query(
    collection(db,"enrollments"),
    where("studentId","==",user.uid)
);


const enrollmentsSnapshot =
await getDocs(enrollmentsQuery);

console.log("Enrollments:", enrollmentsSnapshot.size);

enrollmentsSnapshot.forEach((item)=>{
    console.log(item.data());
});

const totalCourses =
enrollmentsSnapshot.size;

            studentName.textContent =
            data.name || "SSA Student";


            courseCount.textContent =
`${totalCourses} Enrolled`;


let totalProgress = 0;


enrollmentsSnapshot.forEach((item)=>{

    const courseData = item.data();

    totalProgress += courseData.progress || 0;

});


let averageProgress = 0;


if(enrollmentsSnapshot.size > 0){

    averageProgress =
    Math.round(
        totalProgress / enrollmentsSnapshot.size
    );

}


progressCount.textContent =
`${averageProgress}% Complete`;

const certificatesQuery =
query(
    collection(db,"certificates"),
    where("studentId","==",user.uid)
);

const certificatesSnapshot =
await getDocs(certificatesQuery);


certificateCount.textContent =
`${certificatesSnapshot.size} Earned`;

const courses = [];

enrollmentsSnapshot.forEach((item)=>{

    courses.push(item.data());

});


if(courses.length === 0){

    continueLearning.innerHTML =
    "No courses started yet 🚀";

}else{

    continueLearning.innerHTML =
    "";

    for(const course of courses){

        const courseRef =
        doc(db,"courses",course.courseId);


        const courseSnap =
        await getDoc(courseRef);


        if(courseSnap.exists()){

    const data =
    courseSnap.data();


    continueLearning.innerHTML += `

    <div class="course-mini-card">

        <h3>
        ${data.title}
        </h3>

        <button onclick="openCourse('${course.courseId}')">
        Continue Learning
        </button>

    </div>

    `;

}else{

    continueLearning.innerHTML += `

    <p>
    Course not found: ${course.courseId}
    </p>

    `;

}

    }

}


        }


    }else{


        window.location.href="../login.html";


    }


});

window.openCourse = function(id){

    window.location.href =
    `course-player.html?id=${id}`;

};