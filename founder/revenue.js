// ===================================
// SPARK STACK ACADEMY
// REVENUE MANAGEMENT CORE
// PRODUCTION VERSION
// ===================================

import { db } from "../../js/firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("💰 Revenue Core Loaded");


// ===================================
// ELEMENTS
// ===================================

const totalRevenueEl =
    document.getElementById("totalRevenue");

const monthlyRevenueEl =
    document.getElementById("monthlyRevenue");

const premiumUsersEl =
    document.getElementById("premiumUsers");

const courseSalesEl =
    document.getElementById("courseSales");


// ===================================
// FORMAT MONEY
// ===================================

function formatMoney(amount){

    return new Intl.NumberFormat(
        "en-US",
        {
            style:"currency",
            currency:"USD"
        }
    ).format(amount);

}


// ===================================
// LOAD REVENUE DATA
// ===================================

async function loadRevenue(){

    try{


        showLoading();



        const [
            revenue,
            monthlyRevenue,
            premiumUsers,
            courseSales

        ] = await Promise.all([

            getTotalRevenue(),

            getMonthlyRevenue(),

            getPremiumUsers(),

            getCourseSales()

        ]);



        updateRevenueUI({

            revenue,

            monthlyRevenue,

            premiumUsers,

            courseSales

        });



    }


    catch(error){

        console.error(
            "Revenue loading failed:",
            error
        );

        showError();

    }


}


// ===================================
// TOTAL REVENUE
// ===================================

async function getTotalRevenue(){


    const ref =
        collection(
            db,
            "revenue",
            "transactions",
            "items"
        );


    const snapshot =
        await getDocs(
            query(
                ref,
                where(
                    "status",
                    "==",
                    "completed"
                )
            )
        );


    let total = 0;


    snapshot.forEach(doc=>{

        total +=
            Number(
                doc.data().amount || 0
            );

    });


    return total;

}



// ===================================
// MONTHLY REVENUE
// ===================================

async function getMonthlyRevenue(){

    // Will add timestamp filtering
    // after confirming your Firestore timestamp format


    return 0;

}



// ===================================
// PREMIUM USERS
// ===================================

async function getPremiumUsers(){


    const ref =
        collection(
            db,
            "revenue",
            "subscriptions",
            "items"
        );


    const snapshot =
        await getDocs(
            query(
                ref,
                where(
                    "status",
                    "==",
                    "active"
                )
            )
        );


    return snapshot.size;

}



// ===================================
// COURSE SALES
// ===================================

async function getCourseSales(){


    const ref =
        collection(
            db,
            "revenue",
            "transactions",
            "items"
        );


    const snapshot =
        await getDocs(
            query(
                ref,
                where(
                    "type",
                    "==",
                    "course"
                ),
                where(
                    "status",
                    "==",
                    "completed"
                )
            )
        );


    return snapshot.size;

}



// ===================================
// UPDATE UI
// ===================================

function updateRevenueUI(data){


    if(totalRevenueEl){

        totalRevenueEl.textContent =
            formatMoney(
                data.revenue
            );

    }


    if(monthlyRevenueEl){

        monthlyRevenueEl.textContent =
            formatMoney(
                data.monthlyRevenue
            );

    }


    if(premiumUsersEl){

        premiumUsersEl.textContent =
            data.premiumUsers;

    }


    if(courseSalesEl){

        courseSalesEl.textContent =
            data.courseSales;

    }


}


// ===================================
// STATES
// ===================================

function showLoading(){

    console.log(
        "Loading revenue..."
    );

}


function showError(){

    if(totalRevenueEl){

        totalRevenueEl.textContent =
            "Error";

    }

}



// ===================================
// START
// ===================================

window.addEventListener(
    "DOMContentLoaded",
    loadRevenue
);