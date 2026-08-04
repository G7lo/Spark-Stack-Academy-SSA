// =================================
// SSA STUDENT SIDEBAR COMPONENT
// =================================


const sidebarContainer =
document.getElementById("sidebarContainer");



if(sidebarContainer){


fetch("components/sidebar.html?v=1")

.then(response => response.text())

.then(html => {


    sidebarContainer.innerHTML = html;



    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }



    initializeSidebar();


});


}







function initializeSidebar(){



    const sidebar =
    document.querySelector(".sidebar");



    const logoutBtn =
    document.getElementById("logoutBtn");



    if(!sidebar)
    return;





    // =========================
    // ACTIVE PAGE
    // =========================


    const currentPage =
    window.location.pathname
    .split("/")
    .pop();



    document
    .querySelectorAll(".nav-link")
    .forEach(link=>{


        const href =
        link.getAttribute("href");



        if(href === currentPage){


            link.classList.add(
                "active"
            );


        }
        else{


            link.classList.remove(
                "active"
            );


        }


    });







    // =========================
    // LOGOUT
    // =========================


    if(logoutBtn){


        logoutBtn.addEventListener(
        "click",
        async()=>{


            try{


                const {
                    auth
                } =
                await import(
                "../../js/firebase.js"
                );



                const {
                    signOut
                } =
                await import(
                "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
                );



                await signOut(auth);



                window.location.href =
                "../login.html";



            }
            catch(error){


                console.error(
                    "Logout error:",
                    error
                );


            }


        });


    }







    loadSidebarUser();


}









// =========================
// LOAD STUDENT PROFILE
// =========================


async function loadSidebarUser(){


    try{


        const {
            auth,
            db
        } =
        await import(
        "../../js/firebase.js"
        );



        const {
            onAuthStateChanged
        } =
        await import(
        "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
        );



        const {
            doc,
            getDoc
        } =
        await import(
        "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
        );





        onAuthStateChanged(
        auth,
        async(user)=>{


            if(!user)
            return;



            const ref =
            doc(
                db,
                "students",
                user.uid
            );



            const snap =
            await getDoc(ref);



            if(!snap.exists())
            return;



            const student =
            snap.data();



            const name =
            student.name || "Student";



            const initial =
            name
            .charAt(0)
            .toUpperCase();





            const nameEl =
            document.getElementById(
                "sidebarStudentName"
            );



            const avatarEl =
            document.getElementById(
                "sidebarAvatar"
            );



            if(nameEl)
            nameEl.textContent = name;



            if(avatarEl)
            avatarEl.textContent = initial;



        });



    }
    catch(error){


        console.error(
            "Sidebar profile error:",
            error
        );


    }


}