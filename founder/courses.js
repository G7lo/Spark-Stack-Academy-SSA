/* ==========================================
   SPARK STACK ACADEMY
   COURSES PAGE
========================================== */

import { auth, db } from "../../js/firebase.js";

import {

    collection,
    onSnapshot,
    query,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ==========================================
   COLLECTION
========================================== */

const coursesRef =
collection(db,"courses");

/* ==========================================
   DOM ELEMENTS
========================================== */

const coursesGrid =
document.getElementById("coursesGrid");

const loadingGrid =
document.getElementById("loadingGrid");

const emptyState =
document.getElementById("emptyState");

const searchInput =
document.getElementById("courseSearch");

const categoryFilter =
document.getElementById("categoryFilter");

const statusFilter =
document.getElementById("statusFilter");

const courseDrawer =
document.getElementById("courseDrawer");

const drawerContent =
document.getElementById("drawerContent");

const closeDrawer =
document.getElementById("closeDrawer");

/* ==========================================
   DASHBOARD STATS
========================================== */

const totalCourses =
document.getElementById("totalCourses");

const publishedCourses =
document.getElementById("publishedCourses");

const draftCourses =
document.getElementById("draftCourses");

const archivedCourses =
document.getElementById("archivedCourses");

const totalStudents =
document.getElementById("totalStudents");

const totalRevenue =
document.getElementById("totalRevenue");

/* ==========================================
   GLOBAL STATE
========================================== */

let courses = [];

let filteredCourses = [];

let instructors = [];
/* ==========================================
   AUTHENTICATION
========================================== */

onAuthStateChanged(

    auth,

    (user)=>{

        if(!user){

            location.href =
            "../../login.html";

            return;

        }

        initializePage();

    }

);

/* ==========================================
   INITIALIZE PAGE
========================================== */

function initializePage(){

    initializeRealtimeCourses();

    loadInstructors();

    initializeEventListeners();

    console.log(

        "✅ Courses page initialized"

    );

}

/* ==========================================
   REALTIME COURSES
========================================== */

function initializeRealtimeCourses(){

    const q = query(

        coursesRef,

        orderBy(

            "createdAt",

            "desc"

        )

    );

    onSnapshot(

        q,

        (snapshot)=>{

            courses = [];

            snapshot.forEach(

                (doc)=>{

                    courses.push({

                        id:doc.id,

                        ...doc.data()

                    });

                }

            );

            filteredCourses = [

                ...courses

            ];

            populateCategoryFilter();

            renderCourses();

            updateStatistics();

            hideLoading();

        },

        (error)=>{

            console.error(

                "Course Load Error:",

                error

            );

            hideLoading();

        }

    );

}

/* ==========================================
   LOADING
========================================== */

function hideLoading(){

    loadingGrid.style.display = "none";

}

/* ==========================================
   EMPTY STATE
========================================== */

function toggleEmptyState(){

    if(filteredCourses.length === 0){

        emptyState.style.display = "flex";

        coursesGrid.style.display = "none";

    }

    else{

        emptyState.style.display = "none";

        coursesGrid.style.display = "grid";

    }

}
/* ==========================================
   RENDER COURSES
========================================== */

function renderCourses(){

    toggleEmptyState();

    coursesGrid.innerHTML = "";

    filteredCourses.forEach(

        (course)=>{

            coursesGrid.innerHTML +=

            createCourseCard(course);

        }

    );

}

/* ==========================================
   CREATE COURSE CARD
========================================== */

function createCourseCard(course){

    const thumbnail =

        course.thumbnail ||

        "../../assets/images/course-placeholder.jpg";

    const tutor =

        course.tutorName ||

        "Unassigned";

    const students =

        course.totalStudents || 0;

    const lessons =

        course.lessonCount || 0;

    const revenue =

        course.revenue || 0;

    const rating =

        course.rating || 0;

    const category =

        course.category || "General";

    const price =

        course.price || "Free";

    return `

<article class="course-card">

    <div class="course-thumbnail">

        <img src="${thumbnail}"

             alt="${course.title}">

        <span class="course-status ${course.status}">

            ${capitalize(course.status)}

        </span>

        <button class="course-menu-btn"

                onclick="toggleCourseMenu('${course.id}')">

            <i class="fas fa-ellipsis-vertical"></i>

        </button>

        <div class="course-menu"

             id="menu-${course.id}">

            <button class="menu-item"

                onclick="viewCourse('${course.id}')">

                <i class="fas fa-eye"></i>

                View Details

            </button>

            <button class="menu-item"

                onclick="featureCourse('${course.id}')">

                <i class="fas fa-star"></i>

                Feature Course

            </button>

            <button class="menu-item"

                onclick="setCourseStatus('${course.id}','${course.status === "published" ? "draft" : "published"}')">

                <i class="fas fa-power-off"></i>

                ${course.status === "published" ? "Unpublish" : "Publish"}

            </button>

            <button class="menu-item warning"

                onclick="archiveCourse('${course.id}')">

                <i class="fas fa-box-archive"></i>

                Archive

            </button>

        </div>

    </div>

    <div class="course-content">

        <div class="course-category">

            <span>

                ${category}

            </span>

            <strong>

                ⭐ ${rating}

            </strong>

        </div>

        <h3>

            ${course.title}

        </h3>

        <p class="course-description">

            ${course.description || "No description available."}

        </p>

        <div class="course-tutor">

            <div class="tutor-avatar">

                ${getInitials(tutor)}

            </div>

            <div>

                <strong>

                    ${tutor}

                </strong>

                <small>

                    Course Tutor

                </small>

            </div>

        </div>

        <div class="course-stats">

            <div>

                <i class="fas fa-users"></i>

                <span>

                    ${students} Students

                </span>

            </div>

            <div>

                <i class="fas fa-book-open"></i>

                <span>

                    ${lessons} Lessons

                </span>

            </div>

            <div>

                <i class="fas fa-dollar-sign"></i>

                <span>

                    $${revenue}

                </span>

            </div>

        </div>

        <div class="course-footer">

            <div class="course-price">

                ${price}

            </div>

            <button class="view-course-btn"

                onclick="viewCourse('${course.id}')">

                View Course

            </button>

        </div>

    </div>

</article>

`;

}
/* ==========================================
   GET INITIALS
========================================== */

function getInitials(name){

    if(!name) return "?";

    return name

        .trim()

        .split(" ")

        .map(word=>word.charAt(0).toUpperCase())

        .slice(0,2)

        .join("");

}

/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(text){

    if(!text) return "";

    return text.charAt(0).toUpperCase() +

           text.slice(1);

}

/* ==========================================
   UPDATE DASHBOARD STATISTICS
========================================== */

function updateStatistics(){

    totalCourses.textContent =

        courses.length;

    publishedCourses.textContent =

        courses.filter(

            course=>course.status==="published"

        ).length;

    draftCourses.textContent =

        courses.filter(

            course=>course.status==="draft"

        ).length;

    archivedCourses.textContent =

        courses.filter(

            course=>course.status==="archived"

        ).length;

    totalStudents.textContent =

        courses.reduce(

            (total,course)=>

                total+(course.totalStudents||0),

            0

        );

    const revenue =

        courses.reduce(

            (total,course)=>

                total+(course.revenue||0),

            0

        );

    totalRevenue.textContent =

        "$" + revenue.toLocaleString();

}

/* ==========================================
   POPULATE CATEGORY FILTER
========================================== */

function populateCategoryFilter(){

    const categories =

        [

            ...new Set(

                courses.map(

                    course=>course.category

                )

            )

        ].filter(Boolean);

    categoryFilter.innerHTML =

    `

        <option value="all">

            All Categories

        </option>

    `;

    categories.forEach(category=>{

        categoryFilter.innerHTML +=

        `

            <option value="${category}">

                ${category}

            </option>

        `;

    });

}
/* ==========================================
   EVENT LISTENERS
========================================== */

function initializeEventListeners(){

    searchInput.addEventListener(

        "input",

        filterCourses

    );

    categoryFilter.addEventListener(

        "change",

        filterCourses

    );

    statusFilter.addEventListener(

        "change",

        filterCourses

    );

    closeDrawer.addEventListener(

        "click",

        ()=>{

            courseDrawer.classList.remove("open");

        }

    );

    document.addEventListener(

        "click",

        closeMenus

    );

}

/* ==========================================
   FILTER COURSES
========================================== */

function filterCourses(){

    const search =

        searchInput.value

        .trim()

        .toLowerCase();

    const category =

        categoryFilter.value;

    const status =

        statusFilter.value;

    filteredCourses = courses.filter(

        (course)=>{

            const matchesSearch =

                course.title
                ?.toLowerCase()
                .includes(search)

                ||

                course.description
                ?.toLowerCase()
                .includes(search)

                ||

                course.tutorName
                ?.toLowerCase()
                .includes(search);

            const matchesCategory =

                category==="all"

                ||

                course.category===category;

            const matchesStatus =

                status==="all"

                ||

                course.status===status;

            return(

                matchesSearch &&

                matchesCategory &&

                matchesStatus

            );

        }

    );

    renderCourses();

    updateStatistics();

}

/* ==========================================
   COURSE MENU
========================================== */

window.toggleCourseMenu = function(courseId){

    event.stopPropagation();

    document.querySelectorAll(".course-menu")

    .forEach(menu=>{

        if(menu.id !== `menu-${courseId}`){

            menu.style.display = "none";

        }

    });

    const menu =

    document.getElementById(`menu-${courseId}`);

    if(!menu) return;

    menu.style.display =

        menu.style.display==="flex"

        ? "none"

        : "flex";

};

function closeMenus(){

    document.querySelectorAll(".course-menu")

    .forEach(menu=>{

        menu.style.display="none";

    });

}
/* ==========================================
   COURSE DRAWER
========================================== */

window.viewCourse = function(courseId){

    const course = courses.find(

        c => c.id === courseId

    );

    if(!course) return;

    drawerContent.innerHTML = `

    <div class="drawer-profile">

        <img
            class="drawer-cover"
            src="${course.thumbnail || '../../assets/images/course-placeholder.jpg'}"
            alt="${course.title}">

        <h2 class="drawer-title">

            ${course.title}

        </h2>

        <p class="drawer-description">

            ${course.description || "No description available."}

        </p>

        <div class="drawer-meta">

            <div class="meta-card">

                <span>Category</span>

                <strong>

                    ${course.category || "General"}

                </strong>

            </div>

            <div class="meta-card">

                <span>Status</span>

                <strong>

                    ${capitalize(course.status)}

                </strong>

            </div>

            <div class="meta-card">

                <span>Students</span>

                <strong>

                    ${course.totalStudents || 0}

                </strong>

            </div>

            <div class="meta-card">

                <span>Lessons</span>

                <strong>

                    ${course.lessonCount || 0}

                </strong>

            </div>

            <div class="meta-card">

                <span>Rating</span>

                <strong>

                    ⭐ ${course.rating || 0}

                </strong>

            </div>

            <div class="meta-card">

                <span>Revenue</span>

                <strong>

                    $${(course.revenue || 0).toLocaleString()}

                </strong>

            </div>

        </div>

        <div class="drawer-tutor">

            <div class="tutor-avatar">

                ${getInitials(course.tutorName || "Tutor")}

            </div>

            <div>

                <h4>

                    ${course.tutorName || "Unassigned"}

                </h4>

                <p>

                    Course Tutor

                </p>

            </div>

        </div>

        <div class="drawer-actions">

            <label class="drawer-instructor-control">

                <span>Assigned instructor</span>

                <select id="courseInstructorSelect">

                    <option value="">Unassigned</option>

                    ${instructors.map(instructor=>`<option value="${instructor.id}" ${course.instructorId === instructor.id ? "selected" : ""}>${instructor.name || instructor.email || "Instructor"}</option>`).join("")}

                </select>

            </label>

            <button class="secondary-btn"

                onclick="assignCourseInstructor('${course.id}')">

                <i class="fas fa-user-check"></i>

                Save Instructor

            </button>

            <button class="secondary-btn"

                onclick="setCourseStatus('${course.id}','${course.status === "published" ? "draft" : "published"}')">

                <i class="fas fa-power-off"></i>

                ${course.status === "published" ? "Unpublish" : "Publish"}

            </button>

            <button class="primary-btn"

                onclick="featureCourse('${course.id}')">

                <i class="fas fa-star"></i>

                Feature Course

            </button>

            <button class="warning-btn"

                onclick="archiveCourse('${course.id}')">

                <i class="fas fa-box-archive"></i>

                Archive

            </button>

        </div>

    </div>

    `;

    courseDrawer.classList.add("open");

};

/* ==========================================
   FEATURE COURSE
========================================== */

window.featureCourse = async function(courseId){

    try{

        await updateDoc(

            doc(db,"courses",courseId),

            {

                featured:true

            }

        );

    }

    catch(error){

        console.error(

            "Feature Error:",

            error

        );

    }

};

/* ==========================================
   ARCHIVE COURSE
========================================== */

window.archiveCourse = async function(courseId){

    const confirmed = confirm(

        "Archive this course?"

    );

    if(!confirmed) return;

    try{

        await updateDoc(

            doc(db,"courses",courseId),

            {

                status:"archived"

            }

        );

    }

    catch(error){

        console.error(

            "Archive Error:",

            error

        );

    }

};

/* ==========================================
   COURSE LIFECYCLE & INSTRUCTOR ASSIGNMENT
========================================== */

window.setCourseStatus = async function(courseId,status){

    try{

        await updateDoc(
            doc(db,"courses",courseId),
            {status,updatedAt:serverTimestamp()}
        );

        courseDrawer.classList.remove("open");

    }catch(error){

        console.error("Course status update failed:",error);
        alert("Unable to update this course status.");

    }

};

window.assignCourseInstructor = async function(courseId){

    const select = document.getElementById("courseInstructorSelect");

    if(!select) return;

    const instructor = instructors.find(item=>item.id === select.value);

    try{

        await updateDoc(
            doc(db,"courses",courseId),
            {
                instructorId:instructor?.id || null,
                tutorName:instructor?.name || "Unassigned",
                updatedAt:serverTimestamp()
            }
        );

    }catch(error){

        console.error("Instructor assignment failed:",error);
        alert("Unable to assign this instructor.");

    }

};
/* ==========================================
   EXPORT REPORT
========================================== */

document

.getElementById("exportReport")

.addEventListener(

    "click",

    exportCoursesCSV

);

function exportCoursesCSV(){

    if(!courses.length){

        alert("No courses to export.");

        return;

    }

    let csv =

`Title,Category,Tutor,Students,Lessons,Revenue,Rating,Status
`;

    courses.forEach(course=>{

        csv +=

`${course.title},
${course.category || ""},
${course.tutorName || ""},
${course.totalStudents || 0},
${course.lessonCount || 0},
${course.revenue || 0},
${course.rating || 0},
${course.status}
`;

    });

    const blob =

    new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url =

    URL.createObjectURL(blob);

    const a =

    document.createElement("a");

    a.href = url;

    a.download =

    "courses-report.csv";

    a.click();

    URL.revokeObjectURL(url);

}

/* ==========================================
   CHARTS
========================================== */

let categoryChart;

let revenueChart;

function initializeCharts(){

    const categoryCanvas =

    document.getElementById("categoryChart");

    const revenueCanvas =

    document.getElementById("courseRevenueChart");

    if(

        !categoryCanvas ||

        !revenueCanvas ||

        typeof Chart==="undefined"

    ) return;

    if(categoryChart)

        categoryChart.destroy();

    if(revenueChart)

        revenueChart.destroy();

    const categories={};

    courses.forEach(course=>{

        const category=

        course.category ||

        "General";

        categories[category]=

        (categories[category]||0)+1;

    });

    categoryChart =

    new Chart(

        categoryCanvas,

        {

            type:"doughnut",

            data:{

                labels:Object.keys(categories),

                datasets:[{

                    data:Object.values(categories)

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false

            }

        }

    );

    revenueChart =

    new Chart(

        revenueCanvas,

        {

            type:"bar",

            data:{

                labels:

                courses.map(

                    course=>course.title

                ),

                datasets:[{

                    label:"Revenue",

                    data:

                    courses.map(

                        course=>

                        course.revenue||0

                    )

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false

            }

        }

    );

}

/* ==========================================
   UPDATE CHARTS
========================================== */

function refreshDashboard(){

    renderCourses();

    updateStatistics();

    initializeCharts();

    hideLoading();

}

async function loadInstructors(){

    try{

        const snapshot = await getDocs(collection(db,"instructors"));

        instructors = snapshot.docs
        .map(entry=>({id:entry.id,...entry.data()}))
        .filter(instructor=>instructor.status !== "suspended");

    }catch(error){

        console.error("Instructor Load Error:",error);

    }

}
