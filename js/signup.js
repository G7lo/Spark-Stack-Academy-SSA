import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const signupForm =
document.getElementById("signupForm");


const role =
document.getElementById("role");


const instructorFields =
document.getElementById("instructorFields");


role.addEventListener("change",()=>{

    if(role.value === "instructor"){

        instructorFields.style.display = "block";

        document.getElementById("bio").required = true;
        document.getElementById("expertise").required = true;

    }else{

        instructorFields.style.display = "none";

        document.getElementById("bio").required = false;
        document.getElementById("expertise").required = false;

    }

});


signupForm.addEventListener("submit", async(e)=>{

    e.preventDefault();


    const name =
    document.getElementById("name").value.trim();


    const email =
    document.getElementById("email").value.trim();


    const password =
    document.getElementById("password").value;


    const selectedRole =
    role.value;


    const bio =
    document.getElementById("bio")?.value.trim() || "";


    const expertise =
    document.getElementById("expertise")?.value.trim() || "";



    try{


        const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


        const uid =
        userCredential.user.uid;



        if(selectedRole === "student"){


            await setDoc(
                doc(db,"students",uid),
                {

                    name,

                    email,

                    role:"student",

                    coursesEnrolled:0,

                    progress:0,

                    certificates:0,

                    createdAt:
                    serverTimestamp()

                }
            );


        }



        if(selectedRole === "instructor"){


            await setDoc(
                doc(db,"instructors",uid),
                {

                    name,

                    email,

                    role:"instructor",

                    bio,

                    expertise,

                    verified:false,

                    totalStudents:0,

                    totalCourses:0,

                    rating:0,

                    createdAt:
                    serverTimestamp()

                }
            );


        }



        alert("🎉 Account created successfully!");

        window.location.href =
        "login.html";


    }


    catch(error){

        console.error(error);

        alert(error.message);

    }


});