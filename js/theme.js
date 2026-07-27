// ===========================
// SSA GLOBAL THEME
// ===========================

const savedTheme =
localStorage.getItem("ssa-theme");

if(savedTheme==="dark"){

document.body.classList.add("dark");

}

window.toggleTheme = function(enabled){

if(enabled){

document.body.classList.add("dark");

localStorage.setItem(
"ssa-theme",
"dark"
);

}else{

document.body.classList.remove("dark");

localStorage.setItem(
"ssa-theme",
"light"
);

}

}