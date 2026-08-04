import { db } from "../js/firebase.js";


import {
collection,
getDocs,
doc,
updateDoc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



console.log(
"SSA ADMIN ADMISSIONS CONNECTED"
);



window.addEventListener(
"DOMContentLoaded",
()=>{

loadApplications();

});





async function loadApplications(){


const container =
document.getElementById(
"applicationsList"
);



try{


const snap =
await getDocs(
collection(
db,
"applications"
)
);



if(snap.empty){

container.innerHTML =
"<p>No applications found</p>";

return;

}




container.innerHTML="";



snap.forEach(item=>{


const data =
item.data();



const card =
document.createElement(
"div"
);


card.className =
"application-card";



card.innerHTML = `


<div>

<h3>
${data.name || "Unknown"}
</h3>


<p>
${data.email || ""}
</p>


<p>
Course:
${data.course || "Not selected"}
</p>


<p>
Status:
<span>
${data.status || "pending"}
</span>
</p>


</div>



<div class="actions">


<button class="approve">

Approve

</button>


<button class="reject">

Reject

</button>


</div>


`;





card.querySelector(
".approve"
)
.onclick=()=>{

updateApplication(
item.id,
"approved"
);

};





card.querySelector(
".reject"
)
.onclick=()=>{

updateApplication(
item.id,
"rejected"
);

};





container.appendChild(card);



});



}

catch(error){


console.error(
error
);


container.innerHTML =
"<p>Error loading applications</p>";

}


}







async function updateApplication(
id,
status
){


try{


await updateDoc(

doc(
db,
"applications",
id
),

{

status:status,

updatedAt:
serverTimestamp()

}

);



alert(
"Application updated"
);



loadApplications();



}

catch(error){


console.error(
error
);


}


}