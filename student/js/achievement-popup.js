// =====================================
// SPARK STACK ACADEMY
// ACHIEVEMENT POPUP
// =====================================


console.log("✨ Achievement Popup Loaded");



export function showAchievement(

title,

icon,

xp

){


const overlay = document.createElement(
"div"
);


overlay.className =
"achievement-popup";



overlay.innerHTML = `

<div class="achievement-glow">


<div class="popup-icon">

${icon}

</div>


<h2>

✨ Achievement Unlocked ✨

</h2>


<h1>

${title}

</h1>


<p>

+${xp} XP

</p>


<button>

Continue

</button>


</div>

`;



document.body.appendChild(
overlay
);



overlay
.querySelector("button")
.onclick = ()=>{

overlay.remove();

};



setTimeout(()=>{


overlay.classList.add(
"show"
);


},100);



}