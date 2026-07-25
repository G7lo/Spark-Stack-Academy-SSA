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
document.querySelector(".profile-info h2");


const courseCount =
document.querySelector(".student-card:nth-child(1) p");


const progressCount =
document.querySelector(".student-card:nth-child(2) p");


const certificateCount =
document.querySelector(".student-card:nth-child(3) p");



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




        }


    }else{


        window.location.href="../login.html";


    }


});