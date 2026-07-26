window.addEventListener("DOMContentLoaded",()=>{


const css = document.createElement("link");

css.rel="stylesheet";

css.href="components/topbar.css";

document.head.appendChild(css);




const container =
document.getElementById("topbarContainer");



if(!container) return;



fetch("components/topbar.html")

.then(res=>res.text())

.then(html=>{


    container.innerHTML = html;



    if(typeof lucide !== "undefined"){

        lucide.createIcons();

    }



    setupMenu();



});





});





function setupMenu(){


const menuBtn =
document.getElementById("menuBtn");


const sidebar =
document.querySelector(".sidebar");



if(!menuBtn || !sidebar){

    console.log("Menu or sidebar missing");

    return;

}



menuBtn.addEventListener("click",()=>{


    const overlay =
    document.getElementById("sidebarOverlay");


    sidebar.classList.toggle("active");


    if(overlay){

        overlay.classList.toggle("active");

    }


});

const overlay =
document.getElementById("sidebarOverlay");


if(overlay){

    overlay.addEventListener("click",()=>{


        sidebar.classList.remove("active");

        overlay.classList.remove("active");


    });

}


}