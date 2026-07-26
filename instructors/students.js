import { auth, db } from "../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const studentsTable =
document.getElementById("studentsTable");

const totalStudents =
document.getElementById("totalStudents");

const totalCourses =
document.getElementById("totalCourses");

const activeStudents =
document.getElementById("activeStudents");

let studentsData = [];

auth.onAuthStateChanged(async(user)=>{

    if(!user){

        window.location.href="../login.html";
        return;

    }

    await loadStudents(user);

});



async function loadStudents(user){

    studentsTable.innerHTML=`
    <tr>
        <td colspan="6">
            Loading students...
        </td>
    </tr>
    `;

    try{

        studentsData=[];

        const coursesSnapshot=
        await getDocs(
            query(
                collection(db,"courses"),
                where(
                    "instructorId",
                    "==",
                    user.uid
                )
            )
        );

        const studentMap=new Map();

        for(const courseDoc of coursesSnapshot.docs){

            const course=courseDoc.data();

            const enrollmentsSnapshot=
            await getDocs(
                query(
                    collection(db,"enrollments"),
                    where(
                        "courseId",
                        "==",
                        courseDoc.id
                    )
                )
            );

            for(const enrollmentDoc of enrollmentsSnapshot.docs){

                const enrollment=
                enrollmentDoc.data();

                const studentSnap=
                await getDoc(
                    doc(
                        db,
                        "students",
                        enrollment.studentId
                    )
                );

                if(!studentSnap.exists()) continue;

                const student=
                studentSnap.data();

                if(studentMap.has(studentSnap.id)){

                    studentMap
                    .get(studentSnap.id)
                    .courses
                    .push({

                        title:
                        course.title,

                        progress:
                        enrollment.progress||0

                    });

                }

                else{

                    studentMap.set(
                        studentSnap.id,
                        {

                            id:
                            studentSnap.id,

                            admissionNumber:
                            student.admissionNumber||
                            enrollment.admissionNo||
                            "Pending",

                            name:
                            student.name,

                            email:
                            student.email,

                            status:
                            student.status||
                            "Active",

                            courses:[

                                {

                                    title:
                                    course.title,

                                    progress:
                                    enrollment.progress||0

                                }

                            ]

                        }
                    );

                }

            }

        }

        studentsData=
        Array.from(studentMap.values());

        renderStudents(studentsData);

    }

    catch(error){

        console.error(error);

        studentsTable.innerHTML=`
        <tr>
            <td colspan="6">
                Failed to load students.
            </td>
        </tr>
        `;

    }

}



function renderStudents(students){

    studentsTable.innerHTML="";

    let coursesCount=0;

    if(students.length===0){

        studentsTable.innerHTML=`
        <tr>
            <td colspan="6">
                No students enrolled yet.
            </td>
        </tr>
        `;

        totalStudents.textContent=0;
        totalCourses.textContent=0;
        activeStudents.textContent=0;

        return;

    }

    students.forEach((student,index)=>{

        coursesCount+=student.courses.length;

        const courseHTML=
        student.courses.map(course=>`

        <div class="course-item">

            ${course.title}

        </div>

        `).join("");

        studentsTable.innerHTML+=`

        <tr>

            <td>${index+1}</td>

            <td>${student.admissionNumber}</td>

            <td>

                <strong>${student.name}</strong>

                <br>

                <small>${student.email}</small>

            </td>

            <td>

                ${courseHTML}

            </td>

            <td>

                <span class="status active">

                    ${student.status}

                </span>

            </td>

            <td>

                <button
                class="view-btn"
                onclick="viewStudent('${student.id}')">

                    View

                </button>

            </td>

        </tr>

        `;

    });

    totalStudents.textContent=
    students.length;

    totalCourses.textContent=
    coursesCount;

    activeStudents.textContent=
    students.filter(
        s=>s.status==="Active"
    ).length;

}



document
.getElementById("searchStudent")
.addEventListener(
"input",
(e)=>{

    const value=
    e.target.value.toLowerCase();

    const filtered=
    studentsData.filter(student=>

        student.name
        .toLowerCase()
        .includes(value)

        ||

        student.email
        .toLowerCase()
        .includes(value)

        ||

        student.admissionNumber
        .toLowerCase()
        .includes(value)

    );

    renderStudents(filtered);

});



window.viewStudent=function(id){

    window.location.href=
    `student-profile.html?id=${id}`;

};