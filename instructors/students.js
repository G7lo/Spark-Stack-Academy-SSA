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

const uniqueStudents = new Map();

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



            uniqueStudents.set(
    enrollment.studentId,
    {
        name: enrollment.studentName || "Student",
        admissionNo: enrollment.admissionNo || "Not assigned",
        courses: uniqueStudents.has(enrollment.studentId)
        ?
        uniqueStudents.get(enrollment.studentId).courses + ", " + course.title
        :
        course.title,
        progress: enrollment.progress || 0,
        enrolledAt: enrollment.enrolledAt
    }
);

uniqueStudents.forEach((student)=>{


studentsList.innerHTML += `

<tr>


<td>

<div class="student-cell">

<div class="student-avatar-small">

${student.name.charAt(0).toUpperCase()}

</div>


<span>

${student.name}

</span>


</div>

</td>



<td>

${student.admissionNo}

</td>



<td>

${student.courses}

</td>



<td>

<span class="progress-pill">

${student.progress}%

</span>

</td>



<td>

${student.enrolledAt?.toDate
?
student.enrolledAt.toDate().toLocaleDateString()
:
"Recently"}

</td>


</tr>

`;

});


        }


    }



    if(!foundStudents){

        studentsList.innerHTML=
        "No students enrolled yet 🚀";

    }


});