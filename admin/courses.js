import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const tableBody =
  document.getElementById("coursesTableBody");

const searchInput =
  document.getElementById("searchInput");

const modal =
  document.getElementById("courseModal");

const modalTitle =
  document.getElementById("modalTitle");

const modalBody =
  document.getElementById("modalBody");

const addCourseBtn =
  document.getElementById("addCourseBtn");

let coursesData = [];
let enrollmentsData = [];


// ===========================
// LOAD DATA
// ===========================

async function loadCourses() {

  tableBody.innerHTML = `
    <tr>
      <td colspan="6"
          class="loading-row">
          Loading courses...
      </td>
    </tr>
  `;

  try {

    const [coursesSnap, enrollmentsSnap] =
      await Promise.all([
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "enrollments"))
      ]);

    coursesData = [];
    enrollmentsData = [];

    coursesSnap.forEach(docSnap => {

      coursesData.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    enrollmentsSnap.forEach(docSnap => {

      enrollmentsData.push(docSnap.data());

    });

    updateStats();
    renderCourses(coursesData);

  } catch (error) {

    console.error(error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="loading-row">
            Failed to load courses.
        </td>
      </tr>
    `;
  }
}


// ===========================
// STATS
// ===========================

function updateStats() {

  const total = coursesData.length;

  const published = coursesData.filter(
    c => (c.status || "draft") === "published"
  ).length;

  const drafts = total - published;

  document.getElementById("totalCourses")
    .textContent = total;

  document.getElementById("publishedCourses")
    .textContent = published;

  document.getElementById("draftCourses")
    .textContent = drafts;

  document.getElementById("totalEnrollments")
    .textContent = enrollmentsData.length;
}


// ===========================
// RENDER TABLE
// ===========================

function renderCourses(courses) {

  if (!courses.length) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="loading-row">
            No courses found.
        </td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML = courses.map(course => {

    const title =
      course.title || "Untitled Course";

    const instructor =
      course.instructorName || "Not Assigned";

    const category =
      course.category || "General";

    const status =
      (course.status || "draft")
      .toLowerCase();

    const enrollments = enrollmentsData.filter(
      e => e.courseId === course.id
    ).length;

    const initials = title
      .split(" ")
      .map(w => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return `
      <tr>

        <td>
          <div class="course-info">

            <div class="course-thumb">
              ${initials}
            </div>

            <div>
              <div class="course-title">
                ${title}
              </div>

              <div class="course-meta">
                ${course.level || "Beginner"}
              </div>
            </div>

          </div>
        </td>

        <td>${instructor}</td>

        <td>${category}</td>

        <td>${enrollments}</td>

        <td>
          <span class="status ${status}">
            ${status}
          </span>
        </td>

        <td>
          <div class="actions">

            <button class="view-btn"
              data-id="${course.id}">
              View
            </button>

            <button class="edit-btn"
              data-id="${course.id}">
              Edit
            </button>

            <button class="suspend-btn"
              data-id="${course.id}"
              data-status="${status}">

              ${status === "published"
                ? "Draft"
                : "Publish"}

            </button>

            <button class="delete-btn"
              data-id="${course.id}">
              Delete
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

  const filtered = coursesData.filter(course => {

    const title =
      (course.title || "")
      .toLowerCase();

    const instructor =
      (course.instructorName || "")
      .toLowerCase();

    const category =
      (course.category || "")
      .toLowerCase();

    return title.includes(term) ||
           instructor.includes(term) ||
           category.includes(term);
  });

  renderCourses(filtered);
});


// ===========================
// CLOSE MODAL
// ===========================

document.getElementById("closeModal")
  .addEventListener("click", () => {

    modal.classList.remove("show");

  });


// ===========================
// CREATE COURSE
// ===========================

addCourseBtn.addEventListener("click", () => {

  modalTitle.textContent =
    "Create New Course";

  modalBody.innerHTML = `
    <form class="edit-form"
      id="createCourseForm">

      <input type="text"
        id="courseTitle"
        placeholder="Course title"
        required>

      <input type="text"
        id="courseInstructor"
        placeholder="Instructor name">

      <input type="text"
        id="courseCategory"
        placeholder="Category">

      <select id="courseLevel">
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
      </select>

      <button type="submit"
        class="save-btn">

        Create Course

      </button>

    </form>
  `;

  modal.classList.add("show");

  document.getElementById("createCourseForm")
    .addEventListener("submit", async ev => {

      ev.preventDefault();

      await addDoc(collection(db, "courses"), {
        title:
          document.getElementById("courseTitle").value,

        instructorName:
          document.getElementById("courseInstructor").value,

        category:
          document.getElementById("courseCategory").value,

        level:
          document.getElementById("courseLevel").value,

        status: "draft",
        createdAt: new Date().toISOString()
      });

      modal.classList.remove("show");

      loadCourses();
    });
});


// ===========================
// TABLE ACTIONS
// ===========================

tableBody.addEventListener("click", async e => {

  const btn = e.target;


  // VIEW

  if (btn.classList.contains("view-btn")) {

    const course = coursesData.find(
      c => c.id === btn.dataset.id
    );

    const enrollments = enrollmentsData.filter(
      e => e.courseId === course.id
    ).length;

    modalTitle.textContent =
      "Course Details";

    modalBody.innerHTML = `
      <div class="detail-row">
        <strong>Course Title</strong>
        ${course.title || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Instructor</strong>
        ${course.instructorName || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Category</strong>
        ${course.category || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Level</strong>
        ${course.level || "N/A"}
      </div>

      <div class="detail-row">
        <strong>Enrollments</strong>
        ${enrollments}
      </div>

      <div class="detail-row">
        <strong>Status</strong>
        ${course.status || "draft"}
      </div>
    `;

    modal.classList.add("show");
  }


  // EDIT

  if (btn.classList.contains("edit-btn")) {

    const course = coursesData.find(
      c => c.id === btn.dataset.id
    );

    modalTitle.textContent =
      "Edit Course";

    modalBody.innerHTML = `
      <form class="edit-form"
        id="editCourseForm">

        <input type="text"
          id="editTitle"
          value="${course.title || ""}"
          placeholder="Course title">

        <input type="text"
          id="editInstructor"
          value="${course.instructorName || ""}"
          placeholder="Instructor name">

        <input type="text"
          id="editCategory"
          value="${course.category || ""}"
          placeholder="Category">

        <select id="editLevel">
          <option value="Beginner"
            ${course.level === "Beginner" ? "selected" : ""}>
            Beginner
          </option>

          <option value="Intermediate"
            ${course.level === "Intermediate" ? "selected" : ""}>
            Intermediate
          </option>

          <option value="Advanced"
            ${course.level === "Advanced" ? "selected" : ""}>
            Advanced
          </option>
        </select>

        <button type="submit"
          class="save-btn">

          Save Changes

        </button>

      </form>
    `;

    modal.classList.add("show");

    document.getElementById("editCourseForm")
      .addEventListener("submit", async ev => {

        ev.preventDefault();

        await updateDoc(
          doc(db, "courses", course.id),
          {
            title:
              document.getElementById("editTitle").value,

            instructorName:
              document.getElementById("editInstructor").value,

            category:
              document.getElementById("editCategory").value,

            level:
              document.getElementById("editLevel").value
          }
        );

        modal.classList.remove("show");

        loadCourses();
      });
  }


  // PUBLISH / DRAFT

  if (btn.classList.contains("suspend-btn")) {

    const id = btn.dataset.id;

    const currentStatus =
      btn.dataset.status;

    const newStatus =
      currentStatus === "published"
        ? "draft"
        : "published";

    await updateDoc(
      doc(db, "courses", id),
      { status: newStatus }
    );

    loadCourses();
  }


  // DELETE

  if (btn.classList.contains("delete-btn")) {

    const confirmed = confirm(
      "Delete this course permanently?"
    );

    if (!confirmed) return;

    await deleteDoc(
      doc(db, "courses", btn.dataset.id)
    );

    loadCourses();
  }
});


// ===========================
// INIT
// ===========================

loadCourses();