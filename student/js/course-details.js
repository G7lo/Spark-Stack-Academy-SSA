// =====================================
// SPARK STACK ACADEMY
// COURSE DETAILS CONTROLLER V1
// =====================================


import {

    db,
    auth

} from "../../js/firebase.js";



import {

    doc,
    getDoc,
    setDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



console.log(
    "🚀 Course Details Loaded"
);





const params =
new URLSearchParams(
window.location.search
);



const courseId =
params.get("id");





let courseData = null;








document.addEventListener(
"DOMContentLoaded",
()=>{

    loadCourse();

    const enrollBtn =
    document.getElementById(
    "enrollBtn"
    );


    if(enrollBtn){

        enrollBtn.onclick =
        handleEnrollment;

    }

});





// ===============================
// LOAD COURSE
// ===============================


async function loadCourse(){


if(!courseId){


console.error(
"No course ID"
);


return;


}





try{


const courseRef =
doc(

db,

"courses",

courseId

);





const snap =
await getDoc(
courseRef
);





if(!snap.exists()){


console.error(
"Course not found"
);


return;


}





courseData = {

id:snap.id,

...snap.data()

};






displayCourse(
courseData
);

lucide.createIcons();



}

catch(error){


console.error(

"Course error:",

error

);


}



}









// ===============================
// DISPLAY COURSE
// ===============================


function displayCourse(course){





const title =
document.getElementById(
"courseTitle"
);



const description =
document.getElementById(
"courseDescription"
);



const level =
document.getElementById(
"courseLevel"
);



const duration =
document.getElementById(
"courseDuration"
);



const price =
document.getElementById(
"coursePrice"
);







if(title)

title.textContent =
course.title || "Course";




if(description)

description.textContent =
course.description || "";





if(level)

level.textContent =
course.level || "Beginner";





if(duration)

duration.textContent =

(course.duration || 0)
+
" Hours";







if(price){


price.textContent =

course.price > 0

?

"KSh " + course.price

:

"Free";


}







loadCurriculum(
course.lessons
);



loadLearningPoints(
course.learningPoints
);





const instructor =
document.getElementById(
"instructorName"
);



if(instructor)

instructor.textContent =

course.instructor ||

"Spark Stack Academy";





}









// ===============================
// CURRICULUM
// ===============================


function loadCurriculum(
lessons=[]
){



const box =
document.getElementById(
"curriculumList"
);



if(!box)
return;




box.innerHTML="";





lessons.forEach(
(lesson,index)=>{


box.innerHTML += `


<div class="lesson-preview">


<i data-lucide="play-circle"></i>


<span>

${index+1}.
${lesson.title}

</span>


</div>


`;


});





lucide.createIcons();



}









// ===============================
// WHAT YOU LEARN
// ===============================


function loadLearningPoints(
points=[]
){



const list =
document.getElementById(
"learningList"
);



if(!list)
return;




list.innerHTML="";





points.forEach(point=>{


list.innerHTML += `

<li>

${point}

</li>

`;


});



}













// ===============================
// CHECK ACCESS
// ===============================


async function checkEnrollment(){



const user =
auth.currentUser;



if(!user)

return false;





const ref =
doc(

db,

"students",

user.uid,

"enrollments",

courseId

);





const snap =
await getDoc(
ref
);





if(!snap.exists())

return false;





return snap.data();


}

// ===============================
// BUTTON STATE
// ===============================

onAuthStateChanged(

    auth,

    async(user)=>{

        if(!user)
        return;

        const enrollment =
        await checkEnrollment();

        const enrollBtn =
        document.getElementById(
        "enrollBtn"
        );

        if(!enrollBtn)
        return;

        if(enrollment){

            enrollBtn.textContent =
            "Start Learning";

            enrollBtn.onclick = ()=>{

                window.location.href =
                `course-player.html?id=${courseId}`;

            };

        }

    }

);

// ===============================
// HANDLE CLICK
// ===============================


async function handleEnrollment(){



const user =
auth.currentUser;



if(!user){


alert(
"Please login first"
);


return;


}






// FREE COURSE


if(

Number(courseData.price || 0)
===0

){



await enrollFreeCourse(
user.uid
);



return;


}








// PAID COURSE


startPayment();




}









// ===============================
// FREE ENROLLMENT
// ===============================


async function enrollFreeCourse(uid){



try{


await setDoc(

doc(

db,

"students",

uid,

"enrollments",

courseId

),


{


courseId:courseId,


paymentStatus:"free",


progress:0,


completedLessons:[],


joinedAt:new Date()


}



);






alert(
"Enrollment successful 🎉"
);




window.location.href =

`course-player.html?id=${courseId}`;



}

catch(error){


console.error(

"Enrollment error",

error

);


}



}









// ===============================
// PAYMENT START
// ===============================


function startPayment(){



alert(

"Payment request coming soon. Complete M-Pesa payment to unlock."

);



/*

Later:

Firebase Function

        ↓

Daraja STK Push

        ↓

Callback

        ↓

paymentStatus = paid

        ↓

Classroom unlock

*/



}