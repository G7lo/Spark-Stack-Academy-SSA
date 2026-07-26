window.addEventListener("DOMContentLoaded",()=>{


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