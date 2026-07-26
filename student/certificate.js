import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params = new URLSearchParams(window.location.search);

const certificateId = params.get("id");


const studentName = document.getElementById("studentName");
const courseTitle = document.getElementById("courseTitle");
const issuedDate = document.getElementById("issuedDate");
const certificateNumber = document.getElementById("certificateId");


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href = "../login.html";

        return;

    }

    if(!certificateId){

        alert("Certificate not found.");

        return;

    }

    try{

        const certificateRef =
        doc(db,"certificates",certificateId);

        const certificateSnap =
        await getDoc(certificateRef);

        if(!certificateSnap.exists()){

            alert("Certificate does not exist.");

            return;

        }

        const certificate =
        certificateSnap.data();


        if(certificate.studentId !== user.uid){

            alert("Unauthorized access.");

            return;

        }


        const studentSnap = await getDoc(
            doc(db,"students",user.uid)
        );

        if(studentSnap.exists()){

            studentName.textContent =
            studentSnap.data().name;

        }


        const courseSnap = await getDoc(
            doc(db,"courses",certificate.courseId)
        );

        if(courseSnap.exists()){

            courseTitle.textContent =
            courseSnap.data().title;

        }


        if(certificate.issuedAt){

            issuedDate.textContent =
            "Date: " +
            certificate.issuedAt
            .toDate()
            .toLocaleDateString();

        }


        certificateNumber.textContent =
        "Certificate ID: " + certificateId;


    }catch(error){

        console.log(error);

        alert("Error loading certificate.");

    }

});