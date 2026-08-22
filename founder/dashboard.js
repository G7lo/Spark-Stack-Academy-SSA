/* ===================================
   FOUNDER DASHBOARD — SUPABASE
=================================== */

import "./js/founder-app.js";
import { supabase } from "../js/supabase.js";

const studentCount = document.getElementById("studentCount");
const instructorCount = document.getElementById("instructorCount");
const enrollmentCount = document.getElementById("enrollmentCount");
const revenueCount = document.getElementById("revenueCount");
const activityFeed = document.getElementById("activityFeed");
const founderInsight = document.getElementById("founderInsight");

async function count(table) {
    const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
}

async function loadDashboard() {
    try {
        const [students, instructors, enrollments, payments] = await Promise.all([
            count("students"),
            count("instructors"),
            count("enrollments"),
            supabase
                .from("payments")
                .select("amount")
                .eq("status", "paid")
        ]);

        studentCount.textContent = students.toLocaleString();
        instructorCount.textContent = instructors.toLocaleString();
        enrollmentCount.textContent = enrollments.toLocaleString();

        const paymentRows = payments.data || [];
        const revenue = paymentRows.reduce(
            (total, payment) => total + Number(payment.amount || 0),
            0
        );
        revenueCount.textContent = "$" + revenue.toLocaleString();

        await loadRecentActivity();
    } catch (error) {
        console.error("Founder dashboard load failed:", error);
        [studentCount, instructorCount, enrollmentCount, revenueCount].forEach(el => {
            if (el) el.textContent = "—";
        });
        if (activityFeed) {
            activityFeed.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h4>Dashboard data unavailable</h4>
                    <p>We couldn't load the latest data. Please refresh and try again.</p>
                </div>`;
        }
    }
}

async function loadRecentActivity() {
    if (!activityFeed) return;

    const { data, error } = await supabase
        .from("audit_logs")
        .select("id,action,created_at")
        .order("created_at", { ascending: false })
        .limit(8);

    if (error) {
        console.warn("Activity feed unavailable:", error.message);
        activityFeed.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📡</div>
                <h4>Activity feed unavailable</h4>
                <p>Recent activity will appear here when available.</p>
            </div>`;
        return;
    }

    if (!data?.length) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📡</div>
                <h4>No Recent Activity</h4>
                <p>Activity will appear here.</p>
            </div>`;
        return;
    }

    activityFeed.innerHTML = data.map(item => `
        <div class="activity-item">
            <div class="activity-icon">✨</div>
            <div>
                <h4>${escapeHtml(item.action || "Platform activity")}</h4>
                <small>${formatDate(item.created_at)}</small>
            </div>
        </div>
    `).join("");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    }[char]));
}

function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

const insights = [
    "Everything is running smoothly.",
    "Admissions are growing steadily.",
    "Student engagement remains healthy.",
    "Revenue trends look positive.",
    "No critical issues detected."
];

let index = 0;

setInterval(() => {
    if (!founderInsight) return;
    founderInsight.textContent = insights[index++];
    if (index >= insights.length) index = 0;
}, 10000);

loadDashboard();

console.log("🚀 Founder Dashboard Ready — Supabase runtime");
