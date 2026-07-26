// ===========================
// SSA SIDEBAR COMPONENT
// ===========================


const sidebarContainer = 
document.getElementById("sidebarContainer");



// Load sidebar CSS

const sidebarCSS = document.createElement("link");

sidebarCSS.rel = "stylesheet";

sidebarCSS.href = "components/sidebar.css";

document.head.appendChild(sidebarCSS);





// Load sidebar HTML

fetch("components/sidebar.html")

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



    if(!menuBtn || !sidebar) return;



    menuBtn.addEventListener("click",()=>{


        sidebar.classList.toggle("active");


    });




    document.addEventListener("click",(e)=>{


        if(
            window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !menuBtn.contains(e.target)

        ){

            sidebar.classList.remove("active");

        }


    });


}