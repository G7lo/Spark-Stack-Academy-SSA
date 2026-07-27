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
    updateDoc,
    setDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const params = new URLSearchParams(window.location.search);

const courseId = params.get("id");

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

const completeBtn =
document.getElementById("completeBtn");

let currentUser = null;

let currentLesson = null;

let totalLessons = 0;

let completedLessons = [];

let lessonCards = [];

let enrollmentRef = null;



onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="../login.html";

        return;

    }

    currentUser = user;

    await loadCompletedLessons();

});
async function loadCourse(){

    try{

        const snapshot =
        await getDoc(
            doc(db,"courses",courseId)
        );

        if(!snapshot.exists()){

            courseTitle.textContent =
            "Course not found";

            return;

        }

        const course =
        snapshot.data();

        courseTitle.textContent =
        course.title;

        courseSubtitle.textContent =
        `${course.level} • ${course.duration}`;

    }

    catch(error){

        console.error(error);

        courseTitle.textContent =
        "Unable to load course.";

    }

}



async function loadLessons(){

    try{

        const q = query(
    collection(db,"lessons"),
    where("courseId","==",courseId)
);


        const snapshot =
        await getDocs(q);


        totalLessons =
        snapshot.size;


        lessonsList.innerHTML = "";

        lessonCards = [];


        if(snapshot.empty){

            lessonsList.innerHTML = `

            <p>

            No lessons available.

            </p>

            `;

            return;

        }


        snapshot.forEach((lessonDoc)=>{

            const lesson = {

                id: lessonDoc.id,

                ...lessonDoc.data()

            };


            const card =
            document.createElement("div");


            card.className =
            "lesson-card";


            card.innerHTML = `

            <strong>

            ${lesson.order || ""}

            ${lesson.title}

            </strong>

            `;


            if(
                completedLessons.includes(lesson.id)
            ){

                card.classList.add("completed");

            }


            card.onclick = ()=>{

                document

                .querySelectorAll(".lesson-card")

                .forEach(item=>{

                    item.classList.remove("active");

                });


                card.classList.add("active");


                openLesson(lesson);

            };


            lessonsList.appendChild(card);


            lessonCards.push({

                lesson,

                card

            });

        });


        resumeLearning();

    }

    catch(error){

        console.error(error);

        lessonsList.innerHTML = `

        <p>

        Failed to load lessons.

        </p>

        `;

    }

}
async function loadCompletedLessons(){

    if(!currentUser) return;

    const q = query(

        collection(db,"progress"),

        where("studentId","==",currentUser.uid),

        where("courseId","==",courseId)

    );

    const snapshot =
    await getDocs(q);

    completedLessons = [];

    snapshot.forEach(doc=>{

        completedLessons.push(
            doc.data().lessonId
        );

    });

const enrollmentQuery = query(

    collection(db,"enrollments"),

    where("studentId","==",currentUser.uid),

    where("courseId","==",courseId),

    limit(1)

);

const enrollmentSnapshot =
await getDocs(enrollmentQuery);

if(!enrollmentSnapshot.empty){

    enrollmentRef =
    enrollmentSnapshot.docs[0].ref;

}

}



function resumeLearning(){

    if(lessonCards.length===0) return;

    let lessonToOpen =
    lessonCards[0];

    for(const item of lessonCards){

        if(
            !completedLessons.includes(
                item.lesson.id
            )
        ){

            lessonToOpen = item;

            break;

        }

    }

    lessonCards.forEach(item=>{

        item.card.classList.remove("active");

    });

    lessonToOpen.card.classList.add("active");

    openLesson(lessonToOpen.lesson);

}



function openLesson(lesson){

    currentLesson = lesson;

    lessonTitle.textContent =
    lesson.title;

    lessonDescription.textContent =
    lesson.description || "";



    if(lesson.resourceUrl){

        resourceLink.href =
        lesson.resourceUrl;

        resourceLink.textContent =
        "📎 Open Resource";

        resourceLink.style.display =
        "inline-block";

    }

    else{

        resourceLink.style.display =
        "none";

    }



    const video =
    lesson.videoUrl || "";


    if(
        video.includes("youtube.com") ||
        video.includes("youtu.be")
    ){

        let videoId = "";


        if(video.includes("watch?v=")){

            videoId =
            video.split("watch?v=")[1]
            .split("&")[0];

        }

        else if(video.includes("shorts/")){

            videoId =
            video.split("shorts/")[1]
            .split("?")[0];

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

    }

    else{

        videoContainer.innerHTML = `

<video controls>

<source
src="${video}"
type="video/mp4">

</video>

`;

    }



    if(
        completedLessons.includes(
            lesson.id
        )
    ){

        completeBtn.textContent =
        "✅ Lesson Completed";

        completeBtn.disabled = true;

    }

    else{

        completeBtn.textContent =
        "✓ Mark Lesson Complete";

        completeBtn.disabled = false;

    }

}
completeBtn.addEventListener("click", completeLesson);



async function completeLesson(){

    if(!currentUser){

        alert("Please login.");

        return;

    }

    if(!currentLesson){

        alert("Select a lesson first.");

        return;

    }

    if(completedLessons.includes(currentLesson.id)){

        alert("✅ Lesson already completed.");

        return;

    }


    try{

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


        completedLessons.push(currentLesson.id);


        const progress = Math.round(

            (completedLessons.length / totalLessons) * 100

        );


        if(enrollmentRef){

            await updateDoc(

                enrollmentRef,

                {

                    progress,

                    lastLessonId: currentLesson.id,

                    lastOpened: serverTimestamp()

                }

            );

        }


await updateDoc(

    doc(db,"students",currentUser.uid),

    {

        "stats.lessonsCompleted":
        increment(1),

        "stats.progress":
        progress

    }

);


        lessonCards.forEach(item=>{

            if(item.lesson.id===currentLesson.id){

                item.card.classList.add("completed");

            }

        });


        completeBtn.disabled = true;

        completeBtn.textContent =
        "✅ Lesson Completed";


        if(progress>=100){

    await setDoc(

        doc(
            db,
            "certificates",
            `${currentUser.uid}_${courseId}`
        ),

        {

            studentId:
            currentUser.uid,

            courseId,

            issuedAt:
            serverTimestamp()

        }

    );


    await updateDoc(

        doc(db,"students",currentUser.uid),

        {

            "stats.certificates":
            increment(1)

        }

    );


    alert("🏆 Congratulations! Course completed!");

    return;

}


        // ---------- AUTO NEXT LESSON ----------

        const currentIndex =
        lessonCards.findIndex(item=>

            item.lesson.id===currentLesson.id

        );


        if(

            currentIndex !== -1 &&

            currentIndex < lessonCards.length-1

        ){

            setTimeout(()=>{

                lessonCards[currentIndex+1]

                .card.click();

            },800);

        }

    }

    catch(error){

        console.error(error);

        alert("Something went wrong.");

    }

}




async function init(){

    await loadCourse();

    await loadLessons();

}


init();