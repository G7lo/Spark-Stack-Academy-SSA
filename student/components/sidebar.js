// ===========================
// SSA SIDEBAR COMPONENT
// ===========================


const sidebarContainer = 
document.getElementById("sidebarContainer");



// Load sidebar CSS

const sidebarCSS = document.createElement("link");

sidebarCSS.rel = "stylesheet";

sidebarCSS.href = "components/sidebar.css?v=3";

document.head.appendChild(sidebarCSS);





// Load sidebar HTML

fetch("components/sidebar.html?v=3")

.then(res => res.text())

.then(html => {


    sidebarContainer.innerHTML = html;



    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }



    setupSidebarMenu();


});







function setupSidebarMenu(){


    const menuBtn = 
    document.getElementById("menuBtn");


    const sidebar =
    document.querySelector(".sidebar");


    const overlay =
    document.getElementById("sidebarOverlay");



    if(!sidebar) return;



    // ===========================
    // MOBILE MENU
    // ===========================


    if(menuBtn){

        menuBtn.addEventListener("click",()=>{


            sidebar.classList.toggle("active");


            if(overlay){

                overlay.classList.toggle("active");

            }


        });

    }





    // ===========================
    // CLOSE OUTSIDE TAP
    // ===========================


    document.addEventListener("click",(e)=>{


        if(
            window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            menuBtn &&
            !menuBtn.contains(e.target)

        ){

            sidebar.classList.remove("active");


            if(overlay){

                overlay.classList.remove("active");

            }


        }


    });





    // ===========================
    // OVERLAY CLOSE
    // ===========================


    if(overlay){


        overlay.addEventListener("click",()=>{


            sidebar.classList.remove("active");


            overlay.classList.remove("active");


        });


    }






    // ===========================
    // LOGOUT
    // ===========================


    const logoutBtn =
    document.getElementById("logoutBtn");



    if(logoutBtn){


        logoutBtn.addEventListener(
        "click",
        async(e)=>{


            e.preventDefault();


            try{


                const { auth } =
                await import("../../js/firebase.js");


                const { signOut } =
                await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
                );


                await signOut(auth);



                window.location.href =
                "../login.html";


            }


            catch(error){


                console.error(error);


                alert(
                "Logout failed"
                );


            }


        });


    }


}