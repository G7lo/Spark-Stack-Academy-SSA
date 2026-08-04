import { db } from "../js/firebase.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
new URLSearchParams(window.location.search);

const certificateId =
params.get("id");


if(!certificateId){

    window.location.href =
    "certificates.html";

}



async function loadCertificate(){

    try{

        const certificateSnap =
        await getDoc(

            doc(
                db,
                "certificates",
                certificateId
            )

        );


        if(!certificateSnap.exists()){

            alert("Certificate not found.");

            window.location.href =
            "certificates.html";

            return;

        }


        const certificate =
        certificateSnap.data();


        document.getElementById(
"academyName"
).textContent =
certificate.academyName;

document.getElementById(
"academyMotto"
).textContent =
certificate.academyMotto;

document.getElementById(
"headquarters"
).textContent =
certificate.headquarters;

document.getElementById(
"phone"
).textContent =
certificate.phone;

document.getElementById(
"whatsapp"
).textContent =
certificate.whatsapp;

document.getElementById(
"website"
).textContent =
certificate.website;



        document.getElementById(
            "studentName"
        ).textContent =
        certificate.studentName;



        document.getElementById(
            "admissionNumber"
        ).textContent =
        certificate.admissionNumber ||
        "Pending";



        document.getElementById(
            "courseTitle"
        ).textContent =
        certificate.courseTitle;



        document.getElementById(
            "instructorName"
        ).textContent =
        certificate.instructorName;



        document.getElementById(
            "instructorSignature"
        ).textContent =
        certificate.instructorName;



        document.getElementById(
            "certificateNumber"
        ).textContent =
        certificate.certificateNumber;



        if(certificate.issuedAt){

            document.getElementById(
                "issuedDate"
            ).textContent =

            certificate
            .issuedAt
            .toDate()
            .toLocaleDateString(

                "en-KE",

                {

                    year:"numeric",

                    month:"long",

                    day:"numeric"

                }

            );

        }



        document.title =
        certificate.courseTitle +
        " Certificate";

    }

    catch(error){

        console.error(
            error
        );

        alert(
            "Unable to load certificate."
        );

    }

}



// ===========================
// PRINT
// ===========================

document
.getElementById("printBtn")
.addEventListener(

    "click",

    ()=>{

        window.print();

    }

);



// ===========================
// DOWNLOAD PDF
// ===========================

document
.getElementById("downloadBtn")
.addEventListener(

    "click",

    ()=>{

        window.print();

    }

);



loadCertificate();