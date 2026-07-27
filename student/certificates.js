import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const certificateGrid =
document.getElementById("certificateGrid");

const certificateCount =
document.getElementById("certificateCount");


onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";

        return;

    }

    loadCertificates(user.uid);

});


async function loadCertificates(uid){

    try{

        const certificatesQuery = query(

            collection(db,"certificates"),

            where("studentId","==",uid)


        );


        const snapshot =
        await getDocs(certificatesQuery);


        certificateCount.textContent =
        snapshot.size;


        if(snapshot.empty){

            certificateGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    🏆

                </div>

                <h2>

                    No Certificates Yet

                </h2>

                <p>

                    Complete a course to earn your first certificate.

                </p>

                <a
                href="courses.html"
                class="browse-btn">

                    Browse Courses

                </a>

            </div>

            `;

            return;

        }


        certificateGrid.innerHTML = "";


        snapshot.forEach(doc=>{

            const certificate =
            doc.data();


            const issuedDate =
            certificate.issuedAt

            ?

            certificate.issuedAt
            .toDate()
            .toLocaleDateString()

            :

            "Pending";


            certificateGrid.innerHTML += `

            <div
            class="certificate-card"
            onclick="location.href='certificate.html?id=${doc.id}'">

                <div class="certificate-top">

                    <div class="certificate-icon">

                        🏆

                    </div>

                    <span class="certificate-status">

                        ${certificate.status || "Issued"}

                    </span>

                </div>


                <h2>

                    ${certificate.courseTitle}

                </h2>


                <div class="certificate-details">

                    <p>

                        👤

                        ${certificate.studentName}

                    </p>

                    <p>

                        🆔

                        ${certificate.admissionNumber || "Pending"}

                    </p>

                    <p>

                        👨‍🏫

                        ${certificate.instructorName}

                    </p>

                    <p>

                        📅

                        ${issuedDate}

                    </p>

                </div>


                <div class="certificate-footer">

                    <span>

                        ${certificate.certificateNumber}

                    </span>

                    <button>

                        View Certificate →

                    </button>

                </div>

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

        certificateGrid.innerHTML = `

        <div class="empty-state">

            <h2>

                Failed to load certificates.

            </h2>

        </div>

        `;

    }

}