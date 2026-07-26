function setupMenu(){


const menuBtn =
document.getElementById("menuBtn");



if(!menuBtn){

    return;

}



menuBtn.addEventListener("click",()=>{

    const sidebar =
    document.querySelector(".sidebar");

    const overlay =
    document.getElementById("sidebarOverlay");

    if(!sidebar){

        return;

    }

    sidebar.classList.toggle("active");

    if(overlay){

        overlay.classList.toggle("active");

    }

});





document.addEventListener("click",(e)=>{


const sidebar =
document.querySelector(".sidebar");


const isMenuClick =
menuBtn.contains(e.target);



const isSidebarClick =
sidebar && sidebar.contains(e.target);



if(
sidebar &&
sidebar.classList.contains("active") &&
!isSidebarClick &&
!isMenuClick
){

    sidebar.classList.remove("active");

    const overlay =
    document.getElementById("sidebarOverlay");

    if(overlay){

        overlay.classList.remove("active");

    }

}

});

}


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