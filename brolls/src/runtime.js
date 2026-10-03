/* Runtime compartilhado dos B-rolls "Ninguém entra numa seita".
 * Cada SVG gerado embute este arquivo, templates.js e os parâmetros do clipe.
 * Contrato: TEMPLATES[nome](raiz, params, duracao, clipe) monta o DOM e devolve frame(t).
 * renderFrame(t) é determinístico: o mesmo t sempre produz o mesmo quadro. */

const W = 1920, H = 1080, NS = 'http://www.w3.org/2000/svg';

const C = {
  bg: '#0E0D0B', bg2: '#16140F', plate: '#121110',
  cream: '#ECE4D3', dim: '#8E887B', faint: '#3A3730', line: '#2B2924',
  red: '#D9412F', amber: '#E5A73C', blue: '#5B8BC0', violet: '#A387D0',
  white: '#F4EFE4', gray: '#9A9488', paper: '#E9E1CF', ink: '#1B1A17'
};

const CAT = {
  judicial:   { label: 'DECISÃO JUDICIAL',      color: C.red },
  oficial:    { label: 'DOCUMENTO OFICIAL',     color: C.blue },
  reportagem: { label: 'REPORTAGEM',            color: C.amber },
  testemunho: { label: 'TESTEMUNHO',            color: C.violet },
  academia:   { label: 'ACADEMIA',              color: C.white },
  org:        { label: 'VERSÃO DA ORGANIZAÇÃO', color: C.gray }
};

const FONT = {
  disp: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  mono: "'IBM Plex Mono', 'DejaVu Sans Mono', monospace",
  serif: "'Newsreader', 'Georgia', serif"
};

/* ---------- utilidades ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const P = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const Ez = {
  lin: p => p,
  out: p => 1 - Math.pow(1 - p, 3),
  out5: p => 1 - Math.pow(1 - p, 5),
  in: p => p * p * p,
  io: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  expo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p))
};

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) {
    if (k === 'text') e.textContent = attrs[k];
    else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}

/* texto: o = {f:'disp'|'mono'|'serif', size, w, fill, anchor, ls, italic, op, upper} */
function tx(parent, x, y, s, o = {}) {
  const e = el('text', {
    x, y,
    'font-family': FONT[o.f || 'mono'],
    'font-size': o.size || 28,
    'font-weight': o.w || (o.f === 'disp' ? 700 : 400),
    'font-style': o.italic ? 'italic' : 'normal',
    fill: o.fill || C.cream,
    'text-anchor': o.anchor || 'start',
    'letter-spacing': o.ls !== undefined ? o.ls : (o.f === 'disp' ? '0.01em' : '0'),
    opacity: o.op !== undefined ? o.op : 1
  }, parent);
  e.textContent = o.upper ? String(s).toUpperCase() : s;
  return e;
}

/* várias linhas, um <text> por linha (para animar separadamente) */
function txLines(parent, x, y, arr, o = {}) {
  const lh = o.lh || (o.size || 28) * 1.25;
  return arr.map((s, i) => tx(parent, x, y + i * lh, s, o));
}

const g = (parent, attrs) => el('g', attrs || {}, parent);
const op = (e, v) => { e.setAttribute('opacity', clamp(v)); return e; };
const tr = (e, x, y, s = 1, r = 0) => { e.setAttribute('transform', `translate(${x},${y}) rotate(${r}) scale(${s})`); return e; };
const typeIn = (e, s, p) => { e.textContent = s.slice(0, Math.round(s.length * clamp(p))); };

function fmt(v, dec = 0) {
  const s = Math.abs(v).toFixed(dec).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + s.join(',');
}

/* revela um elemento com deslize + opacidade. dir em px */
function rise(e, t, t0, dur = 0.6, dy = 24, ease = Ez.out) {
  // preserva a transformação original do elemento (posição, rotação)
  if (e.__base === undefined) e.__base = e.getAttribute('transform') || '';
  const p = ease(P(t, t0, t0 + dur));
  op(e, p);
  e.setAttribute('transform', `${e.__base} translate(0,${(1 - p) * dy})`);
  return p;
}

/* linha que cresce: comprimento via stroke-dasharray */
function growLine(e, len, p) {
  e.setAttribute('stroke-dasharray', `${len} ${len}`);
  e.setAttribute('stroke-dashoffset', len * (1 - clamp(p)));
}

/* ---------- ícones vetoriais (evitam glifos fora do subconjunto latino) ---------- */
function iconCheck(parent, x, y, s, color) {
  return el('path', { d: `M${x - s * 0.5},${y} l${s * 0.35},${s * 0.35} l${s * 0.65},${-s * 0.75}`, fill: 'none', stroke: color, 'stroke-width': s * 0.16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
}
function iconCross(parent, x, y, s, color) {
  const gg = g(parent);
  el('path', { d: `M${x - s / 2},${y - s / 2} L${x + s / 2},${y + s / 2} M${x + s / 2},${y - s / 2} L${x - s / 2},${y + s / 2}`, stroke: color, 'stroke-width': s * 0.16, 'stroke-linecap': 'round' }, gg);
  return gg;
}
function arrowR(parent, x1, y, x2, color, w = 3) {
  const gg = g(parent);
  el('line', { x1, y1: y, x2: x2 - 4, y2: y, stroke: color, 'stroke-width': w }, gg);
  el('path', { d: `M${x2 - 16},${y - 9} L${x2},${y} L${x2 - 16},${y + 9}`, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round' }, gg);
  return gg;
}
function arrowD(parent, x, y1, y2, color, w = 3) {
  const gg = g(parent);
  el('line', { x1: x, y1, x2: x, y2: y2 - 4, stroke: color, 'stroke-width': w }, gg);
  el('path', { d: `M${x - 9},${y2 - 16} L${x},${y2} L${x + 9},${y2 - 16}`, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round' }, gg);
  return gg;
}
/* águia geométrica genérica (não reproduz o símbolo de nenhuma organização) */
function iconEagle(parent, cx, cy, s, color) {
  const gg = g(parent, { transform: `translate(${cx},${cy}) scale(${s / 100})` });
  el('path', {
    d: 'M0,-34 L9,-22 L5,-4 L44,-26 L36,-10 L52,-14 L38,4 L48,6 L28,18 L10,14 L14,38 L0,30 L-14,38 L-10,14 L-28,18 L-48,6 L-38,4 L-52,-14 L-36,-10 L-44,-26 L-5,-4 L-9,-22 Z',
    fill: color
  }, gg);
  el('circle', { cx: 0, cy: -26, r: 2.2, fill: C.bg }, gg);
  return gg;
}
function iconLock(parent, x, y, s, color) {
  const gg = g(parent, { transform: `translate(${x},${y}) scale(${s / 100})` });
  el('path', { d: 'M-26,-10 V-34 A26,26 0 0 1 26,-34 V-10', fill: 'none', stroke: color, 'stroke-width': 10 }, gg);
  el('rect', { x: -40, y: -12, width: 80, height: 64, rx: 6, fill: color }, gg);
  el('circle', { cx: 0, cy: 14, r: 8, fill: C.bg }, gg);
  el('rect', { x: -3, y: 16, width: 6, height: 18, fill: C.bg }, gg);
  return gg;
}

/* reduz a fonte de um conjunto de linhas para caber na largura (fontes já carregadas no boot) */
function fitText(els, maxW) {
  if (!els.length) return;
  const w = Math.max(...els.map(e => e.getComputedTextLength()));
  if (w > maxW) els.forEach(e => e.setAttribute('font-size', (parseFloat(e.getAttribute('font-size')) * maxW / w).toFixed(1)));
}

/* evita que notas inferiores colidam com a linha de fonte do rodapé */
const FY = (clip, y) => (clip && clip.fonte ? Math.min(y, 905) : y);

/* ---------- palco (tela cheia) ---------- */
function stage(root, clip, opts = {}) {
  const somber = !!clip.somber;
  const defs = el('defs', {}, root);
  const vg = el('radialGradient', { id: 'vig', cx: '50%', cy: '46%', r: '75%' }, defs);
  el('stop', { offset: '0%', 'stop-color': somber ? '#121110' : C.bg2 }, vg);
  el('stop', { offset: '100%', 'stop-color': '#070706' }, vg);
  const flt = el('filter', { id: 'grain', x: 0, y: 0, width: '100%', height: '100%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.85, numOctaves: 2, seed: 7, stitchTiles: 'stitch' }, flt);
  el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0' }, flt);

  el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vig)' }, root);
  el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#grain)', opacity: 0.05 }, root);

  const chrome = g(root);
  if (!opts.bare) {
    // moldura de arquivo: cantoneiras
    const m = 44, L = 34;
    const corner = (x, y, dx, dy) => el('path', { d: `M${x},${y + dy * L} L${x},${y} L${x + dx * L},${y}`, fill: 'none', stroke: C.faint, 'stroke-width': 2 }, chrome);
    corner(m, m, 1, 1); corner(W - m, m, -1, 1); corner(m, H - m, 1, -1); corner(W - m, H - m, -1, -1);
    tx(chrome, 92, 78, `NINGUÉM ENTRA NUMA SEITA  ·  PARTE ${clip.ep}`, { f: 'mono', size: 18, fill: C.dim, ls: '0.12em' });
    tx(chrome, W - 92, 78, `ARQ. ${clip.id}`, { f: 'mono', size: 18, fill: C.dim, ls: '0.12em', anchor: 'end' });
    if (clip.fonte) {
      const cat = clip.cat ? CAT[clip.cat] : null;
      let x = 92;
      if (cat) {
        const lab = cat.label;
        const wbox = lab.length * 11.2 + 28;
        el('rect', { x, y: H - 104, width: wbox, height: 34, fill: 'none', stroke: cat.color, 'stroke-width': 2 }, chrome);
        tx(chrome, x + wbox / 2, H - 80, lab, { f: 'mono', size: 17, w: 500, fill: cat.color, anchor: 'middle', ls: '0.08em' });
        x += wbox + 20;
      }
      tx(chrome, x, H - 80, clip.fonte, { f: 'mono', size: 20, fill: C.dim });
    }
  }
  const content = g(root);
  return { content, chrome, defs, somber };
}

/* ---------- boot ---------- */
function boot() {
  const svg = document.documentElement;
  const root = document.getElementById('root');
  const clip = window.CLIP;
  const start = () => {
    const frame = TEMPLATES[clip.t](root, clip.p || {}, clip.d, clip);
    window.renderFrame = t => frame(Math.min(t, clip.d - 1e-6));
    window.renderFrame(0);
    window.__ready = true;
    if (location.hash !== '#capture') {
      let t0 = null;
      const loop = now => {
        if (t0 === null) t0 = now;
        const t = ((now - t0) / 1000) % (clip.d + 1);
        window.renderFrame(Math.min(t, clip.d));
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };
  if (document.fonts && document.fonts.ready) {
    // força o carregamento das faces antes de medir texto
    Promise.all([
      document.fonts.load(`700 40px ${FONT.disp}`), document.fonts.load(`600 40px ${FONT.disp}`),
      document.fonts.load(`400 40px ${FONT.mono}`), document.fonts.load(`500 40px ${FONT.mono}`),
      document.fonts.load(`italic 400 40px ${FONT.serif}`), document.fonts.load(`400 40px ${FONT.serif}`)
    ]).catch(() => {}).then(() => document.fonts.ready).then(start);
  } else start();
}
