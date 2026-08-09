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

console.time("Payments Page");


// =====================================
// STATE
// =====================================


let currentUser = null;

const API_BASE_URL =
    "http://localhost:3000";

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

console.timeEnd("Payments Page");
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

console.time("Checkout Course");


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


const payButton =
    courseList.querySelector(".pay-btn");

if(payButton){

    payButton.addEventListener(
        "click",
        ()=>{

            initializePayment(
                course.title,
                course.price
            );

        }
    );

}

console.timeEnd("Load Courses");



}

async function loadCourses(){

console.time("Load Courses");

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


async function initializePayment(course, amount){

    try{

        const response = await fetch(
            `${API_BASE_URL}/api/payments/initialize`,
            {
                method: "POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body: JSON.stringify({

                    email: currentUser.email,

                    amount: Number(amount),

                    courseId: selectedCourseId,

                    course: course,

                    userId: currentUser.uid

                })

            }
        );


        const data =
            await response.json();


        if(!data.success){

            throw new Error(
                data.message ||
                "Payment initialization failed"
            );

        }


        window.location.href =
            data.authorization_url;


    }

    catch(error){

        console.error(
            "Payment error:",
            error
        );

        alert(
            "Unable to start payment. Please try again."
        );

    }

}