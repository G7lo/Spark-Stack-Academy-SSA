```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY")!;

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {

    if (req.method !== "POST") {
      return json(
        { error: "POST request required." },
        405
      );
    }

    const body = await req.json();

    const transactionId = String(
      body.transaction_id || ""
    ).trim();

    const userId = String(
      body.user_id || ""
    ).trim();

    if (!transactionId || !userId) {
      return json(
        {
          error:
            "transaction_id and user_id are required."
        },
        400
      );
    }

    /*
     * --------------------------------------------------
     * VERIFY TRANSACTION WITH FLUTTERWAVE
     * --------------------------------------------------
     */

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(
        transactionId
      )}/verify`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Flutterwave verification failed:",
        result
      );

      return json(
        {
          error: "Unable to verify transaction."
        },
        502
      );
    }

    const transaction = result?.data;

    /*
     * --------------------------------------------------
     * CHECK PAYMENT STATUS
     * --------------------------------------------------
     */

    if (
      result?.status !== "success" ||
      transaction?.status !== "successful"
    ) {

      return json(
        {
          success: false,
          status: transaction?.status || "failed",
          message: "Payment was not successful."
        },
        400
      );

    }

    /*
     * --------------------------------------------------
     * EXTRACT PAYMENT DATA
     * --------------------------------------------------
     */

    const amount = Number(
      transaction.amount || 0
    );

    const currency =
      transaction.currency || "KES";

    const reference =
      transaction.tx_ref ||
      transaction.flw_ref ||
      `FLW-${transaction.id}`;

    const courseId =
      transaction.meta?.courseId ||
      body.course_id ||
      null;

    const courseName =
      transaction.meta?.courseName ||
      body.course_name ||
      "Course Payment";

    const email =
      transaction.customer?.email ||
      body.email ||
      null;

    /*
     * --------------------------------------------------
     * PREVENT DUPLICATE PAYMENT
     * --------------------------------------------------
     */

    const { data: existing } = await admin
      .from("payments")
      .select("id,status,reference")
      .eq("reference", reference)
      .maybeSingle();

    if (existing) {

      return json({
        success: true,
        alreadyProcessed: true,
        payment: existing
      });
    }

    /*
     * --------------------------------------------------
     * SAVE PAYMENT
     * --------------------------------------------------
     */

    const { data: payment, error } = await admin
      .from("payments")
      .insert({
        user_id: userId,
        course_id: courseId,
        course_name: courseName,
        amount,
        currency,
        reference,
        provider: "flutterwave",
        customer_email: email,
        status: "successful",
        provider_transaction_id:
          String(transaction.id),
        payment_method:
          transaction.payment_type || null,
        metadata: {
          flutterwave_transaction_id:
            transaction.id,
          flw_ref:
            transaction.flw_ref || null,
          tx_ref:
            transaction.tx_ref || null
        }
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Payment insert failed:",
        error
      );

      throw error;
    }

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return json({
      success: true,
      message: "Payment verified successfully.",
      payment
    });

  } catch (error) {

    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed."
      },
      500
    );
  }
});
```
