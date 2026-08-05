// =====================================
// SPARK STACK ACADEMY
// MESSAGE UPLOAD ENGINE V1
// =====================================


console.log(
"📎 Upload Module Loaded"
);





// =====================================
// DOM
// =====================================


const attachBtn =

document.getElementById(
"attachBtn"
);



const fileInput =

document.getElementById(
"fileInput"
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






let selectedFile = null;





// =====================================
// INITIALIZE
// =====================================


export function initUploads(){



console.log(

"Upload system ready"

);




attachBtn?.addEventListener(

"click",

()=>{


fileInput.click();



}

);





fileInput?.addEventListener(

"change",

handleFileSelect

);





removeFileBtn?.addEventListener(

"click",

clearFile

);



}








// =====================================
// FILE SELECT
// =====================================


function handleFileSelect(event){



const file =

event.target.files[0];





if(!file)

return;




if(!validateFile(file))

return;



selectedFile = file;



showPreview(

file

);



}







// =====================================
// SHOW PREVIEW
// =====================================


function showPreview(file){



if(!uploadPreview)

return;





uploadPreview.style.display =

"flex";





fileName.textContent =

file.name;



}







// =====================================
// REMOVE FILE
// =====================================


function clearFile(){



selectedFile = null;



if(fileInput)

fileInput.value = "";





if(uploadPreview)

uploadPreview.style.display =

"none";



}







// =====================================
// GET FILE
// =====================================


export function getSelectedFile(){



return selectedFile;



}



// =====================================
// FILE VALIDATION
// =====================================


export function validateFile(file){



if(!file)

return false;





const allowedTypes = [


"image/jpeg",

"image/png",

"image/webp",

"application/pdf",

"application/msword",

"application/vnd.openxmlformats-officedocument.wordprocessingml.document"


];






if(!allowedTypes.includes(file.type)){


alert(

"File type not supported"

);


return false;


}






// 10MB LIMIT

const maxSize =

10 * 1024 * 1024;






if(file.size > maxSize){


alert(

"File too large. Maximum 10MB"

);


return false;


}






return true;



}








// =====================================
// FILE INFORMATION
// =====================================


export function getFileData(file){



if(!file)

return null;






return {


name:file.name,


type:file.type,


size:file.size,


category:getFileCategory(file.type)



};



}







// =====================================
// FILE CATEGORY
// =====================================


function getFileCategory(type){



if(type.startsWith("image"))

return "image";



if(type === "application/pdf")

return "pdf";



return "document";



}