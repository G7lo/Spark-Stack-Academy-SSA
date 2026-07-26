import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const certificateGrid =
document.getElementById("certificateGrid");


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href = "../login.html";

        return;

    }

    const certificatesQuery = query(
        collection(db,"certificates"),
        where("studentId","==",user.uid)
    );

    const certificatesSnapshot =
    await getDocs(certificatesQuery);

    certificateGrid.innerHTML = "";

    if(certificatesSnapshot.empty){

        certificateGrid.innerHTML = `
            <p>No certificates earned yet 🏆</p>
        `;

        return;

    }

    for(const certificate of certificatesSnapshot.docs){

        const data = certificate.data();

        const courseSnap = await getDoc(
            doc(db,"courses",data.courseId)
        );

        let courseTitle = "Unknown Course";

        if(courseSnap.exists()){

            courseTitle =
            courseSnap.data().title;

        }

        const issuedDate =
        data.issuedAt?.toDate().toLocaleDateString() ||
        "Pending";

        certificateGrid.innerHTML += `

        <div class="certificate-card">

            <div class="seal">
                SSA
            </div>

            <h2>${courseTitle}</h2>

            <p>
                Successfully Completed
            </p>

            <span>
                Issued: ${issuedDate}
            </span>

            <br><br>

            <button onclick="viewCertificate('${certificate.id}')">
                View Certificate
            </button>

        </div>

        `;

    }

});


window.viewCertificate = function(id){

    window.location.href =
    `certificate.html?id=${id}`;

};