import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DA_DREAMTECH_BASE_URL = "https://www.dadreamtech.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const merchantKey = Deno.env.get("DA_DREAMTECH_MERCHANT_KEY") || "";
    const apiKey = Deno.env.get("DA_DREAMTECH_API_KEY") || "";
    const clientSecret = Deno.env.get("DA_DREAMTECH_CLIENT_SECRET") || "";
    const environment = Deno.env.get("DA_DREAMTECH_ENVIRONMENT") || "sandbox";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      amount, plan_type, property_id, duration_days, user_id,
      user_email, user_name, type, payment_method,
      phone, account, card_last4,
    } = body;

    if (!amount || !plan_type || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, plan_type, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const refTrx = `DF_${plan_type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const description = type === "featured"
      ? `Featured listing ${duration_days} days`
      : plan_type === "premium_6mo"
      ? "Premium Subscription 6 Months"
      : plan_type === "premium_1yr"
      ? "Premium Subscription 1 Year"
      : "Subscription Payment";

    // Build request body for DA DREAM-TECH — on-site payment (no redirect)
    const paymentBody: Record<string, unknown> = {
      payment_amount: Number(amount),
      currency_code: "UGX",
      ref_trx: refTrx,
      description,
      customer_name: user_name || "",
      customer_email: user_email || "",
      customer_phone: phone || "",
      payment_method: payment_method || "",
      account_number: account || "",
      card_last4: card_last4 || "",
      // On-site mode — no redirects, process directly
      payment_mode: "onsite",
      ipn_url: `${supabaseUrl}/functions/v1/da-dreamtech-webhook`,
    };

    const methodMap: Record<string, string> = {
      mtn_momo: "mtn-momo",
      airtel_money: "airtel-money",
      stanbic_bank: "stanbic-bank",
      centenary_bank: "centenary-bank",
      dfcu_bank: "dfcu-bank",
      equity_bank: "equity-bank",
      postbank_uganda: "postbank-uganda",
      visa_card: "visa",
    };
    if (payment_method && methodMap[payment_method]) {
      paymentBody.allow_payment_methods = [methodMap[payment_method]];
    }

    const rawBody = JSON.stringify(paymentBody);

    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000);
    const method = "POST";
    const pathWithQuery = "/api/v1/initiate-payment";
    const signaturePayload = `${timestamp}.${method}.${pathWithQuery}.${rawBody}`;

    let signature = "";
    if (clientSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(clientSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signaturePayload));
      signature = "sha256=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Environment": environment,
      "X-Merchant-Key": merchantKey,
      "X-API-Key": apiKey,
      "X-Timestamp": timestamp.toString(),
    };
    if (signature) headers["X-Signature"] = signature;

    let daResponse;
    let daResult;

    try {
      const response = await fetch(`${DA_DREAMTECH_BASE_URL}/api/v1/initiate-payment`, {
        method: "POST",
        headers,
        body: rawBody,
      });
      daResult = await response.json();

      if (!response.ok) {
        // DA DREAM-TECH API not available or credentials missing —
        // Record payment as pending for manual verification by DA DREAM-TECH
        await supabase.from("payments").insert({
          user_id,
          amount: Number(amount),
          type: type || "subscription",
          reference: refTrx,
          network: payment_method || "da-dreamtech",
          status: "pending",
          plan_type,
          property_id: property_id || null,
          duration_days: duration_days || null,
        });

        return new Response(
          JSON.stringify({
            status: "pending",
            ref_trx: refTrx,
            message: "Payment submitted for verification by DA DREAM-TECH. Account will activate automatically after confirmation.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      daResponse = daResult;
    } catch {
      // Network error calling DA DREAM-TECH — record as pending
      await supabase.from("payments").insert({
        user_id,
        amount: Number(amount),
        type: type || "subscription",
        reference: refTrx,
        network: payment_method || "da-dreamtech",
        status: "pending",
        plan_type,
        property_id: property_id || null,
        duration_days: duration_days || null,
      });

      return new Response(
        JSON.stringify({
          status: "pending",
          ref_trx: refTrx,
          message: "Payment submitted for verification. Account will activate automatically after confirmation.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DA DREAM-TECH responded — check status
    const paymentStatus = daResponse.status || daResponse.data?.status || "pending";

    if (paymentStatus === "completed" || paymentStatus === "success") {
      // Record as verified
      await supabase.from("payments").insert({
        user_id,
        amount: Number(amount),
        type: type || "subscription",
        reference: refTrx,
        network: payment_method || "da-dreamtech",
        status: "verified",
        plan_type,
        property_id: property_id || null,
        duration_days: duration_days || null,
      });

      // Activate subscription automatically
      if ((type === "subscription" || type === undefined) && plan_type && plan_type !== "free") {
        const planDays = plan_type === "premium_6mo" ? 180 : 365;
        const expiry = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", user_id)
          .eq("status", "active");

        await supabase.from("subscriptions").insert({
          user_id,
          plan_type,
          price_paid: Number(amount),
          start_date: new Date().toISOString(),
          expiry_date: expiry,
          status: "active",
          payment_reference: refTrx,
        });
      }

      // Activate featured listing
      if (type === "featured" && property_id) {
        const durDays = duration_days || 7;
        const expiry = new Date(Date.now() + durDays * 24 * 60 * 60 * 1000).toISOString();

        await supabase.from("featured_listings").insert({
          property_id,
          user_id,
          duration_days: durDays,
          price_paid: Number(amount),
          start_date: new Date().toISOString(),
          expiry_date: expiry,
          status: "active",
          payment_reference: refTrx,
        });
      }

      return new Response(
        JSON.stringify({ status: "completed", ref_trx: refTrx }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment submitted but pending confirmation
    await supabase.from("payments").insert({
      user_id,
      amount: Number(amount),
      type: type || "subscription",
      reference: refTrx,
      network: payment_method || "da-dreamtech",
      status: "pending",
      plan_type,
      property_id: property_id || null,
      duration_days: duration_days || null,
    });

    return new Response(
      JSON.stringify({
        status: "pending",
        ref_trx: refTrx,
        message: "Payment submitted. DA DREAM-TECH will confirm and activate your account automatically.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
