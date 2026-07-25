import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const params =
new URLSearchParams(window.location.search);


const courseId =
params.get("id");



const courseTitle =
document.getElementById("courseTitle");

const courseSubtitle =
document.getElementById("courseSubtitle");

const lessonsList =
document.getElementById("lessonsList");

const videoContainer =
document.getElementById("videoContainer");

const lessonTitle =
document.getElementById("lessonTitle");

const lessonDescription =
document.getElementById("lessonDescription");

const resourceLink =
document.getElementById("resourceLink");



async function loadCourse(){


    const courseRef =
    doc(db,"courses",courseId);


    const snapshot =
    await getDoc(courseRef);



    if(snapshot.exists()){


        const course =
        snapshot.data();



        courseTitle.textContent =
        course.title;


        courseSubtitle.textContent =
        `${course.level} • ${course.duration}`;


    }

}




async function loadLessons(){


    const q =
    query(
        collection(db,"lessons"),
        where("courseId","==",courseId),
        orderBy("order")
    );



    const snapshot =
    await getDocs(q);



    lessonsList.innerHTML = "";



    if(snapshot.empty){


        lessonsList.innerHTML =
        "<p>No lessons available.</p>";


        return;

    }




    snapshot.forEach((lessonDoc)=>{


        const lesson =
        lessonDoc.data();



        const card =
        document.createElement("div");



        card.className =
        "lesson-card";



        card.textContent =
        `${lesson.order}. ${lesson.title}`;



        card.addEventListener("click",()=>{


            openLesson(lesson);


        });



        lessonsList.appendChild(card);



    });


}




function openLesson(lesson){


    lessonTitle.textContent =
    lesson.title;



    lessonDescription.textContent =
    lesson.description;



    if(lesson.resourceUrl){


        resourceLink.href =
        lesson.resourceUrl;


        resourceLink.textContent =
        "📎 Open Resource";


    }else{


        resourceLink.textContent =
        "";

    }



    const video =
    lesson.videoUrl;



    if(video.includes("youtube.com") || video.includes("youtu.be")){


        let videoId = "";



        if(video.includes("shorts")){


            videoId =
            video.split("/shorts/")[1]
            .split("?")[0];


        }
        else if(video.includes("watch?v=")){


            videoId =
            video.split("watch?v=")[1]
            .split("&")[0];


        }
        else{


            videoId =
            video.split("/").pop();


        }




        videoContainer.innerHTML = `

        <iframe

        src="https://www.youtube.com/embed/${videoId}"

        allowfullscreen>

        </iframe>

        `;



    }else{


        videoContainer.innerHTML = `

        <video controls>

        <source src="${video}" type="video/mp4">

        </video>

        `;


    }


}




loadCourse();

loadLessons();