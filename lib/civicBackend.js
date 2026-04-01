/**
 * Backend helpers for participação cívica (Câmara dos Deputados, RSS, validação de destino).
 * Destinos de e-mail só são aceites se coincidirem com o registo oficial na API pública da Câmara.
 */

import Parser from 'rss-parser';

const CAMARA = 'https://dadosabertos.camara.leg.br/api/v2';

/** RSS públicos usados para o “feed” (ampliar conforme necessidade). */
export const DEFAULT_NEWS_FEEDS = [
  'https://g1.globo.com/rss/g1/politica/',
  'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml'
];

const jsonHeaders = { Accept: 'application/json', 'User-Agent': 'participacao-civica/1.0' };

/**
 * Extrai o e-mail institucional do deputado a partir do JSON detalhado da API.
 * @param {Record<string, unknown>} dados — objeto `dados` da resposta `/deputados/{id}`
 * @returns {string | null}
 */
export function emailFromDeputyDetail(dados) {
  if (!dados || typeof dados !== 'object') return null;
  const st = dados.ultimoStatus;
  if (!st || typeof st !== 'object') return null;
  if (typeof st.email === 'string' && st.email.includes('@')) return st.email.trim();
  const g = st.gabinete;
  if (g && typeof g.email === 'string' && g.email.includes('@')) return g.email.trim();
  return null;
}

/**
 * Lista deputados em exercício com filtros opcionais (API Câmara).
 * @param {{ siglaUf?: string, siglaPartido?: string, nome?: string, pagina?: number, itens?: number }} q
 */
export async function listarDeputados(q = {}) {
  const params = new URLSearchParams();
  params.set('ordem', 'ASC');
  params.set('ordenarPor', 'nome');
  params.set('itens', String(Math.min(Number(q.itens) || 40, 100)));
  params.set('pagina', String(Math.max(1, Number(q.pagina) || 1)));
  if (q.siglaUf) params.set('siglaUf', String(q.siglaUf).toUpperCase());
  if (q.siglaPartido) params.set('siglaPartido', String(q.siglaPartido).toUpperCase());
  if (q.nome) params.set('nome', String(q.nome));

  const url = `${CAMARA}/deputados?${params.toString()}`;
  const res = await fetch(url, { headers: jsonHeaders });
  if (!res.ok) throw new Error(`Câmara deputados: HTTP ${res.status}`);
  const data = await res.json();
  const lista = Array.isArray(data.dados) ? data.dados : [];
  return {
    deputados: lista.map((d) => ({
      id: d.id,
      nome: d.nome,
      siglaPartido: d.siglaPartido,
      siglaUf: d.siglaUf,
      urlFoto: d.urlFoto,
      email: typeof d.email === 'string' ? d.email : null
    })),
    links: data.links || []
  };
}

/**
 * Obtém o e-mail oficial para envio, revalidando sempre pelo ID (anti-relay abusivo).
 * @param {number} id
 * @returns {Promise<{ nome: string, email: string, siglaUf: string, siglaPartido: string }>}
 */
export async function obterDeputadoParaEnvio(id) {
  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) throw new Error('ID de deputado inválido');

  const res = await fetch(`${CAMARA}/deputados/${num}`, { headers: jsonHeaders });
  if (!res.ok) throw new Error(`Câmara deputado ${num}: HTTP ${res.status}`);
  const data = await res.json();
  const dados = data.dados;
  if (!dados) throw new Error('Resposta da Câmara sem dados');

  const email = emailFromDeputyDetail(dados);
  if (!email || !email.endsWith('@camara.leg.br')) {
    throw new Error('E-mail institucional da Câmara indisponível para este deputado');
  }

  const st = dados.ultimoStatus || {};
  return {
    nome: st.nome || dados.nomeCivil || 'Deputado(a)',
    email,
    siglaUf: st.siglaUf || '',
    siglaPartido: st.siglaPartido || ''
  };
}

const parser = new Parser({ timeout: 12000 });

/**
 * Agrega entradas RSS e filtra por termo no título ou resumo.
 * @param {string} query
 * @param {string[]} feedUrls
 * @param {number} limit
 */
export async function agregarNoticias(query, feedUrls = DEFAULT_NEWS_FEEDS, limit = 25) {
  const q = (query || '').trim().toLowerCase();
  const urls = feedUrls.length ? feedUrls : DEFAULT_NEWS_FEEDS;

  const results = await Promise.allSettled(
    urls.map(async (u) => {
      const feed = await parser.parseURL(u);
      return feed.items || [];
    })
  );

  /** @type {import('rss-parser').Item[]} */
  const flat = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) flat.push(...r.value);
  }

  const scored = flat
    .map((item) => {
      const title = String(item.title ?? '').toLowerCase();
      const content = String(item.contentSnippet ?? item.content ?? '').toLowerCase();
      const catStr = normalizeCategories(item.categories);
      const match =
        !q ||
        title.includes(q) ||
        content.includes(q) ||
        catStr.toLowerCase().includes(q);
      return { item, match };
    })
    .filter((x) => x.match)
    .map((x) => x.item);

  const seen = new Set();
  const unique = [];
  for (const item of scored) {
    const linkRaw = item.link ?? item.guid ?? item.title;
    const link = normalizeLink(linkRaw);
    const key = link || String(item.title ?? '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({
      title: String(item.title ?? '(sem título)'),
      link,
      isoDate: String(item.isoDate ?? item.pubDate ?? ''),
      source: link ? tryHost(link) : ''
    });
    if (unique.length >= limit) break;
  }

  return unique;
}

function tryHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** @param {unknown} cats */
function normalizeCategories(cats) {
  if (!cats) return '';
  if (typeof cats === 'string') return cats;
  if (!Array.isArray(cats)) return String(cats);
  return cats
    .map((c) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object' && '_' in c) return String(/** @type {{_:string}} */ (c)._);
      return '';
    })
    .join(' ');
}

/** @param {unknown} v */
function normalizeLink(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'href' in v) return String(/** @type {{href:unknown}} */ (v).href);
  try {
    return String(v);
  } catch {
    return '';
  }
}
