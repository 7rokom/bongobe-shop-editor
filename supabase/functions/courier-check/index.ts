import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, apiKey } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = apiKey || Deno.env.get("BDCOURIER_API_KEY") || "";
    
    const res = await fetch("https://api.bdcourier.com/courier-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    // Check for API errors (limit exceeded, invalid key, etc.)
    if (data?.status === "error" || data?.error) {
      return new Response(
        JSON.stringify({ error: data?.message || data?.error || "API error", all: 0, delivered: 0, returned: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // bdcourier API returns: { courierData: { summary: { total_parcel, success_parcel, cancelled_parcel, success_ratio } } }
    const summary = data?.courierData?.summary || data?.courier_data?.summary || data?.data?.summary || {};
    const all = summary.total_parcel || 0;
    const delivered = summary.success_parcel || 0;
    const returned = summary.cancelled_parcel || 0;

    return new Response(
      JSON.stringify({ all, delivered, returned }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to check courier", all: 0, delivered: 0, returned: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
