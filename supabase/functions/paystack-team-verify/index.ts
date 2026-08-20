import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const PRICE_PER_SEAT_KES = 2500;

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { reference, userId, seats } = await req.json();

    if (!reference || !userId) {
      return new Response(JSON.stringify({ error: "Missing reference or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Number.isInteger(seats) || seats < 1) {
      return new Response(JSON.stringify({ error: "Invalid seat count" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return new Response(
        JSON.stringify({ verified: false, error: "Transaction not successful" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const expectedAmount = seats * PRICE_PER_SEAT_KES * 100;
    if (verifyData.data.amount !== expectedAmount) {
      return new Response(
        JSON.stringify({ verified: false, error: "Amount mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate a unique invite code (retry on rare collision)
    let inviteCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode();
      const { data: existing } = await supabase
        .from("company_licenses")
        .select("id")
        .eq("invite_code", candidate)
        .maybeSingle();
      if (!existing) {
        inviteCode = candidate;
        break;
      }
    }

    if (!inviteCode) {
      return new Response(
        JSON.stringify({ error: "Failed to generate unique invite code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: license, error: insertError } = await supabase
      .from("company_licenses")
      .insert({
        admin_user_id: userId,
        seats,
        amount_paid: seats * PRICE_PER_SEAT_KES,
        paystack_reference: reference,
        invite_code: inviteCode,
        status: "active",
      })
      .select("id, invite_code, seats, amount_paid, status, created_at")
      .maybeSingle();

    if (insertError || !license) {
      return new Response(
        JSON.stringify({ error: insertError?.message || "Failed to create license record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ verified: true, license }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Team verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
