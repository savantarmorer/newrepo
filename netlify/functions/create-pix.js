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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-2033396332836975-072600-1bce4034718a03d373823bf1ba7012e0-222803401';
    const bodyData = JSON.parse(event.body || '{}');

    const nameParts = (bodyData.name || 'Cliente Leitor').trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Leitor';
    const cleanCpf = (bodyData.cpf || '19100000000').replace(/\D/g, '');

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': 'pix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
      },
      body: JSON.stringify({
        transaction_amount: Number(bodyData.price || 99.90),
        description: bodyData.title || 'O Livro dos Iniciados - Iuri Piragibe',
        payment_method_id: 'pix',
        notification_url: 'https://iuripiragibe.net/api/webhook',
        payer: {
          email: bodyData.email || 'cliente@exemplo.com',
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: cleanCpf.length === 11 ? cleanCpf : '19100000000'
          }
        }
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
