/* ===================================
   SPARK STACK ACADEMY
   PLATFORM SETTINGS
=================================== */

import { db } from "../../js/firebase.js";

import {

doc,
getDoc,
setDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ===================================
   FIRESTORE
=================================== */

const settingsRef = doc(
db,
"settings",
"platform"
);


/* ===================================
   DOM CACHE
=================================== */

const $ = id =>
document.getElementById(id);


/* ===================================
   GENERAL
=================================== */

const academyName = $("academyName");

const supportEmail = $("supportEmail");

const supportPhone = $("supportPhone");

const website = $("website");

const timezone = $("timezone");

const language = $("language");


/* ===================================
   ADMISSIONS
=================================== */

const admissionPrefix = $("admissionPrefix");

const admissionYear = $("admissionYear");

const nextAdmissionNumber = $("nextAdmissionNumber");

const defaultStudentStatus = $("defaultStudentStatus");

const autoAdmission = $("autoAdmission");

const requireAdmissionApproval =
$("requireAdmissionApproval");


/* ===================================
   STUDENT PORTAL
=================================== */

const studentLoginMethod =
$("studentLoginMethod");

const passwordMethod =
$("passwordMethod");

const studentPortal =
$("studentPortal");

const studentProfileEdit =
$("studentProfileEdit");

const showProgress =
$("showProgress");

const showCertificates =
$("showCertificates");


/* ===================================
   INSTRUCTORS
=================================== */

const instructorApproval =
$("instructorApproval");

const allowCourseCreation =
$("allowCourseCreation");

const allowInstructorStudents =
$("allowInstructorStudents");

const instructorEarnings =
$("instructorEarnings");


/* ===================================
   SECURITY
=================================== */

const sessionTimeout =
$("sessionTimeout");

const maxLoginAttempts =
$("maxLoginAttempts");

const passwordExpiry =
$("passwordExpiry");

const twoFactor =
$("twoFactor");

const loginTracking =
$("loginTracking");

const securityAlerts =
$("securityAlerts");


/* ===================================
   NOTIFICATIONS
=================================== */

const emailNotifications =
$("emailNotifications");

const admissionAlerts =
$("admissionAlerts");

const newStudentAlerts =
$("newStudentAlerts");

const certificateAlerts =
$("certificateAlerts");

const systemAnnouncements =
$("systemAnnouncements");


/* ===================================
   SPARK AI
=================================== */

const aiName =
$("aiName");

const aiLimit =
$("aiLimit");

const enableAI =
$("enableAI");

const studentAI =
$("studentAI");

const instructorAI =
$("instructorAI");


/* ===================================
   BRANDING
=================================== */

const academyLogo =
$("academyLogo");

const academySeal =
$("academySeal");

const academyFavicon =
$("academyFavicon");

const themeColor =
$("themeColor");


/* ===================================
   PAYMENTS
=================================== */

const currency =
$("currency");

const taxRate =
$("taxRate");

const refundPeriod =
$("refundPeriod");

const enablePayments =
$("enablePayments");

const allowRefunds =
$("allowRefunds");


/* ===================================
   ANALYTICS
=================================== */

const analyticsTracking =
$("analyticsTracking");

const studentTracking =
$("studentTracking");

const courseAnalytics =
$("courseAnalytics");

const revenueAnalytics =
$("revenueAnalytics");


/* ===================================
   SYSTEM
=================================== */

const maintenanceMode =
$("maintenanceMode");

const autoBackup =
$("autoBackup");

const debugMode =
$("debugMode");

const activityLogs =
$("activityLogs");


/* ===================================
   BACKUPS
=================================== */

const backupFrequency =
$("backupFrequency");

const lastBackup =
$("lastBackup");


/* ===================================
   BUTTONS
=================================== */

const exportSettings =
$("exportSettings");

const importSettings =
$("importSettings");

const resetSettings =
$("resetSettings");

const savePlatformSettings =
$("savePlatformSettings");

const clearCache =
$("clearCache");

const disablePlatform =
$("disablePlatform");

const resetSystem =
$("resetSystem");


/* ===================================
   DEFAULT SETTINGS
=================================== */

const defaultSettings = {

academyName:"Spark Stack Academy",

supportEmail:"",

supportPhone:"",

website:"",

timezone:"Africa/Nairobi",

language:"English",


admissionPrefix:"SSA",

admissionYear:new Date().getFullYear(),

nextAdmissionNumber:1,

defaultStudentStatus:"Active",

autoAdmission:true,

requireAdmissionApproval:true,


studentPortal:true,

studentLoginMethod:"admission",

passwordMethod:"Admission Number",

studentProfileEdit:false,

showProgress:true,

showCertificates:true,


instructorApproval:true,

allowCourseCreation:true,

allowInstructorStudents:false,

instructorEarnings:false,


sessionTimeout:30,

maxLoginAttempts:5,

passwordExpiry:90,

twoFactor:false,

loginTracking:true,

securityAlerts:true,


emailNotifications:true,

admissionAlerts:true,

newStudentAlerts:true,

certificateAlerts:true,

systemAnnouncements:true,


enableAI:true,

studentAI:true,

instructorAI:true,

aiName:"Spark AI",

aiLimit:100,


currency:"KES",

taxRate:0,

refundPeriod:7,

enablePayments:true,

allowRefunds:false,


analyticsTracking:true,

studentTracking:false,

courseAnalytics:true,

revenueAnalytics:true,


maintenanceMode:false,

autoBackup:true,

debugMode:false,

activityLogs:true,

backupFrequency:"Daily",

lastBackup:"Never",

themeColor:"#3b82f6"

};


console.log("⚙️ Platform Settings Initialized");
/* ===================================
   LOAD PLATFORM SETTINGS
=================================== */

document.addEventListener(
"DOMContentLoaded",
loadPlatformSettings
);


async function loadPlatformSettings(){

try{

const snapshot =
await getDoc(settingsRef);


/* -------------------------------
CREATE DOCUMENT IF MISSING
-------------------------------- */

if(!snapshot.exists()){

await setDoc(

settingsRef,

{

...defaultSettings,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

populateSettings(
defaultSettings
);

console.log(
"✅ Default platform settings created."
);

return;

}


/* -------------------------------
LOAD SETTINGS
-------------------------------- */

const settings =
snapshot.data();

populateSettings(settings);

console.log(
"✅ Platform settings loaded."
);

}

catch(error){

console.error(
"Failed loading settings:",
error
);

}

}


/* ===================================
   POPULATE UI
=================================== */

function populateSettings(data){

/* ---------- GENERAL ---------- */

academyName.value =
data.academyName ?? "";

supportEmail.value =
data.supportEmail ?? "";

supportPhone.value =
data.supportPhone ?? "";

website.value =
data.website ?? "";

timezone.value =
data.timezone ?? "Africa/Nairobi";

language.value =
data.language ?? "English";


/* ---------- ADMISSIONS ---------- */

admissionPrefix.value =
data.admissionPrefix ?? "SSA";

admissionYear.value =
data.admissionYear ??
new Date().getFullYear();

nextAdmissionNumber.value =
data.nextAdmissionNumber ?? 1;

defaultStudentStatus.value =
data.defaultStudentStatus ?? "Active";

autoAdmission.checked =
data.autoAdmission ?? true;

requireAdmissionApproval.checked =
data.requireAdmissionApproval ?? true;


/* ---------- STUDENTS ---------- */

studentPortal.checked =
data.studentPortal ?? true;

studentLoginMethod.value =
data.studentLoginMethod ?? "admission";

passwordMethod.value =
data.passwordMethod ??
"Admission Number";

studentProfileEdit.checked =
data.studentProfileEdit ?? false;

showProgress.checked =
data.showProgress ?? true;

showCertificates.checked =
data.showCertificates ?? true;


/* ---------- INSTRUCTORS ---------- */

instructorApproval.checked =
data.instructorApproval ?? true;

allowCourseCreation.checked =
data.allowCourseCreation ?? true;

allowInstructorStudents.checked =
data.allowInstructorStudents ?? false;

instructorEarnings.checked =
data.instructorEarnings ?? false;


/* ---------- SECURITY ---------- */

sessionTimeout.value =
data.sessionTimeout ?? 30;

maxLoginAttempts.value =
data.maxLoginAttempts ?? 5;

passwordExpiry.value =
data.passwordExpiry ?? 90;

twoFactor.checked =
data.twoFactor ?? false;

loginTracking.checked =
data.loginTracking ?? true;

securityAlerts.checked =
data.securityAlerts ?? true;


/* ---------- NOTIFICATIONS ---------- */

emailNotifications.checked =
data.emailNotifications ?? true;

admissionAlerts.checked =
data.admissionAlerts ?? true;

newStudentAlerts.checked =
data.newStudentAlerts ?? true;

certificateAlerts.checked =
data.certificateAlerts ?? true;

systemAnnouncements.checked =
data.systemAnnouncements ?? true;


/* ---------- AI ---------- */

aiName.value =
data.aiName ?? "Spark AI";

aiLimit.value =
data.aiLimit ?? 100;

enableAI.checked =
data.enableAI ?? true;

studentAI.checked =
data.studentAI ?? true;

instructorAI.checked =
data.instructorAI ?? true;


/* ---------- PAYMENTS ---------- */

currency.value =
data.currency ?? "KES";

taxRate.value =
data.taxRate ?? 0;

refundPeriod.value =
data.refundPeriod ?? 7;

enablePayments.checked =
data.enablePayments ?? true;

allowRefunds.checked =
data.allowRefunds ?? false;


/* ---------- ANALYTICS ---------- */

analyticsTracking.checked =
data.analyticsTracking ?? true;

studentTracking.checked =
data.studentTracking ?? false;

courseAnalytics.checked =
data.courseAnalytics ?? true;

revenueAnalytics.checked =
data.revenueAnalytics ?? true;


/* ---------- SYSTEM ---------- */

maintenanceMode.checked =
data.maintenanceMode ?? false;

autoBackup.checked =
data.autoBackup ?? true;

debugMode.checked =
data.debugMode ?? false;

activityLogs.checked =
data.activityLogs ?? true;


/* ---------- BACKUPS ---------- */

backupFrequency.value =
data.backupFrequency ?? "Daily";

lastBackup.value =
data.lastBackup ?? "Never";


/* ---------- BRANDING ---------- */

themeColor.value =
data.themeColor ?? "#3b82f6";

}

/* ===================================
   SAVE PLATFORM SETTINGS
=================================== */

savePlatformSettings.addEventListener(
"click",
saveSettings
);

async function saveSettings(){

try{

const settings={

/* ---------- GENERAL ---------- */

academyName:academyName.value.trim(),

supportEmail:supportEmail.value.trim(),

supportPhone:supportPhone.value.trim(),

website:website.value.trim(),

timezone:timezone.value,

language:language.value,


/* ---------- ADMISSIONS ---------- */

admissionPrefix:admissionPrefix.value.trim(),

admissionYear:Number(admissionYear.value),

nextAdmissionNumber:Number(nextAdmissionNumber.value),

defaultStudentStatus:defaultStudentStatus.value,

autoAdmission:autoAdmission.checked,

requireAdmissionApproval:
requireAdmissionApproval.checked,


/* ---------- STUDENT PORTAL ---------- */

studentPortal:studentPortal.checked,

studentLoginMethod:
studentLoginMethod.value,

passwordMethod:
passwordMethod.value,

studentProfileEdit:
studentProfileEdit.checked,

showProgress:
showProgress.checked,

showCertificates:
showCertificates.checked,


/* ---------- INSTRUCTORS ---------- */

instructorApproval:
instructorApproval.checked,

allowCourseCreation:
allowCourseCreation.checked,

allowInstructorStudents:
allowInstructorStudents.checked,

instructorEarnings:
instructorEarnings.checked,


/* ---------- SECURITY ---------- */

sessionTimeout:
Number(sessionTimeout.value),

maxLoginAttempts:
Number(maxLoginAttempts.value),

passwordExpiry:
Number(passwordExpiry.value),

twoFactor:
twoFactor.checked,

loginTracking:
loginTracking.checked,

securityAlerts:
securityAlerts.checked,


/* ---------- NOTIFICATIONS ---------- */

emailNotifications:
emailNotifications.checked,

admissionAlerts:
admissionAlerts.checked,

newStudentAlerts:
newStudentAlerts.checked,

certificateAlerts:
certificateAlerts.checked,

systemAnnouncements:
systemAnnouncements.checked,


/* ---------- AI ---------- */

aiName:
aiName.value.trim(),

aiLimit:
Number(aiLimit.value),

enableAI:
enableAI.checked,

studentAI:
studentAI.checked,

instructorAI:
instructorAI.checked,


/* ---------- BRANDING ---------- */

themeColor:
themeColor.value,


/* ---------- PAYMENTS ---------- */

currency:
currency.value,

taxRate:
Number(taxRate.value),

refundPeriod:
Number(refundPeriod.value),

enablePayments:
enablePayments.checked,

allowRefunds:
allowRefunds.checked,


/* ---------- ANALYTICS ---------- */

analyticsTracking:
analyticsTracking.checked,

studentTracking:
studentTracking.checked,

courseAnalytics:
courseAnalytics.checked,

revenueAnalytics:
revenueAnalytics.checked,


/* ---------- SYSTEM ---------- */

maintenanceMode:
maintenanceMode.checked,

autoBackup:
autoBackup.checked,

debugMode:
debugMode.checked,

activityLogs:
activityLogs.checked,


/* ---------- BACKUP ---------- */

backupFrequency:
backupFrequency.value,

lastBackup:
lastBackup.value ||

new Date().toLocaleString(),


updatedAt:
serverTimestamp()

};


await updateDoc(
settingsRef,
settings
);

alert(
"✅ Platform settings saved successfully."
);

console.log(
"Platform settings updated."
);

}

catch(error){

console.error(
"Save failed:",
error
);

alert(
"❌ Failed to save platform settings."
);

}

}
/* ===================================
   EXPORT SETTINGS
=================================== */

exportSettings.addEventListener(
"click",
exportPlatformSettings
);

async function exportPlatformSettings(){

try{

const snapshot =
await getDoc(settingsRef);

if(!snapshot.exists()){

alert("No settings found.");

return;

}

const data =
snapshot.data();

const blob =
new Blob(

[JSON.stringify(data,null,2)],

{
type:"application/json"
}

);

const url =
URL.createObjectURL(blob);

const link =
document.createElement("a");

link.href = url;

link.download =
"spark-stack-platform-settings.json";

link.click();

URL.revokeObjectURL(url);

console.log(
"Settings exported."
);

}

catch(error){

console.error(error);

alert(
"Failed to export settings."
);

}

}


/* ===================================
   IMPORT SETTINGS
=================================== */

const importInput =
document.createElement("input");

importInput.type = "file";

importInput.accept = ".json";

importSettings.addEventListener(
"click",
()=>{

importInput.click();

}
);

importInput.addEventListener(
"change",
async(e)=>{

const file =
e.target.files[0];

if(!file) return;

try{

const text =
await file.text();

const data =
JSON.parse(text);

await setDoc(

settingsRef,

{

...data,

updatedAt:
serverTimestamp()

},

{

merge:true

}

);

populateSettings(data);

alert(
"✅ Settings imported successfully."
);

}

catch(error){

console.error(error);

alert(
"Invalid settings file."
);

}

}
);


/* ===================================
   RESTORE DEFAULTS
=================================== */

resetSettings.addEventListener(
"click",
async()=>{

const confirmReset =
confirm(
"Restore default platform settings?"
);

if(!confirmReset) return;

try{

await setDoc(

settingsRef,

{

...defaultSettings,

updatedAt:
serverTimestamp()

}

);

populateSettings(
defaultSettings
);

alert(
"Platform restored to defaults."
);

}

catch(error){

console.error(error);

}

}
);


/* ===================================
   CLEAR CACHE
=================================== */

clearCache.addEventListener(
"click",
()=>{

localStorage.clear();

sessionStorage.clear();

alert(
"Cache cleared successfully."
);

}
);


/* ===================================
   DISABLE PLATFORM
=================================== */

disablePlatform.addEventListener(
"click",
async()=>{

const confirmDisable =
confirm(
"Disable the academy platform?"
);

if(!confirmDisable) return;

try{

await updateDoc(

settingsRef,

{

maintenanceMode:true,

platformDisabled:true,

updatedAt:
serverTimestamp()

}

);

maintenanceMode.checked = true;

alert(
"Platform has been disabled."
);

}

catch(error){

console.error(error);

}

}
);


/* ===================================
   RESET SYSTEM
=================================== */

resetSystem.addEventListener(
"click",
async()=>{

const confirmReset =
confirm(
"This will reset ALL platform settings. Continue?"
);

if(!confirmReset) return;

try{

await setDoc(

settingsRef,

{

...defaultSettings,

createdAt:
serverTimestamp(),

updatedAt:
serverTimestamp()

}

);

populateSettings(
defaultSettings
);

alert(
"System reset completed."
);

}

catch(error){

console.error(error);

}

});