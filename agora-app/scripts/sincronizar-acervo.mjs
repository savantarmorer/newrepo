#!/usr/bin/env node
// Sincroniza o acervo da biblioteca do site (pastas públicas do Google Drive) com a
// tabela acervo_documentos da Ágora. Só copia o índice (nome, tipo, pastas, assunto);
// os arquivos continuam no Drive.
//
// Variáveis:
//   AGORA_SUPABASE_URL           https://<ref>.supabase.co
//   AGORA_SUPABASE_SERVICE_KEY   chave service_role/secret (só em segredo do CI)
//   GOOGLE_DRIVE_API_KEY         chave da API do Google; se faltar, usa a mesma da página
//                                biblioteca.html do site (é pública)
//   ACERVO_PASTAS                opcional: JSON [{"id": "...", "nome": "..."}]
//   ACERVO_IGNORAR_PASTAS        opcional: nomes de pastas a pular, separados por "|", com
//                                "*" como curinga (padrão: "[backups]|COMPUTADOR_*" —
//                                cópias repetidas e cópias de computadores pessoais)
//   ACERVO_SAIDA                 opcional: grava o índice num arquivo JSON e não envia
//                                ao banco (útil para conferir antes)
//
// Uso: node scripts/sincronizar-acervo.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));

// As mesmas três pastas da página /biblioteca do site. Muitos arquivos aparecem em
// mais de uma (atalhos); cada um fica na primeira pasta desta lista onde aparece,
// por isso a mais organizada por assunto vem primeiro.
const PASTAS_PADRAO = [
  { id: '18bq6fy8-n8IP8rhYRjXLNdvn7rrhR27Q', nome: 'Tradições Místicas' },
  { id: '1EEi7bB3L2TIshhTOI-HJzQ4mgQ8F2k5i', nome: 'Biblioteca Esotérica' },
  { id: '1zG4yx8B2S1mh7WiFcquCdMGJH_5y6f52', nome: 'Sociedades Secretas' },
];

// Assuntos por palavra-chave (base: os temas da página do site). A palavra precisa
// começar no início de uma palavra: "rito" casa com "rito escocês", não com "espírito".
export const ASSUNTOS = [
  ['Maçonaria', ['maçon', 'mason', 'freemason', 'loja maç', 'grão-mestre', 'grande oriente', 'aprendiz maçom', 'mestre maçom', 'rito escoc', 'rito de york', 'acácia', 'hiram', 'demolay', 'arco real']],
  ['Rosacruzes e Alquimia', ['rosacruz', 'rosa cruz', 'rosa-cruz', 'rosicrucian', 'amorc', 'fama fraternitatis', 'alquimi', 'alchem', 'pedra filosofal', 'hermétic', 'hermetic', 'hermes trismeg', 'caibalion', 'kybalion']],
  ['Ordens e Sociedades Secretas', ['iluminati', 'illuminati', 'templári', 'templar', 'cavaleiros', 'skull and bones', 'bilderberg', 'opus dei', 'jesuíta', 'martinis', 'sociedade secreta', 'sociedades secretas']],
  ['Teosofia e Filosofia Esotérica', ['teosof', 'theosoph', 'blavatsky', 'eubiose', 'acrópole', 'acropole', 'acropolis', 'gnose', 'gnóstic', 'gnostic', 'antroposof', 'steiner', 'neoplat', 'gurdjieff', 'ouspensky', 'rosacrucianismo']],
  ['Thelema e Crowley', ['thelema', 'telema', 'crowley', 'liber al', 'o.t.o', 'ordo templi orientis', 'a.a.']],
  ['Cabala', ['cabala', 'kabbalah', 'qabalah', 'kabala', 'sefirot', 'sephiroth', 'zohar']],
  ['Wicca e Bruxaria', ['wicca', 'bruxa', 'bruxaria', 'witch', 'coven', 'sabá', 'sabbat', 'pagã', 'pagan', 'sagrado feminino', 'deusa']],
  ['Magia e Ocultismo', ['magia', 'magick', 'magic', 'ocult', 'golden dawn', 'aurora dourada', 'enoquian', 'enochian', 'goetia', 'grimório', 'grimoire', 'sigil', 'lemegeton', 'salomão', 'evocação', 'feitiç', 'talism', 'amuleto', 'caos', 'luciferian']],
  ['Artes Divinatórias', ['tarô', 'tarot', 'astrolog', 'zodía', 'numerolog', 'runa', 'rune', 'horóscop', 'arcano', 'cartomancia', 'oráculo', 'i ching', 'quiromancia', 'sonho']],
  ['Espiritualidade e Terapias', ['espiritismo', 'kardec', 'reiki', 'chakra', 'meditação', 'meditation', 'yoga', 'cristais', 'cristal', 'ervas', 'plantas', 'aromaterapia', 'umbanda', 'candomblé', 'xamã', 'xaman', 'shaman']],
  ['Mitologia e Religiões', ['mitolog', 'panteão', 'deuses', 'egito', 'egipto', 'egypt', 'faraó', 'grécia', 'nórdic', 'celta', 'suméri', 'babilôn', 'religi', 'bíblia', 'biblia', 'budis', 'hindu', 'islã', 'judaísmo']],
  ['Conspirações e Poder', ['conspiraç', 'conspiracy', 'nova ordem mundial', 'new world order', 'globalis', 'deep state', 'oligarq']],
  ['História', ['história', 'historia', 'history', 'idade média', 'medieval', 'renascen', 'inquisição']],
];

// Tipos de arquivo
const TIPOS = [
  ['pdf', (m) => m === 'application/pdf'],
  ['documento', (m) => /google-apps\.document|wordprocessingml|msword|opendocument\.text|rtf|^text\/plain|wordperfect/.test(m)],
  ['apresentacao', (m) => /presentation|powerpoint/.test(m)],
  ['planilha', (m) => /spreadsheet|ms-excel/.test(m)],
  ['livro', (m) => /epub|mobi|djvu/.test(m)],
  ['imagem', (m) => m.startsWith('image/')],
  ['audio', (m) => m.startsWith('audio/') && !/mpegurl/.test(m)],
  ['video', (m) => m.startsWith('video/')],
];

// Não entram no acervo: programas, código, atalhos e arquivos técnicos
const MIMES_IGNORADOS = [
  /x-dosexec|x-msdownload|x-ms-shortcut|x-elc|x-msmetafile/,
  /^text\/(javascript|css|xml|html)/,
  /^chemical\//,
  /mpegurl/,
  /google-apps\.(folder|shortcut|project|form|site|map)/,
];

// Arquivos de sistema e fotos sem nome (ex.: "10653614 7699633530 n.jpg")
const NOMES_IGNORADOS = /^(thumbs\.db|desktop\.ini|\.ds_store|pp?thumbs\.ptn|~\$.*)$/i;

const EXT_LIVRO = /\.(epub|mobi|djvu|azw3?)$/i;

export const normalizar = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Assunto pelo nome do arquivo e das pastas (pastas pesam primeiro). */
export function detectarAssunto(nome, caminho) {
  const textos = [...caminho.slice(1).reverse(), nome].map(normalizar);
  for (const texto of textos) {
    for (const [assunto, palavras] of ASSUNTOS) {
      for (const p of palavras) {
        const i = texto.indexOf(normalizar(p));
        if (i >= 0 && (i === 0 || !/[a-z0-9]/.test(texto[i - 1]))) return assunto;
      }
    }
  }
  return null;
}

/** "【A】📌" → "Letra A"; "Wicca 🌒🌕🌘" → "Wicca"; "Maçom-20260515T181146Z-3-001" → "Maçom" */
export function limparPasta(nome) {
  let s = String(nome ?? '')
    .replace(/-\d{8}T\d{6}Z-\d+-\d+$/, '')
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\u{FE0F}\u{200D}\u{20E3}♀♂♈-♓☯✡✴✨]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*\(\d+\)$/, '')
    .replace(/\.$/, '');
  const letra = /^【\s*([^】]+?)\s*】$/.exec(s);
  if (letra) return `Letra ${letra[1]}`;
  s = s.replace(/[【】]/g, '').trim();
  return s || String(nome ?? '').trim();
}

/** Nome legível: sem extensão, "_" e "." viram espaço, espaços colapsados. */
export function limparTitulo(nome) {
  const semExt = String(nome).replace(/\s*·\s*vers[aã]o\s*\d+\s*$/i, '').replace(/\.(pdf|docx?|pptx?|ppsx?|xlsx?|txt|rtf|odt|epub|mobi|djvu|jpe?g|png|gif|bmp|tiff?|mp[34]|wav|wma|wmv|ogg|webm|avi|mov|mpe?g|flv|zip|rar)$/i, '');
  const t = semExt.replace(/[_]+/g, ' ').replace(/\s+-\s+/g, ' – ').replace(/\s+/g, ' ').trim();
  return t || String(nome).trim();
}

export function tipoDoArquivo(mime, nome) {
  if (EXT_LIVRO.test(nome)) return 'livro';
  for (const [tipo, teste] of TIPOS) if (teste(mime)) return tipo;
  return 'outro';
}

export function ignorarArquivo(mime, nome) {
  if (MIMES_IGNORADOS.some((r) => r.test(mime))) return true;
  if (NOMES_IGNORADOS.test(String(nome).trim())) return true;
  // Fotos com nome de câmera/rede social ("IMG_1234", "10653614_7699_n") não dizem o que são
  return mime.startsWith('image/') && /^((img|dsc|dscn|pic|foto|whatsapp image)[\s_-]*)?[\d\s_.-]+[a-z]?$/i.test(limparTitulo(nome));
}

/** "COMPUTADOR_*" → casa com "COMPUTADOR_FULANO" (sem diferenciar maiúsculas e acentos) */
function casaPadrao(padroes, nome) {
  const n = normalizar(nome.trim());
  return padroes.some((p) => {
    const re = new RegExp(`^${normalizar(p).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    return re.test(n);
  });
}

// ------------------------------------------------------------------ Google Drive
function chaveDrive() {
  if (process.env.GOOGLE_DRIVE_API_KEY) return process.env.GOOGLE_DRIVE_API_KEY.trim();
  // Mesma chave pública usada pela página /biblioteca do site
  const html = readFileSync(join(aqui, '..', '..', 'biblioteca.html'), 'utf8');
  const m = /const DRIVE_API_KEY\s*=\s*([^;]+);/.exec(html);
  if (!m) throw new Error('Defina GOOGLE_DRIVE_API_KEY (não achei a chave em biblioteca.html).');
  const partes = [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map((x) => x[1] ?? x[2]);
  return partes.join('');
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedirDrive(url, tentativa = 1) {
  const r = await fetch(url);
  if (r.ok) return r.json();
  if ((r.status === 429 || r.status >= 500) && tentativa < 6) {
    await espera(500 * 2 ** tentativa);
    return pedirDrive(url, tentativa + 1);
  }
  const corpo = await r.json().catch(() => ({}));
  throw new Error(`Drive respondeu ${r.status}: ${corpo.error?.message ?? r.statusText}`);
}

/** Limita quantas pastas são listadas ao mesmo tempo. */
function limitador(max) {
  let ativos = 0;
  const fila = [];
  const proximo = () => {
    if (ativos >= max || !fila.length) return;
    ativos++;
    const { fn, ok, falha } = fila.shift();
    fn().then(ok, falha).finally(() => {
      ativos--;
      proximo();
    });
  };
  return (fn) => new Promise((ok, falha) => {
    fila.push({ fn, ok, falha });
    proximo();
  });
}

export const IGNORAR_PADRAO = ['[backups]', 'COMPUTADOR_*'];

export async function lerDrive({ chave, pastas = PASTAS_PADRAO, ignorarPastas = IGNORAR_PADRAO }) {
  const limite = limitador(8);
  const vistos = new Set();
  const arquivos = new Map();
  const campos = encodeURIComponent('nextPageToken,files(id,name,mimeType,size,modifiedTime,shortcutDetails)');

  async function listar(pastaId, caminho, profundidade) {
    if (profundidade > 10 || vistos.has(pastaId)) return;
    vistos.add(pastaId);
    let token = null;
    const subpastas = [];
    do {
      const q = encodeURIComponent(`'${pastaId}' in parents and trashed=false`);
      let url = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${chave}&fields=${campos}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (token) url += `&pageToken=${token}`;
      const dados = await limite(() => pedirDrive(url));
      for (const item of dados.files ?? []) {
        let alvo = item;
        if (item.mimeType === 'application/vnd.google-apps.shortcut') {
          if (!item.shortcutDetails?.targetId) continue;
          alvo = { ...item, id: item.shortcutDetails.targetId, mimeType: item.shortcutDetails.targetMimeType ?? '' };
        }
        if (alvo.mimeType === 'application/vnd.google-apps.folder') {
          if (!casaPadrao(ignorarPastas, item.name)) subpastas.push([alvo.id, [...caminho, item.name.trim()]]);
          continue;
        }
        if (ignorarArquivo(alvo.mimeType ?? '', item.name) || arquivos.has(alvo.id)) continue;
        arquivos.set(alvo.id, { ...alvo, caminho });
      }
      token = dados.nextPageToken;
    } while (token);
    await Promise.all(subpastas.map(([id, c]) => listar(id, c, profundidade + 1)));
  }

  // Uma pasta raiz por vez: a ordem decide onde ficam os arquivos repetidos
  for (const p of pastas) await listar(p.id, [p.nome], 0);
  return [...arquivos.values()];
}

export function paraLinha(arquivo, vistoEm) {
  const [categoria, ...pastas] = arquivo.caminho;
  const caminhoLimpo = pastas.map(limparPasta);
  // "Letra A", "Letra B"… são só a ordem alfabética: a coleção é a pasta de dentro
  const colecao = /^Letra \S+$/.test(caminhoLimpo[0] ?? '') && caminhoLimpo[1] ? caminhoLimpo[1] : caminhoLimpo[0] ?? null;
  return {
    id: arquivo.id,
    nome: arquivo.name,
    titulo: limparTitulo(arquivo.name),
    tipo: tipoDoArquivo(arquivo.mimeType, arquivo.name),
    mime: arquivo.mimeType || 'application/octet-stream',
    categoria,
    colecao,
    caminho: caminhoLimpo,
    assunto: detectarAssunto(arquivo.name, arquivo.caminho),
    tamanho: arquivo.size ? Number(arquivo.size) : null,
    modificado_em: arquivo.modifiedTime ?? null,
    visto_em: vistoEm,
  };
}

/**
 * O Drive tem muitas cópias do mesmo arquivo (mesmo nome e mesmo tamanho em pastas
 * diferentes). Fica a primeira, na ordem das pastas. Docs do Google não têm tamanho
 * e por isso não são comparados.
 */
export function semDuplicatas(linhas) {
  const vistos = new Set();
  return linhas.filter((l) => {
    if (!l.tamanho) return true;
    const chave = `${normalizar(l.titulo)}|${l.tamanho}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

// ------------------------------------------------------------------ Supabase (PostgREST)
async function pedirBanco(metodo, caminho, corpo, extras = {}) {
  const url = `${process.env.AGORA_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${caminho}`;
  const chave = process.env.AGORA_SUPABASE_SERVICE_KEY;
  for (let tentativa = 1; ; tentativa++) {
    const r = await fetch(url, {
      method: metodo,
      headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json', ...extras },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (r.ok) return r;
    const texto = await r.text();
    if ((r.status === 429 || r.status >= 500) && tentativa < 5) {
      await espera(1000 * tentativa);
      continue;
    }
    if (/permission denied/i.test(texto)) {
      throw new Error('O banco recusou: AGORA_SUPABASE_SERVICE_KEY precisa ser a chave service_role (ou sb_secret_…).');
    }
    throw new Error(`Banco respondeu ${r.status} em ${metodo} ${caminho}: ${texto.slice(0, 300)}`);
  }
}

async function principal() {
  const saida = process.env.ACERVO_SAIDA;
  if (!saida && (!process.env.AGORA_SUPABASE_URL || !process.env.AGORA_SUPABASE_SERVICE_KEY)) {
    throw new Error('Defina AGORA_SUPABASE_URL e AGORA_SUPABASE_SERVICE_KEY (ou ACERVO_SAIDA para só gerar o arquivo).');
  }
  const pastas = process.env.ACERVO_PASTAS ? JSON.parse(process.env.ACERVO_PASTAS) : PASTAS_PADRAO;
  const ignorarPastas = (process.env.ACERVO_IGNORAR_PASTAS ?? IGNORAR_PADRAO.join('|')).split('|').map((s) => s.trim()).filter(Boolean);

  const inicio = new Date().toISOString();
  console.log(`Lendo ${pastas.length} pasta(s) do Drive…`);
  const arquivos = await lerDrive({ chave: chaveDrive(), pastas, ignorarPastas });
  const todas = arquivos.map((a) => paraLinha(a, inicio));
  const linhas = semDuplicatas(todas);
  console.log(`${linhas.length} documentos encontrados (${todas.length - linhas.length} cópias repetidas ignoradas).`);

  const porCategoria = {};
  for (const l of linhas) porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + 1;
  for (const [c, n] of Object.entries(porCategoria)) console.log(`  ${c}: ${n}`);
  const semAssunto = linhas.filter((l) => !l.assunto).length;
  console.log(`  com assunto detectado: ${linhas.length - semAssunto} · sem assunto: ${semAssunto}`);

  if (saida) {
    writeFileSync(saida, JSON.stringify(linhas, null, 1));
    console.log(`Índice gravado em ${saida} (nada foi enviado ao banco).`);
    return;
  }
  if (!linhas.length) throw new Error('O Drive não devolveu nenhum arquivo; nada foi alterado no banco.');

  const LOTE = 1000;
  for (let i = 0; i < linhas.length; i += LOTE) {
    await pedirBanco('POST', 'acervo_documentos?on_conflict=id', linhas.slice(i, i + LOTE), {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    });
    process.stdout.write(`\r  enviados ${Math.min(i + LOTE, linhas.length)}/${linhas.length}`);
  }
  process.stdout.write('\n');
  // Só remove o que sumiu do Drive depois de uma leitura completa e sem erros
  const r = await pedirBanco('DELETE', `acervo_documentos?visto_em=lt.${encodeURIComponent(inicio)}`, null, {
    Prefer: 'return=minimal,count=exact',
  });
  const removidos = Number(r.headers.get('content-range')?.split('/')[1] ?? 0) || 0;
  console.log(`Pronto: ${linhas.length} documentos no acervo${removidos ? `, ${removidos} removidos (saíram do Drive ou eram cópias repetidas)` : ''}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  principal().catch((e) => {
    console.error(`Erro: ${e.message}`);
    process.exit(1);
  });
}
