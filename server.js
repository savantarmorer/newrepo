/**
 * Servidor Express: páginas estáticas, proxy Base dos Dados, API de participação cívica (Câmara + e-mail)
 * e API de indexação do Google Drive (Biblioteca de Documentos).
 * Requer Node 18+ (fetch nativo). Com `"type": "module"`, este ficheiro usa apenas ESM.
 * Carrega `.env` na raiz do projeto (se existir) para RESEND_API_KEY / SMTP sem export manual.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import {
  listarDeputados,
  obterDeputadoParaEnvio,
  agregarNoticias,
  DEFAULT_NEWS_FEEDS
} from './lib/civicBackend.js';
import { indexarDrives, buscarArquivos } from './lib/driveIndexer.js';
import { sync as syncEmbeddings } from './scripts/sync-embeddings.js';
import { getUser, getOrCreateProfile, recordView, getProfileStats, toggleBookmark, getBookmarks } from './lib/amoqAuth.js';
import { getGrauInfo, xpParaProximoGrau, GRAUS_AMOQ, GOETIA_72 } from './lib/goetia.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '48kb' }));
app.use(cookieParser());

// ── Middleware de autenticação AMOQ ───────────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.cookies?.amoq_token;
  if (!token) return res.status(401).json({ error: 'Autenticação necessária' });
  const user = await getUser(token);
  if (!user || user.error) return res.status(401).json({ error: 'Token inválido ou expirado' });
  req.amoqUser = user;
  req.amoqToken = token;
  next();
}

// ── Rotas de Auth AMOQ ────────────────────────────────────────────────────────

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.amoqUser.id);
    const grauInfo = getGrauInfo(profile.grau || 1);
    const xpFalta  = xpParaProximoGrau(profile.xp || 0);
    const proximoGrau = GRAUS_AMOQ.find(g => g.grau === grauInfo.grau + 1) || null;
    res.json({
      id:          req.amoqUser.id,
      email:       req.amoqUser.email,
      grau:        grauInfo,
      xp:          profile.xp || 0,
      xpFalta,
      xpProximo:   proximoGrau?.xpRequired ?? null,
      demon:       { num: profile.demon_num, nome: profile.demon_nome, rank: profile.demon_rank },
    });
  } catch (e) {
    console.error('[auth/me]', e);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});

app.post('/api/auth/view', requireAuth, async (req, res) => {
  const { documentId, documentName, documentTema } = req.body || {};
  if (!documentId) return res.status(400).json({ error: 'documentId obrigatório' });
  try {
    const resultado = await recordView(req.amoqUser.id, documentId, documentName, documentTema);
    const grauInfo  = getGrauInfo(resultado.grau);
    const xpFalta   = xpParaProximoGrau(resultado.totalXP);
    res.json({ ...resultado, grauInfo, xpFalta });
  } catch (e) {
    console.error('[auth/view]', e);
    res.status(500).json({ error: 'Erro ao registrar visualização' });
  }
});

// Perfil completo com estatísticas de atividade
app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const uid = req.amoqUser.id;

    // Chamadas independentes — falhas individuais não derrubam o endpoint
    const [profile, statsResult, bookmarksResult] = await Promise.allSettled([
      getOrCreateProfile(uid),
      getProfileStats(uid),
      getBookmarks(uid),
    ]);

    if (profile.status === 'rejected') {
      console.error('[auth/profile] getOrCreateProfile falhou:', profile.reason);
      return res.status(500).json({ error: 'Tabelas do banco não foram migradas. Execute supabase-migration.sql no painel do Supabase.' });
    }

    const p         = profile.value;
    const stats     = statsResult.status === 'fulfilled' ? statsResult.value : { totalDocs: 0, temaContagem: {}, temasExplorados: 0, temaFavorito: null, diasAtivo: 0, recentDocs: [] };
    const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value : [];

    if (statsResult.status === 'rejected')     console.warn('[auth/profile] stats falhou:', statsResult.reason?.message);
    if (bookmarksResult.status === 'rejected') console.warn('[auth/profile] bookmarks falhou (tabela não criada?):', bookmarksResult.reason?.message);

    const grauInfo    = getGrauInfo(p.grau || 1);
    const xpFalta     = xpParaProximoGrau(p.xp || 0);
    const proximoGrau = GRAUS_AMOQ.find(g => g.grau === grauInfo.grau + 1) || null;
    const demonFull   = GOETIA_72.find(d => d.num === p.demon_num) || null;

    res.json({
      id: uid, email: req.amoqUser.email,
      grau: grauInfo, xp: p.xp || 0, xpFalta,
      xpProximo: proximoGrau?.xpRequired ?? null,
      demon: {
        num:    p.demon_num,
        nome:   p.demon_nome,
        rank:   p.demon_rank,
        legiao: demonFull?.legiao ?? null,
        poder:  demonFull?.poder  ?? null,
      },
      stats, bookmarks,
    });
  } catch (e) {
    console.error('[auth/profile]', e);
    res.status(500).json({ error: 'Erro ao carregar perfil completo' });
  }
});

// Toggle bookmark
app.post('/api/auth/bookmark', requireAuth, async (req, res) => {
  const { documentId, documentName, documentTema } = req.body || {};
  if (!documentId) return res.status(400).json({ error: 'documentId obrigatório' });
  try {
    const result = await toggleBookmark(req.amoqUser.id, documentId, documentName, documentTema);
    res.json(result);
  } catch (e) {
    console.error('[auth/bookmark]', e);
    res.status(500).json({ error: 'Erro ao alterar bookmark' });
  }
});

// ── Mercado Pago API: Endpoint de Preferência de Pagamento ─────────────────
app.post('/api/create-preference', async (req, res) => {
  try {
    const { title = 'Material Oculto - Iuri Piragibe', price = 47.00, email, name } = req.body || {};
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN;

    if (!accessToken) {
      // Fallback gracioso para modo sem credenciais configuradas
      return res.json({
        id: 'demo-preference-id',
        init_point: 'https://www.mercadopago.com.br/',
        sandbox_init_point: 'https://www.mercadopago.com.br/'
      });
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: title,
            unit_price: Number(price),
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: email || 'cliente@exemplo.com',
          name: name || 'Cliente'
        },
        back_urls: {
          success: 'https://iuripiragibe.net/material-oculto.html?status=success',
          failure: 'https://iuripiragibe.net/material-oculto.html?status=failure',
          pending: 'https://iuripiragibe.net/material-oculto.html?status=pending'
        },
        auto_return: 'approved'
      })
    });

    const preferenceData = await mpResponse.json();
    res.json(preferenceData);
  } catch (error) {
    console.error('[MercadoPago Preference Error]', error);
    res.status(500).json({ error: 'Erro ao gerar preferência no Mercado Pago' });
  }
});

// ── Mercado Pago API: Endpoint de Geração de PIX ───────────────────────────
app.post('/api/create-pix', async (req, res) => {
  try {
    const { title = 'O Livro dos Iniciados - Iuri Piragibe', price = 47.00, email, name, cpf } = req.body || {};
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-2033396332836975-072600-1bce4034718a03d373823bf1ba7012e0-222803401';

    const nameParts = (name || 'Cliente Leitor').trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Leitor';
    const cleanCpf = (cpf || '19100000000').replace(/\D/g, '');

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': 'pix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
      },
      body: JSON.stringify({
        transaction_amount: Number(price),
        description: title,
        payment_method_id: 'pix',
        notification_url: 'https://iuripiragibe.net/api/webhook',
        payer: {
          email: email || 'cliente@exemplo.com',
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
    res.json(data);
  } catch (error) {
    console.error('[MercadoPago PIX Error]', error);
    res.status(500).json({ error: 'Erro ao gerar PIX no Mercado Pago' });
  }
});

// ── Mercado Pago API: Checagem em Tempo Real do Pagamento PIX ─────────────
app.get('/api/check-payment', async (req, res) => {
  try {
    const paymentId = req.query.id;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-2033396332836975-072600-1bce4034718a03d373823bf1ba7012e0-222803401';

    if (!paymentId) return res.status(400).json({ error: 'ID ausente' });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!mpRes.ok) return res.json({ status: 'pending' });

    const data = await mpRes.json();
    res.json({ status: data.status, status_detail: data.status_detail, payer_email: data.payer?.email });
  } catch (error) {
    res.json({ status: 'pending' });
  }
});

// ── Mercado Pago OAuth 2.0: Endpoint de Redirecionamento Callback ───────────
app.get('/api/oauth/callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>URL de Redirecionamento OAuth Mercado Pago</title></head>
      <body style="font-family: sans-serif; background: #0d0d12; color: #e4e4e7; padding: 40px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #c9a227;">
          <h2 style="color: #e2c04a;">🔑 URL de Redirecionamento OAuth Configurada</h2>
          <p>Esta é a URL de Callback oficial configurada para autorizações OAuth do Mercado Pago:</p>
          <code style="background: #27272a; padding: 8px 14px; border-radius: 6px; color: #4ade80; display: inline-block; margin: 10px 0;">https://iuripiragibe.net/api/oauth/callback</code>
          <br><br>
          <a href="/material-oculto.html" style="color: #60a5fa; text-decoration: none; font-weight: bold;">← Voltar ao site</a>
        </div>
      </body>
      </html>
    `);
  }
  res.redirect('/material-oculto.html?oauth=success');
});

// ── Mercado Pago Webhook / IPN: Processamento Automático pós-pagamento ──────
const handleMercadoPagoIPN = async (req, res) => {
  try {
    let paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id || req.body?.id;
    const resource = req.query.resource || req.body?.resource;
    if (!paymentId && resource) {
      const match = resource.match(/\/(\d+)$/);
      if (match) paymentId = match[1];
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || 'APP_USR-2033396332836975-072600-1bce4034718a03d373823bf1ba7012e0-222803401';

    if (paymentId && paymentId !== '123456') {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (mpRes.ok) {
          const paymentData = await mpRes.json();
          if (paymentData.status === 'approved' && paymentData.payer?.email) {
            console.log(`[IPN / Webhook] Pagamento ${paymentId} aprovado! Enviando acesso para ${paymentData.payer.email}...`);
          }
        }
      } catch(e) {}
    }
    res.status(200).json({ status: 'ok', message: 'IPN recebida com sucesso' });
  } catch (error) {
    res.status(200).json({ status: 'ok' });
  }
};

app.post('/api/webhook', handleMercadoPagoIPN);
app.get('/api/webhook', handleMercadoPagoIPN);

// --- Participação cívica: rotas antes do static e do catch-all ---

const enviarLimite = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas mensagens deste IP. Tente novamente mais tarde.' }
});

/**
 * SMTP clássico (opcional). Exige host, utilizador, palavra-passe e remetente.
 */
function criarTransporteSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CIVIC_MAIL_FROM?.trim();
  if (!host || !user || !pass || !from) return null;
  return {
    mode: 'smtp',
    transporter: nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    }),
    from
  };
}

/**
 * Resend (recomendado: duas variáveis) ou SMTP. Sem isto, o envio pelo servidor fica desativado — a UI usa mailto.
 */
function resolverEnvioEmail() {
  const from = process.env.CIVIC_MAIL_FROM?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey && from) {
    return { mode: 'resend', from, apiKey: resendKey };
  }
  return criarTransporteSmtp();
}

/**
 * @param {{ mode: 'resend', from: string, apiKey: string } | { mode: 'smtp', transporter: object, from: string }} backend
 * @param {{ to: string, replyTo: string, subject: string, text: string }} opts
 */
async function enviarEmailParticipacao(backend, opts) {
  const { to, replyTo, subject, text } = opts;
  if (backend.mode === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${backend.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: backend.from,
        to: [to],
        reply_to: replyTo,
        subject,
        text
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = typeof data.message === 'string' ? data.message : JSON.stringify(data) || res.statusText;
      throw new Error(msg);
    }
    return data;
  }
  await backend.transporter.sendMail({
    from: backend.from,
    to,
    replyTo,
    subject,
    text
  });
}

app.get('/api/civic/config', (req, res) => {
  const backend = resolverEnvioEmail();
  res.json({
    sendEnabled: Boolean(backend),
    transport: backend ? backend.mode : null
  });
});

app.get('/api/civic/deputados', async (req, res) => {
  try {
    const { siglaUf, siglaPartido, nome, pagina, itens } = req.query;
    const out = await listarDeputados({
      siglaUf: siglaUf ? String(siglaUf) : undefined,
      siglaPartido: siglaPartido ? String(siglaPartido) : undefined,
      nome: nome ? String(nome) : undefined,
      pagina: pagina ? Number(pagina) : undefined,
      itens: itens ? Number(itens) : undefined
    });
    res.json(out);
  } catch (e) {
    console.error('[civic/deputados]', e);
    res.status(502).json({ error: 'Falha ao consultar a API da Câmara', message: String(e.message) });
  }
});

app.get('/api/civic/feed', async (req, res) => {
  try {
    const q = req.query.q != null ? String(req.query.q) : '';
    const limit = Math.min(Number(req.query.limit) || 25, 50);
    const items = await agregarNoticias(q, DEFAULT_NEWS_FEEDS, limit);
    res.json({ items, feeds: DEFAULT_NEWS_FEEDS });
  } catch (e) {
    console.error('[civic/feed]', e);
    res.status(502).json({ error: 'Falha ao ler feeds RSS', message: String(e.message) });
  }
});

app.post('/api/civic/enviar', enviarLimite, async (req, res) => {
  const backend = resolverEnvioEmail();
  if (!backend) {
    return res.status(503).json({
      error: 'Envio pelo site desativado',
      hint: 'Crie um ficheiro .env na raiz com RESEND_API_KEY e CIVIC_MAIL_FROM (Resend), ou configure SMTP_* + CIVIC_MAIL_FROM. Enquanto isso, use «Abrir no meu e-mail» na página.',
      mailConfigured: false
    });
  }

  const { deputadoId, remetenteNome, remetenteEmail, assunto, corpo } = req.body || {};
  const nome = typeof remetenteNome === 'string' ? remetenteNome.trim() : '';
  const emailRem = typeof remetenteEmail === 'string' ? remetenteEmail.trim() : '';
  const sub = typeof assunto === 'string' ? assunto.trim() : '';
  const body = typeof corpo === 'string' ? corpo.trim() : '';

  if (!nome || nome.length > 200) {
    return res.status(400).json({ error: 'Nome do remetente inválido' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRem) || emailRem.length > 320) {
    return res.status(400).json({ error: 'E-mail do remetente inválido' });
  }
  if (!sub || sub.length > 200) {
    return res.status(400).json({ error: 'Assunto inválido' });
  }
  if (!body || body.length > 8000) {
    return res.status(400).json({ error: 'Mensagem vazia ou demasiado longa (máx. 8000 caracteres)' });
  }

  let dest;
  try {
    dest = await obterDeputadoParaEnvio(deputadoId);
  } catch (e) {
    return res.status(400).json({ error: String(e.message) });
  }

  const rodape = [
    '',
    '---',
    `Mensagem enviada via ferramenta de participação cívica.`,
    `Remetente: ${nome} <${emailRem}>`,
    `Destinatário institucional: ${dest.nome} (${dest.siglaPartido}/${dest.siglaUf}) <${dest.email}>`
  ].join('\n');

  const text = `${body}\n${rodape}`;

  try {
    await enviarEmailParticipacao(backend, {
      to: dest.email,
      replyTo: emailRem,
      subject: `[Participação] ${sub}`,
      text
    });
    res.json({ ok: true, para: dest.email, deputado: dest.nome });
  } catch (e) {
    console.error('[civic/enviar]', e);
    res.status(502).json({ error: 'Falha ao enviar e-mail', message: String(e.message) });
  }
});

// ─── Google Drive: Biblioteca de Documentos ──────────────────────────────────

// Pré-aquece o cache ao iniciar
if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  indexarDrives().catch(e => console.warn('[drive] Falha no pré-aquecimento:', e.message));
}

app.get('/api/drive/index', requireAuth, async (req, res) => {
  try {
    const force = req.query.refresh === '1';
    const index = await indexarDrives(force);
    const { q, tema, subtema, pasta, tipo, pagina, porPagina } = req.query;
    const resultado = buscarArquivos(index, {
      q: q || '',
      tema: tema || '',
      subtema: subtema || '',
      pasta: pasta || '',
      tipo: tipo || '',
      pagina: parseInt(pagina) || 1,
      porPagina: Math.min(parseInt(porPagina) || 24, 100)
    });
    res.json({
      ...resultado,
      temas: index.temas,
      pastas: index.pastas,
      totalGeral: index.total,
      indexadoEm: index.indexadoEm,
      semCredenciais: index._semCredenciais || false
    });
  } catch (e) {
    console.error('[drive/index]', e);
    res.status(502).json({ error: 'Falha ao indexar drives', message: String(e.message) });
  }
});

app.get('/api/drive/refresh', async (req, res) => {
  try {
    const index = await indexarDrives(true);
    res.json({ ok: true, total: index.total, indexadoEm: index.indexadoEm });
  } catch (e) {
    res.status(502).json({ error: String(e.message) });
  }
});

app.get('/api/drive/sync-embeddings', async (req, res) => {
  syncEmbeddings()
    .then(() => console.log('[server] Sincronização de embeddings concluída'))
    .catch(err => console.error('[server] Erro na sincronização de embeddings:', err));
  res.json({ ok: true, message: 'Sincronização de embeddings iniciada em segundo plano' });
});

app.get('/api/drive/config', (req, res) => {
  res.json({
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  });
});


app.get('/api/drive/temas', async (req, res) => {
  try {
    const index = await indexarDrives();
    res.json({ temas: index.temas, pastas: index.pastas, total: index.total });
  } catch (e) {
    res.status(502).json({ error: String(e.message) });
  }
});

// --- Rotas curtas (HTML) ---

app.get(['/master', '/master/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'teia-compliance-zero.html'));
});

app.get(['/curral', '/curral/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'teia-serra-curral.html'));
});

app.get(['/ponte', '/ponte/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'teia-ponte.html'));
});

const civicPage = path.join(__dirname, 'participacao-civica.html');
app.get(['/civic', '/civic/', '/participacao', '/participacao/', '/participacao-civica', '/participacao-civica/'], (req, res) => {
  res.sendFile(civicPage);
});

app.get(['/biblioteca', '/biblioteca/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'biblioteca.html'));
});

app.get(['/teia-compliance-zero.html', '/teia-compliance-zero'], (req, res) => {
  res.redirect(301, '/master');
});

app.get(['/teia-serra-curral.html', '/teia-serra-curral'], (req, res) => {
  res.redirect(301, '/curral');
});

app.get(['/teia-ponte.html', '/teia-ponte'], (req, res) => {
  res.redirect(301, '/ponte');
});

// Proxy Base dos Dados (legado) — antes do static para evitar colisão com ficheiros
app.get('/api/candidatos', async (req, res) => {
  try {
    const sqlQuery = req.query.sql;
    if (!sqlQuery) {
      return res.status(400).json({ error: 'Parâmetro sql é obrigatório' });
    }
    const apiUrls = [
      `https://api.basedosdados.org/api/v1/query?sql=${encodeURIComponent(String(sqlQuery))}`,
      `https://basedosdados.org/api/1/query?sql=${encodeURIComponent(String(sqlQuery))}`
    ];
    let lastError = null;
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        if (response.ok) {
          const data = await response.json();
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.json(data);
        }
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Todas as tentativas falharam');
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: 'Erro ao buscar dados do Base dos Dados',
      message: error.message
    });
  }
});

app.options('/api/candidatos', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.use(express.static('.'));

app.get('*', (req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  const rel = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
  const filePath = path.join(__dirname, rel);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

app.use((req, res) => {
  res.status(404).send('Não encontrado');
});

app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
  console.log(`Participação cívica: http://localhost:${PORT}/participacao`);
  const b = resolverEnvioEmail();
  console.log(b ? `E-mail: ${b.mode} (envio pelo site ativo)` : 'E-mail: não configurado (use .env com Resend ou SMTP)');
});
