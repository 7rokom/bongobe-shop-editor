const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('MOHASAGOR_API_KEY')
    const secretKey = Deno.env.get('MOHASAGOR_SECRET_KEY')

    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ error: 'API keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const page = url.searchParams.get('page') || '1'

    const response = await fetch(`https://mohasagor.com.bd/api/reseller/product?page=${page}`, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'secret-key': secretKey,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(JSON.stringify({ error: `Mohasagor API error [${response.status}]: ${text}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
