// =====================================
// SPARK STACK ACADEMY
// PAYMENT ENGINE
// payment-engine.js
// =====================================

import { db } from "../../../js/firebase.js";

import {

collection,
addDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("💳 Payment Engine Loaded");



// =====================================
// CREATE PAYMENT
// =====================================

export async function createPayment(

{

userId,
courseId,
courseName,
amount,
phone,
method="M-PESA"

}

){

try{

const paymentRef =

await addDoc(

collection(db,"payments"),

{

userId,

courseId,

courseName,

amount,

phone,

method,

status:"pending",

createdAt:serverTimestamp()

}

);

console.log(
"✅ Payment Created:",
paymentRef.id
);

return paymentRef.id;

}

catch(error){

console.error(
"Payment creation failed:",
error
);

throw error;

}

}
// =====================================
// IMPORTS
// =====================================

import {

doc,
getDoc,
updateDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

updateInvoice

} from "./invoice-engine.js";

import {

createReceipt

} from "./receipt-engine.js";

import {

giveReward

} from "../rewards/rewards.js";

// =====================================
// SUCCESSFUL PAYMENT
// =====================================

export async function processSuccessfulPayment(

paymentId,
mpesaReceipt

){

try{

const paymentRef =

doc(
db,
"payments",
paymentId
);

const snap =
await getDoc(paymentRef);

if(!snap.exists()){

return;

}

const payment =
snap.data();



// Update payment

await updateDoc(

paymentRef,

{

status:"success",

mpesaReceipt,

completedAt:serverTimestamp()

}

);



// Update invoice

const invoiceQuery = query(

collection(db,"invoices"),

where(
"userId",
"==",
payment.userId
),

where(
"courseId",
"==",
payment.courseId
)

);

const invoiceSnap =
await getDocs(invoiceQuery);

invoiceSnap.forEach(

invoice=>{

updateInvoice(

invoice,

payment.amount

);

}

);



// Generate receipt

await createReceipt({

...payment,

mpesaReceipt

});



// Reward XP

await giveReward(

payment.userId,

50,

"payment_complete"

);



console.log(
"🎉 Payment completed successfully."
);

}

catch(error){

console.error(

error

);

}

}