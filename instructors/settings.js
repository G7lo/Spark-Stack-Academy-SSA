import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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


let instructor = null;



onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href =
        "../login.html";

        return;

    }

    instructor = user;

    try{

        const instructorRef =
        doc(db,"instructors",user.uid);

        const instructorSnap =
        await getDoc(instructorRef);

        if(!instructorSnap.exists()){

            alert("Instructor profile not found.");

            return;

        }

        const data =
        instructorSnap.data();

        nameInput.value =
        data.name || "";

        emailInput.value =
        data.email || "";

        bioInput.value =
        data.bio || "";

        expertiseInput.value =
        data.expertise || "";

    }

    catch(error){

        console.error(error);

        alert("Failed to load profile.");

    }

});



saveProfileBtn.addEventListener("click",async()=>{

    if(!instructor){

        return;

    }

    saveProfileBtn.disabled = true;

    saveProfileBtn.textContent =
    "Saving...";

    try{

        await updateDoc(

            doc(db,"instructors",instructor.uid),

            {

                name:
                nameInput.value.trim(),

                bio:
                bioInput.value.trim(),

                expertise:
                expertiseInput.value.trim()

            }

        );

        alert("✅ Profile updated successfully!");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

    finally{

        saveProfileBtn.disabled = false;

        saveProfileBtn.textContent =
        "💾 Save Profile";

    }

});



changePasswordBtn.addEventListener("click",()=>{

    alert(

        "Password reset will be available in a future update."

    );

});