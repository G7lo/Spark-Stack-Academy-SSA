// =====================================
// SPARK STACK ACADEMY
// STUDENT STREAK ENGINE V1
// =====================================

import {
    db
} from "../../js/firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================
// UPDATE STUDENT STREAK
// =====================================

export async function updateStudentStreak(userId) {

    if (!userId) return;

    try {

        const studentRef =
            doc(db, "students", userId);

        const snapshot =
            await getDoc(studentRef);

        if (!snapshot.exists()) return;

        const student =
            snapshot.data();

        const today =
            getDateKey(new Date());

        const lastActive =
            student.lastActiveDate || null;

        let streak =
            Number(student.streak || 0);


        // =================================
        // FIRST ACTIVITY
        // =================================

        if (!lastActive) {

            streak = 1;

        }


        // =================================
        // ALREADY ACTIVE TODAY
        // =================================

        else if (lastActive === today) {

            return streak;

        }


        // =================================
        // CHECK YESTERDAY
        // =================================

        else {

            const yesterday =
                getDateKey(
                    new Date(
                        Date.now() -
                        86400000
                    )
                );


            if (lastActive === yesterday) {

                streak += 1;

            } else {

                streak = 1;

            }

        }


        // =================================
        // SAVE
        // =================================

        await updateDoc(
            studentRef,
            {
                streak,
                lastActiveDate: today
            }
        );


        console.log(
            "🔥 Student streak:",
            streak
        );


        return streak;

    }

    catch (error) {

        console.error(
            "🔥 Streak update failed:",
            error
        );

    }

}


// =====================================
// DATE KEY
// =====================================

function getDateKey(date) {

    return date
        .toISOString()
        .split("T")[0];

}