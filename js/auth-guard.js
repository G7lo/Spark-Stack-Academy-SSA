// ============================================
// SPARK STACK ACADEMY
// AUTH GUARD SYSTEM
// ============================================

import {
    auth,
    db
} from "./firebase.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================
// DASHBOARD ROUTES
// ============================================

const DASHBOARDS = {

    founder: "/founder/dashboard.html",

    admin: "/admin/dashboard.html",

    instructor: "/instructors/dashboard.html",

    student: "/student/dashboard.html"

};


// ============================================
// CHECK ACCESS
// ============================================

export function protectPage(requiredRole){


onAuthStateChanged(auth, async(user)=>{


    // Not logged in

    if(!user){

        window.location.href =
        "/login.html";

        return;

    }



    try{


        const userRef =
        doc(db,"users",user.uid);



        const userSnap =
        await getDoc(userRef);



        if(!userSnap.exists()){


            window.location.href =
            "/login.html";

            return;

        }



        const userData =
        userSnap.data();



        // Role check

        if(userData.role !== requiredRole){


            alert(
            "Access denied."
            );


            window.location.href =
            DASHBOARDS[userData.role] ||
            "/login.html";


            return;

        }



        console.log(
        "Authorized:",
        userData.role
        );


    }

    catch(error){


        console.error(
        "Guard error:",
        error
        );


        window.location.href =
        "/login.html";


    }



});


}