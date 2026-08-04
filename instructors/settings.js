import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



/* ===========================
   DOM
=========================== */

const nameInput =
document.getElementById("name");

const emailInput =
document.getElementById("email");

const bioInput =
document.getElementById("bio");

const expertiseInput =
document.getElementById("expertise");

const saveProfileBtn =
document.getElementById("saveProfileBtn");

const changePasswordBtn =
document.getElementById("changePasswordBtn");



let currentUser = null;



/* ===========================
   TOAST
=========================== */

function showToast(message){

    let toast =
    document.getElementById("toast");


    if(!toast){

        toast =
        document.createElement("div");

        toast.id="toast";

        toast.className="toast";

        document.body.appendChild(toast);

    }


    toast.textContent = message;

    toast.classList.add("show");


    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}



/* ===========================
   LOAD PROFILE
=========================== */

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href =
        "../login.html";

        return;

    }


    currentUser = user;


    try{


        const profileRef =
        doc(
            db,
            "instructors",
            user.uid
        );


        const snapshot =
        await getDoc(profileRef);



        if(!snapshot.exists()){

            showToast(
                "Instructor profile not found."
            );

            return;

        }



        const data =
        snapshot.data();



        nameInput.value =
        data.name || "";


        emailInput.value =
        data.email || user.email;


        bioInput.value =
        data.bio || "";


        expertiseInput.value =
        data.expertise || "";



    }


    catch(error){

        console.error(
            "Profile loading error:",
            error
        );


        showToast(
            "Failed to load profile."
        );

    }


});



/* ===========================
   SAVE PROFILE
=========================== */

saveProfileBtn.addEventListener(
"click",
async()=>{


    if(!currentUser){

        return;

    }



    saveProfileBtn.disabled = true;

    saveProfileBtn.textContent =
    "Saving...";



    try{


        await updateDoc(

            doc(
                db,
                "instructors",
                currentUser.uid
            ),

            {

                name:
                nameInput.value.trim(),


                bio:
                bioInput.value.trim(),


                expertise:
                expertiseInput.value.trim()

            }

        );



        showToast(
            "✅ Profile updated successfully"
        );


    }


    catch(error){

        console.error(
            error
        );


        showToast(
            "Failed to update profile"
        );

    }



    finally{


        saveProfileBtn.disabled =
        false;


        saveProfileBtn.textContent =
        "💾 Save Profile";


    }


});



/* ===========================
   PASSWORD
=========================== */

changePasswordBtn.addEventListener(
"click",
()=>{


    showToast(
        "🔒 Password reset coming soon"
    );


});