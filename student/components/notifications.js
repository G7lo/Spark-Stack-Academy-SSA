import { auth, db } from "../../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const notificationBtn =
document.getElementById("notificationBtn");


const notificationDropdown =
document.getElementById("notificationDropdown");


const notificationCount =
document.getElementById("notificationCount");



notificationBtn.addEventListener("click",()=>{


    notificationDropdown.classList.toggle("active");


});




onAuthStateChanged(auth,(user)=>{


    if(!user){

        return;

    }



    const q =
    query(

        collection(db,"notifications"),

        where(
            "userId",
            "==",
            user.uid
        ),

        where(
            "read",
            "==",
            false
        ),

        orderBy(
            "createdAt",
            "desc"
        )

    );




    onSnapshot(q,(snapshot)=>{


        notificationCount.textContent =
        snapshot.size;



        if(snapshot.empty){


            notificationDropdown.innerHTML = `

            <h3>
            Notifications
            </h3>


            <p>
            No new notifications
            </p>

            `;


            return;

        }




        notificationDropdown.innerHTML = `

        <h3>
        Notifications
        </h3>

        `;



        snapshot.forEach((item)=>{


            const data =
            item.data();



            notificationDropdown.innerHTML += `

            <div class="notification-item">

                <strong>
                ${data.title}
                </strong>

                <p>
                ${data.message}
                </p>

            </div>

            `;


        });


    });


});