// =====================================
// SPARK STACK ACADEMY
// STUDENT PORTAL V1
// TOPBAR CONTROLLER
// =====================================


console.log(
"🚀 SSA Topbar Loaded"
);





// ==============================
// LOAD TOPBAR
// ==============================


async function loadTopbar(){


    const container =
    document.getElementById(
        "topbarContainer"
    );



    if(!container)
        return;



    try{


        const response =
        await fetch(
            "components/topbar.html"
        );



        const html =
        await response.text();



        container.innerHTML =
        html;



        initializeTopbar();


    }


    catch(error){


        console.error(
            "Topbar loading failed:",
            error
        );


    }


}








// ==============================
// INITIALIZE
// ==============================


function initializeTopbar(){



    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }






    initializeNotifications();



    initializeProfileMenu();



}








// ==============================
// NOTIFICATIONS
// ==============================


function initializeNotifications(){


    const button =
    document.getElementById(
        "notificationBtn"
    );


    const panel =
    document.getElementById(
        "notificationPanel"
    );



    if(!button || !panel)
        return;




    button.addEventListener(
    "click",
    ()=>{


        panel.classList.toggle(
            "show"
        );


    });






    document.addEventListener(
    "click",
    (event)=>{


        if(
            !button.contains(event.target)
            &&
            !panel.contains(event.target)
        ){


            panel.classList.remove(
                "show"
            );


        }



    });



}








// ==============================
// PROFILE MENU
// ==============================


function initializeProfileMenu(){



    const profile =
    document.getElementById(
        "profileMenu"
    );



    if(!profile)
        return;



    profile.addEventListener(
    "click",
    ()=>{


        console.log(
            "Profile clicked"
        );


    });



}









// ==============================
// UPDATE TOPBAR DATA
// ==============================


export function updateTopbar(student){



    const name =
    student.name ||
    student.fullName ||
    "Student";



    const initial =
    name
    .charAt(0)
    .toUpperCase();





    const topName =
    document.getElementById(
        "topStudentName"
    );



    const avatar =
    document.getElementById(
        "topAvatar"
    );



    const level =
    document.getElementById(
        "topLevel"
    );



    const xp =
    document.getElementById(
        "xpPoints"
    );



    const streak =
    document.getElementById(
        "streakCount"
    );






    if(topName)

        topName.textContent =
        name;




    if(avatar)

        avatar.textContent =
        initial;




    if(level)

        level.textContent =
        student.level || 1;




    if(xp)

        xp.textContent =
        student.xp || 0;




    if(streak)

        streak.textContent =
        student.streak || 0;



}








// ==============================
// START
// ==============================


document.addEventListener(
"DOMContentLoaded",
()=>{


    loadTopbar();


});