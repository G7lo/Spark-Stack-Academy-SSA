// =================================
// SSA STUDENT TOPBAR COMPONENT
// =================================


const topbarContainer =
document.getElementById("topbarContainer");



if(topbarContainer){


fetch("components/topbar.html?v=1")

.then(response => response.text())

.then(html => {


    topbarContainer.innerHTML = html;



    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }


    initializeTopbar();


});



}




function initializeTopbar(){


    const menuBtn =
    document.getElementById("menuBtn");


    const sidebar =
    document.querySelector(".sidebar");


    const overlay =
    document.getElementById("sidebarOverlay");



    // ==========================
    // MOBILE MENU
    // ==========================


    if(menuBtn){


        menuBtn.addEventListener(
        "click",
        ()=>{


            sidebar?.classList.toggle(
                "active"
            );


            overlay?.classList.toggle(
                "active"
            );


        });


    }







    // ==========================
    // CLOSE OVERLAY
    // ==========================


    if(overlay){


        overlay.addEventListener(
        "click",
        ()=>{


            sidebar?.classList.remove(
                "active"
            );


            overlay.classList.remove(
                "active"
            );


        });


    }







    loadTopbarUser();


}







// ==========================
// LOAD USER DATA
// ==========================


async function loadTopbarUser(){


    const {
        auth,
        db
    } = await import("../../js/firebase.js");



    const {
        onAuthStateChanged
    } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
    );



    const {
        doc,
        getDoc
    } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
    );





    onAuthStateChanged(
    auth,
    async(user)=>{


        if(!user) return;



        const studentRef =
        doc(
            db,
            "students",
            user.uid
        );



        const snapshot =
        await getDoc(studentRef);



        if(!snapshot.exists())
        return;



        const data =
        snapshot.data();



        const name =
        data.name || "Student";



        const avatar =
        name
        .charAt(0)
        .toUpperCase();





        const nameElement =
        document.getElementById(
            "topStudentName"
        );


        const avatarElement =
        document.getElementById(
            "topStudentAvatar"
        );



        if(nameElement){

            nameElement.textContent =
            name;

        }



        if(avatarElement){

            avatarElement.textContent =
            avatar;

        }



    });


}