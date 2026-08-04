// =====================================
// SPARK STACK ACADEMY
// STUDENT PORTAL V1
// SIDEBAR CONTROLLER
// =====================================


console.log("🚀 SSA Sidebar Loaded");



// LOAD SIDEBAR

export async function loadSidebar(){


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


        if(typeof lucide !== "undefined"){

            lucide.createIcons();

        }



    }
    catch(error){

        console.error(
            "Sidebar loading failed:",
            error
        );

    }


}






// INIT SIDEBAR

function initializeSidebar(){


    const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


    if(logoutBtn){


        logoutBtn.onclick=()=>{


            import("../../js/firebase.js")
            .then(async(module)=>{


                const {auth}=module;


                const {signOut}=await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
                );


                await signOut(auth);


                window.location.href="../login.html";


            });


        };


    }



}







// UPDATE SIDEBAR DATA

export function updateSidebar(student){


    const name =
    student.name ||
    student.fullName ||
    "Student";


    const initial =
    name.charAt(0)
    .toUpperCase();



    const sidebarName =
    document.getElementById(
        "sidebarName"
    );


    const avatar =
    document.getElementById(
        "sidebarAvatar"
    );


    const level =
    document.getElementById(
        "sidebarLevel"
    );



    if(sidebarName)
        sidebarName.textContent=name;



    if(avatar)
        avatar.textContent=initial;



    if(level)
        level.textContent=
        student.level || 1;


}