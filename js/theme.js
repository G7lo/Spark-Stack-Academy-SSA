// ============================================
// SPARK STACK ACADEMY
// theme.js
// Global Theme Controller
// ============================================


document.addEventListener("DOMContentLoaded", () => {


    const themeToggle =
    document.querySelector(".theme-toggle");


    const themeIcon =
    themeToggle?.querySelector("i");


    // Load saved theme

    const savedTheme =
    localStorage.getItem("ssa-theme");


    if(savedTheme === "dark"){

        document.body.classList.add(
            "dark-mode"
        );

        updateIcon(true);

    }



    // Toggle theme

    if(themeToggle){

        themeToggle.addEventListener(
        "click",
        ()=>{


            const isDark =
            document.body.classList.toggle(
                "dark-mode"
            );


            localStorage.setItem(
                "ssa-theme",
                isDark ? "dark" : "light"
            );


            updateIcon(isDark);


        });

    }



    function updateIcon(isDark){


        if(!themeIcon) return;


        if(isDark){

            themeIcon.classList.remove(
                "fa-moon"
            );

            themeIcon.classList.add(
                "fa-sun"
            );

        }

        else{

            themeIcon.classList.remove(
                "fa-sun"
            );

            themeIcon.classList.add(
                "fa-moon"
            );

        }

    }


});