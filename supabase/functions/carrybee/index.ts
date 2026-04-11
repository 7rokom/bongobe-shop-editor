const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CARRYBEE_BASE = 'https://developers.carrybee.com/api/v2'

function authHeaders(clientId: string, clientSecret: string, clientContext: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Client-ID': clientId,
    'Client-Secret': clientSecret,
    'Client-Context': clientContext,
  }
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

    const headers = authHeaders(clientId, clientSecret, clientContext)

    if (action === 'get_stores') {
      const res = await fetch(`${CARRYBEE_BASE}/stores`, { headers })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_cities') {
      const res = await fetch(`${CARRYBEE_BASE}/cities`, { headers })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_zones') {
      const res = await fetch(`${CARRYBEE_BASE}/cities/${params.city_id}/zones`, { headers })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'address_details') {
      const res = await fetch(`${CARRYBEE_BASE}/address-details`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: params.query }),
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create_order') {
      const orderBody: Record<string, unknown> = {
        store_id: params.store_id,
        merchant_order_id: params.merchant_order_id,
        delivery_type: params.delivery_type || 1,
        product_type: params.product_type || 1,
        recipient_name: params.recipient_name,
        recipient_phone: params.recipient_phone,
        recipient_address: params.recipient_address,
        city_id: params.city_id,
        zone_id: params.zone_id,
        collectable_amount: params.collectable_amount,
        item_weight: params.item_weight || 500,
      }
      if (params.area_id) orderBody.area_id = params.area_id
      if (params.product_description) orderBody.product_description = params.product_description
      if (params.item_quantity) orderBody.item_quantity = params.item_quantity
      if (params.special_instruction) orderBody.special_instruction = params.special_instruction

      const res = await fetch(`${CARRYBEE_BASE}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderBody),
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'check_status') {
      const res = await fetch(`${CARRYBEE_BASE}/orders/${params.consignment_id}/details`, { headers })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'cancel_order') {
      const res = await fetch(`${CARRYBEE_BASE}/orders/${params.consignment_id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cancellation_reason: params.cancellation_reason || 'Cancelled by merchant' }),
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
