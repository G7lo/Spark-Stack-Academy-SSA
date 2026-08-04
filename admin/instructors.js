import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tableBody =
  document.getElementById("instructorsTableBody");

const searchInput =
  document.getElementById("searchInput");

const modal =
  document.getElementById("instructorModal");

const modalTitle =
  document.getElementById("modalTitle");

const modalBody =
  document.getElementById("modalBody");

let instructorsData = [];


// ===========================
// LOAD INSTRUCTORS
// ===========================

async function loadInstructors() {

  tableBody.innerHTML = `
    <tr>
      <td colspan="6"
          class="loading-row">
          Loading instructors...
      </td>
    </tr>
  `;

  try {

    const snapshot = await getDocs(
      collection(db, "instructors")
    );

    instructorsData = [];

    snapshot.forEach(docSnap => {

      instructorsData.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    renderInstructors(instructorsData);

  } catch (error) {

    console.error(error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="loading-row">
            Failed to load instructors.
        </td>
      </tr>
    `;
  }
}


// ===========================
// RENDER TABLE
// ===========================

function renderInstructors(instructors) {

  if (!instructors.length) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="loading-row">
            No instructors found.
        </td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML = instructors.map(instructor => {

    const name =
      instructor.name ||
      instructor.fullName ||
      "Unknown Instructor";

    const email =
      instructor.email || "No email";

    const expertise =
      instructor.expertise ||
      "General Instructor";

    const totalCourses =
      instructor.totalCourses || 0;

    const status =
      (instructor.status || "active")
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
                SSA Instructor
              </div>
            </div>

          </div>
        </td>

        <td>${expertise}</td>

        <td>${email}</td>

        <td>${totalCourses}</td>

        <td>
          <span class="status ${status}">
            ${status}
          </span>
        </td>

        <td>
          <div class="actions">

            <button class="view-btn"
              data-id="${instructor.id}">
              View
            </button>

            <button class="edit-btn"
              data-id="${instructor.id}">
              Edit
            </button>

            <button class="suspend-btn"
              data-id="${instructor.id}"
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

  const filtered = instructorsData.filter(instructor => {

    const name =
      (instructor.name ||
       instructor.fullName || "")
      .toLowerCase();

    const email =
      (instructor.email || "")
      .toLowerCase();

    const expertise =
      (instructor.expertise || "")
      .toLowerCase();

    return name.includes(term) ||
           email.includes(term) ||
           expertise.includes(term);
  });

  renderInstructors(filtered);
});


// ===========================
// CLOSE MODAL
// ===========================

document.getElementById("closeModal")
  .addEventListener("click", () => {

    modal.classList.remove("show");

  });


// ===========================
// ACTIONS
// ===========================

tableBody.addEventListener("click", async e => {

  const btn = e.target;

  // ===========================
  // SUSPEND / ACTIVATE
  // ===========================

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
        doc(db, "instructors", id),
        { status: newStatus }
      );

      loadInstructors();

    } catch (error) {

      console.error(error);

      alert("Failed to update instructor status");
    }
  }


  // ===========================
  // VIEW INSTRUCTOR
  // ===========================

  if (btn.classList.contains("view-btn")) {

    const instructor = instructorsData.find(
      i => i.id === btn.dataset.id
    );

    modalTitle.textContent =
      "Instructor Details";

    modalBody.innerHTML = `
      <div class="detail-row">
        <strong>Full Name</strong>
        ${instructor.name || instructor.fullName || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Email</strong>
        ${instructor.email || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Expertise</strong>
        ${instructor.expertise || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Courses Taught</strong>
        ${instructor.totalCourses || 0}
      </div>

      <div class="detail-row">
        <strong>Students</strong>
        ${instructor.totalStudents || 0}
      </div>

      <div class="detail-row">
        <strong>Rating</strong>
        ⭐ ${instructor.rating || 0}
      </div>

      <div class="detail-row">
        <strong>Status</strong>
        ${instructor.status || "active"}
      </div>
    `;

    modal.classList.add("show");
  }


  // ===========================
  // EDIT INSTRUCTOR
  // ===========================

  if (btn.classList.contains("edit-btn")) {

    const instructor = instructorsData.find(
      i => i.id === btn.dataset.id
    );

    modalTitle.textContent =
      "Edit Instructor";

    modalBody.innerHTML = `
      <form class="edit-form"
        id="editInstructorForm">

        <input type="text"
          id="editName"
          value="${instructor.name || instructor.fullName || ""}"
          placeholder="Instructor name">

        <input type="email"
          id="editEmail"
          value="${instructor.email || ""}"
          placeholder="Email address">

        <input type="text"
          id="editExpertise"
          value="${instructor.expertise || ""}"
          placeholder="Expertise">

        <input type="number"
          id="editCourses"
          value="${instructor.totalCourses || 0}"
          placeholder="Total courses">

        <select id="editStatus">

          <option value="active"
            ${instructor.status === "active" ? "selected" : ""}>
            Active
          </option>

          <option value="pending"
            ${instructor.status === "pending" ? "selected" : ""}>
            Pending
          </option>

          <option value="suspended"
            ${instructor.status === "suspended" ? "selected" : ""}>
            Suspended
          </option>

        </select>

        <button type="submit"
          class="save-btn">

          Save Changes

        </button>

      </form>
    `;

    modal.classList.add("show");

    document.getElementById("editInstructorForm")
      .addEventListener("submit", async ev => {

        ev.preventDefault();

        await updateDoc(
          doc(db, "instructors", instructor.id),
          {
            name:
              document.getElementById("editName").value,

            email:
              document.getElementById("editEmail").value,

            expertise:
              document.getElementById("editExpertise").value,

            totalCourses:
              Number(
                document.getElementById("editCourses").value
              ),

            status:
              document.getElementById("editStatus").value
          }
        );

        modal.classList.remove("show");

        loadInstructors();
      });
  }
});


// ===========================
// INIT
// ===========================

loadInstructors();