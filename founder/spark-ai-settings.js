// ===================================
// SPARK AI SETTINGS
// ===================================

import { db } from "../../js/firebase.js";

import {

doc,
getDoc,
setDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

console.log("🤖 Spark AI Settings Loaded");

const settingsRef =
doc(db,"settings","sparkAI");

// ===================================
// LOAD SETTINGS
// ===================================

async function loadSettings(){

    try{

        const snap =
        await getDoc(settingsRef);

        if(!snap.exists()) return;

        const data = snap.data();

        Object.keys(data).forEach(key=>{

            const el =
            document.getElementById(key);

            if(!el) return;

            if(el.type==="checkbox"){

                el.checked=data[key];

            }else{

                el.value=data[key];

            }

        });

    }

    catch(error){

        console.error(error);

    }

}

// ===================================
// SAVE SETTINGS
// ===================================

async function saveSettings(){

    try{

        const settings={

            aiProvider:
            aiProvider.value,

            aiModel:
            aiModel.value,

            apiKey:
            apiKey.value,

            apiEndpoint:
            apiEndpoint.value,

            temperature:
            Number(temperature.value),

            maxTokens:
            Number(maxTokens.value),

            systemPrompt:
            systemPrompt.value,

            aiPersonality:
            aiPersonality.value,

            defaultLanguage:
            defaultLanguage.value,

            responseStyle:
            responseStyle.value,

            enableStreaming:
            enableStreaming.checked,

            enableMemory:
            enableMemory.checked,

            enableWeb:
            enableWeb.checked,

            enableCode:
            enableCode.checked,

            enableImages:
            enableImages.checked,

            rateLimit:
            Number(rateLimit.value),

            conversationLimit:
            Number(conversationLimit.value),

            updatedAt:
            serverTimestamp()

        };

        await setDoc(

            settingsRef,

            settings,

            {merge:true}

        );

        alert("✅ Spark AI settings saved.");

    }

    catch(error){

        console.error(error);

        alert("Failed to save settings.");

    }

}

// ===================================
// TEST CONNECTION
// ===================================

async function testConnection(){

    const btn =
    document.getElementById("testConnectionBtn");

    btn.disabled = true;
    btn.textContent = "Testing...";

    try{

        const response = await fetch(

            "https://api.groq.com/openai/v1/chat/completions",

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    "Authorization":"Bearer " + apiKey.value

                },

                body:JSON.stringify({

                    model: aiModel.value || "llama-3.3-70b-versatile",

                    messages:[

                        {

                            role:"user",

                            content:"Hello"

                        }

                    ],

                    max_tokens:10

                })

            }

        );

        if(response.ok){

            alert("✅ Groq API connected successfully.");

        }else{

            const error = await response.json();

            alert(error.error?.message || "Connection failed.");

        }

    }

    catch(error){

        console.error(error);

        alert("Network error.");

    }

    btn.disabled = false;

    btn.textContent = "Test Connection";

}

// ===================================
// EVENTS
// ===================================

window.addEventListener(

"DOMContentLoaded",

()=>{

    loadSettings();

    saveAISettingsBtn.onclick=
    saveSettings;

    testConnectionBtn.onclick=
    testConnection;

});