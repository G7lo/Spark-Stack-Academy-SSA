// ===================================
// SPARK STACK ACADEMY
// CERTIFICATE SETTINGS
// ===================================

import { db } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

console.log("📜 Certificates Loaded");

const certificateRef =
doc(db,"settings","certificates");

// ===================================
// LOAD SETTINGS
// ===================================

async function loadCertificateSettings(){

    try{

        const snapshot =
        await getDoc(certificateRef);

        if(!snapshot.exists()) return;

        const data = snapshot.data();

        document.getElementById(
            "certificateTitle"
        ).value =
        data.certificateTitle || "";

        document.getElementById(
            "certificatePrefix"
        ).value =
        data.certificatePrefix || "SSA";

        document.getElementById(
            "founderName"
        ).value =
        data.founderName || "";

        document.getElementById(
            "founderTitle"
        ).value =
        data.founderTitle || "";

        document.getElementById(
            "enableQR"
        ).checked =
        data.enableQR || false;

        document.getElementById(
            "autoIssue"
        ).checked =
        data.autoIssue || false;

        document.getElementById(
            "allowDownloads"
        ).checked =
        data.allowDownloads || false;

    }

    catch(error){

        console.error(
            "Certificate Load Error:",
            error
        );

    }

}

// ===================================
// SAVE SETTINGS
// ===================================

async function saveCertificateSettings(){

    try{

        const settings = {

            certificateTitle:
            document.getElementById(
                "certificateTitle"
            ).value.trim(),

            certificatePrefix:
            document.getElementById(
                "certificatePrefix"
            ).value.trim().toUpperCase(),

            founderName:
            document.getElementById(
                "founderName"
            ).value.trim(),

            founderTitle:
            document.getElementById(
                "founderTitle"
            ).value.trim(),

            enableQR:
            document.getElementById(
                "enableQR"
            ).checked,

            autoIssue:
            document.getElementById(
                "autoIssue"
            ).checked,

            allowDownloads:
            document.getElementById(
                "allowDownloads"
            ).checked,

            updatedAt:
            serverTimestamp()

        };

        await setDoc(

            certificateRef,

            settings,

            { merge:true }

        );

        alert(
            "✅ Certificate settings saved."
        );

    }

    catch(error){

        console.error(error);

        alert(
            "Failed to save certificate settings."
        );

    }

}

// ===================================
// GENERATE SAMPLE NUMBER
// ===================================

function generateSampleNumber(){

    const prefix =
    document.getElementById(
        "certificatePrefix"
    ).value.trim().toUpperCase() || "SSA";

    return `${prefix}-000001`;

}

// ===================================
// EVENTS
// ===================================

window.addEventListener(

    "DOMContentLoaded",

    ()=>{

        loadCertificateSettings();

        document
        .getElementById(
            "saveCertificateSettings"
        )
        ?.addEventListener(
            "click",
            saveCertificateSettings
        );

        document
        .getElementById(
            "certificatePrefix"
        )
        ?.addEventListener(
            "input",
            ()=>{

                console.log(
                    "Sample Certificate:",
                    generateSampleNumber()
                );

            }
        );

    }

);