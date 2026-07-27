/* ===========================
   SSA ADMIN APP CORE
=========================== */


/* ===========================
   IMPORTS
=========================== */

import {
    auth,
    db
} from "../../js/firebase.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===========================
   LOAD SIDEBAR
=========================== */

async function loadSidebar(){

    const container =
    document.getElementById(
        "sidebarContainer"
    );


    if(!container) return;


    try{


        const response =
        await fetch(
            "components/sidebar.html"
        );


        container.innerHTML =
        await response.text();



        if(typeof lucide !== "undefined"){

            lucide.createIcons();

        }


    }


    catch(error){

        console.error(
            "Sidebar error:",
            error
        );

    }

}



/* ===========================
   LOAD TOPBAR
=========================== */

async function loadTopbar(){

    const container =
    document.getElementById(
        "topbarContainer"
    );


    if(!container) return;


    try{


        const response =
        await fetch(
            "components/topbar.html"
        );


        container.innerHTML =
        await response.text();



        if(typeof lucide !== "undefined"){

            lucide.createIcons();

        }


    }


    catch(error){

        console.error(
            "Topbar error:",
            error
        );

    }

}
/* ===========================
   ADMIN AUTH CHECK
=========================== */


function checkAdmin(){


onAuthStateChanged(
auth,
async(user)=>{


    if(!user){

        window.location.href =
        "../login.html";

        return;

    }



    try{


        const adminRef =
        doc(
            db,
            "admins",
            user.uid
        );



        const adminSnap =
        await getDoc(adminRef);



        if(!adminSnap.exists()){


            alert(
                "Access denied"
            );


            window.location.href =
            "../index.html";


            return;

        }



        console.log(
            "Admin verified:",
            user.email
        );



    }


    catch(error){


        console.error(
            "Admin verification error:",
            error
        );


        window.location.href =
        "../index.html";


    }


});


}




/* ===========================
   START ADMIN APP
=========================== */


loadSidebar();

loadTopbar();

checkAdmin();