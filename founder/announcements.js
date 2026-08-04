// ===================================
// SPARK STACK ACADEMY
// ANNOUNCEMENTS
// ===================================

import { db } from "../../js/firebase.js";

import {
    collection,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

console.log("📢 Announcements Loaded");

const announcementsRef =
collection(db,"announcements");

// ===================================
// PUBLISH ANNOUNCEMENT
// ===================================

async function publishAnnouncement(){

    try{

        await addDoc(announcementsRef,{

            title:
            announcementTitle.value.trim(),

            category:
            announcementCategory.value,

            message:
            announcementMessage.value.trim(),

            audience:
            announcementAudience.value,

            publishDate:
            publishDate.value || null,

            expiryDate:
            expiryDate.value || null,

            pinned:
            pinAnnouncement.checked,

            important:
            importantAnnouncement.checked,

            push:
            sendPush.checked,

            email:
            sendEmail.checked,

            popup:
            showPopup.checked,

            status:"published",

            createdAt:
            serverTimestamp()

        });

        alert("✅ Announcement published.");

        clearForm();

    }

    catch(error){

        console.error(error);

        alert("Failed to publish announcement.");

    }

}

// ===================================
// SAVE DRAFT
// ===================================

async function saveDraft(){

    try{

        await addDoc(announcementsRef,{

            title:
            announcementTitle.value.trim(),

            category:
            announcementCategory.value,

            message:
            announcementMessage.value.trim(),

            audience:
            announcementAudience.value,

            publishDate:
            publishDate.value || null,

            expiryDate:
            expiryDate.value || null,

            pinned:
            pinAnnouncement.checked,

            important:
            importantAnnouncement.checked,

            push:
            sendPush.checked,

            email:
            sendEmail.checked,

            popup:
            showPopup.checked,

            status:"draft",

            createdAt:
            serverTimestamp()

        });

        alert("💾 Draft saved.");

    }

    catch(error){

        console.error(error);

    }

}

// ===================================
// LOAD ANNOUNCEMENTS
// ===================================

function loadAnnouncements(){

    const q =
    query(
        announcementsRef,
        orderBy("createdAt","desc")
    );

    onSnapshot(q,(snapshot)=>{

        announcementList.innerHTML="";

        announcementCount.textContent =
        `${snapshot.size} Announcements`;

        if(snapshot.empty){

            announcementList.innerHTML=

            `<p class="empty-state">
                No announcements yet.
            </p>`;

            return;

        }

        snapshot.forEach(document=>{

            const data =
            document.data();

            const card =
            document.createElement("div");

            card.className=
            "announcement-card";

            card.innerHTML=`

                <div class="announcement-header">

                    <h3>
                        ${data.title}
                    </h3>

                    <span class="badge">
                        ${data.status}
                    </span>

                </div>

                <p>
                    ${data.message}
                </p>

                <div class="announcement-footer">

                    <span class="announcement-date">

                        ${data.category}

                    </span>

                    <div class="announcement-actions">

                        <button
                            class="secondary-btn"
                            data-pin="${document.id}">

                            📌

                        </button>

                        <button
                            class="secondary-btn"
                            data-delete="${document.id}">

                            🗑️

                        </button>

                    </div>

                </div>

            `;

            announcementList.appendChild(card);

        });

    });

}

// ===================================
// PIN
// ===================================

async function togglePin(id,current){

    await updateDoc(

        doc(db,"announcements",id),

        {

            pinned:!current

        }

    );

}

// ===================================
// DELETE
// ===================================

async function removeAnnouncement(id){

    if(!confirm(
        "Delete announcement?"
    )) return;

    await deleteDoc(

        doc(
            db,
            "announcements",
            id
        )

    );

}

// ===================================
// EVENTS
// ===================================

document.addEventListener("click",async(e)=>{

    if(e.target.dataset.delete){

        removeAnnouncement(

            e.target.dataset.delete

        );

    }

    if(e.target.dataset.pin){

        const id =
        e.target.dataset.pin;

        await togglePin(id,false);

    }

});

// ===================================
// CLEAR FORM
// ===================================

function clearForm(){

    announcementTitle.value="";

    announcementMessage.value="";

    publishDate.value="";

    expiryDate.value="";

    pinAnnouncement.checked=false;

    importantAnnouncement.checked=false;

    sendPush.checked=false;

    sendEmail.checked=false;

    showPopup.checked=false;

}

// ===================================
// INIT
// ===================================

window.addEventListener(

    "DOMContentLoaded",

    ()=>{

        loadAnnouncements();

        publishAnnouncementBtn.onclick=
        publishAnnouncement;

        saveDraftBtn.onclick=
        saveDraft;

    }

);