import { db } from "../js/firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const money = new Intl.NumberFormat("en-KE", { style:"currency", currency:"KES", maximumFractionDigits:0 });
const $ = (id) => document.getElementById(id);
const state = { students:0, enrollments:[], courses:[], instructors:0, certificates:0, payments:[] };
const amount = (item) => Number(item.amount || item.total || item.price || 0) || 0;
const dateOf = (item) => { const value=item.paidAt || item.createdAt || item.updatedAt; return value?.toDate ? value.toDate() : value ? new Date(value) : null; };

function render() {
  const days = Number($("analyticsPeriod")?.value || 30); const start = new Date(); start.setDate(start.getDate() - days + 1); start.setHours(0,0,0,0);
  const periodPayments = state.payments.filter((item) => { const date=dateOf(item); return date && !Number.isNaN(date) && date >= start; });
  const total = periodPayments.reduce((sum,item) => sum + amount(item), 0);
  $("analyticsStudents").textContent = state.students.toLocaleString(); $("analyticsEnrollments").textContent = state.enrollments.length.toLocaleString();
  $("analyticsConversion").textContent = state.students ? `${Math.round((state.enrollments.length / state.students) * 100)}%` : "—"; $("analyticsRevenue").textContent = money.format(total); $("chartTotal").textContent = money.format(total);
  $("analyticsCourses").textContent = state.courses.filter((course) => course.status !== "archived").length.toLocaleString(); $("analyticsInstructors").textContent=state.instructors.toLocaleString(); $("analyticsCertificates").textContent=state.certificates.toLocaleString();
  $("studentTrend").textContent = state.students ? "Live learner total" : "Ready for your first learner"; $("revenueTrend").textContent = `${days}-day reporting window`;
  $("analyticsBrief").textContent = state.students ? `Your academy has ${state.students.toLocaleString()} learners across ${state.courses.length.toLocaleString()} courses. ${total ? `${money.format(total)} was recorded in the selected period.` : "No payments have been recorded in this period."}` : "Start by publishing a course and inviting learners. This page will turn their activity into founder-ready signals.";
  renderBars(days, periodPayments); renderCourses();
}

function renderBars(days, payments) { const chart=$("revenueBars"); chart.replaceChildren(); const buckets=Array.from({length:Math.min(days,30)},()=>0); const today=new Date(); today.setHours(0,0,0,0); payments.forEach((payment)=>{const d=dateOf(payment); d.setHours(0,0,0,0); const age=Math.floor((today-d)/86400000); if(age>=0 && age<buckets.length) buckets[buckets.length-1-age]+=amount(payment);}); const max=Math.max(...buckets,1); buckets.forEach((value)=>{const bar=document.createElement("span");bar.className="chart-bar";bar.style.height=`${Math.max(4,(value/max)*100)}%`;bar.title=money.format(value);chart.append(bar);}); }
function renderCourses() { const list=$("coursePerformance"); list.replaceChildren(); const ranked=state.courses.slice(0,5); if(!ranked.length){list.innerHTML='<p class="empty">Publish courses to begin measuring catalog performance.</p>';return;} const maximum=Math.max(...ranked.map((course)=>Number(course.enrollmentCount || course.students || 0)),1); ranked.forEach((course)=>{const count=Number(course.enrollmentCount || course.students || 0);const row=document.createElement("div");row.className="ranked-row";const copy=document.createElement("div");const name=document.createElement("strong");name.textContent=course.title || course.name || "Untitled course";const line=document.createElement("span");line.textContent=`${count.toLocaleString()} enrollments`;const progress=document.createElement("div");progress.className="progress";const fill=document.createElement("i");fill.style.width=`${(count/maximum)*100}%`;progress.append(fill);copy.append(name,line,progress);const value=document.createElement("span");value.textContent=course.status || "active";row.append(copy,value);list.append(row);}); }
[["students",(docs)=>state.students=docs.length],["enrollments",(docs)=>state.enrollments=docs],["courses",(docs)=>state.courses=docs],["instructors",(docs)=>state.instructors=docs.length],["certificates",(docs)=>state.certificates=docs.length],["payments",(docs)=>state.payments=docs]].forEach(([name,apply])=>onSnapshot(collection(db,name),(snapshot)=>{apply(snapshot.docs.map((entry)=>entry.data()));render();}));
$("analyticsPeriod")?.addEventListener("change",render); window.addEventListener("DOMContentLoaded",()=>window.lucide?.createIcons());
