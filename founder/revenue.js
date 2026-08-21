import { db } from "../../js/firebase.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
const money = n => `KES ${Number(n || 0).toLocaleString()}`;
let payments = [], withdrawals = [], chart, allDays = [];

function dateOf(v){ try{return v?.toDate?.() || (v ? new Date(v) : null)}catch{return null} }
function statusOk(s){return ["success","completed"].includes(String(s||"").toLowerCase())}
function typeOf(d){return String(d.type || d.paymentType || "course").toLowerCase()}
function methodOf(d){return String(d.method || d.paymentMethod || "m-pesa").toLowerCase()}

function renderPayments(){
 const search=String($("transactionSearch")?.value||"").toLowerCase();
 const filter=$("transactionFilter")?.value||"all";
 const rows=payments.filter(d=>{
   const s=String(d.status||"").toLowerCase();
   const hay=[d.receipt,d.studentName,d.name,d.admissionNo,d.type,d.method,d.course].join(" ").toLowerCase();
   return (filter==="all" || s===filter || (filter==="completed"&&s==="success")) && hay.includes(search);
 });
 const table=$("transactionsTable"); if(!table)return; table.innerHTML="";
 if(!rows.length){table.innerHTML='<tr><td colspan="9" class="empty-table">No matching transactions.</td></tr>';return}
 rows.forEach(d=>{const dt=dateOf(d.createdAt);const tr=document.createElement("tr");tr.innerHTML=`<td>${d.receipt||d.reference||"--"}</td><td>${d.studentName||d.name||d.email||"Unknown"}</td><td>${d.admissionNo||"--"}</td><td>${d.type||d.paymentType||"Course"}</td><td>${d.method||d.paymentMethod||"M-Pesa"}</td><td>${money(d.amount)}</td><td><span class="status ${d.status||"unknown"}">${d.status||"unknown"}</span></td><td>${dt?dt.toLocaleString():"--"}</td><td><button class="table-action" data-view="${d.id}">View</button></td>`;table.appendChild(tr)})
}

function renderMetrics(){
 let total=0,month=0,today=0,success=0,pending=0,failed=0,course=0,registration=0,certificate=0,exam=0,mpesa=0,card=0,bank=0,paypal=0,highest=0;const daily={};const now=new Date();const mk=now.toISOString().slice(0,7),tk=now.toISOString().slice(0,10);
 payments.forEach(d=>{const a=Number(d.amount||0),s=String(d.status||"").toLowerCase(),dt=dateOf(d.createdAt),k=dt?.toISOString().slice(0,10);if(s==="pending")pending++;else if(statusOk(s)){success++;total+=a;highest=Math.max(highest,a);if(k)daily[k]=(daily[k]||0)+a;if(k===tk)today+=a;if(k?.startsWith(mk))month+=a;switch(typeOf(d)){case"registration":registration+=a;break;case"certificate":certificate+=a;break;case"exam":exam+=a;break;default:course+=a}switch(methodOf(d)){case"card":card+=a;break;case"bank":case"bank transfer":bank+=a;break;case"paypal":paypal+=a;break;default:mpesa+=a}}else failed++});
 $("totalRevenue")&&( $("totalRevenue").textContent=money(total));$("monthlyRevenue")&&($("monthlyRevenue").textContent=money(month));$("todayRevenue")&&($("todayRevenue").textContent=money(today));
 [ ["transactionCount",payments.length],["successfulPayments",success],["pendingPayments",pending],["failedPayments",failed],["courseRevenue",money(course)],["registrationRevenue",money(registration)],["certificateRevenue",money(certificate)],["examRevenue",money(exam)],["breakdownTotal",money(total)],["mpesaRevenue",money(mpesa)],["cardRevenue",money(card)],["bankRevenue",money(bank)],["paypalRevenue",money(paypal)],["highestTransaction",money(highest)] ].forEach(([id,v])=>{if($(id))$(id).textContent=v});
 const days=Object.keys(daily).sort();const vals=days.map(k=>daily[k]);const avg=days.length?total/days.length:0;const best=days.length?days.reduce((a,b)=>daily[b]>daily[a]?b:a):null;$("dailyAverage")&&($("dailyAverage").textContent=money(avg));$("bestRevenueDay")&&($("bestRevenueDay").textContent=best?`${best} (${money(daily[best])})`:"--");
 drawChart(days,vals); renderPayments();
}
function drawChart(days,vals){const c=$("revenueChart");if(!c||typeof Chart==="undefined")return;chart?.destroy();chart=new Chart(c,{type:"line",data:{labels:days,datasets:[{label:"Revenue (KES)",data:vals,tension:.35,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})}
function renderWithdrawals(){const t=$("withdrawalsTable");if(!t)return;t.innerHTML="";let pending=0;if(!withdrawals.length){t.innerHTML='<tr><td colspan="6" class="empty-table">No withdrawal requests found.</td></tr>';return}withdrawals.forEach(d=>{if(d.status==="pending")pending+=Number(d.amount||0);const dt=dateOf(d.requestedAt);const tr=document.createElement("tr");tr.innerHTML=`<td>${d.instructor||d.instructorName||"Unknown"}</td><td>${d.method||"--"}</td><td>${money(d.amount)}</td><td><span class="status ${d.status||"unknown"}">${d.status||"unknown"}</span></td><td>${dt?dt.toLocaleDateString():"--"}</td><td><button class="withdraw-action approve" data-id="${d.id}">Approve</button> <button class="withdraw-action reject" data-id="${d.id}">Reject</button></td>`;t.appendChild(tr)});$("pendingWithdrawals")&&($("pendingWithdrawals").textContent=money(pending))}

onSnapshot(query(collection(db,"payments"),orderBy("createdAt","desc")),snap=>{payments=snap.docs.map(x=>({id:x.id,...x.data()}));renderMetrics()},e=>console.error("Payments:",e));
onSnapshot(query(collection(db,"withdrawals"),orderBy("requestedAt","desc")),snap=>{withdrawals=snap.docs.map(x=>({id:x.id,...x.data()}));renderWithdrawals()},e=>console.error("Withdrawals:",e));

$("transactionSearch")?.addEventListener("input",renderPayments);$("transactionFilter")?.addEventListener("change",renderPayments);
$("refreshRevenue")?.addEventListener("click",()=>renderMetrics());$("refreshRevenueDashboard")?.addEventListener("click",()=>renderMetrics());$("refreshWithdrawals")?.addEventListener("click",renderWithdrawals);
document.addEventListener("click",async e=>{const id=e.target?.dataset?.id;if(!id)return;const status=e.target.classList.contains("approve")?"completed":e.target.classList.contains("reject")?"failed":null;if(!status)return;if(!confirm(`Mark this withdrawal as ${status}?`))return;try{await updateDoc(doc(db,"withdrawals",id),{status,processedAt:new Date()})}catch(err){console.error(err);alert("Could not update withdrawal.")}});

$("exportCSV")?.addEventListener("click",()=>{const rows=payments.map(d=>[d.receipt||d.reference||"",d.studentName||d.name||d.email||"",d.admissionNo||"",d.type||"Course",d.method||"M-Pesa",d.amount||0,d.status||"",dateOf(d.createdAt)?.toISOString()||""]);const csv=[["Receipt","Student","Admission","Type","Method","Amount","Status","Date"],...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`SSA-revenue-${new Date().toISOString().slice(0,10)}.csv`;a.click()});
$("printReport")?.addEventListener("click",()=>window.print());
$("monthlyReport")?.addEventListener("click",()=>alert(`Current month revenue: ${$("monthlyRevenue")?.textContent||"KES 0"}`));
$("annualReport")?.addEventListener("click",()=>alert("Annual report is ready from the transaction data shown on this page."));
$("forecastReport")?.addEventListener("click",()=>{const m=payments.filter(d=>statusOk(d.status)&&dateOf(d.createdAt)?.getMonth()===new Date().getMonth()).reduce((s,d)=>s+Number(d.amount||0),0);alert(`Simple forecast: ${money(m*12)} annualized from this month's revenue.`)});
