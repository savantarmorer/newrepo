// Gera ../index.html: galeria com a prévia animada (SVG) de cada grau e o
// download do MP4. Funciona aberta localmente (links diretos) e publicada como
// Artifact no claude.ai (download pela capability `downloads`).
//
// Uso: node galeria.mjs                                  → ../index.html
//      node galeria.mjs --artifact saida.html --zips dir → versão para publicar
//                                                          (sem esqueleto HTML, com ZIPs por seção)
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRAUS, duracao, slug } from './graus.mjs';
import { mockBackground } from './lib/mock.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SECTIONS = [
  { id: 'consistorio', title: 'Grande Consistório', range: '34°–67°', test: (n) => n <= 67 },
  { id: 'conselho', title: 'Sublime Conselho', range: '68°–86°', test: (n) => n >= 68 && n <= 86 },
  { id: 'arcana', title: 'Arcana Arcanorum', range: '87°–90°', test: (n) => n >= 87 && n <= 90 },
  { id: 'admin', title: 'Graus administrativos', range: '91°–100°', test: (n) => n >= 91 },
];

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const artifactOut = opt('--artifact');
const zipDir = opt('--zips');

const mb = (bytes) => (bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const size = (rel) => (existsSync(join(ROOT, rel)) ? statSync(join(ROOT, rel)).size : 0);

const data = SECTIONS.map((s) => ({
  id: s.id,
  title: s.title,
  range: s.range,
  zips: zipDir
    ? readdirSync(zipDir)
        .filter((f) => f.startsWith(s.id + '-') && f.endsWith('.zip'))
        .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
        .map((f) => {
          const [, a, b] = f.replace('.zip', '').split('-');
          return { path: `zip/${f}`, mb: mb(statSync(join(zipDir, f)).size), label: `${a}°–${b}°` };
        })
    : [],
  items: GRAUS.filter((d) => s.test(d.n)).map((d) => ({
    n: d.n,
    name: d.name,
    alt: d.alt ?? '',
    kicker: d.kicker,
    dur: duracao(d),
    slug: slug(d),
    mb: mb(size(`mp4/${slug(d)}.mp4`)),
  })),
}));

const mock = `data:image/svg+xml;base64,${Buffer.from(mockBackground('escuro')).toString('base64')}`;
const total = GRAUS.length;
const minutes = Math.round(GRAUS.reduce((a, d) => a + duracao(d), 0) / 60);

const html = `<title>Overlays da Maçonaria Egípcia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
/* Layout: cabeçalho de arquivo + barra fixa de filtros + seções com grade de cartões (prévia 16:9 em cima, ficha embaixo). Tema único escuro: as prévias são douradas sobre fundo escuro. */
:root {
  --bg: #0F0C0A;
  --panel: #18130F;
  --panel-2: #211A13;
  --ink: #F1E7D0;
  --muted: #A99A7E;
  --gold: #E2BE68;
  --gold-deep: #9C7434;
  --line: #34291D;
  --chroma: #00FF00;
  --danger: #E58A7A;
  --display: 'Cinzel', 'Trajan Pro', Georgia, serif;
  --body: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --serif: 'Cormorant Garamond', Georgia, serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.55; margin: 0; }
.wrap { max-width: 1240px; margin: 0 auto; padding-inline: max(16px, 3vw); padding-block: 0 64px; }
header.mast { padding-block: 40px 22px; display: grid; gap: 14px; border-bottom: 1px solid var(--line); }
.eyebrow { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); }
h1 { font-family: var(--display); font-weight: 700; font-size: clamp(30px, 5vw, 52px); line-height: 1.05; margin: 0; text-wrap: balance; letter-spacing: .01em; }
h1 em { font-family: var(--serif); font-style: italic; font-weight: 500; color: var(--gold); letter-spacing: 0; }
.lede { max-width: 66ch; color: var(--ink); margin: 0; }
.facts { display: flex; flex-wrap: wrap; gap: 8px 18px; color: var(--muted); font-size: 13px; margin: 0; padding: 0; list-style: none; }
.facts b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.howto { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px 22px; margin-top: 4px; font-size: 13.5px; color: var(--muted); }
.howto strong { color: var(--ink); font-weight: 600; }
.chip { display: inline-block; width: .9em; height: .9em; border-radius: 2px; background: var(--chroma); vertical-align: -.1em; margin-right: .3em; }

.bar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); padding-block: 12px; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
.seg { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; padding: 3px; gap: 2px; background: var(--panel); }
.seg button { font: 500 13px/1 var(--body); color: var(--muted); background: transparent; border: 0; border-radius: 999px; padding: 8px 12px; cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--panel-2); color: var(--ink); box-shadow: inset 0 0 0 1px var(--gold-deep); }
.search { flex: 1 1 220px; min-width: 0; }
.search input { width: 100%; font: 400 14px/1.2 var(--body); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; }
.search input::placeholder { color: var(--muted); }
.jump { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; }
.jump a { color: var(--muted); text-decoration: none; }
.jump a:hover { color: var(--gold); }
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

section.sec { padding-top: 34px; scroll-margin-top: 72px; }
.sec-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px; margin-bottom: 16px; }
h2 { font-family: var(--display); font-weight: 600; font-size: clamp(20px, 2.6vw, 26px); margin: 0; letter-spacing: .02em; }
h2 small { font-family: var(--body); font-size: 13px; color: var(--muted); letter-spacing: .04em; margin-left: .6em; font-weight: 400; }
.zips { display: flex; flex-wrap: wrap; gap: 8px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 18px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; min-width: 0; }
.stage { position: relative; aspect-ratio: 16 / 9; max-width: 100%; background-size: cover; background-position: center; cursor: pointer; border: 0; padding: 0; display: block; width: 100%; }
body[data-bg="video"] .stage { background-image: url("${mock}"); }
body[data-bg="verde"] .stage { background: var(--chroma); }
body[data-bg="escuro"] .stage { background: #0A0806; }
.stage img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.stage .again { position: absolute; right: 8px; top: 8px; font: 500 11px/1 var(--body); color: var(--ink); background: rgba(10, 8, 6, .72); border-radius: 999px; padding: 6px 9px; opacity: 0; transition: opacity .2s; }
.stage:hover .again, .stage:focus-visible .again { opacity: 1; }
.info { padding: 12px 14px 14px; display: grid; gap: 6px; min-width: 0; }
.title { display: flex; gap: 10px; align-items: baseline; min-width: 0; }
.num { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--gold); font-variant-numeric: tabular-nums; flex: none; }
.name { font-family: var(--display); font-weight: 600; font-size: 15.5px; line-height: 1.25; text-wrap: balance; min-width: 0; }
.alt { font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--muted); line-height: 1.2; }
.kicker { font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-top: 4px; }
.meta { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; margin-right: auto; }
.btn { font: 600 13px/1 var(--body); color: #1A1208; background: var(--gold); border: 1px solid var(--gold); border-radius: 7px; padding: 9px 12px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.btn.ghost { background: transparent; color: var(--ink); border-color: var(--line); }
.btn:hover { filter: brightness(1.07); }
.btn[disabled] { opacity: .6; cursor: progress; }
.note { font-size: 13px; color: var(--muted); }
.toast { position: fixed; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); background: var(--panel-2); color: var(--ink); border: 1px solid var(--gold-deep); border-radius: 8px; padding: 10px 14px; font-size: 13.5px; max-width: calc(100% - 32px); z-index: 10; }
.empty { color: var(--muted); padding: 20px 0; }
footer { margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; display: grid; gap: 6px; }
footer code { font-size: 12.5px; color: var(--ink); }
@media (prefers-reduced-motion: reduce) { .stage .again { transition: none; } }
</style>

<div class="wrap">
  <header class="mast">
    <div class="eyebrow">Rito de Memphis-Misraïm · graus 34° a 99°</div>
    <h1>Overlays da Maçonaria <em>Egípcia</em></h1>
    <p class="lede">Um overlay animado por grau para o talking head: número e nome do grau numa placa e uma moldura com o simbolismo de cada um — runas, colunas do Templo, labirinto, ovos alados, a corrente da Cadeia Líbia, as quatro fases da Grande Obra.</p>
    <ul class="facts">
      <li><b>${total}</b> overlays (34°–99°, + 89° e 100°)</li>
      <li>MP4 <b>1920×1080</b>, <b>30 fps</b>, H.264</li>
      <li>Fundo <span class="chip" aria-hidden="true"></span><b>verde #00FF00</b></li>
      <li><b>${minutes} min</b> de overlay no total</li>
    </ul>
    <div class="howto">
      <div><strong>Como usar:</strong> coloque o MP4 numa faixa acima do talking head e aplique <em>chroma key</em> no verde.</div>
      <div><strong>CapCut:</strong> Chroma key (em Remover fundo/Recortar). <strong>Premiere:</strong> Ultra Key. <strong>DaVinci:</strong> 3D Keyer. <strong>Final Cut:</strong> Keyer.</div>
      <div><strong>Duração:</strong> calculada pelo texto do roteiro. Entrada de ~2,5 s e depois um ciclo de 8 s que emenda — corte onde quiser.</div>
    </div>
  </header>

  <div class="bar" role="toolbar" aria-label="Opções da galeria">
    <div class="seg" role="group" aria-label="Fundo da prévia">
      <button type="button" data-bg="video" aria-pressed="true">Sobre o vídeo</button>
      <button type="button" data-bg="verde" aria-pressed="false">Verde (MP4)</button>
      <button type="button" data-bg="escuro" aria-pressed="false">Escuro</button>
    </div>
    <label class="search"><span hidden>Buscar</span><input id="q" type="search" placeholder="Buscar por número ou nome (ex.: 88, fênix, Ísis)" autocomplete="off"></label>
    <nav class="jump" aria-label="Seções">${SECTIONS.map((s) => `<a href="#${s.id}">${s.title}</a>`).join('')}</nav>
  </div>

  <main id="main"></main>
  <p class="empty" id="empty" hidden>Nenhum grau encontrado.</p>

  <footer>
    <div>Clique numa prévia para rever a animação de entrada. As prévias são os SVG animados; os MP4 são o mesmo desenho, renderizado sobre verde.</div>
    <div id="dlnote" hidden>Para baixar, abra esta página pelo claude.ai ou pelo app do Claude. Os arquivos também estão na pasta <code>overlays/maconaria-egipcia</code> do repositório.</div>
  </footer>
</div>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>

<script>
const DATA = ${JSON.stringify(data)};
const main = document.getElementById('main');
const toastEl = document.getElementById('toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3600);
}

// Dentro do claude.ai o download passa pela capability "downloads"; aberto
// localmente (sem window.claude) usamos links diretos para os arquivos.
const inViewer = typeof window.claude !== 'undefined';
let downloads = null;
document.body.dataset.dl = inViewer ? 'pending' : 'local';

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  for (const k of kids) if (k) e.append(k);
  return e;
}

function fileButton(label, path, filename, cls) {
  if (!inViewer) {
    const a = el('a', { class: cls, href: path, download: filename }, label);
    return a;
  }
  const b = el('button', { class: cls + ' needs-dl', type: 'button', 'data-path': path, 'data-file': filename }, label);
  b.hidden = !downloads;
  return b;
}

function card(item) {
  const label = item.n + '° ' + item.name;
  const img = el('img', { src: 'svg/' + item.slug + '.svg', alt: 'Prévia do overlay do ' + label, loading: 'lazy', decoding: 'async' });
  const stage = el('button', { class: 'stage', type: 'button', 'aria-label': 'Rever a animação do ' + label }, img, el('span', { class: 'again', text: 'Rever animação' }));
  stage.addEventListener('click', () => { img.src = 'svg/' + item.slug + '.svg?r=' + Date.now(); });
  const title = el('div', { class: 'title' }, el('span', { class: 'num', text: item.n + '°' }), el('span', { class: 'name', text: item.name }));
  const info = el('div', { class: 'info' }, title);
  if (item.alt) info.append(el('div', { class: 'alt', text: item.alt }));
  info.append(el('div', { class: 'kicker', text: item.kicker }));
  const row = el('div', { class: 'row' }, el('span', { class: 'meta', text: item.dur + ' s · ' + item.mb + ' MB' }));
  row.append(fileButton('Baixar MP4', 'mp4/' + item.slug + '.mp4', item.slug + '.mp4', 'btn'));
  row.append(fileButton('SVG', 'svg/' + item.slug + '.svg', item.slug + '.svg', 'btn ghost'));
  info.append(row);
  const c = el('article', { class: 'card', 'data-q': (item.n + ' ' + item.name + ' ' + item.alt + ' ' + item.kicker).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '') }, stage, info);
  return c;
}

for (const sec of DATA) {
  const head = el('div', { class: 'sec-head' });
  const h2 = el('h2', {}, sec.title, el('small', { text: sec.range + ' · ' + sec.items.length + ' graus' }));
  head.append(h2);
  if (sec.zips.length) {
    const zips = el('div', { class: 'zips' });
    sec.zips.forEach((z) => zips.append(fileButton('Baixar ' + z.label + ' (ZIP · ' + z.mb + ' MB)', z.path, 'overlays-' + z.path.split('/').pop(), 'btn ghost')));
    head.append(zips);
  }
  const grid = el('div', { class: 'grid' });
  sec.items.forEach((it) => grid.append(card(it)));
  main.append(el('section', { class: 'sec', id: sec.id }, head, grid));
}

main.addEventListener('click', async (ev) => {
  const b = ev.target.closest('button.needs-dl');
  if (!b || !downloads) return;
  const old = b.textContent;
  b.disabled = true;
  b.textContent = 'Preparando…';
  try {
    const res = await fetch(b.dataset.path);
    if (!res.ok) throw { code: 'missing' };
    const blob = await res.blob();
    await downloads.save({ filename: b.dataset.file, data: blob });
    toast('Download de ' + b.dataset.file + ' iniciado.');
  } catch (err) {
    const code = err && err.code;
    if (code === 'declined') toast('Download cancelado.');
    else if (code === 'rate_limited') toast('Já há um download aguardando confirmação.');
    else if (code === 'missing') toast('Arquivo não encontrado nesta página.');
    else toast('Não foi possível baixar aqui. Tente pelo app do Claude ou pelo repositório.');
  } finally {
    b.disabled = false;
    b.textContent = old;
  }
});

if (inViewer && window.claude.use) {
  window.claude.use('downloads').then((ns) => {
    downloads = ns;
    document.querySelectorAll('.needs-dl').forEach((b) => { b.hidden = !ns; });
    document.getElementById('dlnote').hidden = !!ns;
  });
}

// fundo da prévia (lembrado só neste navegador)
const segButtons = document.querySelectorAll('.seg button');
function setBg(v) {
  document.body.dataset.bg = v;
  segButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bg === v)));
  try { localStorage.setItem('overlay-bg', v); } catch (e) {}
}
segButtons.forEach((b) => b.addEventListener('click', () => setBg(b.dataset.bg)));
let saved = 'video';
try { saved = localStorage.getItem('overlay-bg') || 'video'; } catch (e) {}
setBg(saved);

// busca
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace('°', '');
  let shown = 0;
  document.querySelectorAll('section.sec').forEach((s) => {
    let n = 0;
    s.querySelectorAll('.card').forEach((c) => {
      const ok = !term || c.dataset.q.includes(term);
      c.hidden = !ok;
      if (ok) n++;
    });
    s.hidden = n === 0;
    shown += n;
  });
  document.getElementById('empty').hidden = shown > 0;
});
</script>
`;

if (artifactOut) {
  writeFileSync(artifactOut, html);
  console.log(`${artifactOut} (${Math.round(html.length / 1024)} KB)`);
} else {
  const cut = html.indexOf('<style>');
  const doc = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${html.slice(0, cut)}</head>\n<body>\n${html.slice(cut)}\n</body>\n</html>\n`;
  writeFileSync(join(ROOT, 'index.html'), doc);
  console.log(`index.html (${Math.round(doc.length / 1024)} KB, ${total} graus)`);
}
