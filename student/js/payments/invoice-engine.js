// =====================================
// SPARK STACK ACADEMY
// INVOICE ENGINE
// invoice-engine.js
// =====================================

import { db } from "../../../js/firebase.js";

import {

collection,
addDoc,
serverTimestamp,
query,
where,
getDocs,
updateDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🧾 Invoice Engine Loaded");



// =====================================
// CREATE INVOICE
// =====================================

export async function createInvoice(

enrollment

){

try{

const existing = query(

collection(db,"invoices"),

where(
"userId",
"==",
enrollment.userId
),

where(
"courseId",
"==",
enrollment.courseId
)

);

const snap = await getDocs(existing);

if(!snap.empty){

console.log(
"Invoice already exists."
);

return;
}

await addDoc(

collection(db,"invoices"),

{

userId:
enrollment.userId,

enrollmentId:
enrollment.enrollmentId,

courseId:
enrollment.courseId,

courseName:
enrollment.courseName,

totalFee:
Number(enrollment.totalFee),

amountPaid:0,

balance:
Number(enrollment.totalFee),

status:"pending",

dueDate:
enrollment.dueDate || null,

createdAt:
serverTimestamp(),

updatedAt:
serverTimestamp()

}

);

console.log("✅ Invoice created");

}

catch(error){

console.error(
"Invoice creation failed:",
error
);

}

}

// =====================================
// UPDATE INVOICE
// =====================================

export async function updateInvoice(

invoiceRef,

paymentAmount

){

const data =
invoiceRef.data();

const paid =
(data.amountPaid || 0) + paymentAmount;

const balance =
Math.max(0,(data.totalFee || 0)-paid);

let status =
"partial";

if(balance === 0){

status = "paid";

}else if(paid === 0){

status = "pending";

}

await updateDoc(

invoiceRef.ref,

{

amountPaid:paid,

balance:balance,

status:status,

updatedAt:serverTimestamp()

}

);

}