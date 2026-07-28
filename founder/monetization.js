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

let editingPlanId = null;

let editingCouponId = null;

/* ===================================
   INITIALIZE
=================================== */

window.addEventListener(

    "DOMContentLoaded",

    ()=>{

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


    window.addEventListener(
"click",
e=>{

    if(e.target===pricingModal){

        pricingModal.classList.remove("active");

    }

});

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

        if(editingPlanId){

    await updateDoc(
        doc(
            db,
            "premiumPlans",
            editingPlanId
        ),
        planData
    );

    editingPlanId = null;

}
else{

    await addDoc(
        collection(
            db,
            "premiumPlans"
        ),
        planData
    );

}


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
// ===================================
// LOAD PREMIUM PLANS
// ===================================

async function loadPlans(){

    if(!plansContainer) return;


    try{

        const snapshot =
        await getDocs(
            collection(
                db,
                "premiumPlans"
            )
        );


        plansContainer.innerHTML = "";


        if(snapshot.empty){

            plansContainer.innerHTML = `
                <p>
                No premium plans created yet.
                </p>
            `;

            return;

        }


        snapshot.forEach(docSnap=>{


            const plan =
            docSnap.data();


            plansContainer.innerHTML += `

            <div class="plan-card glass-card">

                <h3>
                    ${plan.name}
                </h3>

                <h2>
                    ${plan.currency} ${plan.price}
                </h2>

                <p>
                    ${plan.billingCycle}
                </p>


                <ul>

                    ${
                    plan.features
                    .map(feature=>`
                        <li>
                        ${feature}
                        </li>
                    `)
                    .join("")
                    }

                </ul>


                <div class="plan-actions">

    <button 
    class="edit-plan"
    data-id="${docSnap.id}">
        Edit
    </button>


    <button 
    class="delete-plan"
    data-id="${docSnap.id}">
        Delete
    </button>

</div>


            </div>

            `;


        });


    }
    catch(error){

        console.error(
            "Loading plans failed:",
            error
        );

    }

}
// ===================================
// DELETE PREMIUM PLAN
// ===================================

document.addEventListener(
"click",
async(e)=>{


    if(
        e.target.classList.contains(
            "delete-plan"
        )
    ){

        const id =
        e.target.dataset.id;


        const confirmDelete =
        confirm(
            "Delete this plan?"
        );


        if(!confirmDelete) return;


        try{

            await deleteDoc(
                doc(
                    db,
                    "premiumPlans",
                    id
                )
            );


            loadPlans();


        }
        catch(error){

            console.error(
                "Delete failed:",
                error
            );

        }

    }


});
// ===================================
// LOAD COUPONS
// ===================================

async function loadCoupons(){

    if(!couponContainer) return;


    try{

        const snapshot =
await getDocs(
    collection(
        db,
        "coupons"
    )
);
        
        couponContainer.innerHTML = "";


        if(snapshot.empty){

            couponContainer.innerHTML = `
                <p>
                No coupons created yet.
                </p>
            `;

            return;

        }


        snapshot.forEach(docSnap=>{


            const coupon =
            docSnap.data();


            couponContainer.innerHTML += `

            <div class="coupon-card glass-card">

                <h3>
                    🎟️ ${coupon.code}
                </h3>


                <p>
                    Discount:
                    ${coupon.discount}%
                </p>


                <div class="coupon-actions">

<button
class="edit-coupon"
data-id="${docSnap.id}">
Edit
</button>


<button
class="delete-coupon"
data-id="${docSnap.id}">
Delete
</button>

</div>

            `;


        });


    }
    catch(error){

        console.error(
            "Loading coupons failed:",
            error
        );

    }

}
// ===================================
// EDIT PREMIUM PLAN
// ===================================

document.addEventListener(
"click",
async(e)=>{


    if(
        e.target.classList.contains(
            "edit-plan"
        )
    ){

        editingPlanId =
        e.target.dataset.id;


        const snap =
        await getDoc(
            doc(
                db,
                "premiumPlans",
                editingPlanId
            )
        );


        if(!snap.exists()) return;


        const plan =
        snap.data();


        document.getElementById(
            "planName"
        ).value = plan.name;


        document.getElementById(
            "planDescription"
        ).value = plan.description;


        document.getElementById(
            "planPrice"
        ).value = plan.price;


        document.getElementById(
            "planCurrency"
        ).value = plan.currency;


        document.getElementById(
            "billingCycle"
        ).value = plan.billingCycle;


        document.getElementById(
            "planBadge"
        ).value = plan.badge;


        document.getElementById(
            "planFeatures"
        ).value =
        plan.features.join("\n");


        document.getElementById(
            "planActive"
        ).checked = plan.active;


        planModal.classList.add(
            "active"
        );

    }

});
document.addEventListener(
"click",
async(e)=>{


if(
e.target.classList.contains(
"delete-coupon"
)
){

const id =
e.target.dataset.id;


if(!confirm("Delete coupon?"))
return;


await deleteDoc(
doc(
db,
"coupons",
id
)
);


loadCoupons();

}

});
document.addEventListener(
"click",
async(e)=>{


if(
e.target.classList.contains(
"edit-coupon"
)
){

editingCouponId =
e.target.dataset.id;


const snap =
await getDoc(
doc(
db,
"coupons",
editingCouponId
)
);


if(!snap.exists()) return;


const coupon =
snap.data();


document.getElementById(
"couponCode"
).value =
coupon.code;


document.getElementById(
"couponDiscount"
).value =
coupon.discount;


document.getElementById(
"couponActive"
).checked =
coupon.active;


couponModal.classList.add(
"active"
);

}

});
// ===================================
// COUPON CREATE / UPDATE
// ===================================

couponForm?.addEventListener(
"submit",
async(e)=>{

    e.preventDefault();


    const couponData = {

        code:
        document.getElementById(
            "couponCode"
        ).value.trim()
        .toUpperCase(),


        discount:
        Number(
            document.getElementById(
                "couponDiscount"
            ).value
        ),


        active:
        document.getElementById(
            "couponActive"
        ).checked,


        updatedAt:
        serverTimestamp()

    };


    try{


        if(editingCouponId){


            await updateDoc(
                doc(
                    db,
                    "coupons",
                    editingCouponId
                ),
                couponData
            );


            editingCouponId = null;


        }
        else{


            await addDoc(
                collection(
                    db,
                    "coupons"
                ),
                {
                    ...couponData,
                    createdAt:
                    serverTimestamp()
                }
            );


        }


        alert(
            "✅ Coupon saved"
        );


        couponForm.reset();


        couponModal.classList.remove(
            "active"
        );


        loadCoupons();


    }
    catch(error){


        console.error(
            "Coupon save error:",
            error
        );


        alert(
            "Failed saving coupon"
        );

    }

});