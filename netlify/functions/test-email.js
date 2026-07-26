export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const query = event.queryStringParameters || {};
  const email = query.email || 'iuri@piragibe.com.br';
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: 'A variável RESEND_API_KEY não foi configurada nas variáveis de ambiente do Netlify.',
        instruction: 'Acesse o Netlify -> Site Configuration -> Environment variables -> Adicione RESEND_API_KEY com a sua chave do site resend.com'
      })
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #0d0d12; color: #e4e4e7; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #c9a227; border-radius: 12px; padding: 30px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin-top: 0;">O Livro dos Iniciados (Teste de Envio)</h1>
            <p>Olá! Este é um e-mail de teste de confirmação de entrega do sistema.</p>
            
            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📘 1. O Livro dos Iniciados (PDF)</h3>
                <a href="https://iuripiragibe.net/downloads/O-Livro-dos-Iniciados-Iuri-Piragibe.pdf" style="display: inline-block; background: #c9a227; color: #000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📥 Baixar O Livro dos Iniciados (PDF)</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📖 2. Deusa da Discórdia: Livro I (PDF)</h3>
                <a href="https://iuripiragibe.net/downloads/Deusa-da-Discordia-Iuri-Piragibe.pdf" style="display: inline-block; background: #c9a227; color: #000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📥 Baixar Deusa da Discórdia (PDF)</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">📂 3. Bônus — Acervo com +20.000 Documentos Vazados</h3>
                <a href="https://drive.google.com/drive/folders/1zG4yx8B2S1mh7WiFcquCdMGJH_5y6f52?hl=pt-br" style="display: inline-block; background: #3b82f6; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">📂 Acessar Acervo Secreto no Google Drive</a>
            </div>

            <div style="background: #27272a; border-radius: 8px; padding: 18px; margin: 15px 0;">
                <h3 style="color: #e2c04a; margin-top: 0;">💬 4. Convite para a Comunidade no Discord</h3>
                <a href="https://discord.com/invite/agoraobscur" style="display: inline-block; background: #5865F2; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px;">💬 Entrar na Comunidade Discord</a>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: '🧪 Teste de Entrega: O Livro dos Iniciados + Acervo Secreto',
        html: htmlContent
      })
    });

    const resData = await res.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: res.ok ? 'success' : 'error',
        message: res.ok ? `E-mail enviado com sucesso para ${email}!` : 'Falha no envio pelo Resend.',
        resendResponse: resData,
        senderUsed: fromEmail
      })
    };
  } catch(err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', message: err.message })
    };
  }
}
