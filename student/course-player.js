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

    try{

        const courseRef =
        doc(db,"courses",courseId);


        const snapshot =
        await getDoc(courseRef);


        console.log("Course ID:", courseId);


        if(snapshot.exists()){

            const course = snapshot.data();

            console.log(course);


            courseTitle.textContent =
            course.title;


            courseSubtitle.textContent =
            `${course.level} • ${course.duration}`;


        }else{

            courseTitle.textContent =
            "Course not found";

        }


    }catch(error){

        console.log(error);

        courseTitle.textContent =
        "Firebase error";

    }

}



async function loadLessons(){

    try{

        const q = query(
            collection(db,"lessons"),
            where("courseId","==",courseId)
        );


        const snapshot = await getDocs(q);


        console.log("Lessons found:", snapshot.size);


        lessonsList.innerHTML = "";


        if(snapshot.empty){

            lessonsList.innerHTML =
            "<p>No lessons available.</p>";

            return;

        }


        snapshot.forEach((lessonDoc)=>{

            const lesson = lessonDoc.data();


            lessonsList.innerHTML += `

            <div class="lesson-card">

                ${lesson.order || ""}. ${lesson.title}

            </div>

            `;


        });


    }catch(error){

        console.log("LESSON ERROR:", error);

        lessonsList.innerHTML =
        "<p>Error loading lessons.</p>";

    }

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