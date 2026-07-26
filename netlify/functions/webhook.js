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
    
    let paymentId = null;
    const query = event.queryStringParameters || {};
    
    // Extrair ID do pagamento (IPN / Webhook)
    if (query['data.id']) {
      paymentId = query['data.id'];
    } else if (query.id) {
      paymentId = query.id;
    } else if (query.resource) {
      const match = query.resource.match(/\/(\d+)$/);
      if (match) paymentId = match[1];
    }

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

    // Se for um ID real e não o teste genérico '123456'
    // Se for simulação de teste direto do site
    if (paymentId === 'test_approved_simulation') {
      const simEmail = query.email || 'iuri@piragibe.com.br';
      await sendAccessEmail(simEmail, 'Cliente Teste');
    } else if (paymentId && paymentId !== '123456') {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (mpRes.ok) {
          const paymentData = await mpRes.json();
          if (paymentData.status === 'approved' && paymentData.payer?.email) {
            const payerName = paymentData.payer?.first_name || 'Cliente';
            await sendAccessEmail(paymentData.payer.email, payerName);
          }
        }
      } catch (err) {
        console.error('[MercadoPago Fetch Error]', err);
      }
    }

    // Retorna SEMPRE 200 OK com status 'ok' para validação imediata do teste no Mercado Pago
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', message: 'Notificacao IPN recebida com sucesso' })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok' })
    };
  }
}

async function sendAccessEmail(toEmail, name) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(`[Email Simulation] RESEND_API_KEY ausente. Não foi possível enviar para ${toEmail}`);
    return { success: false, reason: 'RESEND_API_KEY ausente no Netlify' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const buyerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #0d0d12; color: #e4e4e7; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #c9a227; border-radius: 12px; padding: 30px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin-top: 0;">O Livro dos Iniciados + Deusa da Discórdia</h1>
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Seu pagamento de <strong>R$ 99,90</strong> foi confirmado com sucesso! Abaixo estão seus links de download e acesso imediato:</p>
            
            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📘 1. O Livro dos Iniciados (PDF)</h3>
                <p style="font-size: 0.9rem;">Seitas, Ordens Secretas e os Ritos que Ninguém Deveria Ver:</p>
                <a href="https://iuripiragibe.net/downloads/O-Livro-dos-Iniciados-Iuri-Piragibe.pdf" style="display: inline-block; background: #c9a227; color: #000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📥 Baixar O Livro dos Iniciados (PDF)</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📖 2. Deusa da Discórdia: Livro I (PDF)</h3>
                <p style="font-size: 0.9rem;">Obra de ficção científica especulativa, thriller psicológico e filosofia existencial de Iuri Tato Piragibe:</p>
                <a href="https://iuripiragibe.net/downloads/Deusa-da-Discordia-Iuri-Piragibe.pdf" style="display: inline-block; background: #c9a227; color: #000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📥 Baixar Deusa da Discórdia (PDF)</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📂 3. Bônus — Acervo com +20.000 Documentos Vazados</h3>
                <p style="font-size: 0.9rem;">Acesse a pasta restrita no Google Drive com manuais rituais internos, sentenças e relatórios sigilosos:</p>
                <a href="https://drive.google.com/drive/folders/1zG4yx8B2S1mh7WiFcquCdMGJH_5y6f52?hl=pt-br" style="display: inline-block; background: #3b82f6; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📂 Acessar Acervo Secreto no Google Drive</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">💬 4. Convite para a Comunidade no Discord</h3>
                <p style="font-size: 0.9rem;">Entre na nossa comunidade exclusiva de Urbex & Sociedades Secretas:</p>
                <a href="https://discord.com/invite/agoraobscur" style="display: inline-block; background: #5865F2; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">💬 Entrar na Comunidade Discord</a>
            </div>

            <p style="font-size: 0.8rem; color: #71717a; margin-top: 25px; border-top: 1px solid #3f3f46; padding-top: 15px;">Dúvidas ou suporte? Responda a este e-mail ou contate iuri@piragibe.com.br.</p>
        </div>
    </body>
    </html>
  `;

  const sellerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #0d0d12; color: #e4e4e7; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #4ade80; border-radius: 12px; padding: 30px;">
            <h1 style="color: #4ade80; font-size: 24px; margin-top: 0;">🎉 Nova Venda Confirmada: R$ 99,90</h1>
            <p>Parabéns, Iuri! Uma nova compra foi realizada e aprovada no seu site:</p>
            <ul style="background: #27272a; padding: 15px 25px; border-radius: 8px; line-height: 1.8;">
                <li><strong>Cliente:</strong> ${name}</li>
                <li><strong>E-mail:</strong> ${toEmail}</li>
                <li><strong>Valor:</strong> R$ 99,90</li>
                <li><strong>Produto:</strong> O Livro dos Iniciados + Deusa da Discórdia + Acervo 20k Docs</li>
            </ul>
            <p style="font-size: 0.85rem; color: #a1a1aa;">Os e-mails de acesso contendo os 2 livros em PDF, o link do Google Drive e a comunidade do Discord já foram entregues ao comprador automaticamente.</p>
        </div>
    </body>
    </html>
  `;

  try {
    // 1. Envia e-mail de acesso para o comprador
    const resBuyer = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: '📘 Seu Acesso: O Livro dos Iniciados + Deusa da Discórdia + Acervo Secreto',
        html: buyerHtml
      })
    });

    const buyerData = await resBuyer.json();

    // 2. Notifica o vendedor (iuri@piragibe.com.br)
    if (toEmail !== 'iuri@piragibe.com.br') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: ['iuri@piragibe.com.br'],
          subject: `🚨 NOVA VENDA (R$ 99,90): ${name} (${toEmail})`,
          html: sellerHtml
        })
      }).catch(() => {});
    }

    return { success: resBuyer.ok, data: buyerData };
  } catch(err) {
    return { success: false, error: err.message };
  }
}
