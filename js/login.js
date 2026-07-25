import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const loginForm =
document.getElementById("loginForm");


loginForm.addEventListener("submit", async(e)=>{

    e.preventDefault();


    const email =
    document.getElementById("email").value.trim();


    const password =
    document.getElementById("password").value;



    try{


        const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        const uid =
        userCredential.user.uid;



        // 1. Check Founder

        const founderSnap =
        await getDoc(
            doc(db,"founders",uid)
        );


        if(founderSnap.exists()){

            window.location.href =
            "founder/dashboard.html";

            return;

        }



        // 2. Check Instructor

        const instructorSnap =
        await getDoc(
            doc(db,"instructors",uid)
        );


        if(instructorSnap.exists()){

            window.location.href =
            "instructors/dashboard.html";

            return;

        }



        // 3. Check Student

        const studentSnap =
        await getDoc(
            doc(db,"students",uid)
        );


        if(studentSnap.exists()){

            window.location.href =
            "student/dashboard.html";

            return;

        }



        alert(
        "Account profile not found."
        );


    }


    catch(error){

        console.error(error);

        alert(error.message);

    }


});