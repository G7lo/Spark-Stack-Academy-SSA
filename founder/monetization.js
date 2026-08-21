/* ===================================
   SPARK STACK ACADEMY
   MONETIZATION CENTER
=================================== */

import { db } from "../js/firebase.js";

import {

doc,
getDoc,
setDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===================================
   DOCUMENT
=================================== */

const monetizationRef =
doc(db,"settings","monetization");

const minimumWithdrawal =
document.getElementById("minimumWithdrawal");

const withdrawalFee =
document.getElementById("withdrawalFee");

const withdrawalTime =
document.getElementById("withdrawalTime");

const enableWithdrawals =
document.getElementById("enableWithdrawals");

const withdrawalApproval =
document.getElementById("withdrawalApproval");


/* ===================================
   DEFAULT SETTINGS
=================================== */

const defaultMonetization={

/* Revenue */

totalRevenue:0,
monthlyRevenue:0,
todayRevenue:0,
pendingWithdrawals:0,

/* Course Pricing */

courseFee:5000,
registrationFee:1000,
examinationFee:500,
certificateFee:1000,

/* Instructor */

instructorCommission:70,

/* Platform */

platformCommission:30,

/* Currency */

currency:"KES",

/* Payments */

enablePayments:true,

allowRefunds:false,

refundDays:7,

/* Withdrawals */

minimumWithdrawal:1000,

withdrawalFeePercent:2,

withdrawalTime:"24 Hours",

enableWithdrawals:true,

withdrawalApproval:true,

/* Discounts */

allowCoupons:true,

allowScholarships:true,

/* Metadata */

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

};
/* ===================================
   LOAD MONETIZATION SETTINGS
=================================== */

document.addEventListener(
"DOMContentLoaded",
loadMonetization
);

async function loadMonetization(){

try{

const snapshot =
await getDoc(monetizationRef);


/* -------------------------------
CREATE DOCUMENT IF MISSING
-------------------------------- */

if(!snapshot.exists()){

await setDoc(

monetizationRef,

defaultMonetization

);

populateMonetization(
defaultMonetization
);

console.log(
"✅ Default monetization created."
);

return;

}


/* -------------------------------
LOAD SETTINGS
-------------------------------- */

const data =
snapshot.data();

populateMonetization(data);

console.log(
"✅ Monetization loaded."
);

}

catch(error){

console.error(
"Failed loading monetization:",
error
);

}

}


/* ===================================
   POPULATE UI
=================================== */

function populateMonetization(data){

/* ---------- KPI ---------- */

document.getElementById("totalRevenue").textContent =
`${data.currency} ${Number(data.totalRevenue).toLocaleString()}`;

document.getElementById("monthlyRevenue").textContent =
`${data.currency} ${Number(data.monthlyRevenue).toLocaleString()}`;

document.getElementById("todayRevenue").textContent =
`${data.currency} ${Number(data.todayRevenue).toLocaleString()}`;

document.getElementById("pendingWithdrawals").textContent =
`${data.currency} ${Number(data.pendingWithdrawals).toLocaleString()}`;


/* ---------- COURSE FEES ---------- */

courseFee.value =
data.courseFee ?? 5000;

registrationFee.value =
data.registrationFee ?? 1000;

examinationFee.value =
data.examinationFee ?? 500;

certificateFee.value =
data.certificateFee ?? 1000;


/* ---------- COMMISSION ---------- */

platformCommission.value =
data.platformCommission ?? 30;

instructorCommission.value =
data.instructorCommission ?? 70;


/* ---------- PAYMENT ---------- */

currency.value =
data.currency ?? "KES";

enablePayments.checked =
data.enablePayments ?? true;

allowRefunds.checked =
data.allowRefunds ?? false;

refundDays.value =
data.refundDays ?? 7;

/* ---------- WITHDRAWALS ---------- */

minimumWithdrawal.value =
data.minimumWithdrawal ?? 1000;

withdrawalFee.value =
data.withdrawalFeePercent ?? 2;

withdrawalTime.value =
data.withdrawalTime ?? "24 Hours";

enableWithdrawals.checked =
data.enableWithdrawals ?? true;

withdrawalApproval.checked =
data.withdrawalApproval ?? true;


/* ---------- DISCOUNTS ---------- */

allowCoupons.checked =
data.allowCoupons ?? true;

allowScholarships.checked =
data.allowScholarships ?? true;

}
/* ===================================
   SAVE MONETIZATION
=================================== */

document
.getElementById("saveMonetization")
.addEventListener(
"click",
saveMonetization
);

async function saveMonetization(){

try{

const data={

/* ---------- COURSE FEES ---------- */

courseFee:
Number(courseFee.value),

registrationFee:
Number(registrationFee.value),

examinationFee:
Number(examinationFee.value),

certificateFee:
Number(certificateFee.value),

/* ---------- COMMISSION ---------- */

platformCommission:
Number(platformCommission.value),

instructorCommission:
Number(instructorCommission.value),

/* ---------- PAYMENT ---------- */

currency:
currency.value,

enablePayments:
enablePayments.checked,

allowRefunds:
allowRefunds.checked,

refundDays:
Number(refundDays.value),

/* ---------- WITHDRAWALS ---------- */

minimumWithdrawal:
Number(minimumWithdrawal.value),

withdrawalFeePercent:
Number(withdrawalFee.value),

withdrawalTime:
withdrawalTime.value,

enableWithdrawals:
enableWithdrawals.checked,

withdrawalApproval:
withdrawalApproval.checked,

/* ---------- DISCOUNTS ---------- */

allowCoupons:
allowCoupons.checked,

allowScholarships:
allowScholarships.checked,

/* ---------- KEEP EXISTING REVENUE ---------- */

updatedAt:
serverTimestamp()

};


await setDoc(

monetizationRef,

data,

{merge:true}

);

/* Instructor withdrawal requests read this shared platform record. */
await setDoc(
doc(db,"platformSettings","earnings"),
{
minimumWithdrawal:data.minimumWithdrawal,
withdrawalFeePercent:data.withdrawalFeePercent,
withdrawalsEnabled:data.enableWithdrawals,
withdrawalApproval:data.withdrawalApproval,
withdrawalProcessingTime:data.withdrawalTime,
updatedAt:serverTimestamp()
},
{merge:true}
);


alert(
"✅ Monetization settings saved successfully."
);

console.log(
"Monetization updated."
);

}

catch(error){

console.error(
"Save failed:",
error
);

alert(
"❌ Failed to save monetization settings."
);

}

}
