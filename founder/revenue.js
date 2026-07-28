// ===================================
// SPARK STACK ACADEMY
// REVENUE ANALYTICS
// ===================================

import { db } from "../../js/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("📊 Revenue Loaded");



const totalRevenue =
document.getElementById("totalRevenue");

const totalSubscribers =
document.getElementById("totalSubscribers");

const courseSales =
document.getElementById("courseSales");

const couponUsage =
document.getElementById("couponUsage");

const transactionsContainer =
document.getElementById("transactionsContainer");



let monthlyRevenue = {};



function loadRevenue(){


onSnapshot(

collection(
db,
"transactions"
),

(snapshot)=>{


let revenue = 0;

let subscribers = 0;

let courses = 0;

let coupons = 0;


monthlyRevenue = {};



transactionsContainer.innerHTML="";



if(snapshot.empty){

transactionsContainer.innerHTML =
`
<p>
No transactions yet.
</p>
`;

return;

}



snapshot.forEach(doc=>{


const data = doc.data();



if(data.status === "completed"){

revenue += Number(data.amount || 0);

}



if(data.type==="premium"){

subscribers++;

}


if(data.type==="course"){

courses++;

}


if(data.type==="coupon"){

coupons++;

}




// MONTHLY GRAPH DATA

if(data.createdAt){


const date =
data.createdAt.toDate();


const month =
date.toLocaleString(
"default",
{
month:"short"
}
);



monthlyRevenue[month] =
(monthlyRevenue[month] || 0)
+
Number(data.amount || 0);


}




// TRANSACTION UI

transactionsContainer.innerHTML +=
`

<div class="transaction-item">


<div>

<strong>
${data.type || "Payment"}
</strong>


<p>
${data.status || "pending"}
</p>


</div>



<span>
${data.currency || "KES"}
${data.amount || 0}
</span>


</div>

`;



});



totalRevenue.textContent =
`KES ${revenue.toLocaleString()}`;


totalSubscribers.textContent =
subscribers;


courseSales.textContent =
courses;


couponUsage.textContent =
coupons;



updateChart();



}

);


}



let revenueChart;



function updateChart(){


const ctx =
document.getElementById(
"revenueChart"
);



if(!ctx) return;



if(revenueChart){

revenueChart.destroy();

}



revenueChart =
new Chart(

ctx,

{

type:"line",

data:{


labels:
Object.keys(monthlyRevenue),



datasets:[{

label:"Revenue",

data:
Object.values(monthlyRevenue)

}]

},


options:{

responsive:true,

plugins:{

legend:{

display:true

}

}

}

}

);


}



window.addEventListener(
"DOMContentLoaded",
loadRevenue
);