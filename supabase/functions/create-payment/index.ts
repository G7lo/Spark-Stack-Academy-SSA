import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PESAPAL_KEY = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
const PESAPAL_SECRET = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const PESAPAL_BASE = "https://pay.pesapal.com/v3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
}

async function getToken() {
  const response = await fetch(
    PESAPAL_BASE + "/api/Auth/RequestToken",
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
    console.error("Pesapal authentication failed:", data);
    throw new Error("Unable to authenticate with Pesapal.");
  }

  return data.token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: cors
    });
  }

  try {
    if (req.method !== "POST") {
      return json(
        { error: "POST request required." },
        405
      );
    }

    const body = await req.json();

    const userId = String(body.user_id || "").trim();
    const email = String(body.email || "").trim();
    const courseId = String(body.course_id || "").trim();
    const courseName = String(
      body.course_name || "SSA Course"
    ).trim();

    const amount = Number(body.amount);

    if (!userId || !email || !amount || amount <= 0) {
      return json(
        {
          error:
            "user_id, email and valid amount are required."
        },
        400
      );
    }

    const reference =
      "SSA-" +
      Date.now() +
      "-" +
      crypto.randomUUID().slice(0, 8);

    const token = await getToken();

    const callbackUrl =
      SUPABASE_URL +
      "/functions/v1/payment-webhook";

    const order = {
      id: reference,
      currency: "KES",
      amount: amount,
      description:
        courseName +
        " - Spark Stack Academy",
      callback_url: callbackUrl,
      billing_address: {
        email_address: email
      }
    };

    const response = await fetch(
      PESAPAL_BASE +
      "/api/Transactions/SubmitOrderRequest",
      {
        method: "POST",
        headers: {
          "Authorization":
            "Bearer " + token,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(order)
      }
    );

    const result = await response.json();

    if (!response.ok || !result.redirect_url) {
      console.error(
        "Pesapal order failed:",
        result
      );

      throw new Error(
        result.message ||
        "Unable to create Pesapal payment."
      );
    }

    const { error } = await admin
      .from("payments")
      .insert({
        user_id: userId,
        course_id: courseId || null,
        course_name: courseName,
        amount: amount,
        currency: "KES",
        reference: reference,
        provider: "pesapal",
        customer_email: email,
        status: "pending",
        metadata: {
          pesapal_order_tracking_id:
            result.order_tracking_id
        }
      });

    if (error) {
      console.error(
        "Payment database error:",
        error
      );

      throw error;
    }

    return json({
      success: true,
      reference: reference,
      order_tracking_id:
        result.order_tracking_id,
      authorization_url:
        result.redirect_url
    });

  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment initialization failed."
      },
      500
    );
  }
});