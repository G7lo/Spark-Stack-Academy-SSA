/* ===========================
   SSA SIGNUP SYSTEM
=========================== */


import {
    auth,
    db
} from "./firebase.js";


import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";





/* ===========================
   ELEMENTS
=========================== */


const signupForm =
document.getElementById("signupForm");


const roleSelect =
document.getElementById("role");


const instructorFields =
document.getElementById(
    "instructorFields"
);


const signupBtn =
document.getElementById(
    "signupBtn"
);






/* ===========================
   ROLE FIELD TOGGLE
=========================== */


roleSelect.addEventListener(
"change",
()=>{


    if(
        roleSelect.value === "instructor"
    ){


        instructorFields.style.display =
        "block";


        document
        .getElementById("bio")
        .required = true;


        document
        .getElementById("expertise")
        .required = true;


    }


    else{


        instructorFields.style.display =
        "none";


        document
        .getElementById("bio")
        .required = false;


        document
        .getElementById("expertise")
        .required = false;


    }


});







/* ===========================
   TOAST SYSTEM
=========================== */


function showToast(
message,
type="success"
){


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


        toast.classList.add(
            "show"
        );


    },100);





    setTimeout(()=>{


        toast.classList.remove(
            "show"
        );



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
   SIGNUP FLOW
=========================== */


signupForm.addEventListener(
"submit",
async(e)=>{


    e.preventDefault();




    const name =
    document
    .getElementById("name")
    .value
    .trim();



    const email =
    document
    .getElementById("email")
    .value
    .trim();



    const password =
    document
    .getElementById("password")
    .value;



    const selectedRole =
    roleSelect.value;




    const bio =
    document
    .getElementById("bio")
    ?.value
    .trim()
    || "";



    const expertise =
    document
    .getElementById("expertise")
    ?.value
    .trim()
    || "";







    signupBtn.disabled =
    true;



    signupBtn.textContent =
    "Creating Account...";







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

                doc(
                    db,
                    "students",
                    uid
                ),

                {


                    name,


                    email,


                    role:"student",


                    coursesEnrolled:0,


                    progress:0,


                    certificates:0,


                    status:"Active",


                    createdAt:
                    serverTimestamp()


                }

            );


        }








        if(selectedRole === "instructor"){



            await setDoc(

                doc(
                    db,
                    "instructors",
                    uid
                ),

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


                    status:"Pending",


                    createdAt:
                    serverTimestamp()


                }

            );


        }







        showToast(

        "🎉 Account created successfully!",

        "success"

        );





        showLoader(

        "Preparing your SSA login..."

        );






        setTimeout(()=>{


            window.location.href =
            "login.html";


        },1200);





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


        signupBtn.disabled =
        false;



        signupBtn.textContent =
        "Create Account";



    }




});