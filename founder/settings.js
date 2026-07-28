// ===================================
// SETTINGS CONTROLLER
// ===================================

console.log("⚙️ Settings Loaded");


document
.querySelectorAll(".settings-card")
.forEach(card=>{


    card.addEventListener(
        "click",
        ()=>{

            console.log(
                "Opening:",
                card.href
            );

        }
    );


});