// =====================================
// SPARK STACK ACADEMY
// CERTIFICATE VIEW CONTROLLER
// =====================================

console.log(
    "🏆 Certificate Viewer Loaded"
);


const params =
    new URLSearchParams(
        window.location.search
    );


const encodedData =
    params.get("data");


if (!encodedData) {

    document.getElementById(
        "studentName"
    ).textContent =
        "Certificate Not Found";

}
else {

    try {

        const certificate =
            JSON.parse(
                decodeURIComponent(
                    encodedData
                )
            );


        renderCertificate(
            certificate
        );


    }

    catch (error) {

        console.error(
            "Certificate parsing failed:",
            error
        );

    }

}


// =====================================
// RENDER
// =====================================

function renderCertificate(
    certificate
) {


    document.getElementById(
        "studentName"
    ).textContent =
        certificate.studentName ||
        "Student";


    document.getElementById(
        "courseTitle"
    ).textContent =
        certificate.courseTitle ||
        "Course Completion";


    document.getElementById(
        "certificateNumber"
    ).textContent =
        certificate.certificateNumber ||
        "—";


    document.getElementById(
        "admissionNumber"
    ).textContent =
        certificate.admissionNumber ||
        "—";


    document.getElementById(
        "instructorName"
    ).textContent =
        certificate.instructorName ||
        "Academy Instructor";


    document.getElementById(
        "headquarters"
    ).textContent =
        certificate.headquarters ||
        "Kenya";


    document.getElementById(
        "website"
    ).textContent =
        certificate.website ||
        "sparkstackacademy.com";


    document.getElementById(
        "issuedAt"
    ).textContent =
        formatDate(
            certificate.issuedAt
        );


    document.title =
        `${certificate.courseTitle || "Certificate"} | Spark Stack Academy`;


    // ---------------------------------
    // AUTO DOWNLOAD MODE
    // ---------------------------------

    const download =
        params.get("download");


    if (download === "true") {

        setTimeout(
            () => {

                window.print();

            },
            800
        );

    }

}


// =====================================
// DATE
// =====================================

function formatDate(
    value
) {

    if (!value)
        return "—";


    try {

        let date;


        if (
            typeof value.toDate ===
            "function"
        ) {

            date =
                value.toDate();

        }

        else {

            date =
                new Date(value);

        }


        return date.toLocaleDateString(
            "en-KE",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    }

    catch {

        return "—";

    }

}


// =====================================
// PRINT
// =====================================

document
    .getElementById(
        "printCertificate"
    )
    ?.addEventListener(
        "click",
        () => {

            window.print();

        }
    );


// =====================================
// CLOSE
// =====================================

document
    .getElementById(
        "closeCertificate"
    )
    ?.addEventListener(
        "click",
        () => {

            window.close();

        }
    );