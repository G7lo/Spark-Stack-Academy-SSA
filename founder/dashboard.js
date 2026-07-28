/* ===================================
   FOUNDER DASHBOARD
=================================== */

import "./js/founder-app.js";

/* ===================================
   ELEMENTS
=================================== */

const studentCount =
    document.getElementById("studentCount");

const courseCount =
    document.getElementById("courseCount");

const instructorCount =
    document.getElementById("instructorCount");

const revenueCount =
    document.getElementById("revenueCount");

const enrollmentCount =
    document.getElementById("enrollmentCount");

const dailyInsight = document.getElementById("dailyInsight");
const founderInsight = document.getElementById("founderInsight");

/* ===================================
   DEMO DATA
=================================== */

const dashboardData = {

    students:248,

    courses:18,

    instructors:7,

    revenue:12500,

    enrollments:396


};

/* ===================================
   COUNTER ANIMATION
=================================== */

function animateCounter(element,target){

    let current=0;

    const step=Math.max(1,Math.ceil(target/60));

    const timer=setInterval(()=>{

        current+=step;

        if(current>=target){

            current=target;

            clearInterval(timer);

        }

        element.textContent=current.toLocaleString();

    },20);

}

/* ===================================
   LOAD STATS
=================================== */

function loadDashboard(){

    animateCounter(
        studentCount,
        dashboardData.students
    );


    animateCounter(
        courseCount,
        dashboardData.courses
    );


    animateCounter(
        instructorCount,
        dashboardData.instructors
    );


    animateCounter(
        revenueCount,
        dashboardData.revenue
    );


    animateCounter(
        enrollmentCount,
        dashboardData.enrollments
    );

}
/* ===================================
   DYNAMIC GREETING
=================================== */

function updateGreeting(){

    const hour = new Date().getHours();

    let greeting = "Good Evening";

    if(hour < 12){

        greeting = "Good Morning";

    }

    else if(hour < 18){

        greeting = "Good Afternoon";

    }

    const title = document.querySelector(".hero-section h1");

    if(title){

        title.innerHTML = `
            ${greeting},
            <span>Phinehas</span>
        `;
    }

}

/* ===================================
   FOUNDER INSIGHTS
=================================== */

const insights = [

    "Student engagement is stable. Consider publishing a new course this week.",

    "Review instructor activity to maintain high teaching quality.",

    "Admissions are an opportunity for growth. Monitor new applications regularly.",

    "SparkMind recommends checking academy analytics for emerging trends."

];

function rotateInsights(){

    let index = 0;

    function update(){

        if(dailyInsight){

            dailyInsight.textContent = insights[index];
        }

        if(founderInsight){

            founderInsight.textContent = insights[index];
        }

        index = (index + 1) % insights.length;
    }

    update();

    setInterval(update,10000);

}

/* ===================================
   INITIALIZE
=================================== */

window.addEventListener("DOMContentLoaded",()=>{

    updateGreeting();

    loadDashboard();

    rotateInsights();

    console.log("🚀 Founder Dashboard Ready");

});