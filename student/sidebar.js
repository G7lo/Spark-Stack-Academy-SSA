const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

const overlay =
document.getElementById("overlay");


menuBtn.addEventListener("click",()=>{

    sidebar.classList.toggle("show");

    overlay.classList.toggle("show");

});


overlay.addEventListener("click",()=>{

    sidebar.classList.remove("show");

    overlay.classList.remove("show");

});