// ============================================
// SPARK STACK ACADEMY
// SIGNUP CONTROLLER V2
// PART 1 - IMPORTS & INITIALIZATION
// ============================================


// ==============================
// FIREBASE IMPORTS
// ==============================

import {
    auth,
    db
} from "./firebase.js";


import {

    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

    doc,
    setDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";




// ==============================
// DOM ELEMENTS
// ==============================


const signupForm =
document.getElementById(
    "signupForm"
);


const nameInput =
document.getElementById(
    "name"
);


const emailInput =
document.getElementById(
    "email"
);


const passwordInput =
document.getElementById(
    "password"
);


const confirmPasswordInput =
document.getElementById(
    "confirmPassword"
);


const roleSelect =
document.getElementById(
    "role"
);


const bioInput =
document.getElementById(
    "bio"
);


const expertiseInput =
document.getElementById(
    "expertise"
);


const termsCheckbox =
document.getElementById(
    "terms"
);


const signupBtn =
document.getElementById(
    "signupBtn"
);


const googleSignupBtn =
document.getElementById(
    "googleSignup"
);


const instructorFields =
document.getElementById(
    "instructorFields"
);


const toastContainer =
document.getElementById(
    "toastContainer"
);


const loader =
document.getElementById(
    "authLoader"
);


const loaderText =
document.getElementById(
    "loaderText"
);




// ==============================
// GOOGLE PROVIDER
// ==============================


const provider =
new GoogleAuthProvider();


provider.setCustomParameters({

    prompt:"select_account"

});





console.log(
    "🚀 SSA Signup Controller Loaded"
);
// ============================================
// PART 2 - UI HELPERS & VALIDATION
// ============================================


// ==============================
// LOADER
// ==============================

function showLoader(message){

    if(!loader)
        return;


    loader.classList.add(
        "active"
    );


    if(loaderText)

        loaderText.textContent =
        message;

}



function hideLoader(){

    if(!loader)
        return;


    loader.classList.remove(
        "active"
    );

}




// ==============================
// TOAST
// ==============================


function showToast(
    message,
    type="success"
){


    if(!toastContainer)
        return;



    const toast =
    document.createElement(
        "div"
    );



    toast.className =
    `toast ${type}`;



    toast.innerHTML =
    `
        <strong>
            ${message}
        </strong>
    `;



    toastContainer.appendChild(
        toast
    );



    setTimeout(()=>{


        toast.style.opacity =
        "0";


        toast.style.transform =
        "translateX(40px)";



        setTimeout(()=>{

            toast.remove();

        },300);



    },3500);



}





// ==============================
// VALIDATION
// ==============================


function isValidEmail(email){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}



function hasUpperCase(password){

    return /[A-Z]/.test(password);

}



function hasLowerCase(password){

    return /[a-z]/.test(password);

}



function hasNumber(password){

    return /\d/.test(password);

}



function hasMinimumLength(password){

    return password.length >= 8;

}





// ==============================
// BUTTON CONTROL
// ==============================


function disableButtons(){

    if(signupBtn)

        signupBtn.disabled = true;


    if(googleSignupBtn)

        googleSignupBtn.disabled = true;

}





function enableButtons(){

    if(signupBtn)

        signupBtn.disabled = false;


    if(googleSignupBtn)

        googleSignupBtn.disabled = false;

}



console.log(
    "✅ Signup Helpers Ready"
);
// ============================================
// PART 3 - EMAIL SIGNUP
// ============================================


signupForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();




const fullName =
nameInput.value.trim();


const email =
emailInput.value.trim();


const password =
passwordInput.value;


const confirmPassword =
confirmPasswordInput.value;


const role =
roleSelect.value;


const bio =
bioInput.value.trim();


const expertise =
expertiseInput.value.trim();




// ==============================
// VALIDATION
// ==============================


if(!fullName){

    showToast(
        "Enter your full name",
        "error"
    );

    return;

}



if(!isValidEmail(email)){

    showToast(
        "Enter a valid email",
        "error"
    );

    return;

}



if(
!hasMinimumLength(password) ||
!hasUpperCase(password) ||
!hasLowerCase(password) ||
!hasNumber(password)
){

    showToast(
        "Password must contain uppercase, lowercase, number and 8 characters",
        "error"
    );

    return;

}



if(password !== confirmPassword){

    showToast(
        "Passwords do not match",
        "error"
    );

    return;

}



if(!role){

    showToast(
        "Select account type",
        "error"
    );

    return;

}



if(!termsCheckbox.checked){

    showToast(
        "Accept Terms & Conditions",
        "warning"
    );

    return;

}





try{


disableButtons();

showLoader(
    "Creating account..."
);




// ==============================
// CREATE AUTH ACCOUNT
// ==============================


const credential =
await createUserWithEmailAndPassword(
    auth,
    email,
    password
);



const user =
credential.user;




// ==============================
// UPDATE AUTH PROFILE
// ==============================


await updateProfile(
user,
{

    displayName:
    fullName

}

);






// ==============================
// USERS COLLECTION
// ==============================


await setDoc(

doc(
    db,
    "users",
    user.uid
),

{

    uid:user.uid,

    fullName,

    email,

    role,

    bio:
    role === "instructor"
    ? bio
    : "",


    expertise:
    role === "instructor"
    ? expertise
    : "",


    profilePhoto:"",


    active:true,


    verified:false,


    createdAt:
    serverTimestamp(),


    lastLogin:
    serverTimestamp()

}

);







// ==============================
// STUDENT PROFILE
// MATCHES DASHBOARD
// ==============================


if(role === "student"){


await setDoc(

doc(
    db,
    "students",
    user.uid
),

{

    uid:user.uid,


    name:fullName,


    email,


    level:1,


    xp:0,


    streak:0,


    badges:[],


    stats:{


        coursesEnrolled:0,


        lessonsCompleted:0,


        progress:0,


        certificates:0


    },


    admissionNumber:
    "Pending",


    createdAt:
    serverTimestamp()


}

);


}







showToast(
"Account created successfully!",
"success"
);




setTimeout(()=>{


hideLoader();



if(role==="student"){


window.location.href =
"student/dashboard.html";


}

else{


window.location.href =
"login.html";


}



},1500);





}

catch(error){


console.error(
"Signup Error:",
error
);



hideLoader();

enableButtons();



showToast(
error.message,
"error"
);



}



});
// ============================================
// PART 4 - GOOGLE SIGNUP
// ============================================


if(googleSignupBtn){


googleSignupBtn.addEventListener(
"click",
async()=>{


try{


disableButtons();


showLoader(
"Signing in with Google..."
);




// ==============================
// GOOGLE AUTH
// ==============================


const result =
await signInWithPopup(
    auth,
    provider
);



const user =
result.user;




// ==============================
// USERS COLLECTION
// ==============================


await setDoc(

doc(
    db,
    "users",
    user.uid
),

{

    uid:user.uid,


    fullName:
    user.displayName || "Student",


    email:
    user.email || "",


    role:"student",


    bio:"",


    expertise:"",


    profilePhoto:
    user.photoURL || "",


    active:true,


    verified:
    user.emailVerified,


    provider:"google",


    createdAt:
    serverTimestamp(),


    lastLogin:
    serverTimestamp()


},

{
    merge:true
}

);







// ==============================
// CREATE STUDENT PROFILE
// ==============================


await setDoc(

doc(
    db,
    "students",
    user.uid
),

{

    uid:user.uid,


    name:
    user.displayName || "Student",


    email:
    user.email || "",


    level:1,


    xp:0,


    streak:0,


    badges:[],


    stats:{


        coursesEnrolled:0,


        lessonsCompleted:0,


        progress:0,


        certificates:0


    },


    admissionNumber:
    "Pending",


    createdAt:
    serverTimestamp()


},

{
    merge:true
}

);






showToast(
"Welcome to Spark Stack Academy!",
"success"
);






setTimeout(()=>{


hideLoader();



window.location.href =
"student/dashboard.html";



},1500);






}


catch(error){


console.error(
"Google Signup Error:",
error
);



hideLoader();


enableButtons();



showToast(
error.message,
"error"
);



}



});


}




console.log(
"✅ Google Signup Ready"
);
// ============================================
// PART 5 - FINAL INITIALIZATION
// ============================================


// ==============================
// PASSWORD TOGGLE
// ==============================


document
.querySelectorAll(".toggle-password")
.forEach(toggle=>{


toggle.addEventListener(
"click",
()=>{


const target =
document.getElementById(
    toggle.dataset.target
);



if(!target)
    return;




if(target.type === "password"){


target.type =
"text";


toggle.classList.remove(
"fa-eye"
);


toggle.classList.add(
"fa-eye-slash"
);



}

else{


target.type =
"password";


toggle.classList.remove(
"fa-eye-slash"
);


toggle.classList.add(
"fa-eye"
);



}



});


});







// ==============================
// ROLE CHANGE
// ==============================


if(roleSelect){


roleSelect.addEventListener(
"change",
()=>{


if(
roleSelect.value === "instructor"
){


if(instructorFields)

instructorFields.style.display =
"block";


}

else{


if(instructorFields)

instructorFields.style.display =
"none";


if(bioInput)

bioInput.value = "";


if(expertiseInput)

expertiseInput.value = "";


}



});


}







// ==============================
// PASSWORD STRENGTH LIVE
// ==============================


if(passwordInput){


passwordInput.addEventListener(
"input",
()=>{


let score = 0;



if(hasMinimumLength(passwordInput.value))
score++;


if(hasUpperCase(passwordInput.value))
score++;


if(hasLowerCase(passwordInput.value))
score++;


if(hasNumber(passwordInput.value))
score++;





if(strengthBar){


strengthBar.style.width =
(score * 25) + "%";


}




if(strengthText){


const labels = [
"Enter password",
"Weak",
"Fair",
"Good",
"Strong"
];


strengthText.textContent =
labels[score];


}




});


}






// ==============================
// PAGE READY
// ==============================


window.addEventListener(
"load",
()=>{


hideLoader();


if(nameInput)

nameInput.focus();


});






// ==============================
// AUTH DEBUG
// ==============================


auth.onAuthStateChanged(
(user)=>{


if(user){


console.log(
"Logged in:",
user.email
);


}



});






console.log(
"%cSpark Stack Academy Signup Ready 🚀",
"color:#2979FF;font-size:16px;font-weight:bold;"
);