import { db } from "../js/firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const form =
  document.getElementById("announcementForm");

const list =
  document.getElementById("announcementsList");


// ===========================
// LOAD ANNOUNCEMENTS
// ===========================

async function loadAnnouncements() {

  try {

    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

      list.innerHTML = `
        <p>No announcements published yet.</p>
      `;

      return;
    }

    list.innerHTML = snapshot.docs.map(docSnap => {

      const data = docSnap.data();

      const date =
        data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date();

      return `
        <div class="announcement-item">

          <div class="announcement-header">

            <div>

              <div class="announcement-title">
                ${data.title || "Untitled Announcement"}
              </div>

              <div class="announcement-meta">

                Audience: ${data.audience || "all"} •
                ${date.toLocaleString()}

              </div>

            </div>

            <span class="priority-badge ${data.priority || "normal"}">

              ${data.priority || "normal"}

            </span>

          </div>

          <div class="announcement-message">

            ${data.message || ""}

          </div>

        </div>
      `;

    }).join("");

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <p>Failed to load announcements.</p>
    `;
  }
}


// ===========================
// PUBLISH ANNOUNCEMENT
// ===========================

form.addEventListener("submit", async e => {

  e.preventDefault();

  const title =
    document.getElementById("title").value.trim();

  const audience =
    document.getElementById("audience").value;

  const priority =
    document.getElementById("priority").value;

  const message =
    document.getElementById("message").value.trim();

  try {

    await addDoc(
      collection(db, "announcements"),
      {
        title,
        audience,
        priority,
        message,
        createdAt: serverTimestamp(),
        createdBy: "Founder"
      }
    );

    form.reset();

    alert("Announcement published successfully 🚀");

    loadAnnouncements();

  } catch (error) {

    console.error(error);

    alert("Failed to publish announcement");
  }
});


// ===========================
// INIT
// ===========================

loadAnnouncements();