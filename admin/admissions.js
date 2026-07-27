import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* ===========================
   ELEMENTS
=========================== */

const applicationsTable =
document.getElementById(
    "applicationsTable"
);

const pendingCount =
document.getElementById(
    "pendingCount"
);

const approvedCount =
document.getElementById(
    "approvedCount"
);

const rejectedCount =
document.getElementById(
    "rejectedCount"
);

const totalCount =
document.getElementById(
    "totalCount"
);

const searchInput =
document.getElementById(
    "searchApplication"
);

const statusFilter =
document.getElementById(
    "statusFilter"
);



let applicationsData = [];



/* ===========================
   AUTH
=========================== */

onAuthStateChanged(
auth,
async(user)=>{

    if(!user){

        window.location.href =
        "../login.html";

        return;

    }

    await loadApplications();

});




/* ===========================
   LOAD APPLICATIONS
=========================== */

async function loadApplications(){

    applicationsTable.innerHTML = `

    <tr>

        <td colspan="7">

            Loading applications...

        </td>

    </tr>

    `;

    try{

        applicationsData = [];

        const snapshot =
        await getDocs(

            query(

                collection(
                    db,
                    "applications"
                ),

                orderBy(
                    "createdAt",
                    "desc"
                )

            )

        );



        snapshot.forEach(doc=>{

            applicationsData.push({

                id:doc.id,

                ...doc.data()

            });

        });



        renderApplications(
            applicationsData
        );

    }

    catch(error){

        console.error(error);

        applicationsTable.innerHTML = `

        <tr data-id="${application.id}">

            <td colspan="7">

                Failed to load applications.

            </td>

        </tr>

        `;

    }

}




/* ===========================
   RENDER TABLE
=========================== */

function renderApplications(data){

    applicationsTable.innerHTML = "";



    if(data.length===0){

        applicationsTable.innerHTML = `

        <tr>

            <td colspan="7">

                No applications found.

            </td>

        </tr>

        `;

    }



    let pending = 0;
    let approved = 0;
    let rejected = 0;



    data.forEach((application,index)=>{

        const status =
        application.status || "Pending";



        if(status==="Pending") pending++;

        if(status==="Approved") approved++;

        if(status==="Rejected") rejected++;




        applicationsTable.innerHTML += `

        <tr>

            <td>${index+1}</td>

            <td>

                ${application.name || "-"}

            </td>

            <td>

                ${application.email || "-"}

            </td>

            <td>

                ${application.program || "-"}

            </td>

            <td>

                <span class="status ${status.toLowerCase()}">

                    ${status}

                </span>

            </td>

            <td>

                ${application.createdAt
    ? application.createdAt
        .toDate()
        .toLocaleDateString()
    : "-"
}

            </td>

            <td>

                <div class="action-buttons">

                    <button
                    class="view-btn">

                        View

                    </button>

                    <button
                    class="approve-btn">

                        Approve

                    </button>

                    <button
                    class="reject-btn">

                        Reject

                    </button>

                </div>

            </td>

        </tr>

        `;

    });



    pendingCount.textContent =
    pending;

    approvedCount.textContent =
    approved;

    rejectedCount.textContent =
    rejected;

    totalCount.textContent =
    data.length;

}




/* ===========================
   SEARCH
=========================== */

searchInput.addEventListener(
"input",
filterApplications
);

statusFilter.addEventListener(
"change",
filterApplications
);




function filterApplications(){

    const search =
    searchInput.value.toLowerCase();

    const status =
    statusFilter.value;



    const filtered =
    applicationsData.filter(app=>{

        const matchesSearch =

        (app.name || "")
        .toLowerCase()
        .includes(search)

        ||

        (app.email || "")
        .toLowerCase()
        .includes(search);



        const matchesStatus =

        status==="all"

        ||

        (app.status || "Pending")
        === status;



        return (

            matchesSearch

            &&

            matchesStatus

        );

    });



    renderApplications(
        filtered
    );

}



/* ===========================
   TOAST
=========================== */

function showToast(message,type="success"){

    const toast =
    document.createElement("div");

    toast.className =
    `ssa-toast ${type}`;

    toast.textContent =
    message;

    document.body.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.classList.remove("show");

        setTimeout(()=>{

            toast.remove();

        },300);

    },3000);

}



/* ===========================
   ADMISSION NUMBER
=========================== */

function generateAdmissionNumber(){

    const year =
    new Date().getFullYear();

    const random =
    Math.floor(
        1000 +
        Math.random()*9000
    );

    return `SSA${year}${random}`;

}



/* ===========================
   UPDATE STATUS
=========================== */

async function updateApplicationStatus(
    applicationId,
    status
){

    await updateDoc(

        doc(
            db,
            "applications",
            applicationId
        ),

        {

            status,

            updatedAt:
            serverTimestamp()

        }

    );

}



/* ===========================
   CREATE STUDENT
=========================== */

async function createStudent(application){

    const admissionNo =
    generateAdmissionNumber();

    await setDoc(

        doc(
            db,
            "students",
            admissionNo
        ),

        {

            admissionNo,

            name:
            application.name || "",

            email:
            application.email || "",

            phone:
            application.phone || "",

            gender:
            application.gender || "",

            program:
            application.program || "",

            status:"Active",

            applicationId:
            application.id,

            createdAt:
            serverTimestamp()

        }

    );

    return admissionNo;

}



/* ===========================
   TABLE ACTIONS
=========================== */

applicationsTable.addEventListener(
"click",
async(e)=>{

    const button =
    e.target;

    if(
        !button.matches(
            ".view-btn,.approve-btn,.reject-btn"
        )
    ) return;

    const row =
    button.closest("tr");

    if(!row) return;

    const id =
    row.dataset.id;

    const application =
    applicationsData.find(
        app=>app.id===id
    );

    if(!application) return;



    /* VIEW */

    if(
        button.classList.contains(
            "view-btn"
        )
    ){

        openApplicantModal(
            application
        );

        return;

    }



    /* APPROVE */

    if(
        button.classList.contains(
            "approve-btn"
        )
    ){

        const confirmed =
        confirm(
            `Approve ${application.name}?`
        );

        if(!confirmed) return;

        try{

            const admissionNo =
            await createStudent(
                application
            );

            await updateApplicationStatus(

                application.id,

                "Approved"

            );

            showToast(

                `${application.name} approved (${admissionNo})`

            );

            await loadApplications();

        }

        catch(error){

            console.error(error);

            showToast(

                "Approval failed",

                "error"

            );

        }

        return;

    }



    /* REJECT */

    if(
        button.classList.contains(
            "reject-btn"
        )
    ){

        const confirmed =
        confirm(
            `Reject ${application.name}?`
        );

        if(!confirmed) return;

        try{

            await updateApplicationStatus(

                application.id,

                "Rejected"

            );

            showToast(

                "Application rejected"

            );

            await loadApplications();

        }

        catch(error){

            console.error(error);

            showToast(

                "Failed to reject",

                "error"

            );

        }

    }

});

/* ===========================
   APPLICANT MODAL
=========================== */

const applicantModal =
document.getElementById(
    "applicantModal"
);

const applicantDetails =
document.getElementById(
    "applicantDetails"
);

const closeApplicantModal =
document.getElementById(
    "closeApplicantModal"
);



function openApplicantModal(application){

    applicantDetails.innerHTML = `

        <div class="applicant-profile">

            <div class="profile-avatar">

                ${application.photo
                ?
                `<img
                src="${application.photo}"
                alt="Applicant">`
                :
                `<div class="avatar-placeholder">

                    ${(
                        application.name || "?"
                    ).charAt(0).toUpperCase()}

                </div>`
                }

            </div>

            <div class="profile-info">

                <h3>

                    ${application.name || "-"}

                </h3>

                <p>

                    <strong>Email:</strong>

                    ${application.email || "-"}

                </p>

                <p>

                    <strong>Phone:</strong>

                    ${application.phone || "-"}

                </p>

                <p>

                    <strong>Gender:</strong>

                    ${application.gender || "-"}

                </p>

                <p>

                    <strong>Program:</strong>

                    ${application.program || "-"}

                </p>

                <p>

                    <strong>Status:</strong>

                    ${application.status || "Pending"}

                </p>

                <p>

                    <strong>Address:</strong>

                    ${application.address || "-"}

                </p>

                <p>

                    <strong>Date Applied:</strong>

                    ${application.createdAt
                    ?
                    application.createdAt
                    .toDate()
                    .toLocaleString()
                    :
                    "-"}

                </p>

            </div>

        </div>

    `;

    applicantModal.classList.add(
        "show"
    );

}



closeApplicantModal.addEventListener(
"click",
()=>{

    applicantModal.classList.remove(
        "show"
    );

});



applicantModal.addEventListener(
"click",
(e)=>{

    if(
        e.target===applicantModal
    ){

        applicantModal.classList.remove(
            "show"
        );

    }

});