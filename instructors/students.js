import { auth, db } from "../js/firebase.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const studentsList =
document.getElementById("studentsList");



onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="../login.html";

        return;

    }



    const coursesQuery =
    query(
        collection(db,"courses"),
        where("instructorId","==",user.uid)
    );



    const coursesSnapshot =
    await getDocs(coursesQuery);



    studentsList.innerHTML="";



    if(coursesSnapshot.empty){

        studentsList.innerHTML=
        "No courses found.";

        return;

    }



    let foundStudents = false;



    for(const courseDoc of coursesSnapshot.docs){


        const course =
        courseDoc.data();



        const enrollmentsQuery =
        query(
            collection(db,"enrollments"),
            where("courseId","==",courseDoc.id)
        );



        const enrollmentsSnapshot =
        await getDocs(enrollmentsQuery);



        for(const enrollmentDoc of enrollmentsSnapshot.docs){


            foundStudents=true;


            const enrollment =
            enrollmentDoc.data();



            studentsList.innerHTML += `

            <div class="student-card">


                <h3>
                ${enrollment.studentName || "Student"}
                </h3>


                <p>
                Admission:
                ${enrollment.admissionNo || "Not assigned"}
                </p>


                <p>
                Course:
                ${course.title}
                </p>


                <p>
                Progress:
                ${enrollment.progress || 0}%
                </p>


            </div>

            `;


        }


    }



    if(!foundStudents){

        studentsList.innerHTML=
        "No students enrolled yet 🚀";

    }


});