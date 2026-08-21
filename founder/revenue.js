/* ===================================
   FOUNDER OS — REVENUE ANALYTICS
=================================== */
import { db } from "../../js/firebase.js";
import "./js/founder-auth.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
const money = value => `KES ${Number(value || 0).toLocaleString()}`;
const overlay = $("loadingOverlay");
let chart;

function finishLoading() {
    if (!overlay) return;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => { overlay.style.display = "none"; }, 250);
}
function dateOf(value) { try { return value?.toDate?.() || (value ? new Date(value) : null); } catch { return null; } }
function text(id, value) { const el = $(id); if (el) el.textContent = value; }
function empty(el, cols, msg) { if (el) el.innerHTML = `<tr><td colspan="${cols}" class="empty-table">${msg}</td></tr>`; }

const payments = query(collection(db, "payments"), orderBy("createdAt", "desc"));
onSnapshot(payments, snap => {
    try {
        let total=0, month=0, today=0, count=0, success=0, pending=0, failed=0;
        let course=0, registration=0, certificate=0, exam=0, mpesa=0, card=0, bank=0, paypal=0;
        const daily = {};
        const now = new Date(), monthKey = now.toISOString().slice(0,7), todayKey = now.toISOString().slice(0,10);
        const table = $("transactionsTable");
        if (table) table.innerHTML = "";
        snap.forEach(payment => {
            const d = payment.data(), amount = Number(d.amount || 0), dt = dateOf(d.createdAt), key = dt?.toISOString().slice(0,10);
            count++;
            if (d.status === "completed" || d.status === "success") {
                success++; total += amount;
                if (key) daily[key] = (daily[key] || 0) + amount;
                if (key?.startsWith(monthKey)) month += amount;
                if (key === todayKey) today += amount;
                switch (String(d.type || "").toLowerCase()) { case "course": course+=amount; break; case "registration": registration+=amount; break; case "certificate": certificate+=amount; break; case "exam": exam+=amount; break; }
                switch (String(d.method || "").toLowerCase()) { case "mpesa": case "m-pesa": mpesa+=amount; break; case "card": card+=amount; break; case "bank": case "bank_transfer": bank+=amount; break; case "paypal": paypal+=amount; break; }
            } else if (d.status === "pending") pending++; else failed++;
            if (table) {
                const row = document.createElement("tr");
                row.innerHTML = `<td>${d.receipt || "--"}</td><td>${d.studentName || "Unknown"}</td><td>${d.admissionNo || "--"}</td><td>${d.type || "--"}</td><td>${d.method || "--"}</td><td>${money(amount)}</td><td><span class="status ${d.status || "unknown"}">${d.status || "unknown"}</span></td><td>${dt ? dt.toLocaleDateString() : "--"}</td><td><button class="table-action">View</button></td>`;
                table.appendChild(row);
            }
        });
        if (!count) empty(table, 9, "No transactions found.");
        text("totalRevenue",money(total)); text("monthlyRevenue",money(month)); text("todayRevenue",money(today));
        text("transactionCount",count); text("successfulPayments",success); text("pendingPayments",pending); text("failedPayments",failed);
        text("courseRevenue",money(course)); text("registrationRevenue",money(registration)); text("certificateRevenue",money(certificate)); text("examRevenue",money(exam)); text("breakdownTotal",money(total));
        text("mpesaRevenue",money(mpesa)); text("cardRevenue",money(card)); text("bankRevenue",money(bank)); text("paypalRevenue",money(paypal));
        drawChart(Object.keys(daily).sort(), Object.keys(daily).sort().map(k => daily[k]));
    } catch (e) { console.error("Revenue error:",e); empty($("transactionsTable"),9,"Unable to load transactions right now."); }
    finally { finishLoading(); }
}, e => { console.error("Payments listener failed:",e); empty($("transactionsTable"),9,"Unable to load transactions."); finishLoading(); });

const withdrawals = query(collection(db, "withdrawals"), orderBy("requestedAt", "desc"));
onSnapshot(withdrawals, snap => {
    try {
        const table=$("withdrawalsTable"); let pending=0; if(table) table.innerHTML="";
        snap.forEach(w => { const d=w.data(), dt=dateOf(d.requestedAt); if(d.status==="pending") pending+=Number(d.amount||0); const row=document.createElement("tr"); row.innerHTML=`<td>${d.instructor||"Unknown"}</td><td>${d.method||"--"}</td><td>${money(d.amount)}</td><td><span class="status ${d.status||"unknown"}">${d.status||"unknown"}</span></td><td>${dt?dt.toLocaleDateString():"--"}</td><td><button class="withdraw-action approve" data-id="${w.id}">Approve</button><button class="withdraw-action reject" data-id="${w.id}">Reject</button></td>`; table?.appendChild(row); });
        if(!snap.size) empty(table,6,"No withdrawal requests found.");
        text("pendingWithdrawals",money(pending));
    } catch(e) { console.error("Withdrawals error:",e); empty($("withdrawalsTable"),6,"Unable to load withdrawals."); }
    finally { finishLoading(); }
}, e => { console.error("Withdrawals listener failed:",e); empty($("withdrawalsTable"),6,"Unable to load withdrawals."); finishLoading(); });

// Absolute safety: never trap the Founder behind an infinite spinner.
setTimeout(finishLoading, 5000);

async function setWithdrawal(id,status){ try { await updateDoc(doc(db,"withdrawals",id),{status,processedAt:new Date()}); } catch(e){ console.error(e); alert("Could not update this withdrawal."); } }
document.addEventListener("click",e=>{ const id=e.target?.dataset?.id; if(!id)return; if(e.target.classList.contains("approve"))setWithdrawal(id,"completed"); if(e.target.classList.contains("reject"))setWithdrawal(id,"failed"); });

function drawChart(labels,values){ const canvas=$("revenueChart"); if(!canvas||typeof Chart==="undefined")return; chart?.destroy(); chart=new Chart(canvas,{type:"line",data:{labels,datasets:[{label:"Revenue (KES)",data:values,tension:.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}},scales:{y:{beginAtZero:true}}}}); }
function reload(){ location.reload(); }
$("refreshRevenue")?.addEventListener("click",reload); $("refreshRevenueDashboard")?.addEventListener("click",reload); $("refreshWithdrawals")?.addEventListener("click",reload);
$("exportCSV")?.addEventListener("click",()=>{ const table=document.querySelector(".transactions-section table"); if(!table)return; const csv=[...table.querySelectorAll("tr")].map(r=>[...r.querySelectorAll("th,td")].map(c=>`"${c.innerText.replaceAll('"','""')}"`).join(",")).join("\n"); const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); const a=document.createElement("a"); a.href=url; a.download="revenue-report.csv"; a.click(); URL.revokeObjectURL(url); });
$("printReport")?.addEventListener("click",()=>window.print());
