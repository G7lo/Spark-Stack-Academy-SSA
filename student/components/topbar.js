// =====================================
// SPARK STACK ACADEMY
// TOPBAR CONTROLLER V1
// =====================================


console.log("🚀 SSA Topbar Loaded");





export async function loadTopbar(){


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


        container.innerHTML =
        await response.text();



        initializeTopbar();


    }
    catch(error){

        console.error(
            "Topbar error:",
            error
        );

    }


}





function initializeTopbar(){


    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }


}







export function updateTopbar(student){


    const name =
    student.name ||
    student.fullName ||
    "Student";



    const initial =
    name.charAt(0)
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
        topName.textContent=name;


    if(avatar)
        avatar.textContent=initial;


    if(level)
        level.textContent=
        student.level || 1;


    if(xp)
        xp.textContent=
        student.xp || 0;


    if(streak)
        streak.textContent=
        student.streak || 0;


}