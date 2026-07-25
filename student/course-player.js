import { db } from "../js/firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");

const courseTitle = document.getElementById("courseTitle");
const courseSubtitle = document.getElementById("courseSubtitle");
const lessonsList = document.getElementById("lessonsList");

const videoContainer = document.getElementById("videoContainer");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const resourceLink = document.getElementById("resourceLink");
const completeBtn = document.getElementById("completeBtn");


async function loadCourse(){

    const courseRef = doc(db,"courses",courseId);

    const courseSnap = await getDoc(courseRef);

    if(!courseSnap.exists()){

        courseTitle.textContent = "Course not found";

        return;

    }

    const course = courseSnap.data();

    courseTitle.textContent = course.title;
    courseSubtitle.textContent = `${course.level} • ${course.duration}`;

}

async function loadLessons(){

    const q = query(
        collection(db,"lessons"),
        where("courseId","==",courseId)
    );


    const snapshot = await getDocs(q);


    lessonsList.innerHTML = "";


    if(snapshot.empty){

        lessonsList.innerHTML =
        "<p>No lessons yet.</p>";

        return;

    }


    snapshot.forEach(doc=>{

        const lesson = doc.data();

        lessonsList.innerHTML += `

        <div
        class="lesson-card"
        data-video="${lesson.videoUrl}"
        data-title="${lesson.title}"
        data-description="${lesson.description}"
        data-resource="${lesson.resourceUrl || ""}">

        ${lesson.order}. ${lesson.title}

        </div>

        `;

    });

}

function attachLessonEvents(){

    document.querySelectorAll(".lesson-card").forEach(card=>{

        card.addEventListener("click",()=>{

            const video = card.dataset.video;

            const title = card.dataset.title;

            const description = card.dataset.description;

            const resource = card.dataset.resource;

            lessonTitle.textContent = title;

            lessonDescription.textContent = description;

            if(resource){

                resourceLink.href = resource;

                resourceLink.textContent = "📎 Open Resource";

                resourceLink.style.display = "inline-block";

            }else{

                resourceLink.style.display = "none";

            }

            if(video.includes("youtube.com") || video.includes("youtu.be")){

                let videoId = "";

                if(video.includes("watch?v=")){
                    videoId = video.split("watch?v=")[1].split("&")[0];
                }else{
                    videoId = video.split("/").pop();
                }

                videoContainer.innerHTML = `
                    <iframe
                        width="100%"
                        height="450"
                        src="https://www.youtube.com/embed/${videoId}"
                        frameborder="0"
                        allowfullscreen>
                    </iframe>
                `;

            }else{

                videoContainer.innerHTML = `
                    <video controls width="100%">
                        <source src="${video}" type="video/mp4">
                    </video>
                `;

            }

        });

    });

}

loadCourse();

loadLessons();

attachLessonEvents();