export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-2033396332836975-072600-1bce4034718a03d373823bf1ba7012e0-222803401';
    
    // Obter ID do pagamento das notificações Webhook / IPN do Mercado Pago
    let paymentId = null;
    const query = event.queryStringParameters || {};
    
    // 1. Tenta query params (IPN padrão: ?id=123456789&topic=payment)
    if (query['data.id']) {
      paymentId = query['data.id'];
    } else if (query.id) {
      paymentId = query.id;
    } else if (query.resource) {
      const match = query.resource.match(/\/(\d+)$/);
      if (match) paymentId = match[1];
    }

    // 2. Tenta corpo JSON ou urlencoded
    if (!paymentId && event.body) {
      try {
        const bodyObj = typeof event.body === 'string' && event.body.startsWith('{') ? JSON.parse(event.body) : {};
        paymentId = bodyObj.data?.id || bodyObj.id;
        if (!paymentId && bodyObj.resource) {
          const match = bodyObj.resource.match(/\/(\d+)$/);
          if (match) paymentId = match[1];
        }
      } catch (e) {}
    }

    if (!paymentId) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', message: 'Notificação IPN recebida (sem id)' }) };
    }

    // Consultar status do pagamento na API do Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!mpRes.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'payment_fetch_failed' }) };
    }

    const paymentData = await mpRes.json();

    // Se o pagamento foi APROVADO, enviar o e-mail com o Livro + Drive + Discord
    if (paymentData.status === 'approved') {
      const payerEmail = paymentData.payer?.email;
      const payerName = paymentData.payer?.first_name || 'Cliente';

      if (payerEmail) {
        await sendAccessEmail(payerEmail, payerName);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'processed', payment_status: paymentData.status })
    };

  } catch (error) {
    console.error('[Webhook Error]', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function sendAccessEmail(toEmail, name) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(`[Email Simulation] Enviando acesso para ${toEmail}`);
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #0d0d12; color: #e4e4e7; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #c9a227; border-radius: 12px; padding: 30px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin-top: 0;">O Livro dos Iniciados</h1>
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Seu pagamento foi confirmado com sucesso! Abaixo estão os links para download do livro e acesso aos seus bônus exclusivos:</p>
            
            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📘 1. Seu E-book Oficial</h3>
                <p style="font-size: 0.9rem;">Baixe o livro digital em PDF:</p>
                <a href="https://iuripiragibe.net/downloads/O-Livro-dos-Iniciados-Iuri-Piragibe.pdf" style="display: inline-block; background: #c9a227; color: #000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📥 Baixar O Livro dos Iniciados (PDF)</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📂 2. Bônus — Acervo com +20.000 Documentos Vazados</h3>
                <p style="font-size: 0.9rem;">Acesse a pasta restrita no Google Drive com manuais rituais internos, sentenças e relatórios sigilosos:</p>
                <a href="https://drive.google.com/drive/folders/1zG4yx8B2S1mh7WiFcquCdMGJH_5y6f52?hl=pt-br" style="display: inline-block; background: #3b82f6; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📂 Acessar Acervo Secreto no Google Drive</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">💬 3. Convite para a Comunidade no Discord</h3>
                <p style="font-size: 0.9rem;">Entre na nossa comunidade exclusiva de Urbex & Sociedades Secretas:</p>
                <a href="https://discord.com/invite/agoraobscur" style="display: inline-block; background: #5865F2; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">💬 Entrar na Comunidade Discord</a>
            </div>

            <p style="font-size: 0.8rem; color: #71717a; margin-top: 25px; border-top: 1px solid #3f3f46; padding-top: 15px;">Dúvidas ou suporte? Responda a este e-mail ou contate iuri@piragibe.com.br.</p>
        </div>
    </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Iuri Piragibe <vendas@iuripiragibe.net>',
      to: [toEmail],
      subject: '📘 Seu Acesso: O Livro dos Iniciados + Acervo Secreto de Documentos',
      html: htmlContent
    })
  });
}
