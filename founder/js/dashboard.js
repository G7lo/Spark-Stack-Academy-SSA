/* ==========================================
   SPARK STACK ACADEMY
   FOUNDER DASHBOARD
========================================== */

/* ==========================================
   IMPORTS
========================================== */

import { auth, db }
from "../../js/firebase.js";

import {

    onAuthStateChanged,
    signOut

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==========================================
   CHART.JS
========================================== */

let revenueChart = null;

let studentChart = null;

/* ==========================================
   FIRESTORE COLLECTIONS
========================================== */

const studentsRef =
collection(db,"students");

const coursesRef =
collection(db,"courses");

const instructorsRef =
collection(db,"instructors");

const enrollmentsRef =
collection(db,"enrollments");

const revenueRef =
collection(db,"payments");

const certificatesRef =
collection(db,"certificates");

const announcementsRef =
collection(db,"announcements");

const activityRef =
collection(db,"activity");

/* ==========================================
   CURRENT USER
========================================== */

let currentUser = null;

let founderData = null;

/* ==========================================
   DASHBOARD STATE
========================================== */

const dashboardState = {

    students:0,

    activeStudents:0,

    premiumStudents:0,

    courses:0,

    instructors:0,

    enrollments:0,

    revenue:0,

    certificates:0,

    announcements:0

};

console.log(
    "🚀 Founder Dashboard Loaded"
);
/* ==========================================
   DOM ELEMENTS
========================================== */

/* ---------- HERO ---------- */

const heroFounderName =
document.getElementById("heroFounderName");

const dailyInsight =
document.getElementById("dailyInsight");

const founderInsight =
document.getElementById("founderInsight");

const sparkInsight =
document.getElementById("sparkInsight");

/* ---------- KPI ---------- */

const studentCount =
document.getElementById("studentCount");

const courseCount =
document.getElementById("courseCount");

const instructorCount =
document.getElementById("instructorCount");

const enrollmentCount =
document.getElementById("enrollmentCount");

const revenueCount =
document.getElementById("revenueCount");

const certificateCount =
document.getElementById("certificateCount");

const premiumCount =
document.getElementById("premiumCount");

const announcementCount =
document.getElementById("announcementCount");

/* ---------- WEEKLY SUMMARY ---------- */

const weekRevenue =
document.getElementById("weekRevenue");

const weekStudents =
document.getElementById("weekStudents");

const weekCourses =
document.getElementById("weekCourses");

const weekCertificates =
document.getElementById("weekCertificates");

/* ---------- LISTS ---------- */

const activityList =
document.getElementById("activityList");

const announcementFeed =
document.getElementById("announcementFeed");

/* ---------- CHARTS ---------- */

const revenueCanvas =
document.getElementById("revenueChart");

const studentCanvas =
document.getElementById("studentChart");

/* ---------- SIDEBAR ---------- */

const sidebar =
document.getElementById("sidebar");

const sidebarOverlay =
document.getElementById("sidebarOverlay");

/* ---------- TOPBAR ---------- */

const topbar =
document.getElementById("topbar");

const menuToggle =
document.getElementById("menuToggle");

const dashboardSearch =
document.getElementById("dashboardSearch");

const notificationBtn =
document.getElementById("notificationBtn");

const profileBtn =
document.getElementById("profileBtn");

const profileMenu =
document.getElementById("profileMenu");

const quickCreateBtn =
document.getElementById("quickCreateBtn");

/* ---------- DRAWERS ---------- */

const notificationDrawer =
document.getElementById("notificationDrawer");

const closeNotificationDrawer =
document.getElementById(
"closeNotificationDrawer"
);

/* ---------- MODALS ---------- */

const logoutModal =
document.getElementById("logoutModal");

const confirmLogoutBtn =
document.getElementById("confirmLogout");

const cancelLogoutBtn =
document.getElementById("cancelLogout");

const loadingOverlay =
document.getElementById("loadingOverlay");

/* ---------- TOAST ---------- */

const toastContainer =
document.getElementById("toastContainer");

/* ---------- PLATFORM HEALTH ---------- */

const databaseStatus =
document.getElementById("databaseStatus");

const authStatus =
document.getElementById("authStatus");

const storageStatus =
document.getElementById("storageStatus");

const aiStatus =
document.getElementById("aiStatus");

/* ---------- QUICK STATS ---------- */

const totalRevenueCard =
document.getElementById("totalRevenueCard");

const totalStudentsCard =
document.getElementById("totalStudentsCard");

const activeCoursesCard =
document.getElementById("activeCoursesCard");

const premiumMembersCard =
document.getElementById("premiumMembersCard");

/* ---------- CHECK ---------- */

console.log("✅ DOM Elements Cached");
/* ==========================================
   INITIALIZE DASHBOARD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeDashboard();

    }
);

/* ==========================================
   AUTHENTICATION
========================================== */

function initializeDashboard(){

    onAuthStateChanged(

        auth,

        async(user)=>{

            if(!user){

                location.href =
                "../../login.html";

                return;

            }

            currentUser = user;

            console.log(
                "✅ Authenticated:",
                user.email
            );

            await loadFounderProfile();

            initializeRealtimeListeners();

            initializeCharts();

            initializeUI();

            initializePlatformHealth();

            console.log(
                "🚀 Dashboard Ready"
            );

        }

    );

}

/* ==========================================
   LOAD FOUNDER PROFILE
========================================== */

async function loadFounderProfile(){

    try{

        const founderRef =
        doc(
            db,
            "founders",
            currentUser.uid
        );

        const founderSnap =
        await getDoc(founderRef);

        if(founderSnap.exists()){

            founderData =
            founderSnap.data();

        }

        else{

            founderData = {

                firstName:"Founder",

                lastName:"",

                role:"Founder",

                academy:"Spark Stack Academy"

            };

        }

        const fullName =

            `${founderData.firstName}
             ${founderData.lastName}`.trim();

        heroFounderName.textContent =
        fullName || "Founder";

        console.log(
            "✅ Founder Loaded"
        );

    }

    catch(error){

        console.error(

            "Founder Error:",

            error

        );

        heroFounderName.textContent =
        "Founder";

    }

}

/* ==========================================
   INITIALIZE UI
========================================== */

function initializeUI(){

    initializeSidebar();

    initializeProfileMenu();

    initializeNotifications();

    initializeSearch();

    initializeLogout();

}

/* ==========================================
   INITIALIZE REALTIME DATA
========================================== */

function initializeRealtimeListeners(){

    listenStudents();

    listenCourses();

    listenInstructors();

    listenEnrollments();

    listenRevenue();

    listenCertificates();

    listenAnnouncements();

    listenActivity();

}

/* ==========================================
   START CHARTS
========================================== */

function initializeCharts(){

    createRevenueChart();

    createStudentChart();

}

/* ==========================================
   PLATFORM HEALTH
========================================== */

function initializePlatformHealth(){

    if(databaseStatus){

        databaseStatus.textContent =
        "Online";

    }

    if(authStatus){

        authStatus.textContent =
        "Online";

    }

    if(storageStatus){

        storageStatus.textContent =
        "Online";

    }

    if(aiStatus){

        aiStatus.textContent =
        "Active";

    }

}
/* ==========================================
   REALTIME STUDENTS
========================================== */

function listenStudents(){

    onSnapshot(

        studentsRef,

        (snapshot)=>{

            let total = 0;

            let active = 0;

            let premium = 0;

            let suspended = 0;

            snapshot.forEach((doc)=>{

                total++;

                const student = doc.data();

                if(student.status === "Active"){

                    active++;

                }

                if(student.membership === "Premium"){

                    premium++;

                }

                if(student.status === "Suspended"){

                    suspended++;

                }

            });

            dashboardState.students = total;

            dashboardState.activeStudents = active;

            dashboardState.premiumStudents = premium;

            updateStudentUI();

        },

        (error)=>{

            console.error(
                "Students Listener:",
                error
            );

        }

    );

}

/* ==========================================
   REALTIME COURSES
========================================== */

function listenCourses(){

    onSnapshot(

        coursesRef,

        (snapshot)=>{

            dashboardState.courses =
            snapshot.size;

            updateCourseUI();

        }

    );

}

/* ==========================================
   REALTIME INSTRUCTORS
========================================== */

function listenInstructors(){

    onSnapshot(

        instructorsRef,

        (snapshot)=>{

            dashboardState.instructors =
            snapshot.size;

            updateInstructorUI();

        }

    );

}

/* ==========================================
   REALTIME ENROLLMENTS
========================================== */

function listenEnrollments(){

    onSnapshot(

        enrollmentsRef,

        (snapshot)=>{

            dashboardState.enrollments =
            snapshot.size;

            updateEnrollmentUI();

        }

    );

}

/* ==========================================
   REALTIME CERTIFICATES
========================================== */

function listenCertificates(){

    onSnapshot(

        certificatesRef,

        (snapshot)=>{

            dashboardState.certificates =
            snapshot.size;

            updateCertificateUI();

        }

    );

}

/* ==========================================
   REALTIME ANNOUNCEMENTS
========================================== */

function listenAnnouncements(){

    onSnapshot(

        announcementsRef,

        (snapshot)=>{

            dashboardState.announcements =
            snapshot.size;

            updateAnnouncementUI();

        }

    );

}

/* ==========================================
   REALTIME REVENUE
========================================== */

function listenRevenue(){

    onSnapshot(

        revenueRef,

        (snapshot)=>{

            let revenue = 0;

            snapshot.forEach((doc)=>{

                const payment =
                doc.data();

                revenue +=
                Number(payment.amount || 0);

            });

            dashboardState.revenue =
            revenue;

            updateRevenueUI();

        }

    );

}

/* ==========================================
   UPDATE UI
========================================== */

function updateStudentUI(){

    studentCount.textContent =
    dashboardState.students;

    premiumCount.textContent =
    dashboardState.premiumStudents;

}

function updateCourseUI(){

    courseCount.textContent =
    dashboardState.courses;

}

function updateInstructorUI(){

    instructorCount.textContent =
    dashboardState.instructors;

}

function updateEnrollmentUI(){

    enrollmentCount.textContent =
    dashboardState.enrollments;

}

function updateCertificateUI(){

    certificateCount.textContent =
    dashboardState.certificates;

}

function updateAnnouncementUI(){

    announcementCount.textContent =
    dashboardState.announcements;

}

function updateRevenueUI(){

    revenueCount.textContent =

        "KES " +

        dashboardState.revenue.toLocaleString();

}
/* ==========================================
   REVENUE CHART
========================================== */

function createRevenueChart(){

    if(!revenueCanvas) return;

    revenueChart = new Chart(

        revenueCanvas,

        {

            type:"line",

            data:{

                labels:[

                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"

                ],

                datasets:[{

                    label:"Revenue",

                    data:new Array(12).fill(0),

                    borderColor:"#F4E7C5",

                    backgroundColor:
                    "rgba(244,231,197,.15)",

                    borderWidth:3,

                    fill:true,

                    tension:.4,

                    pointRadius:4,

                    pointHoverRadius:6

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{

                        display:false

                    }

                },

                scales:{

                    y:{

                        beginAtZero:true,

                        grid:{

                            color:"rgba(255,255,255,.05)"

                        },

                        ticks:{

                            color:"#94A3B8"

                        }

                    },

                    x:{

                        grid:{

                            display:false

                        },

                        ticks:{

                            color:"#94A3B8"

                        }

                    }

                }

            }

        }

    );

}

/* ==========================================
   STUDENT GROWTH CHART
========================================== */

function createStudentChart(){

    if(!studentCanvas) return;

    studentChart = new Chart(

        studentCanvas,

        {

            type:"bar",

            data:{

                labels:[

                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"

                ],

                datasets:[{

                    label:"Students",

                    data:new Array(12).fill(0),

                    backgroundColor:"#3B82F6",

                    borderRadius:8

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{

                        display:false

                    }

                },

                scales:{

                    y:{

                        beginAtZero:true,

                        grid:{

                            color:"rgba(255,255,255,.05)"

                        },

                        ticks:{

                            color:"#94A3B8"

                        }

                    },

                    x:{

                        grid:{

                            display:false

                        },

                        ticks:{

                            color:"#94A3B8"

                        }

                    }

                }

            }

        }

    );

}

/* ==========================================
   UPDATE CHARTS
========================================== */

async function updateCharts(){

    const revenueData =
    new Array(12).fill(0);

    const studentData =
    new Array(12).fill(0);

    const paymentSnapshot =
    await getDocs(revenueRef);

    paymentSnapshot.forEach((doc)=>{

        const payment =
        doc.data();

        if(payment.createdAt){

            const month =
            payment.createdAt
            .toDate()
            .getMonth();

            revenueData[month] +=
            Number(payment.amount || 0);

        }

    });

    const studentSnapshot =
    await getDocs(studentsRef);

    studentSnapshot.forEach((doc)=>{

        const student =
        doc.data();

        if(student.createdAt){

            const month =
            student.createdAt
            .toDate()
            .getMonth();

            studentData[month]++;

        }

    });

    if(revenueChart){

        revenueChart.data.datasets[0].data =
        revenueData;

        revenueChart.update();

    }

    if(studentChart){

        studentChart.data.datasets[0].data =
        studentData;

        studentChart.update();

    }

}
/* ==========================================
   RECENT ACTIVITY
========================================== */

function listenActivity(){

    const activityQuery = query(
        activityRef,
        orderBy("createdAt","desc"),
        limit(8)
    );

    onSnapshot(

        activityQuery,

        (snapshot)=>{

            if(snapshot.empty){

                activityList.innerHTML = `

                    <div class="loading-state">

                        No recent activity.

                    </div>

                `;

                return;

            }

            let html = "";

            snapshot.forEach((doc)=>{

                const item = doc.data();

                html += `

                <div class="feed-item">

                    <div class="feed-icon">

                        ${item.icon || "📌"}

                    </div>

                    <div class="feed-content">

                        <h4>

                            ${item.title}

                        </h4>

                        <p>

                            ${item.description}

                        </p>

                        <span class="feed-time">

                            ${formatDate(item.createdAt)}

                        </span>

                    </div>

                </div>

                `;

            });

            activityList.innerHTML = html;

        }

    );

}

/* ==========================================
   ANNOUNCEMENTS
========================================== */

function listenAnnouncementsFeed(){

    const announcementQuery = query(

        announcementsRef,

        orderBy("createdAt","desc"),

        limit(5)

    );

    onSnapshot(

        announcementQuery,

        (snapshot)=>{

            if(snapshot.empty){

                announcementFeed.innerHTML = `

                    <div class="loading-state">

                        No announcements available.

                    </div>

                `;

                return;

            }

            let html = "";

            snapshot.forEach((doc)=>{

                const announcement = doc.data();

                html += `

                <div class="feed-item">

                    <div class="feed-icon">

                        📢

                    </div>

                    <div class="feed-content">

                        <h4>

                            ${announcement.title}

                        </h4>

                        <p>

                            ${announcement.message}

                        </p>

                        <span class="feed-time">

                            ${formatDate(
                                announcement.createdAt
                            )}

                        </span>

                    </div>

                </div>

                `;

            });

            announcementFeed.innerHTML = html;

        }

    );

}

/* ==========================================
   SPARKMIND INSIGHTS
========================================== */

function updateSparkMind(){

    let message = "";

    if(dashboardState.students === 0){

        message =
        "🚀 Welcome! Start by enrolling your first student.";

    }

    else if(

        dashboardState.students < 50

    ){

        message =
        "📈 Student growth is healthy. Promote your academy to reach more learners.";

    }

    else if(

        dashboardState.premiumStudents < 10

    ){

        message =
        "💎 Consider promoting Premium Membership to increase recurring revenue.";

    }

    else{

        message =
        "🔥 Academy performance is excellent. Focus on engagement and course completion.";

    }

    if(sparkInsight){

        sparkInsight.textContent = message;

    }

    if(founderInsight){

        founderInsight.textContent = message;

    }

    if(dailyInsight){

        dailyInsight.textContent = message;

    }

}

/* ==========================================
   UPDATE WEEKLY SUMMARY
========================================== */

function updateWeeklySummary(){

    if(weekStudents){

        weekStudents.textContent =
        dashboardState.students;

    }

    if(weekCourses){

        weekCourses.textContent =
        dashboardState.courses;

    }

    if(weekCertificates){

        weekCertificates.textContent =
        dashboardState.certificates;

    }

    if(weekRevenue){

        weekRevenue.textContent =

            "KES " +

            dashboardState.revenue.toLocaleString();

    }

}

/* ==========================================
   DATE FORMATTER
========================================== */

function formatDate(timestamp){

    if(!timestamp) return "Just now";

    return timestamp
        .toDate()
        .toLocaleString(
            "en-KE",
            {

                dateStyle:"medium",

                timeStyle:"short"

            }

        );

}
/* ==========================================
   SIDEBAR
========================================== */

function initializeSidebar(){

    if(menuToggle){

        menuToggle.addEventListener(
            "click",
            toggleSidebar
        );

    }

    if(sidebarOverlay){

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }

}

function toggleSidebar(){

    sidebar.classList.toggle("open");

    sidebarOverlay.classList.toggle("show");

}

function closeSidebar(){

    sidebar.classList.remove("open");

    sidebarOverlay.classList.remove("show");

}

/* ==========================================
   PROFILE MENU
========================================== */

function initializeProfileMenu(){

    if(!profileBtn || !profileMenu) return;

    profileBtn.addEventListener(
        "click",
        (e)=>{

            e.stopPropagation();

            profileMenu.classList.toggle("show");

        }
    );

    document.addEventListener(
        "click",
        ()=>{

            profileMenu.classList.remove("show");

        }
    );

}

/* ==========================================
   NOTIFICATIONS
========================================== */

function initializeNotifications(){

    if(notificationBtn){

        notificationBtn.addEventListener(
            "click",
            ()=>{

                notificationDrawer.classList.add("open");

            }
        );

    }

    if(closeNotificationDrawer){

        closeNotificationDrawer.addEventListener(
            "click",
            ()=>{

                notificationDrawer.classList.remove("open");

            }
        );

    }

}

/* ==========================================
   GLOBAL SEARCH
========================================== */

function initializeSearch(){

    if(!dashboardSearch) return;

    dashboardSearch.addEventListener(
        "input",
        (e)=>{

            const keyword =
            e.target.value
            .trim()
            .toLowerCase();

            console.log(
                "Searching:",
                keyword
            );

        }
    );

}

/* ==========================================
   LOGOUT
========================================== */

function initializeLogout(){

    if(!confirmLogoutBtn) return;

    confirmLogoutBtn.addEventListener(
        "click",
        logoutFounder
    );

    if(cancelLogoutBtn){

        cancelLogoutBtn.addEventListener(
            "click",
            ()=>{

                logoutModal.classList.remove("show");

            }
        );

    }

}

async function logoutFounder(){

    try{

        loadingOverlay.classList.add("show");

        await signOut(auth);

        location.href =
        "../../login.html";

    }

    catch(error){

        console.error(error);

        showToast(
            "Logout failed",
            "error"
        );

    }

}
/* ==========================================
   TOAST NOTIFICATIONS
========================================== */

function showToast(

    message,

    type="success"

){

    if(!toastContainer) return;

    const toast =
    document.createElement("div");

    toast.className =
    `toast ${type}`;

    toast.innerHTML = `

        <span>${message}</span>

    `;

    toastContainer.appendChild(toast);

    setTimeout(()=>{

        toast.style.opacity="0";

        toast.style.transform=
        "translateX(30px)";

        setTimeout(()=>{

            toast.remove();

        },300);

    },3000);

}

/* ==========================================
   LOADING OVERLAY
========================================== */

function showLoader(){

    if(loadingOverlay){

        loadingOverlay.classList.add("show");

    }

}

function hideLoader(){

    if(loadingOverlay){

        loadingOverlay.classList.remove("show");

    }

}

/* ==========================================
   DEBOUNCE
========================================== */

function debounce(

    callback,

    delay=300

){

    let timer;

    return(...args)=>{

        clearTimeout(timer);

        timer=setTimeout(()=>{

            callback(...args);

        },delay);

    };

}

/* ==========================================
   NUMBER FORMATTER
========================================== */

function formatNumber(number){

    return Number(number)
    .toLocaleString("en-KE");

}

/* ==========================================
   CURRENCY FORMATTER
========================================== */

function formatCurrency(amount){

    return "KES " +

    Number(amount)
    .toLocaleString("en-KE");

}

/* ==========================================
   CLEANUP
========================================== */

window.addEventListener(

    "beforeunload",

    ()=>{

        console.log(

            "Dashboard closed."

        );

    }

);

/* ==========================================
   DASHBOARD READY
========================================== */

console.log(

    "✅ Spark Stack Founder Dashboard Ready"

);