// ===========================
// SSA ADMIN APP CORE
// ===========================


import { auth, db } from "../../js/firebase.js";


import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import "../../js/theme.js";


console.log("SSA ADMIN APP CONNECTED");




// ===========================
// INITIALIZE
// ===========================


window.addEventListener(
"DOMContentLoaded",
async()=>{


await loadSidebar();

await loadTopbar();

loadAdmin();

highlightActivePage();


});







// ===========================
// LOAD SIDEBAR
// ===========================


async function loadSidebar(){


const css =
document.createElement("link");


css.rel="stylesheet";


css.href="components/sidebar.css";


document.head.appendChild(css);



const container =
document.getElementById(
"sidebarContainer"
);



if(!container) return;



const res =
await fetch(
"components/sidebar.html"
);



container.innerHTML =
await res.text();



if(typeof lucide !== "undefined"){

lucide.createIcons();

}



highlightActivePage();


}







// ===========================
// LOAD TOPBAR
// ===========================


async function loadTopbar(){


const css =
document.createElement("link");


css.rel="stylesheet";


css.href="components/topbar.css";


document.head.appendChild(css);




const container =
document.getElementById(
"topbarContainer"
);



if(!container) return;




const res =
await fetch(
"components/topbar.html"
);



container.innerHTML =
await res.text();




if(typeof lucide !== "undefined"){

lucide.createIcons();

}




setupSidebar();

setupLogout();


}








// ===========================
// LOAD ADMIN AUTH
// ===========================


function loadAdmin(){


onAuthStateChanged(

auth,

async(user)=>{


if(!user){

window.location.href =
"../login.html";

return;

}



try{


const ref =
doc(
db,
"users",
user.uid
);



const snap =
await getDoc(ref);



if(!snap.exists()){


console.log(
"Admin profile missing"
);


return;

}



const admin =
snap.data();



if(
admin.role !== "admin"
){


console.log(
"Access denied"
);


window.location.href =
"../login.html";


return;


}



updateAdminUI(
admin,
user
);



}

catch(error){


console.error(
"Admin auth error:",
error
);


}


});


}








// ===========================
// UPDATE ADMIN UI
// ===========================


function updateAdminUI(admin,user){



const name =
document.getElementById(
"adminName"
);



if(name){

name.textContent =
admin.name || "Admin";

}



const email =
document.getElementById(
"adminEmail"
);



if(email){

email.textContent =
user.email || "";

}



}









// ===========================
// LOGOUT
// ===========================


function setupLogout(){


const logout =
document.getElementById(
"logoutBtn"
);



if(!logout) return;



logout.onclick =
async()=>{


await signOut(auth);


window.location.href =
"../login.html";


};


}








// ===========================
// MOBILE SIDEBAR
// ===========================


function setupSidebar(){



const menuBtn =
document.getElementById(
"menuBtn"
);



const sidebar =
document.querySelector(
".sidebar"
);



const overlay =
document.getElementById(
"sidebarOverlay"
);




if(
!menuBtn ||
!sidebar ||
!overlay
) return;




menuBtn.onclick = ()=>{


sidebar.classList.toggle(
"active"
);


overlay.classList.toggle(
"show"
);


};





overlay.onclick = ()=>{


sidebar.classList.remove(
"active"
);


overlay.classList.remove(
"show"
);


};


}








// ===========================
// ACTIVE PAGE
// ===========================


function highlightActivePage(){



const current =
window.location.pathname
.split("/")
.pop();




document
.querySelectorAll(
".sidebar a"
)
.forEach(link=>{



link.classList.remove(
"active"
);



if(
link.getAttribute("href")
=== current
){


link.classList.add(
"active"
);


}



});


}