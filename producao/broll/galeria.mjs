// Gera a galeria de revisão dos b-rolls.
// Uso:
//   node producao/broll/galeria.mjs                 → producao/broll/index.html (carrega os arquivos de svg/)
//   node producao/broll/galeria.mjs --inline <saida> → página única com todos os SVGs embutidos
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSS } from './kit.mjs';
import { AULAS, MODULOS } from './aulas.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const inline = process.argv[2] === '--inline';
const target = inline ? process.argv[3] : join(here, 'index.html');
if (!target) throw new Error('informe o arquivo de saída depois de --inline');

const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const data = manifest.map((c) => {
  const d = { id: c.id, aula: c.aula, title: c.title, cue: c.cue, dur: c.dur, overlay: c.overlay, warn: c.warn, file: c.file };
  // vídeos já renderizados (out/mp4, out/webm): tamanho em bytes, para o botão de download
  for (const ext of ['mp4', 'webm']) {
    const f = join(here, 'out', ext, c.file.replace('.svg', '.' + ext));
    if (existsSync(f)) d[ext] = statSync(f).size;
  }
  if (inline) {
    // o estilo das animações é o mesmo em todos os clipes: vai uma vez só no <head>
    d.svg = readFileSync(join(here, 'svg', c.file), 'utf8').replace(/<style>[\s\S]*?<\/style>/, '');
  }
  return d;
});
const json = JSON.stringify(data).replace(/<\//g, '<\\/');
const total = data.length;
const nAulas = new Set(data.filter((c) => c.aula !== 'L').map((c) => c.aula)).size;
const nWarn = data.filter((c) => c.warn).length;

const html = `<title>B-rolls Jornalismo Investigativo</title>
<meta name="description" content="${total} b-rolls e animações em SVG para as aulas do curso Jornalismo Investigativo na Prática.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap">
<style>
/* Layout: mesa de edição — índice de módulos fixo no topo, aulas em sequência, clipes em grade 16:9 */
:root {
  --bg: #0C0C0D; --panel: #141416; --panel-2: #1C1C1F; --line: #2A2A2F;
  --ink: #F4F1EA; --ink-2: #A9A59C; --ink-3: #8A867D;
  --amber: #FFB800; --red: #FF6B5E; --green: #4ADE80;
  --display: 'Archivo Black', 'Arial Black', Impact, sans-serif;
  --body: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'JetBrains Mono', 'DejaVu Sans Mono', Menlo, monospace;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.45; }
.g-wrap { max-width: 1480px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 48px); padding-block: 40px 96px; }
.g-eyebrow { font: 700 12px/1 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--amber); display: flex; gap: 10px; align-items: center; }
.g-eyebrow::before { content: ''; width: 10px; height: 10px; background: var(--amber); }
h1 { font: 400 clamp(34px, 6vw, 64px)/1.02 var(--display); margin: 16px 0 14px; text-wrap: balance; }
.g-lede { color: var(--ink-2); max-width: 62ch; margin: 0; font-size: 17px; }
.g-lede b { color: var(--ink); font-weight: 700; }
.g-bar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); margin-top: 28px; padding-block: 12px; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
.g-mods { display: flex; flex-wrap: wrap; gap: 6px; }
.g-chip { font: 700 12px/1 var(--mono); letter-spacing: .06em; color: var(--ink-2); background: var(--panel); border: 1px solid var(--line); padding: 8px 10px; cursor: pointer; }
.g-chip:hover { color: var(--ink); border-color: var(--ink-3); }
.g-chip[aria-pressed="true"] { background: var(--amber); border-color: var(--amber); color: var(--bg); }
.g-chip:focus-visible, .g-search:focus-visible, .g-stage:focus-visible, .g-toggle input:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.g-search { flex: 1 1 220px; min-width: 0; font: 15px var(--body); color: var(--ink); background: var(--panel); border: 1px solid var(--line); padding: 9px 12px; }
.g-search::placeholder { color: var(--ink-3); }
.g-toggle { display: flex; gap: 8px; align-items: center; font-size: 14px; color: var(--ink-2); cursor: pointer; }
.g-toggle input { accent-color: var(--amber); width: 16px; height: 16px; }
.g-count { font: 12px var(--mono); color: var(--ink-3); margin-left: auto; font-variant-numeric: tabular-nums; }
.g-mod { margin-top: 56px; }
.g-mod > h2 { font: 400 clamp(22px, 3vw, 30px)/1.1 var(--display); margin: 0 0 4px; display: flex; gap: 14px; align-items: baseline; flex-wrap: wrap; text-wrap: balance; }
.g-mod > h2 span { font: 700 13px var(--mono); color: var(--amber); letter-spacing: .1em; }
.g-aula { margin-top: 28px; }
.g-aula > h3 { font: 700 13px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-2); margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; gap: 12px; }
.g-aula > h3 b { color: var(--ink); }
.g-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 28px 22px; }
.g-card { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.g-stage { position: relative; aspect-ratio: 16 / 9; max-width: 100%; background: #0C0C0D; border: 1px solid var(--line); cursor: pointer; overflow: hidden; padding: 0; display: block; width: 100%; }
.g-stage.is-overlay { background: radial-gradient(120% 90% at 70% 30%, #4B5563 0%, #2B323C 55%, #1D2229 100%); }
.g-stage.is-overlay::after { content: 'sobre a câmera'; position: absolute; top: 10px; right: 12px; font: 700 10px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: rgba(244,241,234,.55); }
.g-stage svg, .g-stage object { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
.g-play { position: absolute; left: 10px; bottom: 10px; font: 700 11px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--bg); background: var(--amber); padding: 6px 9px; opacity: 0; transition: opacity .15s; }
.g-stage:hover .g-play, .g-stage:focus-visible .g-play { opacity: 1; }
.g-meta { display: flex; justify-content: space-between; gap: 10px; font: 12px var(--mono); color: var(--ink-3); font-variant-numeric: tabular-nums; }
.g-meta b { color: var(--amber); font-weight: 700; }
.g-meta > span { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.g-dl { font: 700 11px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; text-decoration: none; color: var(--bg); background: var(--amber); border: 1px solid var(--amber); padding: 6px 9px; cursor: pointer; white-space: nowrap; }
.g-dl:hover { background: var(--ink); border-color: var(--ink); }
.g-dl.is-alt { color: var(--amber); background: transparent; }
.g-dl.is-alt:hover { color: var(--bg); background: var(--amber); }
.g-dl[aria-busy="true"] { opacity: .6; cursor: progress; }
.g-dl:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.g-dlmsg { font: 12px var(--mono); color: var(--red); margin: -4px 0 0; }
.g-title { font: 700 17px/1.25 var(--body); margin: 0; }
.g-cue { font-size: 14px; color: var(--ink-2); margin: 0; }
.g-warn { font-size: 13px; color: var(--ink); background: color-mix(in srgb, var(--red) 14%, transparent); border-left: 3px solid var(--red); padding: 8px 10px; margin: 0; }
.g-warn b { color: var(--red); font: 700 11px var(--mono); letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: 2px; }
.g-file { font: 11px var(--mono); color: var(--ink-3); overflow-wrap: anywhere; margin: 0; }
.g-empty { color: var(--ink-2); margin-top: 48px; }
@media (prefers-reduced-motion: reduce) { .g-play { transition: none; } }
${inline ? CSS : ''}
</style>
<div class="g-wrap">
  <p class="g-eyebrow">Jornalismo Investigativo na Prática · material de edição</p>
  <h1>B-rolls e animações das aulas</h1>
  <p class="g-lede"><b>${total} clipes</b> em SVG animado, 1920 × 1080, para as ${nAulas} aulas e os letterings. Cada cartão traz a deixa do roteiro em que o clipe entra e o botão para baixar o vídeo em MP4. Clique na imagem para tocar de novo. <b>${nWarn}</b> pedem conferência antes da gravação.</p>
  <div class="g-bar" role="search">
    <div class="g-mods" id="mods"></div>
    <input class="g-search" id="busca" type="search" placeholder="Buscar por título, deixa ou código (ex.: 4.6, PNCP, prazo)" aria-label="Buscar clipes">
    <label class="g-toggle"><input type="checkbox" id="soAviso"> Só os que pedem conferência</label>
    <span class="g-count" id="contagem"></span>
  </div>
  <main id="lista"></main>
  <p class="g-empty" id="vazio" hidden>Nenhum clipe com esse filtro.</p>
</div>
<script>
const CLIPS = ${json};
const AULAS = ${JSON.stringify(AULAS)};
const MODULOS = ${JSON.stringify(MODULOS)};
const INLINE = ${inline};
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modOf = (c) => (c.aula === 'L' ? 'L' : c.aula.split('.')[0]);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const fmt = (n) => n.toFixed(1).replace('.', ',') + ' s';

const mb = (n) => (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
const base = (c) => c.file.replace(/\\.svg$/, '');
// botões de download: no modo embutido usam a capacidade de downloads do visualizador;
// no modo local são links para out/mp4 e out/webm (gerados pelo render.mjs)
function dlButtons(c) {
  let h = '';
  const kinds = [['mp4', c.overlay ? 'MP4 verde' : 'MP4', ''], ['webm', 'WebM transparente', ' is-alt']];
  for (const [ext, label, cls] of kinds) {
    if (ext === 'webm' && !c.overlay) continue;
    if (INLINE && !c[ext]) continue;
    const name = base(c) + '.' + ext;
    const title = ext === 'webm' ? 'Vídeo com fundo transparente, para pôr sobre a câmera' : c.overlay ? 'MP4 sobre verde de recorte (#00B140)' : 'Vídeo MP4 1080p';
    const size = c[ext] ? ' · ' + mb(c[ext]) : '';
    h += INLINE
      ? '<button class="g-dl' + cls + '" type="button" data-ext="' + ext + '" title="' + title + '" hidden>↓ ' + label + size + '</button>'
      : '<a class="g-dl' + cls + '" href="out/' + ext + '/' + esc(name) + '" download title="' + title + '">↓ ' + label + size + '</a>';
  }
  return h;
}

// monta módulos → aulas → cartões
const lista = document.getElementById('lista');
const mods = [...new Set(CLIPS.map(modOf))];
let htmlOut = '';
for (const m of mods) {
  const doMod = CLIPS.filter((c) => modOf(c) === m);
  htmlOut += '<section class="g-mod" data-mod="' + m + '"><h2>' + (m === 'L' ? '' : '<span>MÓDULO ' + m + '</span>') + esc(MODULOS[m]) + '</h2>';
  for (const a of [...new Set(doMod.map((c) => c.aula))]) {
    const doAula = doMod.filter((c) => c.aula === a);
    htmlOut += '<div class="g-aula" data-aula="' + a + '"><h3><span>' + (a === 'L' ? 'Sobreposições com fundo transparente' : 'Aula ' + a + ' · <b>' + esc(AULAS[a]) + '</b>') + '</span><span class="n">' + doAula.length + '</span></h3><div class="g-grid">';
    for (const c of doAula) {
      const i = CLIPS.indexOf(c);
      htmlOut += '<article class="g-card" data-i="' + i + '">'
        + '<button class="g-stage' + (c.overlay ? ' is-overlay' : '') + '" type="button" aria-label="Tocar ' + esc(c.title) + '"><span class="g-play">▶ Tocar</span></button>'
        + '<div class="g-meta"><b>' + esc(c.id) + '</b><span>' + fmt(c.dur) + dlButtons(c) + '</span></div>'
        + '<p class="g-dlmsg" hidden></p>'
        + '<h4 class="g-title">' + esc(c.title) + '</h4>'
        + '<p class="g-cue">' + esc(c.cue) + '</p>'
        + (c.warn ? '<p class="g-warn"><b>Conferir</b>' + esc(c.warn) + '</p>' : '')
        + '<p class="g-file">svg/' + esc(c.file) + '</p>'
        + '</article>';
    }
    htmlOut += '</div></div>';
  }
  htmlOut += '</section>';
}
lista.innerHTML = htmlOut;

// animação: no modo embutido, o clipe aparece parado no quadro final e toca quando pedido
function anims(stage) { const s = stage.querySelector('svg'); return s ? s.getAnimations({ subtree: true }) : []; }
function toEnd(stage, c) { for (const a of anims(stage)) { a.pause(); a.currentTime = c.dur * 1000; } }
function play(stage, c) {
  if (INLINE) { for (const a of anims(stage)) { a.currentTime = 0; a.play(); } return; }
  const old = stage.querySelector('object');
  if (old) { const o = old.cloneNode(); old.replaceWith(o); }
}
function mount(card) {
  const c = CLIPS[card.dataset.i];
  const stage = card.querySelector('.g-stage');
  if (stage.dataset.on) return;
  stage.dataset.on = '1';
  if (INLINE) {
    stage.insertAdjacentHTML('afterbegin', c.svg);
    toEnd(stage, c);
  } else {
    const o = document.createElement('object');
    o.type = 'image/svg+xml';
    o.data = 'svg/' + c.file;
    o.setAttribute('aria-hidden', 'true');
    stage.prepend(o);
  }
}
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { mount(e.target); io.unobserve(e.target); }
}, { rootMargin: '600px 0px' });
document.querySelectorAll('.g-card').forEach((card) => io.observe(card));
let downloads = null;
if (INLINE && window.claude && typeof window.claude.use === 'function') {
  window.claude.use('downloads').then((d) => {
    downloads = d;
    if (d) document.querySelectorAll('button.g-dl').forEach((b) => { b.hidden = false; });
  }).catch(() => {});
}
const avisos = { rate_limited: 'Já há uma janela de download aberta. Feche-a e tente de novo.', too_large: 'Arquivo grande demais para esta visualização.', fetch: 'Não consegui carregar o vídeo. Recarregue a página e tente de novo.' };
async function baixar(btn) {
  const card = btn.closest('.g-card');
  const c = CLIPS[card.dataset.i];
  const ext = btn.dataset.ext;
  const msg = card.querySelector('.g-dlmsg');
  msg.hidden = true;
  if (!downloads || btn.getAttribute('aria-busy') === 'true') return;
  btn.setAttribute('aria-busy', 'true');
  try {
    const r = await fetch(ext + '/' + base(c) + '.' + ext);
    if (!r.ok) throw { code: 'fetch' };
    const blob = await r.blob();
    await downloads.save({ filename: base(c) + '.' + ext, data: blob });
  } catch (e) {
    const code = (e && e.code) || 'fetch';
    if (code !== 'declined') {
      msg.textContent = avisos[code] || 'Download indisponível nesta visualização.';
      msg.hidden = false;
    }
  } finally {
    btn.removeAttribute('aria-busy');
  }
}
lista.addEventListener('click', (ev) => {
  const dl = ev.target.closest('button.g-dl');
  if (dl) { baixar(dl); return; }
  const stage = ev.target.closest('.g-stage');
  if (!stage) return;
  const card = stage.closest('.g-card');
  mount(card);
  play(stage, CLIPS[card.dataset.i]);
});
if (INLINE && !reduce) {
  lista.addEventListener('pointerenter', (ev) => {
    const stage = ev.target.closest && ev.target.closest('.g-stage');
    if (stage && ev.pointerType === 'mouse' && !stage.dataset.hovered) { stage.dataset.hovered = '1'; play(stage, CLIPS[stage.closest('.g-card').dataset.i]); }
  }, true);
  lista.addEventListener('pointerleave', (ev) => {
    const stage = ev.target.closest && ev.target.closest('.g-stage');
    if (stage && ev.target === stage) delete stage.dataset.hovered;
  }, true);
}

// filtros
const modsEl = document.getElementById('mods');
let modAtivo = 'todos';
const chips = [['todos', 'Todos']].concat(mods.map((m) => [m, m === 'L' ? 'Letterings' : 'M' + m]));
modsEl.innerHTML = chips.map(([k, t]) => '<button class="g-chip" type="button" data-k="' + k + '" aria-pressed="' + (k === 'todos') + '">' + t + '</button>').join('');
const busca = document.getElementById('busca');
const soAviso = document.getElementById('soAviso');
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
function filtrar() {
  const q = norm(busca.value.trim());
  let n = 0;
  document.querySelectorAll('.g-card').forEach((card) => {
    const c = CLIPS[card.dataset.i];
    const ok = (modAtivo === 'todos' || modOf(c) === modAtivo)
      && (!soAviso.checked || c.warn)
      && (!q || norm(c.id + ' ' + c.title + ' ' + c.cue + ' ' + (c.warn || '') + ' ' + (AULAS[c.aula] || '')).includes(q));
    card.hidden = !ok;
    if (ok) n++;
  });
  document.querySelectorAll('.g-aula').forEach((s) => { s.hidden = !s.querySelector('.g-card:not([hidden])'); });
  document.querySelectorAll('.g-mod').forEach((s) => { s.hidden = !s.querySelector('.g-aula:not([hidden])'); });
  document.getElementById('contagem').textContent = n + ' de ' + CLIPS.length;
  document.getElementById('vazio').hidden = n > 0;
}
modsEl.addEventListener('click', (ev) => {
  const b = ev.target.closest('.g-chip');
  if (!b) return;
  modAtivo = b.dataset.k;
  modsEl.querySelectorAll('.g-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  filtrar();
});
busca.addEventListener('input', filtrar);
soAviso.addEventListener('change', filtrar);
filtrar();
</script>
`;

writeFileSync(target, inline ? html : `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${html.replace('<div class="g-wrap">', '</head>\n<body>\n<div class="g-wrap">')}</body>\n</html>\n`);
console.log(`galeria: ${target} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
