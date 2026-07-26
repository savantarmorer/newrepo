export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/html; charset=utf-8'
  };

  try {
    const query = event.queryStringParameters || {};
    const code = query.code;
    const error = query.error;

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: `
          <!DOCTYPE html>
          <html>
          <head><title>Erro na Conexão OAuth</title></head>
          <body style="font-family: sans-serif; background: #0d0d12; color: #ef4444; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #ef4444;">
              <h2>❌ Erro na Autorização OAuth</h2>
              <p>Mercado Pago retornou: <strong>${error}</strong></p>
              <a href="/material-oculto.html" style="color: #60a5fa;">Voltar ao site</a>
            </div>
          </body>
          </html>
        `
      };
    }

    if (!code) {
      return {
        statusCode: 200,
        headers,
        body: `
          <!DOCTYPE html>
          <html>
          <head><title>URL de Redirecionamento OAuth Mercado Pago</title></head>
          <body style="font-family: sans-serif; background: #0d0d12; color: #e4e4e7; padding: 40px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #c9a227;">
              <h2 style="color: #e2c04a;">🔑 URL de Redirecionamento OAuth Configurada</h2>
              <p>Esta é a URL de Callback oficial configurada para autorizações OAuth do Mercado Pago:</p>
              <code style="background: #27272a; padding: 8px 14px; border-radius: 6px; color: #4ade80; display: inline-block; margin: 10px 0;">https://iuripiragibe.net/api/oauth/callback</code>
              <p style="font-size: 0.85rem; color: #a1a1aa;">Ao autorizar a aplicação, o Mercado Pago redirecionará para este endereço com o código de autorização.</p>
              <br>
              <a href="/material-oculto.html" style="color: #60a5fa; text-decoration: none; font-weight: bold;">← Voltar à Página de Vendas</a>
            </div>
          </body>
          </html>
        `
      };
    }

    // Se o código foi recebido, efetua a troca pelo Access Token com o Mercado Pago
    const clientId = process.env.MERCADO_PAGO_CLIENT_ID || '4692020958918626';
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET || '1djbl8tpfq5t2r4GqLasSYJodPtS07kV';
    const redirectUri = 'https://iuripiragibe.net/api/oauth/callback';

    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();

    return {
      statusCode: 200,
      headers,
      body: `
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Mercado Pago Conectado</title></head>
        <body style="font-family: sans-serif; background: #0d0d12; color: #e4e4e7; padding: 40px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #4ade80;">
            <h2 style="color: #4ade80;">🎉 Mercado Pago Conectado com Sucesso via OAuth!</h2>
            <p>Sua aplicação foi vinculada à conta do Mercado Pago.</p>
            <p style="font-size: 0.85rem; color: #a1a1aa;">User ID Mercado Pago: <strong>${tokenData.user_id || 'Conectado'}</strong></p>
            <br>
            <a href="/material-oculto.html" style="background: #c9a227; color: #000; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 6px;">Ir para a Página Principal</a>
          </div>
        </body>
        </html>
      `
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: `<h3>Erro no processamento do callback OAuth: ${err.message}</h3>`
    };
  }
}
