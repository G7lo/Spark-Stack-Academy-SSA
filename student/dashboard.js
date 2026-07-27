import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===========================
ELEMENTS
=========================== */

const studentName =
document.getElementById("studentName");

const studentFullName =
document.getElementById("studentFullName");

const studentEmail =
document.getElementById("studentEmail");

const studentAdmission =
document.getElementById("studentAdmission");

const studentAvatar =
document.getElementById("studentAvatar");

const todayDate =
document.getElementById("todayDate");

const learningStreak =
document.getElementById("learningStreak");

const courseCount =
document.getElementById("courseCount");

const lessonCount =
document.getElementById("lessonCount");

const progressPercent =
document.getElementById("progressPercent");

const certificateCount =
document.getElementById("certificateCount");

const continueCourse =
document.getElementById("continueCourse");

const recentLessons =
document.getElementById("recentLessons");

const progressContainer =
document.getElementById("progressContainer");

const recommendedCourses =
document.getElementById("recommendedCourses");

const dashboardNotifications =
document.getElementById("dashboardNotifications");


/* ===========================
DATE
=========================== */

todayDate.textContent =
new Date().toLocaleDateString(
"en-US",
{
weekday:"long",
month:"long",
day:"numeric"
}
);


/* ===========================
AUTH & DASHBOARD
=========================== */

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location.href="../login.html";

return;

}

try{

const studentSnap =
await getDoc(
doc(db,"students",user.uid)
);

if(!studentSnap.exists()){

window.location.href="../login.html";

return;

}

const student =
studentSnap.data();


/* ===========================
PROFILE
=========================== */

studentName.textContent =
student.name || "Student";

studentFullName.textContent =
student.name || "Student";

studentEmail.textContent =
student.email || "";

studentAdmission.textContent =
`Admission No: ${
student.admissionNumber || "Pending"
}`;

studentAvatar.textContent =
(student.name || "S")
.charAt(0)
.toUpperCase();

learningStreak.textContent =
`${student.streak || 0} Day Streak`;


/* ===========================
QUICK STATS
=========================== */

const enrollmentQuery =
query(
collection(db,"enrollments"),
where("studentId","==",user.uid)
);

const enrollmentSnap =
await getDocs(enrollmentQuery);

courseCount.textContent =
enrollmentSnap.size;

let totalProgress = 0;
let completedLessons = 0;

enrollmentSnap.forEach(doc=>{

const enrollment =
doc.data();

const progress =
enrollment.progress || 0;

totalProgress += progress;

if(progress > 0){

completedLessons++;

}

});

const averageProgress =

enrollmentSnap.size

?

Math.round(
totalProgress /
enrollmentSnap.size
)

:

0;

progressPercent.textContent =
averageProgress + "%";

lessonCount.textContent =
completedLessons;


/* ===========================
CERTIFICATES
=========================== */

const certificateQuery =
query(
collection(db,"certificates"),
where("studentId","==",user.uid)
);

const certificateSnap =
await getDocs(certificateQuery);

certificateCount.textContent =
certificateSnap.size;


/* ===========================
LOAD DASHBOARD
=========================== */

await loadContinueLearning(user.uid);

await loadProgress(user.uid);

await loadRecentActivity(user.uid);

await loadRecommendedCourses();

await loadDashboardNotifications(user.uid);


if(typeof lucide !== "undefined"){

lucide.createIcons();

}

console.log("SSA Dashboard Ready 🚀");

}

catch(error){

console.error(
"Dashboard Error:",
error
);

}

});
/* ===========================
CONTINUE LEARNING
=========================== */

async function loadContinueLearning(userId){

continueCourse.innerHTML = "";

const enrollmentQuery =
query(
collection(db,"enrollments"),
where("studentId","==",userId)
);

const enrollmentSnap =
await getDocs(enrollmentQuery);

if(enrollmentSnap.empty){

continueCourse.innerHTML = `

<div class="empty-card">

No enrolled courses yet 🚀

</div>

`;

return;

}

const enrollment =
enrollmentSnap.docs[0].data();

const courseSnap =
await getDoc(
doc(db,"courses",enrollment.courseId)
);

if(!courseSnap.exists()){

continueCourse.innerHTML = `

<div class="empty-card">

Course unavailable.

</div>

`;

return;

}

const course =
courseSnap.data();

continueCourse.innerHTML = `

<div class="continue-left">

<h3>

${course.title}

</h3>

<p>

${enrollment.progress || 0}% Complete

</p>

</div>

<a
class="continue-btn"
href="course-player.html?id=${enrollment.courseId}">

Continue Learning

</a>

`;

}





/* ===========================
COURSE PROGRESS
=========================== */

async function loadProgress(userId){

progressContainer.innerHTML = "";

const enrollmentQuery =
query(
collection(db,"enrollments"),
where("studentId","==",userId)
);

const enrollmentSnap =
await getDocs(enrollmentQuery);

if(enrollmentSnap.empty){

progressContainer.innerHTML = `

<div class="empty-card">

No progress yet.

</div>

`;

return;

}

for(const enrollmentDoc of enrollmentSnap.docs){

const enrollment =
enrollmentDoc.data();

const courseSnap =
await getDoc(
doc(db,"courses",enrollment.courseId)
);

if(!courseSnap.exists()) continue;

const course =
courseSnap.data();

progressContainer.innerHTML += `

<div class="progress-card">

<div class="progress-header">

<h3>

${course.title}

</h3>

<span>

${enrollment.progress || 0}%

</span>

</div>

<div class="progress-bar">

<div
class="progress-fill"
style="width:${enrollment.progress || 0}%">

</div>

</div>

</div>

`;

}

}





/* ===========================
RECENT ACTIVITY
=========================== */

async function loadRecentActivity(userId){

recentLessons.innerHTML = "";

const enrollmentQuery =
query(
collection(db,"enrollments"),
where("studentId","==",userId)
);

const enrollmentSnap =
await getDocs(enrollmentQuery);

if(enrollmentSnap.empty){

recentLessons.innerHTML = `

<div class="empty-card">

No activity yet.

</div>

`;

return;

}

for(const enrollmentDoc of enrollmentSnap.docs){

const enrollment =
enrollmentDoc.data();

const courseSnap =
await getDoc(
doc(db,"courses",enrollment.courseId)
);

if(!courseSnap.exists()) continue;

const course =
courseSnap.data();

recentLessons.innerHTML += `

<div class="activity-card">

<div class="activity-icon">

📚

</div>

<div class="activity-content">

<h4>

${course.title}

</h4>

<p>

Current Progress:
${enrollment.progress || 0}%

</p>

</div>

</div>

`;

}

}
/* ===========================
RECOMMENDED COURSES
=========================== */

async function loadRecommendedCourses(){

recommendedCourses.innerHTML = "";

const coursesSnap =
await getDocs(
collection(db,"courses")
);

if(coursesSnap.empty){

recommendedCourses.innerHTML = `

<div class="empty-card">

No courses available yet 🚀

</div>

`;

return;

}

coursesSnap.forEach(courseDoc=>{

const course =
courseDoc.data();

recommendedCourses.innerHTML += `

<div class="course-card">

<h3>

${course.title}

</h3>

<p>

${course.description || "Start learning today."}

</p>

<a
class="course-btn"
href="course-details.html?id=${courseDoc.id}">

View Course

</a>

</div>

`;

});

}





/* ===========================
DASHBOARD NOTIFICATIONS
=========================== */

async function loadDashboardNotifications(userId){

dashboardNotifications.innerHTML = "";

const notificationQuery =
query(
collection(db,"notifications"),
where("userId","==",userId)
);

const notificationSnap =
await getDocs(notificationQuery);

if(notificationSnap.empty){

dashboardNotifications.innerHTML = `

<div class="empty-card">

No new notifications 🔔

</div>

`;

return;

}

notificationSnap.forEach(notificationDoc=>{

const notification =
notificationDoc.data();

dashboardNotifications.innerHTML += `

<div class="notification-card">

<div class="notification-icon">

🔔

</div>

<div class="notification-content">

<h4>

${notification.title || "Notification"}

</h4>

<p>

${notification.message || ""}

</p>

</div>

</div>

`;

});

}