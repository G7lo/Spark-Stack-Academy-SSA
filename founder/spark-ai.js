import { askAI } from "./js/groq.js";

/* ===================================
   ELEMENTS
=================================== */

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const typingIndicator = document.getElementById("typingIndicator");
const clearChatBtn = document.getElementById("clearChat");
const founderInsight = document.getElementById("founderInsight");

/* ===================================
   CONVERSATION MEMORY
=================================== */

const SYSTEM_PROMPT = `

You are SparkMind,
the Founder Intelligence System for
The Spark Stack Academy.

Your role is to help the Founder monitor,
analyze and improve the academy.

You DO NOT generate lessons,
quizzes,
courses,
or instructor content.

Instead you provide:

• Founder briefings
• Academy insights
• Student growth analysis
• Instructor activity summaries
• Enrollment trends
• Business strategy
• Product roadmap discussions
• Executive summaries
• Platform recommendations

Always answer professionally,
clearly,
and concisely.

`;

let conversation = [

    {
        role:"system",
        content:SYSTEM_PROMPT
    }

];

/* ===================================
   UI HELPERS
=================================== */

function scrollToBottom(){

    requestAnimationFrame(()=>{

        chatMessages.scrollTop =
        chatMessages.scrollHeight;

    });

}

function showTyping(){

    typingIndicator.classList.add("active");

    scrollToBottom();

}

function hideTyping(){

    typingIndicator.classList.remove("active");

}

function currentTime(){

    return new Date().toLocaleTimeString([],{

        hour:"2-digit",
        minute:"2-digit"

    });

}

/* ===================================
   MESSAGE UI
=================================== */

function addUserMessage(text){

    chatMessages.insertAdjacentHTML(

        "beforeend",

        `

        <div class="message user-message">

            <div class="message-avatar">

                👤

            </div>

            <div class="message-content">

                <p>${text}</p>

                <div class="message-footer">

                    <span class="message-time">

                        You • ${currentTime()}

                    </span>

                </div>

            </div>

        </div>

        `

    );

    scrollToBottom();

}

function addAIMessage(text){

    const html = marked.parse(text);

    chatMessages.insertAdjacentHTML(

        "beforeend",

        `

        <div class="message ai-message">

            <div class="message-avatar">

                ✨

            </div>

            <div class="message-content ai-content">

                ${html}

                <div class="message-footer">

                    <span class="message-time">

                        SparkMind • ${currentTime()}

                    </span>

                    <button class="copy-btn">

                        Copy

                    </button>

                </div>

            </div>

        </div>

        `

    );

    scrollToBottom();

}
/* ===================================
   SEND MESSAGE
=================================== */

async function sendMessage(text){

    const prompt = text.trim();

    if(!prompt) return;

    addUserMessage(prompt);

    conversation.push({

        role:"user",

        content:prompt

    });

    chatInput.value="";

    chatInput.style.height="56px";

    showTyping();

    try{

        const reply = await askAI(conversation);

        hideTyping();

        addAIMessage(reply);

        conversation.push({

            role:"assistant",

            content:reply

        });

        founderInsight.textContent =
        "SparkMind has analyzed your latest request and updated founder context.";

    }

    catch(error){

        hideTyping();

        addAIMessage(

            "Sorry, I couldn't reach the AI right now. Please try again."

        );

        console.error(error);

    }

}

/* ===================================
   CHAT SUBMIT
=================================== */

chatForm.addEventListener(

    "submit",

    async(event)=>{

        event.preventDefault();

        await sendMessage(chatInput.value);

    }

);

/* ===================================
   QUICK COMMANDS
=================================== */

const quickCommands={

    dailyBriefBtn:
`Give me today's founder briefing for The Spark Stack Academy.`,

    academyHealthBtn:
`Analyze the current health of the academy based on available information.`,

    growthBtn:
`Suggest practical ways to increase student growth and engagement.`,

    roadmapBtn:
`Recommend the next milestones for The Spark Stack Academy and Spark Stack ecosystem.`

};

Object.entries(quickCommands).forEach(

    ([id,prompt])=>{

        const button=document.getElementById(id);

        if(!button) return;

        button.addEventListener(

            "click",

            ()=>sendMessage(prompt)

        );

    }

);
/* ===================================
   COPY RESPONSE
=================================== */

document.addEventListener("click",(event)=>{

    if(!event.target.classList.contains("copy-btn")) return;

    const message =
    event.target
    .closest(".message-content")
    .querySelector("p")
    .innerText;

    navigator.clipboard.writeText(message);

    event.target.textContent="Copied ✓";

    setTimeout(()=>{

        event.target.textContent="Copy";

    },1500);

});

/* ===================================
   CLEAR CHAT
=================================== */

clearChatBtn.addEventListener("click",()=>{

    chatMessages.innerHTML="";

    conversation=[

        {
            role:"system",
            content:SYSTEM_PROMPT
        }

    ];

    founderInsight.textContent=
    "Conversation cleared. SparkMind is ready for a new discussion.";

});

/* ===================================
   AUTO RESIZE
=================================== */

chatInput.addEventListener("input",()=>{

    chatInput.style.height="56px";

    chatInput.style.height=
    chatInput.scrollHeight+"px";

});

/* ===================================
   ENTER TO SEND
=================================== */

chatInput.addEventListener("keydown",(event)=>{

    if(event.key==="Enter" && !event.shiftKey){

        event.preventDefault();

        chatForm.requestSubmit();

    }

});

/* ===================================
   LIMIT MEMORY
=================================== */

function trimConversation(){

    const limit=20;

    if(conversation.length>limit){

        conversation=[

            conversation[0],

            ...conversation.slice(-(limit-1))

        ];

    }

}

const originalSend=sendMessage;

sendMessage=async(text)=>{

    await originalSend(text);

    trimConversation();

};

/* ===================================
   INITIALIZE
=================================== */

window.addEventListener("load",()=>{

    chatInput.focus();

    scrollToBottom();

});