// ===================================
// SPARK STACK ACADEMY
// THEME ENGINE
// ===================================

const THEME_KEY = "spark-theme";

/* ===================================
   INITIALIZE THEME
=================================== */

document.addEventListener(
    "DOMContentLoaded",
    initTheme
);

function initTheme(){

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    if(savedTheme === "dark"){

        document.body.classList.add(
            "dark-mode"
        );

    }

    updateThemeIcon();

    const themeBtn =
        document.getElementById("themeBtn");

    if(themeBtn){

        themeBtn.addEventListener(
            "click",
            toggleTheme
        );

    }

}

/* ===================================
   TOGGLE THEME
=================================== */

function toggleTheme(){

    document.body.classList.toggle(
        "dark-mode"
    );

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
    );

    updateThemeIcon();

}

/* ===================================
   UPDATE ICON
=================================== */

function updateThemeIcon(){

    const icon =
        document.querySelector(
            "#themeBtn i"
        );

    if(!icon || typeof lucide === "undefined"){
        return;
    }

    icon.setAttribute(
        "data-lucide",
        document.body.classList.contains("dark-mode")
            ? "sun"
            : "moon"
    );

    lucide.createIcons();

}