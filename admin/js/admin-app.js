/* ===================================
   SSA FOUNDER ADMIN CORE V2
   CLEAN BUILD
=================================== */


import {
    auth,
    db
} from "../../js/firebase.js";


import {
    onAuthStateChanged,
    signOut
} 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";





// ===========================
// COMPONENT LOADER
// ===========================


async function loadComponent(id, path){

    const container =
    document.getElementById(id);


    if(!container) return;


    try{

        const response =
        await fetch(path);


        if(!response.ok){

            throw new Error(
                `Component missing: ${path}`
            );

        }


        const html =
        await response.text();


        container.innerHTML = html;


    }

    catch(error){

        console.error(
            "Component loading failed:",
            error
        );


        container.innerHTML =
        "";

    }

}





// ===========================
// LOAD GLOBAL COMPONENTS
// ===========================


async function loadLayout(){


    await loadComponent(
        "sidebarContainer",
        "../../components/sidebar.html"
    );


    await loadComponent(
        "topbarContainer",
        "../../components/topbar.html"
    );


    setupSidebar();

    setupLogout();

}





// ===========================
// AUTH CHECK
// ===========================


onAuthStateChanged(
    auth,
    async(user)=>{


        if(!user){

            window.location.href =
            "../../login.html";

            return;

        }



        try{


            const userRef =
            doc(
                db,
                "users",
                user.uid
            );


            const snap =
            await getDoc(userRef);



            if(!snap.exists()){

                console.error(
                    "User profile missing"
                );

                return;

            }



            const data =
            snap.data();



            if(data.role !== "admin" &&
               data.role !== "founder"){

                window.location.href =
                "../../login.html";

                return;

            }



            console.log(
                "Admin authenticated:",
                data.name
            );



            const name =
            document.getElementById(
                "adminName"
            );


            if(name){

                name.textContent =
                data.name || "Founder";

            }


        }

        catch(error){

            console.error(
                "Auth error:",
                error
            );

        }


    }

);







// ===========================
// LOGOUT
// ===========================


function setupLogout(){


    const buttons =
    document.querySelectorAll(
        "#logoutBtn"
    );


    buttons.forEach(btn=>{


        btn.addEventListener(
            "click",
            async()=>{


                try{

                    await signOut(auth);


                    window.location.href =
                    "../../login.html";


                }

                catch(error){

                    console.error(
                        "Logout failed",
                        error
                    );

                }


            }
        );


    });


}






// ===========================
// SIDEBAR MOBILE CONTROL
// ===========================


function setupSidebar(){


    const menuBtn =
    document.getElementById(
        "menuBtn"
    );


    const sidebar =
    document.querySelector(
        ".sidebar"
    );


    const overlay =
    document.getElementById(
        "sidebarOverlay"
    );



    if(
        !menuBtn ||
        !sidebar ||
        !overlay
    ){

        return;

    }




    menuBtn.onclick = ()=>{


        sidebar.classList.toggle(
            "active"
        );


        overlay.classList.toggle(
            "show"
        );


    };





    overlay.onclick = ()=>{


        sidebar.classList.remove(
            "active"
        );


        overlay.classList.remove(
            "show"
        );


    };


}








// ===========================
// ACTIVE PAGE
// ===========================


function setActivePage(){


    const current =
    location.pathname
    .split("/")
    .pop();



    const links =
    document.querySelectorAll(
        ".sidebar a"
    );



    links.forEach(link=>{


        link.classList.remove(
            "active"
        );



        if(
            link.href.includes(
                current
            )
        ){

            link.classList.add(
                "active"
            );

        }


    });


}







// ===========================
// PAGE TITLE
// ===========================


function setPageTitle(){


    const title =
    document.getElementById(
        "pageTitle"
    );


    if(!title) return;



    let page =
    document.title
    .replace(
        " | Spark Stack Academy",
        ""
    );



    title.textContent =
    page;


}







// ===========================
// START APP
// ===========================


document.addEventListener(
    "DOMContentLoaded",
    async()=>{


        await loadLayout();


        setActivePage();


        setPageTitle();


    }
);