window.addEventListener("DOMContentLoaded",()=>{


    const css =
    document.createElement("link");


    css.rel="stylesheet";

    css.href="components/sidebar.css";


    document.head.appendChild(css);



    const container =
    document.getElementById("sidebarContainer");


    if(!container) return;



    fetch("components/sidebar.html")


    .then(res=>res.text())


    .then(html=>{


        container.innerHTML = html;


        if(typeof lucide !== "undefined"){

            lucide.createIcons();

        }


    });


});