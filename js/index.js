// ============================================
// PART 3 - FIREBASE AUTH & ROLE REDIRECT
// ============================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================
// NAVIGATION BUTTONS
// ============================================

const loginBtn =
document.querySelector(".login-btn");

const signupBtn =
document.querySelector(".signup-btn");

// ============================================
// DASHBOARDS
// ============================================

const DASHBOARDS = {

    founder:
    "founder/dashboard.html",

    admin:
    "admin/dashboard.html",

    instructor:
    "instructor/dashboard.html",

    student:
    "student/dashboard.html"

};

// ============================================
// AUTH STATE
// ============================================

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    try {

        const userRef =
        doc(db, "users", user.uid);

        const userSnap =
        await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData =
        userSnap.data();

        // Replace Login button

        loginBtn.textContent =
        "Dashboard";

        loginBtn.href =
        DASHBOARDS[userData.role] ||
        DASHBOARDS.student;

        // Replace Sign Up button

        signupBtn.textContent =
        "My Account";

        signupBtn.href =
        DASHBOARDS[userData.role] ||
        DASHBOARDS.student;

        // Welcome message

        const badge =
        document.querySelector(".hero-badge");

        if (badge) {

            badge.innerHTML = `

<i class="fa-solid fa-circle-check"></i>

Welcome back,
${userData.fullName}

`;

        }

    }

    catch(error){

        console.error(error);

    }

});

// ============================================
// LOGOUT (Future)
// ============================================

window.logout = async () => {

    const {

        signOut

    } = await import(

"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

    );

    await signOut(auth);

    location.reload();

};

// ============================================
// PAGE READY
// ============================================

console.log(

"%cSpark Stack Academy Ready 🚀",

"color:#0B2D5C;font-size:18px;font-weight:bold;"

);
// ============================================
// SPARK STACK ACADEMY
// index.js
// PART 1 - UI INTERACTIONS
// ============================================

// ==========================
// DOM ELEMENTS
// ==========================

const preloader =
document.getElementById("preloader");

const header =
document.querySelector("header");

const menuBtn =
document.getElementById("menuBtn");

const navLinks =
document.querySelector(".nav-links");

const backToTop =
document.getElementById("backToTop");

const newsletterForm =
document.getElementById("newsletterForm");

const navItems =
document.querySelectorAll(".nav-links a");

// ==========================
// PRELOADER
// ==========================
function hidePreloader() {

    if (!preloader) return;

    preloader.style.opacity = "0";
    preloader.style.visibility = "hidden";

    setTimeout(() => {

        preloader.remove();

    }, 500);

}

window.addEventListener("load", hidePreloader);

// Safety timeout
setTimeout(hidePreloader, 3000);

// ==========================
// STICKY NAVBAR
// ==========================

window.addEventListener("scroll", () => {

    if (window.scrollY > 40) {

        header.style.background =
        "rgba(255,255,255,.95)";

        header.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.08)";

    } else {

        header.style.background =
        "rgba(255,255,255,.88)";

        header.style.boxShadow =
        "none";

    }

});

// ==========================
// MOBILE MENU
// ==========================

menuBtn.addEventListener("click", () => {

    navLinks.classList.toggle("show");

    const icon =
    menuBtn.querySelector("i");

    if (navLinks.classList.contains("show")) {

        icon.classList.remove("fa-bars");

        icon.classList.add("fa-xmark");

    } else {

        icon.classList.remove("fa-xmark");

        icon.classList.add("fa-bars");

    }

});

// Close menu after clicking a link

navItems.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.classList.remove("show");

        const icon =
        menuBtn.querySelector("i");

        icon.classList.remove("fa-xmark");

        icon.classList.add("fa-bars");

    });

});

// ==========================
// BACK TO TOP
// ==========================

window.addEventListener("scroll", () => {

    if (window.scrollY > 500) {

        backToTop.classList.add("show");

    } else {

        backToTop.classList.remove("show");

    }

});

backToTop.addEventListener("click", () => {

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

// ==========================
// SMOOTH SCROLL
// ==========================

document.querySelectorAll('a[href^="#"]')
.forEach(anchor => {

    anchor.addEventListener("click", e => {

        e.preventDefault();

        const target =
        document.querySelector(
            anchor.getAttribute("href")
        );

        if(target){

            target.scrollIntoView({

                behavior:"smooth",

                block:"start"

            });

        }

    });

});

// ==========================
// NEWSLETTER
// ==========================

newsletterForm.addEventListener("submit", e => {

    e.preventDefault();

    const input =
    newsletterForm.querySelector("input");

    if(!input.value.trim()) return;

    alert(
        "🎉 Thanks for subscribing to Spark Stack Academy!"
    );

    newsletterForm.reset();

});

console.log(
"%cSpark Stack Academy Landing Page Loaded 🚀",
"color:#0B2D5C;font-size:16px;font-weight:bold;"
);
// ============================================
// PART 2 - ANIMATIONS & SCROLL EFFECTS
// ============================================

// ==========================
// ANIMATED COUNTERS
// ==========================

const counters =
document.querySelectorAll(".counter");

const counterObserver =
new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const counter =
        entry.target;

        const target =
        Number(counter.dataset.target);

        let current = 0;

        const increment =
        Math.max(1, Math.ceil(target / 80));

        const timer =
        setInterval(() => {

            current += increment;

            if (current >= target) {

                counter.textContent = target + "+";

                clearInterval(timer);

            } else {

                counter.textContent = current;

            }

        }, 20);

        counterObserver.unobserve(counter);

    });

}, {

    threshold: 0.5

});

counters.forEach(counter => {

    counterObserver.observe(counter);

});

// ==========================
// SCROLL REVEAL
// ==========================

const revealItems =
document.querySelectorAll(

".course-card,\
 .why-card,\
 .achievement-card,\
 .testimonial-card,\
 .contact-card,\
 .partner-item,\
 .feature,\
 .instructor-card"

);

const revealObserver =
new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.style.opacity = "1";

            entry.target.style.transform =
            "translateY(0)";

            revealObserver.unobserve(entry.target);

        }

    });

}, {

    threshold:0.15

});

revealItems.forEach(item => {

    item.style.opacity = "0";

    item.style.transform =
    "translateY(45px)";

    item.style.transition =
    ".7s ease";

    revealObserver.observe(item);

});

// ==========================
// HERO IMAGE PARALLAX
// ==========================

const heroImage =
document.querySelector(".hero-image img");

window.addEventListener("scroll", () => {

    if (!heroImage) return;

    const offset =
    window.scrollY * 0.08;

    heroImage.style.transform =
    `translateY(${offset}px)`;

});

// ==========================
// COURSE CARD EFFECT
// ==========================

document
.querySelectorAll(".course-card")
.forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform =
        "translateY(-12px) scale(1.02)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform =
        "translateY(0) scale(1)";

    });

});

// ==========================
// INSTRUCTOR CARD EFFECT
// ==========================

document
.querySelectorAll(".instructor-card")
.forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.boxShadow =
        "0 30px 60px rgba(0,0,0,.12)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.boxShadow = "";

    });

});

// ==========================
// ACTIVE NAVIGATION
// ==========================

const sections =
document.querySelectorAll("section");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const top =
        section.offsetTop - 120;

        if (window.scrollY >= top) {

            current =
            section.getAttribute("id");

        }

    });

    navItems.forEach(link => {

        link.classList.remove("active");

        if (

            link.getAttribute("href") ===
            "#" + current

        ) {

            link.classList.add("active");

        }

    });

});