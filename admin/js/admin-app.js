/* ===========================
   SSA ADMIN APP V2
=========================== */

import {
    auth,
    db
} from "../../js/firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===========================
   LOAD COMPONENT CSS
=========================== */

[
    "../components/sidebar.css",
    "../components/topbar.css"
].forEach(file=>{

    if(document.querySelector(`link[href="${file}"]`))
        return;

    const css =
    document.createElement("link");

    css.rel="stylesheet";

    css.href=file;

    document.head.appendChild(css);

});


/* ===========================
   LOAD COMPONENT
=========================== */

async function loadComponent(id,file){

    const container =
    document.getElementById(id);

    if(!container) return;

    try{

        const res =
        await fetch(file);

        container.innerHTML =
        await res.text();

    }

    catch(error){

        console.error(error);

    }

}


/* ===========================
   START
=========================== */

async function init(){

    await loadComponent(

        "sidebarContainer",

        "../components/sidebar.html"

    );

    await loadComponent(

        "topbarContainer",

        "../components/topbar.html"

    );

    if(typeof lucide!=="undefined"){

        lucide.createIcons();

    }

    setupSidebar();

    setupLogout();

    checkAuth();

    setActivePage();

    setPageTitle();

}


/* ===========================
   SIDEBAR
=========================== */

function setupSidebar(){

    const menuBtn =
    document.getElementById("menuBtn");

    const sidebar =
    document.querySelector(".sidebar");

    const overlay =
    document.getElementById("sidebarOverlay");

    if(!menuBtn || !sidebar) return;

    menuBtn.onclick=()=>{

        sidebar.classList.toggle("show");

        overlay?.classList.toggle("show");

    };

    overlay?.addEventListener(

        "click",

        ()=>{

            sidebar.classList.remove("show");

            overlay.classList.remove("show");

        }

    );

}


/* ===========================
   ACTIVE PAGE
=========================== */

function setActivePage(){

    const page =
    location.pathname
    .split("/")
    .pop();

    document
    .querySelectorAll(".sidebar-nav a")
    .forEach(link=>{

        if(link.getAttribute("href")===page){

            link.classList.add("active");

        }

    });

}


/* ===========================
   PAGE TITLE
=========================== */

function setPageTitle(){

    const title =
    document.getElementById(
        "pageTitle"
    );

    if(!title) return;

    const page =
    location.pathname
    .split("/")
    .pop()
    .replace(".html","");

    title.textContent =
    page.charAt(0)
    .toUpperCase() +
    page.slice(1);

}


/* ===========================
   AUTH
=========================== */

function checkAuth(){

    onAuthStateChanged(

        auth,

        async(user)=>{

            if(!user){

                location.href=
                "../login.html";

                return;

            }

            try{

                const snap =
                await getDoc(

                    doc(
                        db,
                        "admins",
                        user.uid
                    )

                );

                if(!snap.exists()){

                    location.href=
                    "../index.html";

                    return;

                }

                const data =
                snap.data();

                const adminName =
                document.getElementById(
                    "adminName"
                );

                const avatar =
                document.querySelector(
                    ".avatar"
                );

                if(adminName){

                    adminName.textContent =
                    data.name ||
                    "Administrator";

                }

                if(avatar){

                    avatar.textContent =
                    (
                        data.name ||
                        "A"
                    )
                    .charAt(0)
                    .toUpperCase();

                }

            }

            catch(error){

                console.error(error);

            }

        }

    );

}


/* ===========================
   LOGOUT
=========================== */

function setupLogout(){

    document.addEventListener(

        "click",

        async(e)=>{

            if(
                e.target.closest(
                    "#logoutBtn"
                )
            ){

                await signOut(auth);

                location.href=
                "../login.html";

            }

        }

    );

}


init();