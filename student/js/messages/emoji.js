// =====================================
// SPARK STACK ACADEMY
// CHAT EMOJI PICKER
// emoji.js
// =====================================


console.log("😊 Emoji Loaded");


const emojiBtn =

document.getElementById(
"emojiBtn"
);


const messageInput =

document.getElementById(
"messageInput"
);



const emojis = [
"😀","😂","😍","🔥","❤️",
"👍","🙏","🎉","🚀","😎",
"🤔","😭","👏","💯","✨"
];



let picker;



function createPicker(){


picker = document.createElement(
"div"
);


picker.className =
"emoji-picker";



emojis.forEach(

emoji=>{


const button = document.createElement(
"button"
);


button.textContent = emoji;


button.onclick = ()=>{


messageInput.value += emoji;


messageInput.focus();


};


picker.appendChild(button);


}

);



document.body.appendChild(
picker
);


}



emojiBtn?.addEventListener(

"click",

()=>{


if(!picker){

createPicker();

}


picker.classList.toggle(
"show"
);


}

);