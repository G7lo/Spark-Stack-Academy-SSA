// =====================================
// SPARK STACK ACADEMY
// PAYMENTS
// payments.js
// =====================================


import {

auth,
db

} from "../../../js/firebase.js";


import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

collection,
query,
where,
onSnapshot,
orderBy,
getDocs,
doc,
getDoc

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("💳 Payments Loaded");




// =====================================
// STATE
// =====================================


let currentUser = null;


const urlParams =
new URLSearchParams(
window.location.search
);


const selectedCourseId =
urlParams.get("courseId");

// =====================================
// DOM
// =====================================


const totalPaid =
document.getElementById("totalPaid");


const balance =
document.getElementById("balance");


const paymentStatus =
document.getElementById("paymentStatus");


const transactionList =
document.getElementById("transactionList");


const backBtn =
document.getElementById("backBtn");


const courseList =
document.getElementById("courseList");


const paymentModal =
document.getElementById("paymentModal");


const closePayment =
document.getElementById("closePayment");


const phoneNumber =
document.getElementById("phoneNumber");


const paymentAmount =
document.getElementById("paymentAmount");


const selectedCourse =
document.getElementById("selectedCourse");


const confirmPayment =
document.getElementById("confirmPayment");

console.log("Modal:", paymentModal);
console.log("Selected Course:", selectedCourse);
console.log("Amount Input:", paymentAmount);

// =====================================
// BACK BUTTON
// =====================================


backBtn?.addEventListener(

"click",

()=>{

window.location.href="dashboard.html";

}

);






// =====================================
// AUTH
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(!user){

window.location.href="../login.html";

return;

}


currentUser = user;

loadPayments();

loadCourses();


}

);






// =====================================
// LOAD PAYMENTS
// =====================================


function loadPayments(){


const paymentsRef =
collection(db,"payments");



const paymentsQuery = query(

paymentsRef,

where(
"userId",
"==",
currentUser.uid
),

orderBy(
"createdAt",
"desc"
)

);




onSnapshot(

paymentsQuery,

(snapshot)=>{


let paid = 0;



transactionList.innerHTML = "";



if(snapshot.empty){


transactionList.innerHTML = `

<div class="empty-payment">

No transactions yet

</div>

`;


return;

}





snapshot.forEach(

(doc)=>{


const data = doc.data();



if(data.status === "success"){

paid += Number(data.amount || 0);

}



renderTransaction(data);


}

);




totalPaid.textContent =

`KSh ${paid.toLocaleString()}`;



},


(error)=>{


console.error(

"Payments loading failed",

error

);


}

);


}

async function loadCheckoutCourse(){


const courseRef =
doc(
db,
"courses",
selectedCourseId
);



const snap =
await getDoc(courseRef);



if(!snap.exists()){

courseList.innerHTML = `

<div class="empty-payment">

Course not found

</div>

`;

return;

}



const course =
snap.data();



courseList.innerHTML = `


<div class="course-card">


<h3>
${course.title}
</h3>


<p>
Fee: KSh ${course.price}
</p>


<p>
Pay to unlock this course
</p>


<button

class="pay-btn"

data-course="${course.title}"

data-amount="${course.price}"

>

Pay Now

</button>


</div>


`;



setupPayButtons();


}

async function loadCourses(){


try{


if(selectedCourseId){

await loadCheckoutCourse();

return;

}


const enrollmentsRef =
collection(db,"enrollments");


const q = query(

enrollmentsRef,

where(
"userId",
"==",
currentUser.uid
)

);



const snapshot =
await getDocs(q);



courseList.innerHTML="";



if(snapshot.empty){


courseList.innerHTML = `

<div class="empty-payment">

No enrolled courses yet

</div>

`;


return;

}



for (const docSnap of snapshot.docs){


const data = docSnap.data();


const card =
document.createElement("div");


card.className =
"course-card";


const courseDoc =
await getDoc(
    doc(
        db,
        "courses",
        data.courseId
    )
);


const courseData =
courseDoc.data();


const totalFee =
courseData?.price || 0;


const balance =
totalFee -
(data.amountPaid || 0);



card.innerHTML = `


<div>

<h3>

${data.courseName || "Course"}

</h3>


<p>

Fee: KSh ${totalFee}

</p>


<p>

Paid: KSh ${data.amountPaid || 0}

</p>


<p>

Balance: KSh ${balance}

</p>


</div>



<button

class="pay-btn"

data-course="${data.courseName}"

data-amount="${balance}"

>

Pay Now

</button>


`;



courseList.appendChild(card);



}


setupPayButtons();


}


catch(error){


console.error(

"Courses loading failed",

error

);


}


}



// =====================================
// RENDER TRANSACTION
// =====================================


function renderTransaction(payment){


const card = document.createElement(
"div"
);



card.className =
"transaction-card";



card.innerHTML = `


<div>


<h3>

${payment.course || "Academy Payment"}

</h3>


<p>

${payment.method || "M-PESA"}

</p>


</div>




<div>


<h3>

KSh ${payment.amount}

</h3>


<span class="${payment.status}">

${payment.status}

</span>


</div>


`;



transactionList.appendChild(card);


}
// =====================================
// PAY BUTTONS
// =====================================

function setupPayButtons(){

console.log("Pay buttons found:", document.querySelectorAll(".pay-btn").length);

const buttons =
document.querySelectorAll(".pay-btn");



buttons.forEach(button=>{


button.addEventListener(
"click",
()=>{

console.log("Pay clicked", button.dataset);


const course =
button.dataset.course;


const amount =
button.dataset.amount;



selectedCourse.textContent =
course;


paymentAmount.value =
amount;



paymentModal.classList.remove(
"hidden"
);

console.log(
"Modal classes:",
paymentModal.className
);

}

);


});


}
closePayment?.addEventListener(

"click",

()=>{

paymentModal.classList.add(
"hidden"
);

}

);


confirmPayment?.addEventListener(

"click",

async()=>{


if(!phoneNumber.value){

alert(
"Enter M-PESA number"
);

return;

}



try{


const token =
await currentUser.getIdToken();



const response =
await fetch(

"https://spark-stack-academy-backend-production.up.railway.app/api/payments/stkpush",

{


method:"POST",


headers:{


"Content-Type":"application/json",


"Authorization":
`Bearer ${token}`


},


body:JSON.stringify({

phone:
phoneNumber.value,

amount:
Number(paymentAmount.value),

course:
selectedCourse.textContent,

courseId:
selectedCourseId

})


}

);



const data =
await response.json();



console.log(
"Payment response:",
data
);



if(data.success){


alert(
"M-PESA prompt sent 📱"
);


paymentModal.classList.add(
"hidden"
);


phoneNumber.value="";


}

else{


alert(
"Payment failed"
);


}



}


catch(error){


console.error(
"Payment error:",
error
);


alert(
"Something went wrong"
);


}


}

);



