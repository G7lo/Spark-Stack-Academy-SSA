// ===================================
// SPARK STACK ACADEMY
// MONETIZATION MANAGER
// ===================================

import { db } from "../../js/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("💰 Monetization Loaded");


/* ===================================
   ELEMENTS
=================================== */

const planModal =
    document.getElementById("planModal");

const couponModal =
    document.getElementById("couponModal");

const newPlanBtn =
    document.getElementById("newPlanBtn");

const newCouponBtn =
    document.getElementById("newCouponBtn");

const closePlanModal =
    document.getElementById("closePlanModal");

const closeCouponModal =
    document.getElementById("closeCouponModal");

const cancelPlanBtn =
    document.getElementById("cancelPlanBtn");

const cancelCouponBtn =
    document.getElementById("cancelCouponBtn");

const planForm =
    document.getElementById("planForm");

const couponForm =
    document.getElementById("couponForm");

const plansContainer =
    document.getElementById("plansContainer");

const couponContainer =
    document.getElementById("couponContainer");


/* ===================================
   INITIALIZE
=================================== */

window.addEventListener(

    "DOMContentLoaded",

    ()=>{

        initModals();

        loadPlans();

        loadCoupons();
        loadPricing();

    }

);
/* ===================================
   MODALS
=================================== */

function openModal(modal){

    modal?.classList.add("active");

}

function closeModal(modal){

    modal?.classList.remove("active");

}


newPlanBtn?.addEventListener(

    "click",

    ()=>openModal(planModal)

);


newCouponBtn?.addEventListener(

    "click",

    ()=>openModal(couponModal)

);


closePlanModal?.addEventListener(

    "click",

    ()=>closeModal(planModal)

);


closeCouponModal?.addEventListener(

    "click",

    ()=>closeModal(couponModal)

);


cancelPlanBtn?.addEventListener(

    "click",

    ()=>closeModal(planModal)

);


cancelCouponBtn?.addEventListener(

    "click",

    ()=>closeModal(couponModal)

);


window.addEventListener(

    "click",

    e=>{

        if(e.target===planModal){

            closeModal(planModal);

        }

        if(e.target===couponModal){

            closeModal(couponModal);

        }

    }

);
// ===================================
// COURSE PRICING MODAL
// ===================================

const pricingModal =
document.getElementById("pricingModal");

const editPricingBtn =
document.getElementById("editPricingBtn");

const closePricingModal =
document.getElementById("closePricingModal");

const cancelPricingBtn =
document.getElementById("cancelPricingBtn");


editPricingBtn?.addEventListener(
"click",
()=>{

    pricingModal.classList.add("active");

});


closePricingModal?.addEventListener(
"click",
()=>{

    pricingModal.classList.remove("active");

});


cancelPricingBtn?.addEventListener(
"click",
()=>{

    pricingModal.classList.remove("active");

});

// ===================================
// SAVE COURSE PRICING
// ===================================

const pricingForm =
document.getElementById("pricingForm");


pricingForm?.addEventListener(
"submit",
async(e)=>{

    e.preventDefault();


    const pricingData = {

        coursePrice:
        Number(
            document.getElementById(
                "coursePriceInput"
            ).value
        ),


        certificatePrice:
        Number(
            document.getElementById(
                "certificatePriceInput"
            ).value
        ),


        currency:
        document.getElementById(
            "pricingCurrency"
        ).value,


        allowFreeCourses:
        document.getElementById(
            "freeCoursesToggle"
        ).checked,


        updatedAt:
        serverTimestamp()

    };


    try{

        await setDoc(

            doc(
                db,
                "pricingSettings",
                "academy"
            ),

            pricingData

        );


        alert(
            "✅ Pricing saved successfully"
        );


        pricingModal.classList.remove(
            "active"
        );


        loadPricing();


    }
    catch(error){

        console.error(
            "Pricing error:",
            error
        );

        alert(
            "Failed to save pricing"
        );

    }

});
// ===================================
// LOAD PRICING
// ===================================

import {
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


async function loadPricing(){

    const snap =
    await getDoc(
        doc(
            db,
            "pricingSettings",
            "academy"
        )
    );


    if(!snap.exists()) return;


    const data =
    snap.data();


    document.getElementById(
        "coursePrice"
    ).textContent =
    `${data.currency} ${data.coursePrice}`;


    document.getElementById(
        "certificatePrice"
    ).textContent =
    `${data.currency} ${data.certificatePrice}`;


    document.getElementById(
        "currencyText"
    ).textContent =
    data.currency;

}

// ===================================
// OPEN PRICING EDITOR
// ===================================

async function openPricingEditor(){

    const snap = await getDoc(
        doc(
            db,
            "pricingSettings",
            "academy"
        )
    );


    if(snap.exists()){

        const data = snap.data();


        document.getElementById(
            "coursePriceInput"
        ).value = data.coursePrice || "";


        document.getElementById(
            "certificatePriceInput"
        ).value = data.certificatePrice || "";


        document.getElementById(
            "pricingCurrency"
        ).value = data.currency || "USD";


        document.getElementById(
            "freeCoursesToggle"
        ).checked =
        data.allowFreeCourses || false;

    }


    pricingModal.classList.add("active");

}


editPricingBtn?.addEventListener(
"click",
openPricingEditor
);

// ===================================
// PREMIUM PLAN CREATE
// ===================================

planForm?.addEventListener(
"submit",
async(e)=>{

    e.preventDefault();


    const planData = {

        name:
        document.getElementById(
            "planName"
        ).value.trim(),


        description:
        document.getElementById(
            "planDescription"
        ).value.trim(),


        price:
        Number(
            document.getElementById(
                "planPrice"
            ).value
        ),


        currency:
        document.getElementById(
            "planCurrency"
        ).value,


        billingCycle:
        document.getElementById(
            "billingCycle"
        ).value,


        badge:
        document.getElementById(
            "planBadge"
        ).value,


        features:
        document.getElementById(
            "planFeatures"
        )
        .value
        .split("\n")
        .filter(Boolean),


        active:
        document.getElementById(
            "planActive"
        ).checked,


        createdAt:
        serverTimestamp()

    };


    try{

        await addDoc(
            collection(
                db,
                "premiumPlans"
            ),
            planData
        );


        alert(
            "✅ Premium plan created"
        );


        planForm.reset();

        planModal.classList.remove(
            "active"
        );


        loadPlans();


    }
    catch(error){

        console.error(
            error
        );

        alert(
            "Failed creating plan"
        );

    }

});