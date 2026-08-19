import {
    db
} from "../../js/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function issueCertificate(
    userId,
    course
) {

    if (!userId || !course?.id) {
        throw new Error(
            "Missing student or course information."
        );
    }


    const certificateId =
        `${userId}_${course.id}`;


    const certificateRef =
        doc(
            db,
            "certificates",
            certificateId
        );


    // Prevent duplicates

    const existing =
        await getDoc(
            certificateRef
        );


    if (existing.exists()) {

        return {
            success: true,
            alreadyExists: true,
            certificate: {
                id: existing.id,
                ...existing.data()
            }
        };

    }


    // Get student

    const studentRef =
        doc(
            db,
            "students",
            userId
        );


    const studentSnap =
        await getDoc(
            studentRef
        );


    if (!studentSnap.exists()) {

        throw new Error(
            "Student profile not found."
        );

    }


    const student =
        studentSnap.data();


    // Certificate number

    const certificateNumber =
        `SSA-${new Date().getFullYear()}-${userId
            .slice(0, 6)
            .toUpperCase()}-${course.id
            .slice(0, 6)
            .toUpperCase()}`;


    // Certificate data

    const certificate = {

        studentId:
            userId,

        studentName:
            student.displayName ||
            student.name ||
            "Student",

        admissionNumber:
            student.admissionNumber ||
            student.admissionNo ||
            "—",

        courseId:
            course.id,

        courseTitle:
            course.title ||
            "Course Completion",

        instructorName:
            course.instructorName ||
            "Academy Instructor",

        certificateNumber,

        headquarters:
            "Kenya",

        website:
            "sparkstackacademy.com",

        status:
            "valid",

        issuedAt:
            serverTimestamp(),

        createdAt:
            serverTimestamp()

    };


    await setDoc(
        certificateRef,
        certificate
    );


    console.log(
        "🏆 CERTIFICATE ISSUED:",
        certificateNumber
    );


    return {

        success: true,

        alreadyExists: false,

        certificate: {

            id:
                certificateId,

            ...certificate

        }

    };

}