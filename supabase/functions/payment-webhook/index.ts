import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PESAPAL_KEY = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
const PESAPAL_SECRET = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...cors, "Content-Type": "application/json" }
});

async function getToken() {
  const response = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_key: PESAPAL_KEY, consumer_secret: PESAPAL_SECRET })
  });

  const data = await response.json();
  if (!response.ok || !data.token) throw new Error("Pesapal authentication failed.");
  return data.token;
}

async function notifySuccessfulPayment(payment: any) {
  const courseId = payment.course_id ? String(payment.course_id) : null;
  const courseName = String(payment.course_name || "your course");
  const userId = String(payment.user_id || "");
  if (!userId) return;

  const dedupeBase = `payment-success:${payment.id}:${payment.reference}`;
  const rows: any[] = [
    {
      recipient_firebase_uid: userId,
      audience: "user",
      type: "payment_success",
      title: "Payment confirmed 🎉",
      message: `Your payment for ${courseName} was successful. Your course access is ready.`,
      priority: "high",
      action_url: courseId ? `/student/course-details.html?id=${encodeURIComponent(courseId)}` : "/student/payments.html",
      metadata: { payment_id: payment.id, reference: payment.reference, course_id: courseId, amount: payment.amount },
      dedupe_key: `${dedupeBase}:student`
    },
    {
      audience: "role",
      recipient_role: "admin",
      type: "payment_received",
      title: "Course payment received",
      message: `${courseName} received a successful payment of KSh ${Number(payment.amount || 0).toLocaleString()}.`,
      priority: "normal",
      action_url: "/admin/payments.html",
      metadata: { payment_id: payment.id, reference: payment.reference, user_id: userId, course_id: courseId },
      dedupe_key: `${dedupeBase}:admin`
    },
    {
      audience: "role",
      recipient_role: "founder",
      type: "payment_received",
      title: "New course payment",
      message: `${courseName} received a successful payment of KSh ${Number(payment.amount || 0).toLocaleString()}.`,
      priority: "normal",
      action_url: "/founder/revenue.html",
      metadata: { payment_id: payment.id, reference: payment.reference, user_id: userId, course_id: courseId },
      dedupe_key: `${dedupeBase}:founder`
    }
  ];

  if (courseId) {
    const { data: course } = await admin.from("courses").select("*").eq("id", courseId).maybeSingle();
    const raw = course || {};
    const instructorUid = String(
      raw.instructor_uid || raw.instructorUid || raw.instructor_id || raw.instructorId || ""
    ).trim();

    if (instructorUid) {
      rows.push({
        recipient_firebase_uid: instructorUid,
        audience: "user",
        type: "student_enrolled",
        title: "New student enrolled 🎓",
        message: `A student has successfully paid for ${courseName}.`,
        priority: "high",
        action_url: `/instructor/courses.html?courseId=${encodeURIComponent(courseId)}`,
        metadata: { payment_id: payment.id, reference: payment.reference, student_id: userId, course_id: courseId },
        dedupe_key: `${dedupeBase}:instructor:${instructorUid}`
      });
    }
  }

  const { error } = await admin.from("notifications").upsert(rows, {
    onConflict: "dedupe_key",
    ignoreDuplicates: true
  });

  if (error) console.error("Payment notification error:", error);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("OrderTrackingId") || url.searchParams.get("orderTrackingId") || "";
    const merchantReference = url.searchParams.get("OrderMerchantReference") || url.searchParams.get("orderMerchantReference") || "";

    if (!trackingId) {
      return json({ success: true, message: "Pesapal webhook endpoint is active." });
    }

    const token = await getToken();
    const statusUrl = "https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=" + encodeURIComponent(trackingId);
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });

    const result = await response.json();
    if (!response.ok) throw new Error("Unable to verify Pesapal transaction.");

    const paymentStatus = String(result?.payment_status_description || "").toLowerCase();
    const successful = paymentStatus === "completed" || paymentStatus === "successful";
    const paymentReference = merchantReference || result?.merchant_reference || result?.merchant_reference_number || null;

    if (!paymentReference) return json({ success: false, message: "Payment reference missing." }, 400);

    const { data: existing } = await admin.from("payments").select("*").eq("reference", paymentReference).maybeSingle();

    if (!existing) {
      return json({ success: true, message: "Webhook received; payment record not found yet." });
    }

    const wasSuccessful = String(existing.status || "").toLowerCase() === "successful";
    const metadata = {
      ...(existing.metadata || {}),
      pesapal_order_tracking_id: trackingId,
      pesapal_status: result
    };

    const { error } = await admin.from("payments").update({
      status: successful ? "successful" : "pending",
      provider: "pesapal",
      provider_transaction_id: result?.confirmation_code || trackingId,
      payment_method: result?.payment_method || null,
      metadata,
      updated_at: new Date().toISOString()
    }).eq("id", existing.id);

    if (error) throw error;

    if (successful && !wasSuccessful) {
      await notifySuccessfulPayment({ ...existing, status: "successful", metadata });
    }

    return json({ success: true, payment_status: successful ? "successful" : "pending" });
  } catch (error) {
    console.error("Pesapal webhook error:", error);
    return json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, 500);
  }
});
