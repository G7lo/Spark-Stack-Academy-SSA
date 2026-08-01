import { db } from "../../js/firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===================================
   CREATE NOTIFICATION
=================================== */


export async function createNotification({

userId,

title,

message,

type="system",

priority="normal",

link=""

}){


try{


await addDoc(

collection(
db,
"notifications"
),

{


userId,

title,

message,

type,

priority,

read:false,

link,

createdAt:
serverTimestamp()


}

);



console.log(
"Notification created"
);



}


catch(error){

console.error(
"Notification error:",
error
);

}


}