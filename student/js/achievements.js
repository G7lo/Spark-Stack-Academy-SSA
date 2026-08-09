// ============================================
// SPARK STACK ACADEMY
// ACHIEVEMENT OS ENGINE V2
// PART 1 — CORE XP + LEVEL ENGINE
// ============================================

import { db, auth } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================
// CONFIG
// ============================================

const XP_PER_LEVEL = 250;


// ============================================
// HELPERS
// ============================================

const $ = (id) =>
    document.getElementById(id);


// ============================================
// LEVEL CALCULATION
// ============================================

function calculateLevel(xp = 0) {

    return Math.floor(
        Number(xp) / XP_PER_LEVEL
    ) + 1;

}


function getLevelData(xp = 0) {

    xp = Number(xp) || 0;

    const level =
        calculateLevel(xp);

    const currentLevelXP =
        (level - 1) * XP_PER_LEVEL;

    const nextLevelXP =
        level * XP_PER_LEVEL;

    const progress =
        Math.min(
            100,
            Math.max(
                0,
                (
                    (xp - currentLevelXP) /
                    XP_PER_LEVEL
                ) * 100
            )
        );

    return {
        level,
        currentLevelXP,
        nextLevelXP,
        progress
    };

}


// ============================================
// LEVEL TITLES
// ============================================

function getLevelTitle(level) {

    if (level >= 20)
        return "Legend";

    if (level >= 15)
        return "Visionary";

    if (level >= 10)
        return "Innovator";

    if (level >= 7)
        return "Engineer";

    if (level >= 4)
        return "Builder";

    return "Rookie";

}


// ============================================
// RENDER LEVEL
// ============================================

function renderLevel(student) {

    const xp =
        Number(student.xp || 0);

    const data =
        getLevelData(xp);

    const title =
        getLevelTitle(data.level);


    // LEVEL

    const levelElement =
        $("studentLevel");

    if (levelElement) {

        // Your current HTML uses
        // the number inside the level core.

        if (
            levelElement.closest(
                ".level-number"
            )
        ) {

            levelElement.textContent =
                data.level;

        } else {

            levelElement.textContent =
                `Level ${data.level} ${title}`;

        }

    }


    // XP

    if ($("studentXP")) {

        $("studentXP").textContent =
            xp.toLocaleString();

    }


    // NEXT LEVEL XP

    if ($("nextXP")) {

        $("nextXP").textContent =
            data.nextLevelXP.toLocaleString();

    }


    // XP BAR

    if ($("xpProgress")) {

        $("xpProgress").style.width =
            `${data.progress}%`;

    }


    // STAT XP

    if ($("statXP")) {

        $("statXP").textContent =
            xp.toLocaleString();

    }

}


// ============================================
// LOAD STUDENT
// ============================================

async function loadAchievementOS(user) {

    try {

        console.log(
            "⚡ Achievement OS V2 loading..."
        );


        const studentRef =
            doc(
                db,
                "students",
                user.uid
            );


        const snapshot =
            await getDoc(studentRef);


        if (!snapshot.exists()) {

            console.warn(
                "Student profile not found."
            );

            return;

        }


        const student =
            snapshot.data();


        console.log(
            "👤 Achievement data:",
            student
        );


        // ====================================
        // CORE
        // ====================================

        renderLevel(student);


        // ====================================
        // BADGES
        // ====================================

        const syncedBadges =
            await syncBadges(
                user,
                student
            );


        // Update local student object

        student.badges =
            syncedBadges;


        // Render badge vault

        renderBadges(student);


        // Render featured badge

        renderFeaturedBadge(student);
        renderDailyQuests(student);


        console.log(
            "🏆 Achievement badges synced"
        );


    }

    catch(error) {

        console.error(
            "❌ Achievement OS error:",
            error
        );

    }

}


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            console.log(
                "🔐 No authenticated student."
            );

            return;

        }


        loadAchievementOS(user);

    }
);


console.log(
    "🚀 Achievement OS V2 loaded"
);

/// ============================================
// BADGE ENGINE — PART 2
// ============================================

const BADGES = {

    first_lesson: {
        icon: "📚",
        name: "First Spark",
        description: "Completed your first lesson."
    },

    first_course: {
        icon: "🌱",
        name: "First Builder",
        description: "Completed your first course."
    },

    quiz_master: {
        icon: "🧠",
        name: "Quiz Master",
        description: "Completed your first quiz."
    },

    coder: {
        icon: "💻",
        name: "Code Builder",
        description: "Started your coding journey."
    },

    project_builder: {
        icon: "🚀",
        name: "Project Builder",
        description: "Submitted your first project."
    },

    streak_7: {
        icon: "🔥",
        name: "7 Day Flame",
        description: "Maintained a 7-day learning streak."
    },

    streak_30: {
        icon: "⚡",
        name: "30 Day Storm",
        description: "Maintained a 30-day learning streak."
    },

    level_5: {
        icon: "🏆",
        name: "Rising Builder",
        description: "Reached Level 5."
    },

    level_10: {
        icon: "👑",
        name: "Elite Builder",
        description: "Reached Level 10."
    }

};


// ============================================
// RENDER BADGES
// ============================================

function renderBadges(student) {

    const container =
        document.getElementById(
            "badgeContainer"
        );

    if (!container) return;


    const unlocked =
        Array.isArray(student.badges)
            ? student.badges
            : [];


    container.innerHTML = "";


    Object.entries(BADGES)
        .forEach(([id, badge]) => {

            const isUnlocked =
                unlocked.includes(id);


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                `badge-item ${
                    isUnlocked
                        ? "unlocked"
                        : "locked"
                }`;


            card.innerHTML = `

                <div class="badge-icon">

                    ${
                        isUnlocked
                            ? badge.icon
                            : "🔒"
                    }

                </div>

                <h3>

                    ${
                        isUnlocked
                            ? badge.name
                            : "Locked Achievement"
                    }

                </h3>

                <p>

                    ${
                        isUnlocked
                            ? badge.description
                            : "Keep learning to unlock this."
                    }

                </p>

                <small>

                    ${
                        isUnlocked
                            ? "✓ UNLOCKED"
                            : "LOCKED"
                    }

                </small>

            `;


            container.appendChild(card);

        });


    const statBadges =
        document.getElementById(
            "statBadges"
        );


    if (statBadges) {

        statBadges.textContent =
            unlocked.length;

    }

}


// ============================================
// FEATURED BADGE
// ============================================

function renderFeaturedBadge(student) {

    const element =
        document.getElementById(
            "featuredBadgeName"
        );

    if (!element) return;


    const badges =
        Array.isArray(student.badges)
            ? student.badges
            : [];


    if (!badges.length) {

        element.textContent =
            "No Badge Yet";

        return;

    }


    const latest =
        badges[badges.length - 1];


    const badge =
        BADGES[latest];


    if (badge) {

        element.textContent =
            badge.name;

    }

}


// ============================================
// BADGE AUTO-DETECTION
// ============================================

function calculateEligibleBadges(student) {

    const badges = [];


    const xp =
        Number(student.xp || 0);


    const streak =
        Number(
            student.streak ||
            student.streakDays ||
            0
        );


    const completedLessons =
        Array.isArray(
            student.completedLessons
        )
            ? student.completedLessons.length
            : Number(
                student.completedLessonsCount || 0
            );


    const completedCourses =
        Number(
            student.completedCourses ||
            student.coursesCompleted ||
            0
        );


    const completedQuizzes =
        Number(
            student.completedQuizzes ||
            student.quizzesCompleted ||
            0
        );


    const projects =
        Number(
            student.projectsSubmitted ||
            student.completedProjects ||
            0
        );


    if (completedLessons >= 1)
        badges.push("first_lesson");


    if (completedCourses >= 1)
        badges.push("first_course");


    if (completedQuizzes >= 1)
        badges.push("quiz_master");


    if (
        student.codingStarted === true ||
        student.skill === "coding"
    )
        badges.push("coder");


    if (projects >= 1)
        badges.push("project_builder");


    if (streak >= 7)
        badges.push("streak_7");


    if (streak >= 30)
        badges.push("streak_30");


    const level =
        calculateLevel(xp);


    if (level >= 5)
        badges.push("level_5");


    if (level >= 10)
        badges.push("level_10");


    return badges;

}


// ============================================
// SYNC BADGES
// ============================================

async function syncBadges(user, student) {

    const eligible =
        calculateEligibleBadges(student);


    const existing =
        Array.isArray(student.badges)
            ? student.badges
            : [];


    const newBadges =
        eligible.filter(
            badge =>
                !existing.includes(badge)
        );


    if (!newBadges.length) {

        return existing;

    }


    console.log(
        "🏆 New badges:",
        newBadges
    );


    const updated =
        [
            ...existing,
            ...newBadges
        ];


    const studentRef =
        doc(
            db,
            "students",
            user.uid
        );


    await setDoc(
        studentRef,
        {
            badges: updated
        },
        {
            merge: true
        }
    );


    return updated;

}


// ============================================
// DAILY QUEST ENGINE — PART 4
// ============================================

const QUEST_REWARDS = {
    lesson: 20,
    quiz: 50,
    project: 100
};


// ============================================
// TODAY KEY
// ============================================

function getTodayKey() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


// ============================================
// RENDER DAILY QUESTS
// ============================================

function renderDailyQuests(student) {

    const missions =
        document.querySelectorAll(
            ".mission-card"
        );

    if (!missions.length) return;


    const lessons =
        Number(
            student.lessonsCompleted ||
            student.completedLessonsCount ||
            0
        );

    const quizzes =
        Number(
            student.quizzesCompleted ||
            student.completedQuizzes ||
            0
        );

    const projects =
        Number(
            student.projectsSubmitted ||
            student.completedProjects ||
            0
        );


    updateQuest(
        missions[0],
        lessons >= 1,
        "Watch a lesson",
        lessons >= 1
            ? "Completed"
            : "Learn something new today.",
        "lesson"
    );


    updateQuest(
        missions[1],
        quizzes >= 1,
        "Complete a quiz",
        quizzes >= 1
            ? "Completed"
            : "Prove what you've learned.",
        "quiz"
    );


    updateQuest(
        missions[2],
        projects >= 1,
        "Submit a project",
        projects >= 1
            ? "Completed"
            : "Turn knowledge into something real.",
        "project"
    );

}


// ============================================
// UPDATE QUEST
// ============================================

function updateQuest(
    card,
    completed,
    title,
    description,
    questId
) {

    if (!card) return;


    const titleElement =
        card.querySelector(
            ".mission-info h3"
        );

    const descriptionElement =
        card.querySelector(
            ".mission-info p"
        );


    if (titleElement)
        titleElement.textContent = title;


    if (descriptionElement)
        descriptionElement.textContent =
            description;


    if (!completed) return;


    card.classList.add(
        "quest-completed"
    );


    const reward =
        card.querySelector(
            ".mission-card > strong"
        );


    if (reward)
        reward.textContent =
            "✓ COMPLETE";


    // Prevent duplicate listeners

    if (
        card.dataset.rewardBound === "true"
    ) return;


    card.dataset.rewardBound = "true";


    card.addEventListener(
        "click",
        async () => {

            await claimQuestXP(
                auth.currentUser,
                questId
            );

        }
    );

}


// ============================================
// CLAIM QUEST XP
// ============================================

async function claimQuestXP(
    user,
    questId
) {

    if (!user) return;


    try {

        const today =
            getTodayKey();


        const studentRef =
            doc(
                db,
                "students",
                user.uid
            );


        const snapshot =
            await getDoc(
                studentRef
            );


        if (!snapshot.exists())
            return;


        const student =
            snapshot.data();


        const rewards =
            student.dailyQuestRewards || {};


        const rewardKey =
            `${today}_${questId}`;


        // Already claimed today

        if (rewards[rewardKey]) {

            console.log(
                "🎯 Quest already claimed"
            );

            return;

        }


        const currentXP =
            Number(
                student.xp || 0
            );


        const reward =
            QUEST_REWARDS[questId] || 0;


        await setDoc(
            studentRef,
            {

                xp:
                    currentXP + reward,

                dailyQuestRewards: {

                    ...rewards,

                    [rewardKey]: true

                },

                lastQuestReward:
                    serverTimestamp()

            },

            {
                merge: true
            }

        );


        console.log(
            `⚡ +${reward} XP`
        );


        // Reload Achievement OS

        await loadAchievementOS(
            user
        );

    }

    catch(error) {

        console.error(
            "❌ Quest reward error:",
            error
        );

    }

}