import { db } from "../js/firebase.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const form =
  document.getElementById("settingsForm");

const previewName =
  document.getElementById("previewName");

const previewEmail =
  document.getElementById("previewEmail");

const previewPhone =
  document.getElementById("previewPhone");

const previewLogo =
  document.getElementById("previewLogo");


// ===========================
// LIVE PREVIEW
// ===========================

function updatePreview() {

  const academyName =
    document.getElementById("academyName").value ||
    "Spark Stack Academy";

  const supportEmail =
    document.getElementById("supportEmail").value ||
    "support@sparkstack.ac.ke";

  const supportPhone =
    document.getElementById("supportPhone").value ||
    "+254 700 000 000";

  const primaryColor =
    document.getElementById("primaryColor").value;

  previewName.textContent =
    academyName;

  previewEmail.textContent =
    supportEmail;

  previewPhone.textContent =
    supportPhone;

  previewLogo.textContent = academyName
    .split(" ")
    .map(w => w[0])
    .join("")
    .substring(0, 3)
    .toUpperCase();

  previewLogo.style.background =
    primaryColor;
}

[
  "academyName",
  "supportEmail",
  "supportPhone",
  "primaryColor"
].forEach(id => {

  document.getElementById(id)
    .addEventListener("input", updatePreview);

});


// ===========================
// LOAD SETTINGS
// ===========================

async function loadSettings() {

  try {

    const settingsRef =
      doc(db, "settings", "academy");

    const snapshot =
      await getDoc(settingsRef);

    if (!snapshot.exists()) {

      updatePreview();
      return;
    }

    const data = snapshot.data();

    document.getElementById("academyName")
      .value = data.academyName || "";

    document.getElementById("websiteUrl")
      .value = data.websiteUrl || "";

    document.getElementById("supportEmail")
      .value = data.supportEmail || "";

    document.getElementById("supportPhone")
      .value = data.supportPhone || "";

    document.getElementById("primaryColor")
      .value = data.primaryColor || "#2563eb";

    document.getElementById("logoUrl")
      .value = data.logoUrl || "";

    document.getElementById("maintenanceMode")
      .checked = data.maintenanceMode || false;

    updatePreview();

  } catch (error) {

    console.error(error);

    alert("Failed to load settings");
  }
}


// ===========================
// SAVE SETTINGS
// ===========================

form.addEventListener("submit", async e => {

  e.preventDefault();

  try {

    await setDoc(
      doc(db, "settings", "academy"),
      {
        academyName:
          document.getElementById("academyName").value,

        websiteUrl:
          document.getElementById("websiteUrl").value,

        supportEmail:
          document.getElementById("supportEmail").value,

        supportPhone:
          document.getElementById("supportPhone").value,

        primaryColor:
          document.getElementById("primaryColor").value,

        logoUrl:
          document.getElementById("logoUrl").value,

        maintenanceMode:
          document.getElementById("maintenanceMode").checked,

        updatedAt:
          new Date().toISOString()
      },
      { merge: true }
    );

    alert("Settings saved successfully 🚀");

  } catch (error) {

    console.error(error);

    alert("Failed to save settings");
  }
});


// ===========================
// INIT
// ===========================

loadSettings();