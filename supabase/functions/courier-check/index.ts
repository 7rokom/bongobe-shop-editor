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
    
    const res = await fetch("https://bdcourier.com/api/courier-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    console.log("bdcourier response:", JSON.stringify(data));

    // bdcourier returns data in different possible structures
    const courierData = data?.courier_data || data?.data?.courier_data || data;
    const all = courierData?.all || courierData?.total || 0;
    const delivered = courierData?.delivered || courierData?.success || 0;
    const returned = courierData?.returned || courierData?.cancelled || 0;

    return new Response(
      JSON.stringify({ all, delivered, returned, raw: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("courier-check error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check courier", all: 0, delivered: 0, returned: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
