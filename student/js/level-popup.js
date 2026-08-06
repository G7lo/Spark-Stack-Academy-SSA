// =====================================
// SPARK STACK ACADEMY
// LEVEL UP POPUP
// =====================================


console.log("⚡ Level Popup Loaded");



export function showLevelUp(

level,

rank

){


const overlay = document.createElement("div");


overlay.className =
"level-popup";



overlay.innerHTML = `

<div class="level-card-popup">


<div class="level-fire">

⚡

</div>



<h2>

🎉 LEVEL UP!

</h2>



<h1>

Level ${level}

</h1>



<p>

You are now a

<br>

<strong>${rank}</strong>

</p>



<button>

Continue

</button>


</div>

`;



document.body.appendChild(overlay);



setTimeout(()=>{

overlay.classList.add("show");

},100);



overlay.querySelector("button")

.onclick = ()=>{

overlay.remove();

};


}