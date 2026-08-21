import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PESAPAL_KEY = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
const PESAPAL_SECRET = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });

async function getToken() {
  const response = await fetch(
    "https://pay.pesapal.com/v3/api/Auth/RequestToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_KEY,
        consumer_secret: PESAPAL_SECRET
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error("Pesapal authentication failed.");
  }

  return data.token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const url = new URL(req.url);

    const trackingId =
      url.searchParams.get("OrderTrackingId") ||
      url.searchParams.get("orderTrackingId") ||
      "";

    const merchantReference =
      url.searchParams.get("OrderMerchantReference") ||
      url.searchParams.get("orderMerchantReference") ||
      "";

    if (!trackingId) {
      return json({
        success: true,
        message: "Pesapal webhook endpoint is active."
      });
    }

    const token = await getToken();

    const statusUrl =
      "https://pay.pesapal.com/v3/api/Transactions/" +
      "GetTransactionStatus?orderTrackingId=" +
      encodeURIComponent(trackingId);

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Pesapal status error:", result);
      throw new Error(
        "Unable to verify Pesapal transaction."
      );
    }

    const paymentStatus =
      String(
        result?.payment_status_description || ""
      ).toLowerCase();

    const successful =
      paymentStatus === "completed" ||
      paymentStatus === "successful";

    const paymentReference =
      merchantReference ||
      result?.merchant_reference ||
      result?.merchant_reference_number ||
      null;

    if (!paymentReference) {
      return json({
        success: false,
        message: "Payment reference missing."
      }, 400);
    }

    const { data: existing } = await admin
      .from("payments")
      .select("*")
      .eq("reference", paymentReference)
      .maybeSingle();

    if (!existing) {
      console.warn(
        "Payment record not found:",
        paymentReference
      );

      return json({
        success: true,
        message:
          "Webhook received; payment record not found yet."
      });
    }

    const metadata = {
      ...(existing.metadata || {}),
      pesapal_order_tracking_id: trackingId,
      pesapal_status: result
    };

    const { error } = await admin
      .from("payments")
      .update({
        status: successful
          ? "successful"
          : "pending",

        provider: "pesapal",

        provider_transaction_id:
          result?.confirmation_code ||
          trackingId,

        payment_method:
          result?.payment_method || null,

        metadata
      })
      .eq("id", existing.id);

    if (error) {
      throw error;
    }

    return json({
      success: true,
      payment_status: successful
        ? "successful"
        : "pending"
    });

  } catch (error) {
    console.error(
      "Pesapal webhook error:",
      error
    );

    return json({
      error:
        error instanceof Error
          ? error.message
          : "Webhook processing failed."
    }, 500);
  }
});
