/* ==========================================
   SPARK STACK FOUNDER OS
   COMPONENT LOADER
========================================== */


async function loadComponent(
    elementId,
    file,
    cssFile
){

    const container =
    document.getElementById(elementId);


    if(!container){

        console.error(
            "Component container missing:",
            elementId
        );

        return;

    }



    try{


        // Load HTML

        const response =
        await fetch(file);


        const html =
        await response.text();


        container.innerHTML = html;



        // Load CSS

        if(cssFile){

            const style =
            document.createElement("link");


            style.rel="stylesheet";

            style.href=cssFile;


            document.head.appendChild(style);

        }



        console.log(
            "Loaded:",
            file
        );


    }


    catch(error){

        console.error(
            "Component error:",
            error
        );

    }


}



/* ==========================================
   INITIALIZE COMPONENTS
========================================== */


document.addEventListener(
"DOMContentLoaded",
async ()=>{


    await loadComponent(

        "sidebar",

        "./components/sidebar.html",

        "./components/sidebar.css"

    );


    await loadComponent(

        "topbar",

        "./components/topbar.html",

        "./components/topbar.css"

    );


    document.dispatchEvent(
        new Event("componentsLoaded")
    );


    console.log(
        "✅ Components loaded"
    );


});