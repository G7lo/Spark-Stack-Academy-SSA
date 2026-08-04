//
// =====================================
// SPARK STACK ACADEMY
// STUDENT PORTAL V1
// SIDEBAR CONTROLLER
// =====================================


console.log(
"🚀 SSA Sidebar Loaded"
);





// ==============================
// LOAD SIDEBAR COMPONENT
// ==============================


async function loadSidebar(){


    const container =
    document.getElementById(
        "sidebarContainer"
    );



    if(!container)
        return;



    try{


        const response =
        await fetch(
            "components/sidebar.html"
        );



        const html =
        await response.text();



        container.innerHTML =
        html;



        initializeSidebar();



    }

    catch(error){


        console.error(
            "Sidebar loading failed:",
            error
        );


    }



}








// ==============================
// SIDEBAR FUNCTIONS
// ==============================


function initializeSidebar(){



    // Icons

    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }






    // MOBILE MENU


    const menuBtn =
    document.getElementById(
        "mobileMenuBtn"
    );



    const sidebar =
    document.querySelector(
        ".sidebar"
    );



    const overlay =
    document.getElementById(
        "sidebarOverlay"
    );





    if(menuBtn){


        menuBtn.onclick = ()=>{


            sidebar.classList.toggle(
                "show"
            );


            overlay.classList.toggle(
                "show"
            );


        };


    }





    if(overlay){


        overlay.onclick = ()=>{


            sidebar.classList.remove(
                "show"
            );


            overlay.classList.remove(
                "show"
            );


        };


    }







    // ACTIVE PAGE


    highlightSidebar();







    // LOGOUT


    const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );



    if(logoutBtn){


        logoutBtn.onclick = ()=>{


            logoutUser();


        };


    }



}








// ==============================
// ACTIVE LINK
// ==============================


function highlightSidebar(){



    const page =
    window.location.pathname
    .split("/")
    .pop();





    document
    .querySelectorAll(
        ".sidebar-link"
    )
    .forEach(link=>{


        const href =
        link.getAttribute(
            "href"
        );



        if(
            href === page
        ){


            link.classList.add(
                "active"
            );


        }



    });



}








// ==============================
// LOGOUT
// ==============================


async function logoutUser(){


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



        await signOut(
            auth
        );



        window.location.href =
        "../login.html";



    }


    catch(error){


        console.error(
            "Logout error:",
            error
        );


    }


}







// START

document.addEventListener(
"DOMContentLoaded",
()=>{

    loadSidebar();

});