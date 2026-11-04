import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    const { data, status, message } = payload;

    if (!data || !data.ref_trx) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const refTrx = data.ref_trx;
    const paymentStatus = status; // "completed", "pending", "failed"

    // Find the payment record by reference
    const { data: payment, error: findErr } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", refTrx)
      .maybeSingle();

    if (findErr || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (paymentStatus === "completed") {
      // Mark payment as verified
      await supabase
        .from("payments")
        .update({ status: "verified" })
        .eq("id", payment.id);

      // If it's a subscription payment, activate the subscription
      if (payment.type === "subscription" && payment.plan_type && payment.plan_type !== "free") {
        const planDays = payment.plan_type === "premium_6mo" ? 180 : 365;
        const expiry = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString();

        // Expire existing active subscriptions
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", payment.user_id)
          .eq("status", "active");

        // Create new active subscription
        await supabase.from("subscriptions").insert({
          user_id: payment.user_id,
          plan_type: payment.plan_type,
          price_paid: Number(payment.amount),
          start_date: new Date().toISOString(),
          expiry_date: expiry,
          status: "active",
          payment_reference: refTrx,
        });
      }

      // If it's a featured listing payment, activate the featured listing
      if (payment.type === "featured" && payment.property_id) {
        const durationDays = payment.duration_days || 7;
        const expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        await supabase.from("featured_listings").insert({
          property_id: payment.property_id,
          user_id: payment.user_id,
          duration_days: durationDays,
          price_paid: Number(payment.amount),
          start_date: new Date().toISOString(),
          expiry_date: expiry,
          status: "active",
          payment_reference: refTrx,
        });
      }
    } else if (paymentStatus === "failed") {
      await supabase
        .from("payments")
        .update({ status: "declined" })
        .eq("id", payment.id);
    }

    return new Response(
      JSON.stringify({ received: true, status: paymentStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
