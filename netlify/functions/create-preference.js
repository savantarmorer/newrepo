export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-4692020958918626-072604-2191846a86b3a5d90480a83c5b83d9e6-3569357018';
    const bodyData = JSON.parse(event.body || '{}');

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: bodyData.title || 'O Livro dos Iniciados + Deusa da Discórdia - Iuri Piragibe',
            unit_price: Number(bodyData.price || 1.00),
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: bodyData.email || 'cliente@exemplo.com',
          name: bodyData.name || 'Cliente'
        },
        metadata: {
          payer_email: bodyData.email,
          payer_name: bodyData.name
        },
        external_reference: bodyData.email,
        notification_url: 'https://iuripiragibe.net/api/webhook',
        back_urls: {
          success: 'https://iuripiragibe.net/material-oculto.html?status=success',
          failure: 'https://iuripiragibe.net/material-oculto.html?status=failure'
        },
        auto_return: 'approved'
      })
    });

    const data = await mpResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
