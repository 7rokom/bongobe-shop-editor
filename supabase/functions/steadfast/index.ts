const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STEADFAST_BASE = 'https://portal.packzy.com/api/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, apiKey, secretKey, ...params } = body

    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ status: 400, message: 'API Key এবং Secret Key দিন' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'Secret-Key': secretKey,
    }

    if (action === 'create_order') {
      const res = await fetch(`${STEADFAST_BASE}/create_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          invoice: params.invoice,
          recipient_name: params.recipient_name,
          recipient_phone: params.recipient_phone,
          recipient_address: params.recipient_address,
          cod_amount: params.cod_amount,
          note: params.note || '',
        }),
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'check_status') {
      const res = await fetch(`${STEADFAST_BASE}/status_by_cid/${params.consignment_id}`, {
        headers,
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'cancel_order') {
      const res = await fetch(`${STEADFAST_BASE}/cancel_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ consignment_id: params.consignment_id }),
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'bulk_status') {
      const res = await fetch(`${STEADFAST_BASE}/status_by_invoice/${params.invoice}`, {
        headers,
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ status: 400, message: `Unknown action: ${action}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ status: 500, message: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
