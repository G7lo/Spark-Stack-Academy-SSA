// ===================================
// SPARK STACK ACADEMY
// ACADEMY PROFILE
// ===================================

import { db } from "../../js/firebase.js";

import {

doc,
getDoc,
setDoc,
serverTimestamp,
collection,
getDocs

} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

console.log("🏫 Academy Profile Loaded");

// ===================================
// REFERENCES
// ===================================

const profileRef = doc(
    db,
    "settings",
    "academyProfile"
);

// ===================================
// LOAD PROFILE
// ===================================

async function loadProfile(){

    try{

        const snap = await getDoc(profileRef);

        if(!snap.exists()) return;

        const data = snap.data();

        setValue("academyName",data.academyName);
        setValue("academyTagline",data.tagline);
        setValue("academyDescription",data.description);

        setValue("founderName",data.founderName);
        setValue("founderTitle",data.founderTitle);
        setValue("founderBio",data.founderBio);

        setValue("academyEmail",data.email);
        setValue("academyPhone",data.phone);
        setValue("academyWhatsapp",data.whatsapp);
        setValue("academyWebsite",data.website);
        setValue("academyAddress",data.address);
        setValue("academyCity",data.city);
        setValue("academyCountry",data.country);

        setValue("facebook",data.facebook);
        setValue("instagram",data.instagram);
        setValue("twitter",data.twitter);
        setValue("linkedin",data.linkedin);
        setValue("youtube",data.youtube);
        setValue("tiktok",data.tiktok);
        setValue("github",data.github);

        setValue("language",data.language);
        setValue("currency",data.currency);
        setValue("timezone",data.timezone);

        setValue("studentPrefix",data.studentPrefix);
        setValue("certificatePrefix",data.certificatePrefix);

        setImage("logoPreview",data.logo);
        setImage("bannerPreview",data.banner);
        setImage("sealPreview",data.seal);
        setImage("faviconPreview",data.favicon);
        setImage("founderPreview",data.founderPhoto);

    }

    catch(error){

        console.error(error);

    }

}

// ===================================
// HELPERS
// ===================================

function setValue(id,value){

    const el = document.getElementById(id);

    if(el){

        el.value = value || "";

    }

}

function setImage(id,url){

    if(!url) return;

    const img = document.getElementById(id);

    if(img){

        img.src = url;

    }

}
// ===================================
// SAVE PROFILE
// ===================================

const saveBtn =
document.getElementById("saveProfileBtn");

saveBtn?.addEventListener(
"click",
saveProfile
);

async function saveProfile(){

    try{

        const profile = {

            academyName:getValue("academyName"),
            tagline:getValue("academyTagline"),
            description:getValue("academyDescription"),

            founderName:getValue("founderName"),
            founderTitle:getValue("founderTitle"),
            founderBio:getValue("founderBio"),

            email:getValue("academyEmail"),
            phone:getValue("academyPhone"),
            whatsapp:getValue("academyWhatsapp"),
            website:getValue("academyWebsite"),
            address:getValue("academyAddress"),
            city:getValue("academyCity"),
            country:getValue("academyCountry"),

            facebook:getValue("facebook"),
            instagram:getValue("instagram"),
            twitter:getValue("twitter"),
            linkedin:getValue("linkedin"),
            youtube:getValue("youtube"),
            tiktok:getValue("tiktok"),
            github:getValue("github"),

            language:getValue("language"),
            currency:getValue("currency"),
            timezone:getValue("timezone"),

            studentPrefix:getValue("studentPrefix"),
            certificatePrefix:getValue("certificatePrefix"),

            logo:
            document.getElementById("logoPreview").src,

            banner:
            document.getElementById("bannerPreview").src,

            seal:
            document.getElementById("sealPreview").src,

            favicon:
            document.getElementById("faviconPreview").src,

            founderPhoto:
            document.getElementById("founderPreview").src,

            updatedAt:
            serverTimestamp()

        };

        await setDoc(
            profileRef,
            profile,
            {merge:true}
        );

        alert("✅ Academy profile saved.");

    }

    catch(error){

        console.error(error);

        alert("❌ Failed to save profile.");

    }

}

function getValue(id){

    const el =
    document.getElementById(id);

    return el ? el.value.trim() : "";

}

// ===================================
// IMAGE PREVIEW
// ===================================

setupPreview(
"academyLogo",
"logoPreview"
);

setupPreview(
"academyBanner",
"bannerPreview"
);

setupPreview(
"academySeal",
"sealPreview"
);

setupPreview(
"academyFavicon",
"faviconPreview"
);

setupPreview(
"founderPhoto",
"founderPreview"
);

function setupPreview(
inputId,
previewId
){

    const input =
    document.getElementById(inputId);

    const preview =
    document.getElementById(previewId);

    if(!input || !preview) return;

    input.addEventListener(
    "change",
    ()=>{

        const file =
        input.files[0];

        if(!file) return;

        preview.src =
        URL.createObjectURL(file);

    });

}

// ===================================
// RESET
// ===================================

document
.getElementById("resetProfileBtn")
?.addEventListener(
"click",
()=>{

if(confirm(
"Reset all fields?"
)){

location.reload();

}

});
// ===================================
// LIVE STATISTICS
// ===================================

async function loadStatistics(){

    try{

        const [

            students,

            instructors,

            courses,

            certificates

        ] = await Promise.all([

            getDocs(collection(db,"students")),

            getDocs(collection(db,"instructors")),

            getDocs(collection(db,"courses")),

            getDocs(collection(db,"certificates"))

        ]);

        document.getElementById(
            "totalStudents"
        ).textContent =
        students.size.toLocaleString();

        document.getElementById(
            "totalInstructors"
        ).textContent =
        instructors.size.toLocaleString();

        document.getElementById(
            "totalCourses"
        ).textContent =
        courses.size.toLocaleString();

        document.getElementById(
            "totalCertificates"
        ).textContent =
        certificates.size.toLocaleString();

    }

    catch(error){

        console.error(
            "Statistics Error:",
            error
        );

    }

}

// ===================================
// INITIALIZE
// ===================================

window.addEventListener(
"DOMContentLoaded",
()=>{

    loadProfile();

    loadStatistics();

});