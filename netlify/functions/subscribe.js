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
    const bodyData = JSON.parse(event.body || '{}');
    const email = bodyData.email;

    if (!email || !email.includes('@')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'E-mail inválido' }) };
    }

    console.log(`[Newsletter Subscriber] Novo leitor inscrito: ${email}`);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Iuri Piragibe <vendas@iuripiragibe.net>';
      
      // Notifica o autor e envia boas-vindas ao leitor
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: '🔍 Bem-vindo à Newsletter Secreta de Iuri Piragibe',
          html: `
            <div style="font-family: Arial, sans-serif; background: #0d0d12; color: #e4e4e7; padding: 25px;">
              <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #c9a227; border-radius: 10px; padding: 25px;">
                <h2 style="color: #facc15; margin-top: 0;">Bem-vindo ao Círculo de Leitores!</h2>
                <p>Olá!</p>
                <p>Sua inscrição na <strong>Newsletter Investigativa Secreta</strong> foi confirmada. A partir de agora, você receberá análises inéditas, bastidores de apurações sobre sociedades secretas e avisos sobre novos vídeos e livros diretamente aqui.</p>
                <p style="margin-top: 20px;"><a href="https://iuripiragibe.net/material-oculto.html" style="color: #facc15; font-weight: bold;">📘 Conheça O Livro dos Iniciados + Deusa da Discórdia</a></p>
                <p style="font-size: 0.8rem; color: #71717a; margin-top: 25px; border-top: 1px solid #27272a; padding-top: 10px;">Iuri Piragibe • Jornalismo Investigativo</p>
              </div>
            </div>
          `
        })
      }).catch(() => {});
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'success', message: 'Inscrição realizada com sucesso' })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'success' })
    };
  }
}
