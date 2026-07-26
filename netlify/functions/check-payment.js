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
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-4692020958918626-072604-2191846a86b3a5d90480a83c5b83d9e6-3569357018';
    const query = event.queryStringParameters || {};
    const paymentId = query.id;

    if (!paymentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID do pagamento não informado' }) };
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!mpRes.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'pending' }) };
    }

    const data = await mpRes.json();

    // Se aprovado, garante o envio de e-mail se houver chave Resend
    if (data.status === 'approved' && data.payer?.email) {
      try {
        await sendAccessEmail(data.payer.email, data.payer.first_name || 'Cliente');
      } catch (e) {}
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: data.status,
        status_detail: data.status_detail,
        payer_email: data.payer?.email
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'pending' })
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
