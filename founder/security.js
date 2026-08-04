// ===================================
// SPARK STACK ACADEMY
// SECURITY SETTINGS
// ===================================

import { auth, db } from "../../js/firebase.js";

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


console.log("🔒 Security Module Loaded");


// ===================================
// FIRESTORE REFERENCE
// ===================================

const securityRef = doc(
    db,
    "settings",
    "security"
);


// ===================================
// HELPERS
// ===================================

const $ = (id)=>document.getElementById(id);


function notify(message){

    alert(message);

}



// ===================================
// LOAD SECURITY SETTINGS
// ===================================

async function loadSecuritySettings(){

    try{

        const snapshot =
        await getDoc(securityRef);


        if(!snapshot.exists()) return;


        const data =
        snapshot.data();


        if($("twoFactor"))
            $("twoFactor").checked =
            data.twoFactor ?? false;


        if($("loginAlerts"))
            $("loginAlerts").checked =
            data.loginAlerts ?? false;


        if($("trustedDevices"))
            $("trustedDevices").checked =
            data.trustedDevices ?? false;


        if($("maintenanceMode"))
            $("maintenanceMode").checked =
            data.maintenanceMode ?? false;


    }

    catch(error){

        console.error(
            "Load Security Error:",
            error
        );

    }

}



// ===================================
// SAVE SECURITY SETTINGS
// ===================================

async function saveSecuritySettings(){

    try{


        await setDoc(

            securityRef,

            {


                twoFactor:
                $("twoFactor")?.checked || false,


                loginAlerts:
                $("loginAlerts")?.checked || false,


                trustedDevices:
                $("trustedDevices")?.checked || false,


                maintenanceMode:
                $("maintenanceMode")?.checked || false,


                updatedAt:
                serverTimestamp()


            },

            {
                merge:true
            }

        );


        notify(
            "✅ Security settings saved."
        );


    }

    catch(error){

        console.error(error);

        notify(
            "❌ Failed to save security settings."
        );

    }

}



// ===================================
// CHANGE PASSWORD
// ===================================

async function changePassword(){

    const user =
    auth.currentUser;


    if(!user){

        notify(
            "No authenticated user found."
        );

        return;

    }


    const current =
    $("currentPassword")?.value;


    const newPassword =
    $("newPassword")?.value;


    const confirmPassword =
    $("confirmPassword")?.value;



    if(!current || !newPassword || !confirmPassword){

        notify(
            "Fill all password fields."
        );

        return;

    }



    if(newPassword !== confirmPassword){

        notify(
            "Passwords do not match."
        );

        return;

    }



    if(newPassword.length < 8){

        notify(
            "Password must be at least 8 characters."
        );

        return;

    }



    try{


        const credential =
        EmailAuthProvider.credential(

            user.email,

            current

        );


        await reauthenticateWithCredential(

            user,

            credential

        );


        await updatePassword(

            user,

            newPassword

        );


        notify(
            "✅ Password updated successfully."
        );


        $("currentPassword").value="";
        $("newPassword").value="";
        $("confirmPassword").value="";


    }


    catch(error){

        console.error(error);


        notify(
            error.message
        );

    }

}



// ===================================
// LOGOUT ALL DEVICES
// ===================================

async function logoutAllDevices(){


    const confirmLogout =
    confirm(
        "Logout from this device?"
    );


    if(!confirmLogout)
        return;


    try{


        await signOut(auth);


        window.location.href =
        "../login.html";


    }

    catch(error){

        console.error(error);

        notify(
            "Logout failed."
        );

    }


}




// ===================================
// INITIALIZE
// ===================================

window.addEventListener(

"DOMContentLoaded",

()=>{


    loadSecuritySettings();



    $("saveSecurityBtn")
    ?.addEventListener(

        "click",

        async()=>{

            await saveSecuritySettings();

        }

    );



    $("saveSecurityBtn")
    ?.addEventListener(

        "dblclick",

        async()=>{

            await changePassword();

        }

    );



    $("logoutAllBtn")
    ?.addEventListener(

        "click",

        logoutAllDevices

    );


});