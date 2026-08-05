// =====================================
// SPARK STACK ACADEMY
// REAL TIME MESSAGING ENGINE V1
// uploads.js
// FILE UPLOAD SYSTEM
// =====================================


import {

auth,
db,
storage

} from "../../../js/firebase.js";


import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

ref,
uploadBytes,
getDownloadURL

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


import {

collection,
addDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log(
"📎 Upload Engine Loaded"
);




// =====================================
// STATE
// =====================================


let currentUser=null;

let activeChatId=null;

let selectedFile=null;




// =====================================
// DOM
// =====================================


const fileInput =

document.getElementById(
"fileInput"
);


const attachBtn =

document.getElementById(
"attachBtn"
);


const uploadPreview =

document.getElementById(
"uploadPreview"
);


const fileName =

document.getElementById(
"fileName"
);


const removeFileBtn =

document.getElementById(
"removeFileBtn"
);




// =====================================
// AUTH
// =====================================


onAuthStateChanged(

auth,

(user)=>{


if(user){

currentUser=user;

}


});





// =====================================
// ACTIVE CHAT
// =====================================


window.addEventListener(

"openChat",

(e)=>{


activeChatId=e.detail.id;


});





// =====================================
// OPEN FILE PICKER
// =====================================


attachBtn?.addEventListener(

"click",

()=>{


fileInput.click();


});





// =====================================
// SELECT FILE
// =====================================


fileInput?.addEventListener(

"change",

()=>{


selectedFile =

fileInput.files[0];



if(!selectedFile)

return;



fileName.textContent =

selectedFile.name;



uploadPreview.style.display="flex";



});






// =====================================
// REMOVE FILE
// =====================================


removeFileBtn?.addEventListener(

"click",

()=>{


selectedFile=null;


fileInput.value="";


uploadPreview.style.display="none";


});






// =====================================
// UPLOAD FILE
// =====================================


export async function uploadFile(){



if(!selectedFile || !activeChatId)

return null;



const filePath =

`chatUploads/${

activeChatId

}/${

Date.now()

}_${

selectedFile.name

}`;





const storageRef =

ref(

storage,

filePath

);





await uploadBytes(

storageRef,

selectedFile

);





const url =

await getDownloadURL(

storageRef

);





await addDoc(

collection(

db,

"chats",

activeChatId,

"messages"

),

{


senderId:

currentUser.uid,


fileUrl:url,


fileName:

selectedFile.name,


fileType:

selectedFile.type,


createdAt:

serverTimestamp()



}

);





selectedFile=null;


fileInput.value="";


uploadPreview.style.display="none";


return url;



}