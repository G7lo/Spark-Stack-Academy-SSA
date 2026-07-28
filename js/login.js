/* ===========================
   SSA LOGIN SYSTEM
=========================== */


import {
    auth,
    db
} from "./firebase.js";


import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===========================
   ELEMENTS
=========================== */


const loginForm =
document.getElementById("loginForm");


const loginBtn =
document.getElementById("loginBtn");





/* ===========================
   TOAST SYSTEM
=========================== */


function showToast(message,type="success"){


    const container =
    document.getElementById(
        "toastContainer"
    );


    if(!container) return;



    const toast =
    document.createElement("div");


    toast.className =
    `toast ${type}`;


    toast.textContent =
    message;



    container.appendChild(toast);



    setTimeout(()=>{

        toast.classList.add("show");

    },100);



    setTimeout(()=>{

        toast.classList.remove("show");


        setTimeout(()=>{

            toast.remove();

        },300);


    },3000);


}





/* ===========================
   LOADER
=========================== */


function showLoader(message){


    const loader =
    document.getElementById(
        "authLoader"
    );


    const text =
    document.getElementById(
        "loaderText"
    );



    if(loader){

        loader.classList.add(
            "active"
        );

    }


    if(text){

        text.textContent =
        message;

    }


}






/* ===========================
   LOGIN FLOW
=========================== */


loginForm.addEventListener(
"submit",
async(e)=>{


    e.preventDefault();



    const email =
    document
    .getElementById("email")
    .value
    .trim();



    const password =
    document
    .getElementById("password")
    .value;




    loginBtn.disabled = true;

    loginBtn.textContent =
    "Logging in...";



    try{


        const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );



        const uid =
        userCredential.user.uid;




        // FOUNDER

        const founderSnap =
        await getDoc(
            doc(
                db,
                "founder",
                uid
            )
        );


        if(founderSnap.exists()){


            showLoader(
            "Loading founder console..."
            );


            window.location.href =
            "founder/dashboard.html";


            return;

        }





        // ADMIN

        const adminSnap =
        await getDoc(
            doc(
                db,
                "admins",
                uid
            )
        );


        if(adminSnap.exists()){


            showLoader(
            "Opening admin command center..."
            );


            window.location.href =
            "admin/dashboard.html";


            return;

        }






        // INSTRUCTOR

        const instructorSnap =
        await getDoc(
            doc(
                db,
                "instructors",
                uid
            )
        );


        if(instructorSnap.exists()){


            showLoader(
            "Preparing instructor workspace..."
            );


            window.location.href =
            "instructors/dashboard.html";


            return;

        }







        // STUDENT

        const studentSnap =
        await getDoc(
            doc(
                db,
                "students",
                uid
            )
        );


        if(studentSnap.exists()){


            showLoader(
            "Loading student dashboard..."
            );


            window.location.href =
            "student/dashboard.html";


            return;

        }






        showToast(
        "Account profile not found.",
        "error"
        );



    }


    catch(error){


        console.error(
            error
        );


        showToast(
            error.message,
            "error"
        );


    }



    finally{


        loginBtn.disabled =
        false;


        loginBtn.textContent =
        "Login";


    }


});