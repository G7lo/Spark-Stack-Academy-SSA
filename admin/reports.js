import { db } from "../js/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ===========================
// LOAD REPORTS
// ===========================

async function loadReports() {

  try {

    const [
      studentsSnap,
      instructorsSnap,
      coursesSnap,
      enrollmentsSnap
    ] = await Promise.all([

      getDocs(collection(db, "students")),
      getDocs(collection(db, "instructors")),
      getDocs(collection(db, "courses")),
      getDocs(collection(db, "enrollments"))

    ]);

    const students =
      studentsSnap.docs.map(d => d.data());

    const instructors =
      instructorsSnap.docs.map(d => d.data());

    const courses =
      coursesSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    const enrollments =
      enrollmentsSnap.docs.map(d => d.data());


    // ===========================
    // MAIN STATS
    // ===========================

    document.getElementById("totalStudents")
      .textContent = students.length;

    document.getElementById("totalInstructors")
      .textContent = instructors.length;

    document.getElementById("totalCourses")
      .textContent = courses.length;

    document.getElementById("totalEnrollments")
      .textContent = enrollments.length;


    // ===========================
    // SECONDARY STATS
    // ===========================

    const published = courses.filter(
      c => (c.status || "draft") === "published"
    ).length;

    const drafts =
      courses.length - published;

    const activeInstructors = instructors.filter(
      i => (i.status || "active") === "active"
    ).length;

    const activeStudents = students.filter(
      s => (s.status || "active") === "active"
    ).length;

    document.getElementById("publishedCourses")
      .textContent = published;

    document.getElementById("draftCourses")
      .textContent = drafts;

    document.getElementById("activeInstructors")
      .textContent = activeInstructors;

    document.getElementById("activeStudents")
      .textContent = activeStudents;


    // ===========================
    // TOP COURSES
    // ===========================

    const courseStats = courses.map(course => {

      const count = enrollments.filter(
        e => e.courseId === course.id
      ).length;

      return {
        title:
          course.title || "Untitled Course",
        count
      };
    });

    courseStats.sort(
      (a, b) => b.count - a.count
    );

    const topCourses =
      courseStats.slice(0, 5);

    const topList =
      document.getElementById("topCoursesList");

    if (!topCourses.length) {

      topList.innerHTML =
        "<p>No course enrollments yet.</p>";

    } else {

      topList.innerHTML = topCourses.map(course => `
        <div class="top-item">
          <strong>${course.title}</strong>
          <span>${course.count} students</span>
        </div>
      `).join("");
    }

  } catch (error) {

    console.error(error);

    alert("Failed to load reports");
  }
}


// ===========================
// CSV EXPORT
// ===========================

function downloadCSV(filename, rows) {

  if (!rows.length) {

    alert("No data available to export");
    return;
  }

  const headers =
    Object.keys(rows[0]);

  const csv = [

    headers.join(","),

    ...rows.map(row =>
      headers.map(h =>
        `"${String(row[h] ?? "")
          .replace(/"/g, '""')}"`
      ).join(",")
    )

  ].join("\\n");

  const blob =
    new Blob([csv], { type: "text/csv" });

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


// ===========================
// EXPORT BUTTONS
// ===========================

document.getElementById("exportStudents")
  .addEventListener("click", async () => {

    const snap =
      await getDocs(collection(db, "students"));

    downloadCSV(
      "ssa-students.csv",
      snap.docs.map(d => d.data())
    );
  });


document.getElementById("exportCourses")
  .addEventListener("click", async () => {

    const snap =
      await getDocs(collection(db, "courses"));

    downloadCSV(
      "ssa-courses.csv",
      snap.docs.map(d => d.data())
    );
  });


document.getElementById("exportEnrollments")
  .addEventListener("click", async () => {

    const snap =
      await getDocs(collection(db, "enrollments"));

    downloadCSV(
      "ssa-enrollments.csv",
      snap.docs.map(d => d.data())
    );
  });


// ===========================
// INIT
// ===========================

loadReports();