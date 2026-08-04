import { db } from "../js/firebase.js";


import {
collection,
getDocs,
query,
orderBy,
limit
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



console.log("SSA ADMIN DASHBOARD CONNECTED");




// ===========================
// LOAD DASHBOARD DATA
// ===========================


window.addEventListener(
"DOMContentLoaded",
()=>{

loadStats();

loadRecentAdmissions();

});





// ===========================
// STATISTICS
// ===========================


async function loadStats(){


try{


const studentsSnap =
await getDocs(
collection(
db,
"students"
)
);



const coursesSnap =
await getDocs(
collection(
db,
"courses"
)
);



const instructorsSnap =
await getDocs(
collection(
db,
"instructors"
)
);



const admissionsSnap =
await getDocs(
collection(
db,
"applications"
)
);





document.getElementById(
"studentCount"
).textContent =
studentsSnap.size;



document.getElementById(
"courseCount"
).textContent =
coursesSnap.size;



document.getElementById(
"instructorCount"
).textContent =
instructorsSnap.size;



document.getElementById(
"applicationCount"
).textContent =
admissionsSnap.size;



}

catch(error){


console.error(
"Dashboard stats error:",
error
);


}


}







// ===========================
// RECENT ADMISSIONS
// ===========================


async function loadRecentAdmissions(){


const container =
document.getElementById(
"recentAdmissions"
);



if(!container) return;



try{


const q =
query(

collection(
db,
"applications"
),

orderBy(
"createdAt",
"desc"
),

limit(5)

);




const snap =
await getDocs(q);



if(snap.empty){


container.innerHTML =
"<p>No applications yet</p>";

return;


}





container.innerHTML="";



snap.forEach(doc=>{


const data =
doc.data();



const item =
document.createElement(
"div"
);



item.className =
"admission-item";



item.innerHTML = `

<strong>
${data.name || "Unknown"}
</strong>

<p>
${data.course || "No course"}
</p>

`;



container.appendChild(item);



});



}

catch(error){


console.error(
"Admissions loading error:",
error
);



container.innerHTML =
"<p>Unable to load admissions</p>";

}


}