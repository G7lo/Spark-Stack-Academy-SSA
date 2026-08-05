// =====================================
// SPARK STACK ACADEMY
// ASSIGNMENTS CONTROLLER V1
// =====================================

import {

    db,
    auth

} from "../../js/firebase.js";



import {

    collection,
    getDocs,
    query,
    where

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



console.log(
    "📚 Assignments Loaded"
);





let assignments = [];





onAuthStateChanged(

    auth,

    async(user)=>{

        if(!user){

            window.location.href="login.html";

            return;

        }

        await loadAssignments(
            user.uid
        );

    }

);





// ===============================
// LOAD ASSIGNMENTS
// ===============================

async function loadAssignments(uid){

    try{

        const q = query(

            collection(db,"assignments"),

            where(
                "students",
                "array-contains",
                uid
            )

        );



        const snapshot =
        await getDocs(q);



        assignments = [];



        snapshot.forEach(doc=>{

            assignments.push({

                id:doc.id,

                ...doc.data()

            });

        });



        updateStats();

        renderAssignments(assignments);

    }

    catch(error){

        console.error(error);

    }

}






// ===============================
// UPDATE HEADER STATS
// ===============================

function updateStats(){

    const pending =
    assignments.filter(

        a=>a.status==="pending"

    ).length;



    const submitted =
    assignments.filter(

        a=>a.status==="submitted"

    ).length;



    const graded =
    assignments.filter(

        a=>a.status==="graded"

    ).length;



    document.getElementById(
    "pendingAssignments"
    ).textContent= pending;



    document.getElementById(
    "submittedAssignments"
    ).textContent= submitted;



    document.getElementById(
    "gradedAssignments"
    ).textContent= graded;

}






// ===============================
// RENDER CARDS
// ===============================

function renderAssignments(list){

    const container =
    document.getElementById(
    "assignmentContainer"
    );



    container.innerHTML="";



    if(list.length===0){

        container.innerHTML=`

        <div class="empty-state">

            <i data-lucide="clipboard-list"></i>

            <h3>

                No Assignments

            </h3>

            <p>

                Your instructors haven't posted any assignments yet.

            </p>

        </div>

        `;

        lucide.createIcons();

        return;

    }



    list.forEach(item=>{

        container.innerHTML+=`

<div class="assignment-card">

<div class="assignment-top">

<h3>

${item.title}

</h3>

<span class="status ${item.status}">

${item.status}

</span>

</div>

<div class="assignment-body">

<p>

${item.description}

</p>

<div class="assignment-meta">

<span>

📅 ${item.dueDate}

</span>

<span>

🏫 ${item.courseName}

</span>

</div>

<div class="assignment-actions">

<button
class="primary-btn"
onclick="openAssignment('${item.id}')">

Open

</button>

<button
class="secondary-btn"
onclick="submitAssignment('${item.id}')">

Submit

</button>

</div>

</div>

</div>

`;

    });

    lucide.createIcons();

}
// =====================================
// SEARCH
// =====================================

const searchInput =
document.getElementById(
"assignmentSearch"
);

searchInput.addEventListener(
"input",
filterAssignments
);





// =====================================
// FILTER
// =====================================

const statusFilter =
document.getElementById(
"statusFilter"
);

statusFilter.addEventListener(
"change",
filterAssignments
);





function filterAssignments(){

const keyword =
searchInput.value
.toLowerCase();

const status =
statusFilter.value;



const filtered =
assignments.filter(item=>{


const matchesSearch =

item.title
.toLowerCase()
.includes(keyword)

||

item.description
.toLowerCase()
.includes(keyword);




const matchesStatus =

status==="all"

||

item.status===status;



return (

matchesSearch

&&

matchesStatus

);


});



renderAssignments(
filtered
);


}
// =====================================
// OPEN ASSIGNMENT
// =====================================

window.openAssignment = function(id){

const assignment =
assignments.find(
a=>a.id===id
);

if(!assignment)
return;



window.location.href=

`assignment-details.html?id=${id}`;

};






// =====================================
// SUBMIT
// =====================================

window.submitAssignment = function(id){

alert(

"Assignment upload page opens here."

);

/*

Next version

↓

Firebase Storage

↓

Upload PDF

↓

Save submission

↓

Notify instructor

*/

};