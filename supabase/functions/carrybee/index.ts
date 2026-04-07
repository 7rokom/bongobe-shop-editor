const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CARRYBEE_BASE = 'https://api.carrybee.com/api/v1'

async function getToken(clientId: string, clientSecret: string, clientContext: string): Promise<string | null> {
  const res = await fetch(`${CARRYBEE_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      client_context: clientContext,
    }),
  })
  const data = await res.json()
  return data?.data?.token || data?.token || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, clientId, clientSecret, clientContext, ...params } = body

    if (!clientId || !clientSecret || !clientContext) {
      return new Response(JSON.stringify({ error: true, message: 'CarryBee API credentials দিন' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = await getToken(clientId, clientSecret, clientContext)
    if (!token) {
      return new Response(JSON.stringify({ error: true, message: 'CarryBee লগইন ব্যর্থ। API credentials চেক করুন।' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    if (action === 'get_stores') {
      const res = await fetch(`${CARRYBEE_BASE}/stores`, { headers: authHeaders })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create_order') {
      const res = await fetch(`${CARRYBEE_BASE}/orders`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          store_id: params.store_id,
          merchant_order_id: params.merchant_order_id,
          recipient_name: params.recipient_name,
          recipient_phone: params.recipient_phone,
          recipient_address: params.recipient_address,
          city_id: params.city_id,
          zone_id: params.zone_id,
          collectable_amount: params.collectable_amount,
          product_description: params.product_description,
          item_quantity: params.item_quantity,
          item_weight: params.item_weight || 500,
        }),
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'check_status') {
      const res = await fetch(`${CARRYBEE_BASE}/orders/${params.consignment_id}`, {
        headers: authHeaders,
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: true, message: `Unknown action: ${action}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: true, message: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
