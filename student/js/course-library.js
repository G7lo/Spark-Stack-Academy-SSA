// =====================================
// SPARK STACK ACADEMY
// COURSE LIBRARY CONTROLLER V1
// =====================================


import {

    db,
    auth

} from "../../js/firebase.js";



import {

    collection,
    getDocs,
    query,
    orderBy

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
    "🚀 Course Library Loaded"
);






let allCourses = [];







document.addEventListener(
"DOMContentLoaded",
()=>{


    loadCourses();


});








// ===============================
// LOAD COURSES
// ===============================


async function loadCourses(){


const container =
document.getElementById(
"libraryCourses"
);



if(!container)
return;




try{


const coursesQuery =
query(

collection(
db,
"courses"
),

orderBy(
"createdAt",
"desc"
)

);



const snapshot =
await getDocs(
coursesQuery
);





allCourses = [];





snapshot.forEach(doc=>{


allCourses.push({

id:doc.id,

...doc.data()

});


});






renderCourses(
allCourses
);





}

catch(error){


console.error(

"Course loading error:",

error

);



container.innerHTML = `

<p>
Failed to load courses.
</p>

`;



}



}









// ===============================
// RENDER COURSES
// ===============================


function renderCourses(courses){



const container =
document.getElementById(
"libraryCourses"
);



container.innerHTML="";





if(courses.length === 0){


container.innerHTML = `

<div class="loading-card">

<h3>
No Courses Found
</h3>

<p>
New courses coming soon.
</p>

</div>

`;


return;

}







courses.forEach(course=>{


const paid =
Number(course.price || 0) > 0;



container.innerHTML += `



<div class="library-course-card">





<div class="course-cover">


<i data-lucide="book-open"></i>


</div>







<div class="course-card-body">


<h3>

${course.title || "Untitled Course"}

</h3>



<p>

${course.description || 
"Start your learning journey."}

</p>






<div class="course-meta">


<span class="${
paid ? "lock-tag":"free-tag"
}">


${paid ? 
"🔒 KSh "+course.price :
"Free"}

</span>




<span>

${
course.level ||
"Beginner"
}

</span>



</div>








<button

class="course-action"

data-id="${course.id}"

>


${
paid ?
"View Course"
:
"Enroll Now"
}


</button>





</div>






</div>


`;



});






lucide.createIcons();



attachButtons();


}









// ===============================
// BUTTON ACTIONS
// ===============================


function attachButtons(){


document
.querySelectorAll(
".course-action"
)

.forEach(button=>{


button.onclick = ()=>{


const id =
button.dataset.id;



openCourse(id);



};


});



}








function openCourse(id){



window.location.href =

`course-details.html?id=${id}`;



}
// =====================================
// SEARCH SYSTEM
// =====================================


const searchInput =
document.getElementById(
"courseSearch"
);



if(searchInput){


searchInput.addEventListener(
"input",
()=>{


const value =
searchInput.value
.toLowerCase();



const filtered =
allCourses.filter(course=>{


return (

course.title
?.toLowerCase()
.includes(value)

||

course.description
?.toLowerCase()
.includes(value)

);


});



renderCourses(filtered);



});


}








// =====================================
// COURSE FILTERS
// =====================================


document
.querySelectorAll(
".filter-btn"
)

.forEach(button=>{


button.addEventListener(
"click",
()=>{



document
.querySelectorAll(
".filter-btn"
)
.forEach(btn=>{


btn.classList.remove(
"active"
);


});




button.classList.add(
"active"
);





const filter =
button.dataset.filter;






if(filter==="all"){


renderCourses(
allCourses
);


return;


}







const filtered =
allCourses.filter(course=>{


const paid =
Number(course.price || 0)>0;



if(filter==="paid")

return paid;



if(filter==="free")

return !paid;



});





renderCourses(
filtered
);



});


});









// =====================================
// CHECK STUDENT ACCESS
// =====================================


async function checkStudentEnrollment(
courseId
){



const user =
auth.currentUser;



if(!user)

return false;





const enrollmentRef =
doc(

db,

"students",

user.uid,

"enrollments",

courseId

);




const snap =
await getDoc(
enrollmentRef
);




if(
!snap.exists()
)

return false;





return snap.data();


}









// =====================================
// IMPROVED BUTTON LOGIC
// =====================================


async function openCourse(id){



const course =
allCourses.find(
item=>item.id===id
);





const enrollment =
await checkStudentEnrollment(
id
);







if(enrollment){



window.location.href =

`course-player.html?id=${id}`;



return;


}







window.location.href =

`course-details.html?id=${id}`;



}