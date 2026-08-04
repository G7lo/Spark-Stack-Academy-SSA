/* ===================================
   FOUNDER OS
   REVENUE ANALYTICS ENGINE
=================================== */


import { db } from "../../js/firebase.js";

import "./js/founder-auth.js";


import {

collection,
query,
orderBy,
onSnapshot,
doc,
updateDoc

} from 
"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



/* ===================================
   ELEMENTS
=================================== */


const totalRevenue =
document.getElementById("totalRevenue");

const monthlyRevenue =
document.getElementById("monthlyRevenue");

const todayRevenue =
document.getElementById("todayRevenue");

const transactionCount =
document.getElementById("transactionCount");

const successfulPayments =
document.getElementById("successfulPayments");

const pendingPayments =
document.getElementById("pendingPayments");

const failedPayments =
document.getElementById("failedPayments");


const transactionsTable =
document.getElementById("transactionsTable");


const withdrawalsTable =
document.getElementById("withdrawalsTable");



/* BREAKDOWN */

const courseRevenue =
document.getElementById("courseRevenue");

const registrationRevenue =
document.getElementById("registrationRevenue");

const certificateRevenue =
document.getElementById("certificateRevenue");

const examRevenue =
document.getElementById("examRevenue");

const breakdownTotal =
document.getElementById("breakdownTotal");



/* PAYMENT METHODS */

const mpesaRevenue =
document.getElementById("mpesaRevenue");

const cardRevenue =
document.getElementById("cardRevenue");

const bankRevenue =
document.getElementById("bankRevenue");

const paypalRevenue =
document.getElementById("paypalRevenue");

const loadingOverlay =
document.getElementById("loadingOverlay");

const pendingWithdrawals =
document.getElementById("pendingWithdrawals");

let revenueChart;

/* ===================================
   HELPERS
=================================== */


function money(value){

return "KES " +
Number(value)
.toLocaleString();

}



function today(){

return new Date()
.toISOString()
.split("T")[0];

}



/* ===================================
   LOAD PAYMENTS
=================================== */


const paymentsQuery =
query(

collection(db,"payments"),

orderBy(
"createdAt",
"desc"
)

);



onSnapshot(

paymentsQuery,

(snapshot)=>{

try{


let lifetime = 0;

let monthly = 0;

let todayMoney = 0;


let count = 0;

let success = 0;

let pending = 0;

let failed = 0;



let course = 0;

let registration = 0;

let certificate = 0;

let exam = 0;



let mpesa = 0;

let card = 0;

let bank = 0;

let paypal = 0;

let dailyRevenue = {};

transactionsTable.innerHTML="";



snapshot.forEach((payment)=>{


const data = payment.data();



count++;



if(data.status==="completed"){


let amount =
Number(data.amount || 0);

let date =
data.createdAt
?.toDate()
.toLocaleDateString()
|| "Unknown";


if(!dailyRevenue[date]){

dailyRevenue[date] = 0;

}


dailyRevenue[date] += amount;

lifetime += amount;



if(
data.createdAt
?.toDate()
.toISOString()
.includes(
new Date()
.toISOString()
.slice(0,7)
)

){

monthly += amount;

}



if(
data.createdAt
?.toDate()
.toISOString()
.startsWith(today())

){

todayMoney += amount;

}




switch(data.type){


case "course":

course += amount;

break;


case "registration":

registration += amount;

break;


case "certificate":

certificate += amount;

break;


case "exam":

exam += amount;

break;


}



switch(data.method){


case "mpesa":

mpesa += amount;

break;


case "card":

card += amount;

break;


case "bank":

bank += amount;

break;


case "paypal":

paypal += amount;

break;


}


success++;


}

else if(data.status==="pending"){

pending++;

}

else{

failed++;

}




transactionsTable.innerHTML += `

<tr>

<td>
${data.receipt || "--"}
</td>


<td>
${data.studentName || "Unknown"}
</td>


<td>
${data.admissionNo || "--"}
</td>


<td>
${data.type || "--"}
</td>


<td>
${data.method || "--"}
</td>


<td>
${money(data.amount)}
</td>


<td>

<span class="status ${data.status}">
${data.status}
</span>

</td>


<td>

${data.createdAt
?.toDate()
.toLocaleDateString()
|| "--"}

</td>


<td>

<button class="table-action">

View

</button>

</td>


</tr>

`;

}


});

createRevenueChart(

Object.keys(dailyRevenue),

Object.values(dailyRevenue)

);

/* UPDATE DASHBOARD */


totalRevenue.textContent =
money(lifetime);


monthlyRevenue.textContent =
money(monthly);


todayRevenue.textContent =
money(todayMoney);



transactionCount.textContent =
count;


successfulPayments.textContent =
success;


pendingPayments.textContent =
pending;


failedPayments.textContent =
failed;



courseRevenue.textContent =
money(course);


registrationRevenue.textContent =
money(registration);


certificateRevenue.textContent =
money(certificate);


examRevenue.textContent =
money(exam);



breakdownTotal.textContent =
money(lifetime);



mpesaRevenue.textContent =
money(mpesa);

cardRevenue.textContent =
money(card);

bankRevenue.textContent =
money(bank);

paypalRevenue.textContent =
money(paypal);

if(loadingOverlay){

loadingOverlay.style.display = "none";

}

}

catch(error){

console.error(
"Revenue loading error:",
error
);

}

});


/* ===================================
   WITHDRAWAL ENGINE
=================================== */


const withdrawalsQuery =
query(

collection(db,"withdrawals"),

orderBy(
"requestedAt",
"desc"
)

);



onSnapshot(

withdrawalsQuery,

(snapshot)=>{


withdrawalsTable.innerHTML="";


let pendingAmount = 0;



snapshot.forEach((withdrawal)=>{


const data =
withdrawal.data();



if(data.status==="pending"){

pendingAmount += Number(data.amount || 0);

}



withdrawalsTable.innerHTML += `

<tr>


<td>

${data.instructor || "Unknown"}

</td>


<td>

${data.method || "--"}

</td>


<td>

KES ${Number(data.amount || 0)
.toLocaleString()}

</td>


<td>

<span class="status ${data.status}">

${data.status}

</span>

</td>


<td>

${
data.requestedAt
?.toDate()
.toLocaleDateString()
|| "--"
}

</td>


<td>


<button

class="withdraw-action approve"

data-id="${withdrawal.id}"

>

Approve

</button>



<button

class="withdraw-action reject"

data-id="${withdrawal.id}"

>

Reject

</button>


</td>


</tr>

`;



});



pendingWithdrawals.textContent =
money(pendingAmount);


if(loadingOverlay){

loadingOverlay.style.display = "none";

}

}

);





/* ===================================
   WITHDRAWAL APPROVAL SYSTEM
=================================== */


document.addEventListener(

"click",

async(e)=>{



const id =
e.target.dataset.id;



if(!id) return;



if(
e.target.classList.contains("approve")
){


await updateDoc(

doc(
db,
"withdrawals",
id
),

{

status:"completed",

processedAt:new Date()

}

);


console.log(
"Withdrawal approved"
);


}



if(
e.target.classList.contains("reject")
){


await updateDoc(

doc(
db,
"withdrawals",
id
),

{

status:"failed",

processedAt:new Date()

}

);


console.log(
"Withdrawal rejected"
);


}


}

);

/* ===================================
   REVENUE CHART ENGINE
=================================== */


function createRevenueChart(labels, values){


const ctx =
document.getElementById(
"revenueChart"
);


if(!ctx) return;


if(revenueChart){

revenueChart.destroy();

}



if(typeof Chart === "undefined"){

console.error(
"Chart.js not loaded"
);

return;

}


revenueChart =
new Chart(

ctx,

{

type:"line",

data:{


labels:labels,


datasets:[{

label:"Revenue (KES)",

data:values,

tension:.4,

fill:true

}]

},


options:{


responsive:true,


plugins:{


legend:{

display:true

}


},


scales:{


y:{


beginAtZero:true

}


}


}


}

);


}

/* ===================================
   ACTION CENTER
=================================== */


/* REFRESH REVENUE */

const refreshRevenue =
document.getElementById(
"refreshRevenue"
);


const refreshDashboard =
document.getElementById(
"refreshRevenueDashboard"
);



function reloadDashboard(){

location.reload();

}



if(refreshRevenue){

refreshRevenue.addEventListener(
"click",
reloadDashboard
);

}



if(refreshDashboard){

refreshDashboard.addEventListener(
"click",
reloadDashboard
);

}





/* REFRESH WITHDRAWALS */


const refreshWithdrawals =
document.getElementById(
"refreshWithdrawals"
);


if(refreshWithdrawals){

refreshWithdrawals.addEventListener(
"click",
reloadDashboard
);

}





/* ===================================
   CSV EXPORT
=================================== */


const exportCSV =
document.getElementById(
"exportCSV"
);



if(exportCSV){


exportCSV.addEventListener(
"click",
()=>{


const table =
document.querySelector(
".transactions-section table"
);



let csv = [];


table
.querySelectorAll("tr")
.forEach(row=>{


let rowData=[];


row
.querySelectorAll("th,td")
.forEach(cell=>{

rowData.push(
cell.innerText
.replace(/,/g,"")
);

});


csv.push(
rowData.join(",")
);


});



const blob =
new Blob(

[csv.join("\n")],

{
type:"text/csv"
}

);



const url =
URL.createObjectURL(blob);



const link =
document.createElement("a");


link.href=url;


link.download =
"revenue-report.csv";


link.click();



URL.revokeObjectURL(url);


}

);


}





/* ===================================
   PRINT REPORT
=================================== */


const printReport =
document.getElementById(
"printReport"
);



if(printReport){


printReport.addEventListener(
"click",
()=>{

window.print();

}

);

}