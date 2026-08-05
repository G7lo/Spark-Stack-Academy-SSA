// =====================================
// SPARK STACK ACADEMY
// COURSE PLAYER CONTROLLER V1
// =====================================


import {

    auth,
    db

} from "../../js/firebase.js";



import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import {

    doc,
    getDoc,
    updateDoc,
    setDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";





console.log(
    "🚀 Course Player Loaded"
);





// ===============================
// GET COURSE ID
// ===============================


const params =
new URLSearchParams(
    window.location.search
);



const courseId =
params.get("id");




if(!courseId){

    console.error(
        "No course ID found"
    );

}







// ===============================
// INITIALIZE
// ===============================


document.addEventListener(
"DOMContentLoaded",
()=>{


    startClassroom();


});







async function startClassroom(){


    if(!courseId)
        return;



    onAuthStateChanged(

        auth,

        async(student)=>{


            if(!student){


                window.location.href =
                "../login.html";


                return;

            }



            console.log(
                "Student:",
                student.uid
            );



            await loadClassroom(

                student.uid

            );



        }

    );


}









// ===============================
// LOAD CLASSROOM
// ===============================


async function loadClassroom(uid){



try{


// COURSE DATA

const courseRef =
doc(
    db,
    "courses",
    courseId
);



const courseSnap =
await getDoc(courseRef);



if(!courseSnap.exists()){


    showError(
        "Course not found"
    );


    return;

}




const course =
courseSnap.data();





// CHECK ENROLLMENT

const enrollmentRef =
doc(

    db,

    "students",

    uid,

    "enrollments",

    courseId

);



const enrollmentSnap =
await getDoc(
    enrollmentRef
);






if(!enrollmentSnap.exists()){


    showLocked();


    return;

}





const enrollment =
enrollmentSnap.data();





// PAYMENT CHECK

if(

course.price > 0 &&

enrollment.paymentStatus !== "paid"

){


    showLocked();


    return;


}






// EVERYTHING OK


showClassroom();


loadCourseDetails(
    course,
    enrollment
);

loadNotes();
loadResources(course.resources);


}



catch(error){


console.error(

"Classroom error:",

error

);


}


}









// ===============================
// LOCK / UNLOCK UI
// ===============================


function showLocked(){


document.getElementById(
"courseLocked"
).style.display="block";



document.getElementById(
"courseContent"
).style.display="none";


}






function showClassroom(){


document.getElementById(
"courseLocked"
).style.display="none";



document.getElementById(
"courseContent"
).style.display="block";


}







// ===============================
// COURSE DETAILS
// ===============================


function loadCourseDetails(
course,
enrollment
){



const title =
document.getElementById(
"courseTitle"
);



const description =
document.getElementById(
"courseDescription"
);



if(title)

title.textContent =
course.title || "Course";



if(description)

description.textContent =
course.description || "";





updateProgress(
enrollment.progress || 0
);



}








function updateProgress(value){



const text =
document.getElementById(
"courseProgressText"
);



const bar =
document.getElementById(
"courseProgressBar"
);




if(text)

text.textContent =
value + "%";



if(bar)

bar.style.width =
value + "%";


}








function showError(message){


console.error(message);


}
// =====================================
// LESSON SYSTEM
// =====================================


let lessons = [];

let currentLesson = 0;

let currentEnrollment = null;





// ===============================
// EXTEND COURSE LOADING
// ===============================


function loadCourseDetails(
course,
enrollment
){


currentEnrollment = enrollment;



const title =
document.getElementById(
"courseTitle"
);


const description =
document.getElementById(
"courseDescription"
);



if(title)

title.textContent =
course.title || "Course";



if(description)

description.textContent =
course.description || "";




updateProgress(
enrollment.progress || 0
);





// instructor

const instructor =
document.getElementById(
"instructorName"
);



if(instructor)

instructor.textContent =
course.instructor ||
"Spark Stack Academy";





// lessons

lessons =
course.lessons || [];



renderLessons();



}





// ===============================
// DISPLAY LESSONS
// ===============================


function renderLessons(){


const container =
document.getElementById(
"lessonList"
);



if(!container)
return;



container.innerHTML="";





if(
lessons.length === 0
){


container.innerHTML = `

<p>
No lessons available yet.
</p>

`;

return;


}







lessons.forEach(
(lesson,index)=>{


const div =
document.createElement(
"div"
);



div.className =
"lesson-item";



if(index === currentLesson)

div.classList.add(
"active"
);





div.innerHTML = `

${index+1}. 
${lesson.title || "Lesson"}

`;





div.onclick = ()=>{


openLesson(index);


};



container.appendChild(
div
);



});





openLesson(0);


}









// ===============================
// OPEN LESSON
// ===============================


function openLesson(index){


currentLesson = index;



const lesson =
lessons[index];



if(!lesson)
return;





document.querySelectorAll(
".lesson-item"
)
.forEach(
(item,i)=>{


item.classList.toggle(

"active",

i===index

);


});







const title =
document.getElementById(
"lessonTitle"
);



const description =
document.getElementById(
"lessonDescription"
);





if(title)

title.textContent =
lesson.title || "Lesson";





if(description)

description.textContent =
lesson.description ||
"";





}










// ===============================
// COMPLETE LESSON
// ===============================


const completeBtn =
document.getElementById(
"completeLessonBtn"
);



if(completeBtn){


completeBtn.onclick = ()=>{


completeLesson();


};


}







async function completeLesson(){


if(!currentEnrollment)

return;




const completed =
currentEnrollment.completedLessons || [];



const lessonId =
lessons[currentLesson].id;




if(
!completed.includes(lessonId)
){


completed.push(
lessonId
);


}







const progress =
Math.round(

(completed.length /
lessons.length)
*
100

);



updateProgress(
progress
);




alert(
"Lesson completed 🎉"
);



}









// ===============================
// NEXT / PREVIOUS
// ===============================


const nextBtn =
document.getElementById(
"nextLessonBtn"
);



const previousBtn =
document.getElementById(
"previousLessonBtn"
);





if(nextBtn){


nextBtn.onclick = ()=>{


if(
currentLesson <
lessons.length-1
){


openLesson(
currentLesson + 1
);


}


};


}







if(previousBtn){


previousBtn.onclick = ()=>{


if(
currentLesson > 0
){


openLesson(
currentLesson - 1
);


}


};


}









// ===============================
// RESOURCES
// ===============================


function loadResources(resources){


const box =
document.getElementById(
"courseResources"
);



if(!box)
return;



box.innerHTML="";



if(!resources || resources.length===0){


box.innerHTML=
"<p>No resources available.</p>";

return;


}





resources.forEach(
resource=>{


box.innerHTML += `

<a href="${resource.url}"
target="_blank">

${resource.name}

</a>

<br>

`;


});


}
// =====================================
// SAVE CLASSROOM PROGRESS
// =====================================


async function saveProgress(){


if(!auth.currentUser)
return;


const uid =
auth.currentUser.uid;



const completed =
currentEnrollment.completedLessons || [];



const progress =
Math.round(

(completed.length /
lessons.length)
*
100

);





const enrollmentRef =
doc(

db,

"students",

uid,

"enrollments",

courseId

);




try{


await updateDoc(

enrollmentRef,

{

completedLessons:completed,

progress:progress,

updatedAt:new Date()

}

);





console.log(
"Progress saved"
);



}

catch(error){


console.error(

"Progress save error",

error

);


}


}







// =====================================
// COMPLETE LESSON UPDATED
// =====================================


async function completeLesson(){


if(!lessons[currentLesson])
return;



const lessonId =
lessons[currentLesson].id;



let completed =
currentEnrollment.completedLessons || [];





if(
!completed.includes(lessonId)
){


completed.push(
lessonId
);


}



currentEnrollment.completedLessons =
completed;




const progress =
Math.round(

(completed.length /
lessons.length)
*
100

);




updateProgress(
progress
);




await saveProgress();





console.log(
"Lesson complete:",
lessonId
);



}









// =====================================
// NOTES SYSTEM
// =====================================


const saveNotesBtn =
document.getElementById(
"saveNotesBtn"
);



if(saveNotesBtn){


saveNotesBtn.onclick =
saveNotes;


}







async function saveNotes(){



const notes =
document.getElementById(
"lessonNotes"
).value;



if(!auth.currentUser)
return;



const uid =
auth.currentUser.uid;




const notesRef =
doc(

db,

"students",

uid,

"courseNotes",

courseId

);





try{


await setDoc(

notesRef,

{

notes:notes,

updatedAt:new Date()

},

{

merge:true

}

);





alert(
"Notes saved ✅"
);



}

catch(error){


console.error(
"Notes error",
error
);


}



}









// =====================================
// LOAD NOTES
// =====================================


async function loadNotes(){



if(!auth.currentUser)
return;




const uid =
auth.currentUser.uid;




const notesRef =
doc(

db,

"students",

uid,

"courseNotes",

courseId

);




const snap =
await getDoc(
notesRef
);





if(
snap.exists()
){


document.getElementById(
"lessonNotes"
).value =
snap.data().notes || "";



}



}
// =====================================
// PAYMENT UNLOCK SYSTEM
// =====================================



const unlockBtn =
document.getElementById(
"unlockCourseBtn"
);




if(unlockBtn){


unlockBtn.onclick = ()=>{


startCoursePayment();


};


}







// ===============================
// START PAYMENT
// ===============================


async function startCoursePayment(){



const user =
auth.currentUser;



if(!user)
return;





try{


console.log(
"Starting payment..."
);





/*

THIS WILL CONNECT TO
FIREBASE FUNCTION + DARAJA

Example payload:

studentId
courseId
amount


*/





const paymentData = {


studentId:user.uid,


courseId:courseId,


amount:500

};





// Temporary simulation


alert(
"Payment request sent. Complete M-Pesa payment."
);






}

catch(error){


console.error(

"Payment error",

error

);


}



}









// ===============================
// CHECK PAYMENT STATUS
// ===============================


async function checkPaymentStatus(){



const uid =
auth.currentUser.uid;



const enrollmentRef =
doc(

db,

"students",

uid,

"enrollments",

courseId

);




const snap =
await getDoc(
enrollmentRef
);





if(!snap.exists())

return false;





const data =
snap.data();





return (

data.paymentStatus === "paid"

);



}








// ===============================
// REALTIME UNLOCK CHECK
// ===============================


async function verifyUnlock(){



const paid =
await checkPaymentStatus();



if(paid){


showClassroom();


}

else{


showLocked();


}



}