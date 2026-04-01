/**
 * Servidor Express: páginas estáticas, proxy Base dos Dados e API de participação cívica (Câmara + e-mail).
 * Requer Node 18+ (fetch nativo). Com `"type": "module"`, este ficheiro usa apenas ESM.
 * Carrega `.env` na raiz do projeto (se existir) para RESEND_API_KEY / SMTP sem export manual.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '48kb' }));

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
