const css = document.createElement("link");

css.rel = "stylesheet";

css.href = "components/sidebar.css";

document.head.appendChild(css);

const container =
document.getElementById("sidebarContainer");

fetch("components/sidebar.html")
.then(response => response.text())
.then(html=>{

    container.innerHTML = html;

    initSidebar();

});


function initSidebar(){

    const sidebar =
    document.getElementById("sidebar");

    const overlay =
    document.getElementById("overlay");


    const menuBtn =
    document.getElementById("menuBtn");


    if(menuBtn){

        menuBtn.addEventListener("click",()=>{

            sidebar.classList.toggle("show");

            overlay.classList.toggle("show");

        });

    }


    overlay.addEventListener("click",()=>{

        sidebar.classList.remove("show");

        overlay.classList.remove("show");

    });


    const currentPage =
window.location.pathname.split("/").pop();

document
.querySelectorAll("[data-page]")
.forEach(link=>{

    const page =
    link.dataset.page;

    let href = "";

    switch(page){

        case "dashboard":
            href = "dashboard.html";
            break;

        case "courses":
            href = "courses.html";
            break;

        case "my-courses":
            href = "my-courses.html";
            break;

        case "certificates":
            href = "certificates.html";
            break;

        case "settings":
            href = "settings.html";
            break;

        case "logout":
            href = "../login.html";
            break;

    }

    link.href = href;

    if(currentPage === href){

        link.classList.add("active");

    }

});

}