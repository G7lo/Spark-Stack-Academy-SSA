import { db, auth } from "../js/firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    limit,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

let currentUser = null;

let currentLesson = null;

const completeBtn =
document.getElementById("completeBtn");

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

console.log("COURSE ID:", courseId);
console.log("TOTAL LESSONS:", snapshot.size);


        console.log("Lessons found:", snapshot.size);


        lessonsList.innerHTML = `
<p>Found ${snapshot.size} lessons</p>
`;


        if(snapshot.empty){

            lessonsList.innerHTML =
            "<p>No lessons available.</p>";

            return;

        }


        snapshot.forEach((lessonDoc)=>{

    const lesson = {
    id: lessonDoc.id,
    ...lessonDoc.data()
};


    const card = document.createElement("div");

    card.className = "lesson-card";


    card.textContent =
    `${lesson.order || ""}. ${lesson.title}`;


    card.addEventListener("click",()=>{

        openLesson(lesson);

    });


    lessonsList.appendChild(card);


});


    }catch(error){

        console.log("LESSON ERROR:", error);

        lessonsList.innerHTML =
        "<p>Error loading lessons.</p>";

    }

}



function openLesson(lesson){
  currentLesson = lesson;


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


onAuthStateChanged(auth,(user)=>{

    if(user){

        currentUser = user;

    }

});

completeBtn.addEventListener("click", async () => {

    if(!currentUser || !currentLesson){

        alert("Select a lesson first");

        return;

    }

    const progressQuery = query(
        collection(db,"progress"),
        where("studentId","==",currentUser.uid),
        where("courseId","==",courseId),
        where("lessonId","==",currentLesson.id),
        limit(1)
    );

    const progressSnapshot = await getDocs(progressQuery);

    if(!progressSnapshot.empty){

        alert("✅ You already completed this lesson.");

        return;

    }

    await addDoc(
        collection(db,"progress"),
        {

            studentId: currentUser.uid,

            courseId,

            lessonId: currentLesson.id,

            completed: true,

            completedAt: serverTimestamp()

        }
    );

const totalLessonsQuery = query(
    collection(db,"lessons"),
    where("courseId","==",courseId)
);

const totalLessonsSnapshot =
await getDocs(totalLessonsQuery);

const completedLessonsQuery = query(
    collection(db,"progress"),
    where("studentId","==",currentUser.uid),
    where("courseId","==",courseId)
);

const completedLessonsSnapshot =
await getDocs(completedLessonsQuery);

const progress = Math.round(
    (completedLessonsSnapshot.size /
    totalLessonsSnapshot.size) * 100
);

const enrollmentQuery = query(
    collection(db,"enrollments"),
    where("studentId","==",currentUser.uid),
    where("courseId","==",courseId),
    limit(1)
);

const enrollmentSnapshot =
await getDocs(enrollmentQuery);

if(!enrollmentSnapshot.empty){

    const enrollmentDoc =
    enrollmentSnapshot.docs[0];

    await updateDoc(
        enrollmentDoc.ref,
        {
            progress: progress
        }
    );

}

    alert(`🎉 Lesson completed!\nCourse Progress: ${progress}%`);

});



loadCourse();

loadLessons();