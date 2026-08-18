// ============================================================
// SPARK STACK ACADEMY
// CENTRAL NOTIFICATION ENGINE
// ============================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// CONSTANTS
// ============================================================

export const NOTIFICATION_AUDIENCE = {

    ALL: "all",
    USER: "user",
    ROLE: "role",
    COURSE: "course"

};


// ============================================================
// CREATE NOTIFICATION
// ============================================================

export async function createNotification({

    title,
    message,

    type = "general",

    audience = "user",

    recipientId = null,

    role = null,

    courseId = null,

    senderId = null,

    priority = "normal",

    metadata = {}

}) {

    if (!title || !message) {

        throw new Error(
            "Notification title and message are required."
        );

    }


    const notification = {

        title,
        message,

        type,

        audience,

        recipientId,

        role,

        courseId,

        senderId,

        priority,

        metadata,

        read: false,

        createdAt:
            serverTimestamp()

    };


    const reference =
        await addDoc(
            collection(
                db,
                "notifications"
            ),
            notification
        );


    console.log(
        "🔔 Notification created:",
        reference.id
    );


    return reference.id;

}


// ============================================================
// GLOBAL NOTIFICATION
// ============================================================

export async function notifyAll({

    title,
    message,
    type = "announcement",
    priority = "normal",
    senderId = null,
    metadata = {}

}) {

    return createNotification({

        title,
        message,

        type,

        audience:
            NOTIFICATION_AUDIENCE.ALL,

        senderId,

        priority,

        metadata

    });

}


// ============================================================
// USER NOTIFICATION
// ============================================================

export async function notifyUser({

    userId,

    title,
    message,

    type = "general",

    priority = "normal",

    senderId = null,

    metadata = {}

}) {

    if (!userId) {

        throw new Error(
            "userId is required."
        );

    }


    return createNotification({

        title,
        message,

        type,

        audience:
            NOTIFICATION_AUDIENCE.USER,

        recipientId:
            userId,

        senderId,

        priority,

        metadata

    });

}


// ============================================================
// ROLE NOTIFICATION
// ============================================================

export async function notifyRole({

    role,

    title,
    message,

    type = "general",

    priority = "normal",

    senderId = null,

    metadata = {}

}) {

    if (!role) {

        throw new Error(
            "role is required."
        );

    }


    return createNotification({

        title,
        message,

        type,

        audience:
            NOTIFICATION_AUDIENCE.ROLE,

        role,

        senderId,

        priority,

        metadata

    });

}


// ============================================================
// COURSE NOTIFICATION
// ============================================================

export async function notifyCourse({

    courseId,

    title,
    message,

    type = "course",

    priority = "normal",

    senderId = null,

    metadata = {}

}) {

    if (!courseId) {

        throw new Error(
            "courseId is required."
        );

    }


    return createNotification({

        title,
        message,

        type,

        audience:
            NOTIFICATION_AUDIENCE.COURSE,

        courseId,

        senderId,

        priority,

        metadata

    });

}


// ============================================================
// GET USER NOTIFICATIONS
// ============================================================

export async function getUserNotifications(

    userId,
    userRole = null,
    courseIds = [],
    maxResults = 50

) {

    if (!userId) return [];


    const notifications = [];


    // --------------------------------------------------------
    // USER NOTIFICATIONS
    // --------------------------------------------------------

    const userQuery =
        query(

            collection(
                db,
                "notifications"
            ),

            where(
                "audience",
                "==",
                "user"
            ),

            where(
                "recipientId",
                "==",
                userId
            ),

            limit(maxResults)

        );


    const userSnapshot =
        await getDocs(
            userQuery
        );


    userSnapshot.forEach(
        snapshot => {

            notifications.push({

                id:
                    snapshot.id,

                ...snapshot.data()

            });

        }
    );


    // --------------------------------------------------------
    // GLOBAL NOTIFICATIONS
    // --------------------------------------------------------

    const globalQuery =
        query(

            collection(
                db,
                "notifications"
            ),

            where(
                "audience",
                "==",
                "all"
            ),

            limit(maxResults)

        );


    const globalSnapshot =
        await getDocs(
            globalQuery
        );


    globalSnapshot.forEach(
        snapshot => {

            notifications.push({

                id:
                    snapshot.id,

                ...snapshot.data()

            });

        }
    );


    // --------------------------------------------------------
    // ROLE NOTIFICATIONS
    // --------------------------------------------------------

    if (userRole) {

        const roleQuery =
            query(

                collection(
                    db,
                    "notifications"
                ),

                where(
                    "audience",
                    "==",
                    "role"
                ),

                where(
                    "role",
                    "==",
                    userRole
                ),

                limit(maxResults)

            );


        const roleSnapshot =
            await getDocs(
                roleQuery
            );


        roleSnapshot.forEach(
            snapshot => {

                notifications.push({

                    id:
                        snapshot.id,

                    ...snapshot.data()

                });

            }
        );

    }


    // --------------------------------------------------------
    // COURSE NOTIFICATIONS
    // --------------------------------------------------------

    if (
        Array.isArray(courseIds) &&
        courseIds.length
    ) {

        for (
            const courseId
            of courseIds
        ) {

            const courseQuery =
                query(

                    collection(
                        db,
                        "notifications"
                    ),

                    where(
                        "audience",
                        "==",
                        "course"
                    ),

                    where(
                        "courseId",
                        "==",
                        courseId
                    ),

                    limit(maxResults)

                );


            const courseSnapshot =
                await getDocs(
                    courseQuery
                );


            courseSnapshot.forEach(
                snapshot => {

                    notifications.push({

                        id:
                            snapshot.id,

                        ...snapshot.data()

                    });

                }
            );

        }

    }


    // --------------------------------------------------------
    // REMOVE DUPLICATES
    // --------------------------------------------------------

    const unique =
        new Map();


    notifications.forEach(
        notification => {

            unique.set(
                notification.id,
                notification
            );

        }
    );


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    return Array.from(
        unique.values()
    )
    .sort(
        (a, b) => {

            const aTime =
                a.createdAt?.toMillis?.() || 0;

            const bTime =
                b.createdAt?.toMillis?.() || 0;

            return bTime - aTime;

        }
    )
    .slice(
        0,
        maxResults
    );

}


// ============================================================
// MARK AS READ
// ============================================================

export async function markNotificationRead(

    notificationId

) {

    if (!notificationId) return;


    await updateDoc(

        doc(
            db,
            "notifications",
            notificationId
        ),

        {
            read: true
        }

    );

}


// ============================================================
// MARK ALL AS READ
// ============================================================

export async function markAllNotificationsRead(

    notifications = []

) {

    await Promise.all(

        notifications
            .filter(
                notification =>
                    !notification.read
            )
            .map(
                notification =>
                    markNotificationRead(
                        notification.id
                    )
            )

    );

}


// ============================================================
// SMART NOTIFICATION EVENTS
// ============================================================

// 👤 Student enrollment
export async function notifyEnrollment({
    studentId,
    instructorId,
    courseId,
    studentName,
    courseName,
    amount = 0
}) {

    const results = [];

    // Student
    if (studentId) {

        results.push(
            await notifyUser({
                userId: studentId,

                title: "🎓 Enrollment Successful",

                message:
                    `You have successfully enrolled in ${courseName}.`,

                type: "enrollment",

                metadata: {
                    courseId,
                    courseName,
                    amount
                }
            })
        );

    }


    // Instructor
    if (instructorId) {

        results.push(
            await notifyUser({
                userId: instructorId,

                title: "🎓 New Student Enrollment",

                message:
                    `${studentName} enrolled in ${courseName}.`,

                type: "enrollment",

                metadata: {
                    studentId,
                    studentName,
                    courseId,
                    courseName,
                    amount
                }
            })
        );


        // 💰 Instructor earnings
        if (amount > 0) {

            results.push(
                await notifyUser({
                    userId: instructorId,

                    title: "💰 New Earnings",

                    message:
                        `You earned KSh ${Number(amount).toLocaleString()} from ${courseName}.`,

                    type: "earning",

                    priority: "high",

                    metadata: {
                        courseId,
                        courseName,
                        amount,
                        studentId
                    }
                })
            );

        }

    }


    return results;

}


// ============================================================
// 💰 EARNINGS
// ============================================================

export async function notifyEarning({
    userId,
    amount,
    source = "platform",
    description = "You received a new earning."
}) {

    if (!userId) {
        throw new Error("userId is required.");
    }

    return notifyUser({

        userId,

        title: "💰 New Earnings",

        message:
            `KSh ${Number(amount).toLocaleString()} added to your earnings. ${description}`,

        type: "earning",

        priority: "high",

        metadata: {
            amount,
            source
        }

    });

}


// ============================================================
// 🔧 MAINTENANCE
// ============================================================

export async function notifyMaintenance({
    title = "🔧 Scheduled Maintenance",
    message,
    scheduledAt = null,
    duration = null,
    senderId = null
}) {

    return notifyAll({

        title,

        message,

        type: "maintenance",

        priority: "high",

        senderId,

        metadata: {
            scheduledAt,
            duration
        }

    });

}


// ============================================================
// 🛡️ ADMIN / MODERATION ALERT
// ============================================================

export async function notifyAdmins({
    title,
    message,
    type = "moderation",
    priority = "high",
    metadata = {}
}) {

    return notifyRole({

        role: "admin",

        title,

        message,

        type,

        priority,

        metadata

    });

}


// ============================================================
// 📚 COURSE UPDATE
// ============================================================

export async function notifyCourseUpdate({
    courseId,
    title,
    message,
    type = "course",
    metadata = {}
}) {

    return notifyCourse({

        courseId,

        title,

        message,

        type,

        metadata

    });

}