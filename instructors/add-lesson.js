import { db } from "../js/firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
new URLSearchParams(window.location.search);

const courseId =
params.get("id");

const moduleName =
params.get("module");


const lessonForm =
document.getElementById("lessonForm");


await addDoc(
    collection(db,"lessons"),
    {

        courseId,

        module: moduleName,

        title: title.value.trim(),

        description: description.value.trim(),

        videoUrl: videoUrl.value.trim(),

        duration: duration.value.trim(),

        order: Number(order.value),

        resourceUrl: resourceUrl.value.trim(),

        createdAt: serverTimestamp()

    }
);

    alert("✅ Lesson added successfully!");

    window.history.back();

});