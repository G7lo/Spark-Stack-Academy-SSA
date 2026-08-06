// =====================================
// SPARK STACK ACADEMY
// CHAT INPUT CONTROLLER
// input.js
// =====================================

console.log("⌨️ Chat Input Loaded");


const messageInput = document.getElementById(
"messageInput"
);


if(messageInput){


messageInput.addEventListener(
"input",
()=>{


messageInput.style.height = "auto";


messageInput.style.height =
messageInput.scrollHeight + "px";


}
);



messageInput.addEventListener(
"keydown",
(e)=>{


if(
e.key === "Enter" &&
!e.shiftKey
){


e.preventDefault();

document
.getElementById("sendBtn")
?.click();


}


}

);


}