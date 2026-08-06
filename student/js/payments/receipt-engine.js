// =====================================
// SPARK STACK ACADEMY
// RECEIPT ENGINE
// receipt-engine.js
// =====================================

import { db } from "../../../js/firebase.js";

import {

collection,
addDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🧾 Receipt Engine Loaded");



// =====================================
// CREATE RECEIPT
// =====================================

export async function createReceipt(

payment

){

try{


const receiptNumber =

`SSA-${Date.now()}`;



await addDoc(

collection(db,"receipts"),

{

receiptNumber,

userId:
payment.userId,

course:
payment.course,

amount:
payment.amount,

method:
payment.method,

phone:
payment.phone,

mpesaReceipt:
payment.mpesaReceipt || "",

status:
"success",

createdAt:
serverTimestamp()

}

);



console.log(
"🧾 Receipt Generated"
);


}

catch(error){

console.error(

"Receipt generation failed:",

error

);


}

}