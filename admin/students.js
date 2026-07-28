import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tableBody =
  document.getElementById("studentsTableBody");

const searchInput =
  document.getElementById("searchInput");

let studentsData = [];


// ===========================
// LOAD STUDENTS
// ===========================

async function loadStudents() {

  tableBody.innerHTML = `
    <tr>
      <td colspan="6"
          class="loading-row">
          Loading students...
      </td>
    </tr>
  `;

  try {

    const snapshot = await getDocs(
      collection(db, "students")
    );

    studentsData = [];

    snapshot.forEach(docSnap => {

      studentsData.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    renderStudents(studentsData);

  } catch (error) {

    console.error(error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="loading-row">
            Failed to load students.
        </td>
      </tr>
    `;
  }
}


// ===========================
// RENDER TABLE
// ===========================

function renderStudents(students) {

  if (!students.length) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="loading-row">
            No students found.
        </td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML = students.map(student => {

    const name =
      student.name ||
      student.fullName ||
      "Unknown Student";

    const email =
      student.email || "No email";

    const admissionNo =
      student.admissionNo || "N/A";

    const course =
      student.course ||
      student.program ||
      "Not assigned";

    const status =
      (student.status || "active")
      .toLowerCase();

    const initials = name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return `
      <tr>

        <td>
          <div class="student-info">

            <div class="student-avatar">
              ${initials}
            </div>

            <div>
              <div class="student-name">
                ${name}
              </div>

              <div class="student-meta">
                Registered Student
              </div>
            </div>

          </div>
        </td>

        <td>${admissionNo}</td>

        <td>${email}</td>

        <td>${course}</td>

        <td>
          <span class="status ${status}">
            ${status}
          </span>
        </td>

        <td>
          <div class="actions">

            <button class="view-btn"
              data-id="${student.id}">
              View
            </button>

            <button class="edit-btn"
              data-id="${student.id}">
              Edit
            </button>

            <button class="suspend-btn"
              data-id="${student.id}"
              data-status="${status}">

              ${status === "suspended"
                ? "Activate"
                : "Suspend"}

            </button>

          </div>
        </td>

      </tr>
    `;
  }).join("");
}


// ===========================
// SEARCH
// ===========================

searchInput.addEventListener("input", e => {

  const term =
    e.target.value.toLowerCase();

  const filtered = studentsData.filter(student => {

    const name =
      (student.name ||
       student.fullName || "")
      .toLowerCase();

    const email =
      (student.email || "")
      .toLowerCase();

    const admissionNo =
      (student.admissionNo || "")
      .toLowerCase();

    return name.includes(term) ||
           email.includes(term) ||
           admissionNo.includes(term);
  });

  renderStudents(filtered);
});


// ===========================
// ACTIONS
// ===========================

tableBody.addEventListener("click", async e => {

  const btn = e.target;

  // Suspend / Activate
  if (btn.classList.contains("suspend-btn")) {

    const id = btn.dataset.id;

    const currentStatus =
      btn.dataset.status;

    const newStatus =
      currentStatus === "suspended"
        ? "active"
        : "suspended";

    try {

      await updateDoc(
        doc(db, "students", id),
        { status: newStatus }
      );

      loadStudents();

    } catch (error) {

      console.error(error);

      alert("Failed to update status");
    }
  }

  // View
  if (btn.classList.contains("view-btn")) {

    alert("Student profile view coming next 🚀");
  }

  // Edit
  if (btn.classList.contains("edit-btn")) {

    alert("Student edit form coming next ✨");
  }
});


// ===========================
// INIT
// ===========================

loadStudents();