// ===================================
// SPARK STACK ACADEMY
// FOUNDER APP CORE V2
// ===================================

import { auth, db } from "../../js/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import "../../js/theme.js";

console.log("🚀 Founder Core Initialized");

/* ===================================
   COMPONENT CACHE
=================================== */

const componentCache = new Map();

/* ===================================
   LOAD HTML COMPONENT
=================================== */

async function fetchComponent(path){

    if(componentCache.has(path)){

        return componentCache.get(path);

    }

    const response = await fetch(path);

    if(!response.ok){

        throw new Error(`Failed to load ${path}`);

    }

    const html = await response.text();

    componentCache.set(path, html);

    return html;

}

/* ===================================
   LOAD CSS ONCE
=================================== */

function loadCSS(path){

    if(document.querySelector(`link[href="${path}"]`)){

        return;

    }

    const link = document.createElement("link");

    link.rel = "stylesheet";

    link.href = path;

    document.head.appendChild(link);

}

/* ===================================
   INITIALIZE
=================================== */

window.addEventListener(

    "DOMContentLoaded",

    async()=>{

        try{

            await Promise.all([

                loadSidebar(),

                loadTopbar()

            ]);

            highlightActivePage();

            loadFounder();

        }

        catch(error){

            console.error(error);

        }

    }

);
/* ===================================
   LOAD COMPONENT
=================================== */

async function loadComponent({

    containerId,

    html,

    css,

    callback

}){

    loadCSS(css);

    const container = document.getElementById(containerId);

    if(!container){

        return;

    }

    try{

        container.innerHTML = await fetchComponent(html);

        if(typeof lucide !== "undefined"){

            lucide.createIcons();

        }

        if(typeof callback === "function"){

            callback();

        }

    }

    catch(error){

        console.error(`Failed to load ${html}`, error);

    }

}

/* ===================================
   LOAD SIDEBAR
=================================== */

async function loadSidebar(){

    await loadComponent({

        containerId:"sidebarContainer",

        html:"components/sidebar.html",

        css:"components/sidebar.css",

        callback:highlightActivePage

    });

}

/* ===================================
   LOAD TOPBAR
=================================== */

async function loadTopbar(){

    await loadComponent({

        containerId:"topbarContainer",

        html:"components/topbar.html",

        css:"components/topbar.css",

        callback:()=>{

    setupSidebar();

    setupTopbar();

}

    });

}

/* ===================================
   MOBILE SIDEBAR
=================================== */

function setupSidebar(){

    const menuBtn =
        document.getElementById("menuBtn");

    const sidebar =
        document.querySelector(".sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    if(!menuBtn || !sidebar || !overlay){

        return;

    }


    menuBtn.onclick = ()=>{

        sidebar.classList.toggle("active");

        overlay.classList.toggle("active");

        document.body.classList.toggle(
            "menu-open"
        );

    };


    overlay.onclick = ()=>{

        sidebar.classList.remove("active");

        overlay.classList.remove("active");

        document.body.classList.remove(
            "menu-open"
        );

    };


    document
    .querySelectorAll(".sidebar-menu a")
    .forEach(link=>{

        link.onclick = ()=>{

            overlay.click();

        };

    });

}
/* ===================================
   TOPBAR CONTROLS
=================================== */

function setupTopbar(){

    // Theme button

    const themeBtn =
        document.getElementById("themeBtn");


    if(themeBtn){

        themeBtn.addEventListener(
            "click",
            ()=>{

                document.body.classList.toggle(
                    "dark-mode"
                );

            }
        );

    }


    // Search

    const search =
        document.getElementById(
            "founderSearch"
        );


    if(search){

        search.addEventListener(
            "input",
            (e)=>{

                const query =
                    e.target.value.trim();

                if(query){

                    console.log(
                        "Searching:",
                        query
                    );

                }

            }
        );

    }


    // Notifications

    const notificationBtn =
        document.getElementById(
            "notificationsBtn"
        );


    if(notificationBtn){

        notificationBtn.addEventListener(
            "click",
            ()=>{

                console.log(
                    "Notifications clicked"
                );

            }
        );

    }

}
/* ===================================
   LOAD FOUNDER PROFILE
=================================== */

function loadFounder(){

    setFounderLoading();

    onAuthStateChanged(
        auth,
        async(user)=>{


            if(!user){

                window.location.href =
                    "../login.html";

                return;

            }


            try{


                const cache =
                    sessionStorage.getItem(
                        "founderProfile"
                    );


                if(cache){

                    const founder =
                        JSON.parse(cache);

                    updateFounderUI(
                        founder
                    );

                    return;

                }



                const founderRef =
                    doc(
                        db,
                        "founder",
                        user.uid
                    );


                const snapshot =
                    await getDoc(founderRef);



                if(!snapshot.exists()){

                    console.log(
                        "Founder profile not found"
                    );

                    return;

                }



                const founder =
                    snapshot.data();



                sessionStorage.setItem(

                    "founderProfile",

                    JSON.stringify(founder)

                );



                updateFounderUI(
                    founder
                );



            }

            catch(error){

                console.error(
                    "Founder loading error:",
                    error
                );

            }


        }

    );

}

/* ===================================
   FOUNDER LOADING STATE
=================================== */

function setFounderLoading(){

    const profileName =
        document.getElementById("profileName");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const profileRole =
        document.getElementById("profileRole");


    if(profileName){

        profileName.textContent =
            "Loading...";

    }


    if(profileAvatar){

        profileAvatar.textContent =
            "...";

    }


    if(profileRole){

        profileRole.textContent =
            "Founder";

    }

}

/* ===================================
   UPDATE FOUNDER UI
=================================== */

function updateFounderUI(founder){

    const name =
        founder.name || "Founder";


    const role =
        founder.role || "Founder";


    const initial =
        name.charAt(0).toUpperCase();


    const profileName =
        document.getElementById("profileName");


    const profileAvatar =
        document.getElementById("profileAvatar");


    const profileRole =
        document.getElementById("profileRole");


    const aiStatus =
        document.getElementById("aiStatusText");


    if(profileName){

        profileName.textContent = name;

    }


    if(profileAvatar){

        profileAvatar.textContent = initial;

    }


    if(profileRole){

        profileRole.textContent = role;

    }


    if(aiStatus){

        aiStatus.textContent =
            `Online • ${name}'s Assistant`;

    }


    window.founderData = founder;

}
/* ===================================
   ACTIVE PAGE HIGHLIGHT
=================================== */

function highlightActivePage(){

    const currentPage =
        window.location.pathname
        .split("/")
        .pop();


    document
    .querySelectorAll(".sidebar-menu a")
    .forEach(link=>{


        const linkPage =
            link
            .getAttribute("href");


        if(linkPage === currentPage){

            link.classList.add(
                "active"
            );

        }

        else{

            link.classList.remove(
                "active"
            );

        }


    });

}



/* ===================================
   LOGOUT
=================================== */

document.addEventListener(
    "click",
    async(e)=>{


        const logoutBtn =
            e.target.closest(
                "#logoutBtn"
            );


        if(!logoutBtn){

            return;

        }


        try{


            await signOut(auth);


            sessionStorage.removeItem(
                "founderProfile"
            );


            window.location.href =
                "../login.html";


        }

        catch(error){

            console.error(
                "Logout failed:",
                error
            );

        }


    }
);
// ===================================
// GLOBAL SEARCH
// ===================================


function initSearch(){


const searchInput =
document.getElementById(
    "globalSearch"
);


const searchResults =
document.getElementById(
    "searchResults"
);



if(!searchInput) return;



const pages = [

{
title:"Revenue Analytics",
url:"revenue.html"
},

{
title:"Monetization",
url:"monetization.html"
},

{
title:"Academy Profile",
url:"academy-profile.html"
},

{
title:"Spark AI Settings",
url:"spark-ai-settings.html"
},

{
title:"Security",
url:"security.html"
},

{
title:"Certificates",
url:"certificates.html"
},

{
title:"Platform Settings",
url:"platform-settings.html"
}

];



searchInput.addEventListener(
"input",
()=>{


const value =
searchInput.value
.toLowerCase()
.trim();



searchResults.innerHTML="";



if(!value){

searchResults.style.display="none";

return;

}



const matches =
pages.filter(page=>

page.title
.toLowerCase()
.includes(value)

);



matches.forEach(page=>{


const item =
document.createElement("div");


item.className =
"search-result";


item.textContent =
page.title;



item.onclick=()=>{

window.location.href =
page.url;

};



searchResults.appendChild(item);


});



searchResults.style.display =
matches.length
? "block"
:"none";


});


}



document.addEventListener(
"DOMContentLoaded",
()=>{

initSearch();

});