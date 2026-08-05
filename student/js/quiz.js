// =====================================
// SPARK STACK ACADEMY
// QUIZ ENGINE V1
// MODULE 1
// =====================================

import {

db,
auth

} from "../../js/firebase.js";

import {

doc,
getDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🧠 Quiz Engine Loaded");



// =====================================
// URL PARAMETERS
// =====================================

const params =
new URLSearchParams(
window.location.search
);

const quizId =
params.get("id");



// =====================================
// STATE
// =====================================

let quizData = null;

let questions = [];

let currentQuestion = 0;

let answers = {};

let flaggedQuestions = [];

let earnedXP = 0;

let combo = 0;

let timer = 0;

let timerInterval = null;



// =====================================
// INIT
// =====================================

document.addEventListener(

"DOMContentLoaded",

()=>{

loadQuiz();

}

);



// =====================================
// LOAD QUIZ
// =====================================

async function loadQuiz(){

if(!quizId){

console.error(
"No Quiz ID"
);

return;

}

try{

const ref =

doc(
db,
"quizzes",
quizId
);

const snap =
await getDoc(ref);

if(!snap.exists()){

console.error(
"Quiz not found"
);

return;

}

quizData = {

id:snap.id,

...snap.data()

};

questions =
quizData.questions || [];

restoreDraft();

renderQuestion();

createPalette();

startTimer();

createPalette();

startTimer();

}

catch(error){

console.error(
error
);

}

}
// =====================================
// RENDER QUESTION
// =====================================

function renderQuestion(){

if(!questions.length)
return;

const question =
questions[currentQuestion];



document.getElementById(

"currentQuestion"

).textContent =

currentQuestion + 1;



document.getElementById(

"totalQuestions"

).textContent =

questions.length;



document.getElementById(

"questionText"

).textContent =

question.question;



renderAnswers(question);

updateProgress();

highlightPalette();

}







// =====================================
// RENDER ANSWERS
// =====================================

function renderAnswers(question){

const container =

document.getElementById(

"answersContainer"

);



container.innerHTML = "";



const letters =

["A","B","C","D","E","F"];



question.options.forEach(

(option,index)=>{

const card =

document.createElement("div");

card.className =

"answer-option";



if(

answers[currentQuestion] === index

){

card.classList.add(

"selected"

);

}



card.innerHTML = `

<div class="answer-letter">

${letters[index]}

</div>

<div class="answer-text">

${option}

</div>

`;



card.onclick = ()=>{

selectAnswer(index);

};



container.appendChild(card);

});

}







// =====================================
// SELECT ANSWER
// =====================================

function selectAnswer(index){

answers[currentQuestion] = index;

renderQuestion();

}







// =====================================
// CREATE PALETTE
// =====================================

function createPalette(){

const palette =

document.getElementById(

"questionPalette"

);



palette.innerHTML = "";



questions.forEach(

(question,index)=>{

const button =

document.createElement(

"button"

);



button.textContent =

index + 1;



button.onclick = ()=>{

currentQuestion = index;

renderQuestion();

};



palette.appendChild(

button

);

});



highlightPalette();

}







// =====================================
// UPDATE PALETTE
// =====================================

function highlightPalette(){

const buttons =

document.querySelectorAll(

"#questionPalette button"

);



buttons.forEach(

(button,index)=>{

button.className = "";



if(

answers[index] !== undefined

){

button.classList.add(

"answered"

);

}



if(

flaggedQuestions.includes(

index

)

){

button.classList.add(

"flagged"

);

}



if(

index === currentQuestion

){

button.classList.add(

"active"

);

}

});

}







// =====================================
// PROGRESS
// =====================================

function updateProgress(){

const progress =

Object.keys(

answers

).length;



document.getElementById(

"answeredCounter"

).textContent =

`${progress} / ${questions.length} Answered`;



const percentage =

(progress / questions.length)

*100;



document.getElementById(

"quizProgress"

).style.width =

percentage + "%";

}
// =====================================
// BUTTONS
// =====================================

const previousBtn =
document.getElementById(
"previousBtn"
);

const nextBtn =
document.getElementById(
"nextBtn"
);

const flagBtn =
document.getElementById(
"flagBtn"
);

const submitQuizBtn =
document.getElementById(
"submitQuizBtn"
);



// =====================================
// EVENTS
// =====================================

previousBtn?.addEventListener(
"click",
previousQuestion
);

nextBtn?.addEventListener(
"click",
nextQuestion
);

flagBtn?.addEventListener(
"click",
toggleFlag
);

submitQuizBtn?.addEventListener(
"click",
submitQuiz
);



// =====================================
// NEXT
// =====================================

function nextQuestion(){

if(currentQuestion >= questions.length - 1){

return;

}

currentQuestion++;

renderQuestion();

scrollToTop();

saveDraft();

}



// =====================================
// PREVIOUS
// =====================================

function previousQuestion(){

if(currentQuestion <= 0){

return;

}

currentQuestion--;

renderQuestion();

scrollToTop();

saveDraft();

}



// =====================================
// FLAG QUESTION
// =====================================

function toggleFlag(){

const index =

flaggedQuestions.indexOf(
currentQuestion
);

if(index === -1){

flaggedQuestions.push(
currentQuestion
);

showToast(
"🚩 Question flagged."
);

}else{

flaggedQuestions.splice(
index,
1
);

showToast(
"✅ Flag removed."
);

}

highlightPalette();

saveDraft();

}



// =====================================
// SCROLL TOP
// =====================================

function scrollToTop(){

window.scrollTo({

top:0,

behavior:"smooth"

});

}



// =====================================
// SAVE DRAFT
// =====================================

function saveDraft(){

const draft = {

quizId,

currentQuestion,

answers,

flaggedQuestions,

lastSaved:

Date.now()

};

localStorage.setItem(

`ssa_quiz_${quizId}`,

JSON.stringify(draft)

);

}



// =====================================
// RESTORE DRAFT
// =====================================

function restoreDraft(){

const saved =

localStorage.getItem(

`ssa_quiz_${quizId}`

);

if(!saved){

return;

}

try{

const draft =

JSON.parse(saved);

answers =
draft.answers || {};

flaggedQuestions =
draft.flaggedQuestions || [];

currentQuestion =
draft.currentQuestion || 0;

}catch(error){

console.error(

"Draft restore failed",

error

);

}

}



// =====================================
// TOAST
// =====================================

function showToast(message){

const toast =

document.getElementById(
"xpToast"
);

if(!toast){

return;

}

toast.textContent =
message;

toast.classList.add(
"show"
);

setTimeout(()=>{

toast.classList.remove(
"show"
);

},2500);

}
// =====================================
// TIMER
// =====================================

function startTimer(){

// Restore remaining time if available

const saved =

JSON.parse(

localStorage.getItem(

`ssa_quiz_${quizId}`

) || "{}"

);

timer =

saved.remainingTime ??

(quizData.duration * 60);



updateTimer();



timerInterval =

setInterval(()=>{

timer--;

updateTimer();

saveRemainingTime();



if(timer <= 0){

clearInterval(

timerInterval

);

submitQuiz();

}

},1000);

}





// =====================================
// UPDATE TIMER
// =====================================

function updateTimer(){

const minutes =

Math.floor(timer / 60);

const seconds =

timer % 60;



const display =

`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;



const timerElement =

document.getElementById(
"timer"
);



if(timerElement){

timerElement.textContent =
display;

}



// Last minute warning

if(timer <= 60){

timerElement.style.color =
"#ef4444";

timerElement.parentElement.classList.add(
"danger"
);

showCountdownWarning();

}

}





// =====================================
// SAVE TIME
// =====================================

function saveRemainingTime(){

const draft =

JSON.parse(

localStorage.getItem(

`ssa_quiz_${quizId}`

) || "{}"

);



draft.remainingTime =
timer;



localStorage.setItem(

`ssa_quiz_${quizId}`,

JSON.stringify(draft)

);

}





// =====================================
// WARNING
// =====================================

let warningShown = false;

function showCountdownWarning(){

if(warningShown)
return;

warningShown = true;

showToast(

"⏰ Only one minute remaining!"

);

}
// =====================================
// SUBMIT QUIZ
// =====================================

async function submitQuiz(){

clearInterval(timerInterval);

let correct = 0;

let totalXP = 0;



questions.forEach((question,index)=>{

const selected = answers[index];

if(selected === question.answer){

correct++;

totalXP += question.xp || 10;

}

});



const score =

Math.round(

(correct / questions.length) * 100

);



const passed =

score >= (quizData.passingScore || 70);



await saveAttempt({

score,

correct,

passed,

earnedXP:totalXP

});



showResults({

score,

correct,

passed,

earnedXP:totalXP

});

}
// =====================================
// SAVE ATTEMPT
// =====================================

import {

serverTimestamp,
setDoc

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



async function saveAttempt(result){

const user =

auth.currentUser;

if(!user)
return;



await setDoc(

doc(

db,

"students",

user.uid,

"quizAttempts",

quizId

),

{

quizId,

courseId:

quizData.courseId,

score:

result.score,

correct:

result.correct,

passed:

result.passed,

earnedXP:

result.earnedXP,

submittedAt:

serverTimestamp()

}

);

}
// =====================================
// SHOW RESULTS
// =====================================

function showResults(result){

document.getElementById(
"finalScore"
).textContent =
result.score + "%";

document.getElementById(
"correctAnswers"
).textContent =
`${result.correct}/${questions.length}`;

document.getElementById(
"earnedXpResult"
).textContent =
result.earnedXP + " XP";

document.getElementById(
"quizResultModal"
).classList.add(
"show"
);



// =====================================
// PERFECT SCORE
// =====================================

if(result.score === 100){

setTimeout(()=>{

document.getElementById(
"perfectModal"
).classList.add(
"show"
);

},1200);

}

}