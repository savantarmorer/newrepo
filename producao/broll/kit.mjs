// Kit visual dos b-rolls: identidade do curso, motor de texto e componentes animados.
// Tudo devolve strings SVG. Coordenadas em 1920 × 1080.
import { readFileSync } from 'node:fs';

const metrics = JSON.parse(readFileSync(new URL('./metrics.json', import.meta.url), 'utf8'));

export const W = 1920;
export const H = 1080;
export const X0 = 120;
export const X1 = 1800;
export const BW = X1 - X0;

export const C = {
  bg: '#0C0C0D', s1: '#141416', s2: '#1C1C1F', s3: '#232327', line: '#2A2A2F', lineUi: '#66666F',
  ink: '#F4F1EA', ink2: '#A9A59C', ink3: '#8A867D',
  amber: '#FFB800', red: '#FF6B5E', green: '#4ADE80', blue: '#8FB8FF',
  paper: '#F5F1E8', pInk: '#1C1A17', pInk2: '#5B564C', pLine: '#D8D0BE', pAccent: '#7A5400'
};

export const FONT = {
  display: "'Archivo Black','Arial Black',Impact,sans-serif",
  sans: "'Space Grotesk','Helvetica Neue',Arial,sans-serif",
  mono: "'JetBrains Mono','DejaVu Sans Mono',Menlo,monospace"
};

// ------------------------------------------------------------------ tempo
// Cada clipe zera o relógio; anim() registra o fim de cada animação.
let END = 0;
export function resetClock() { END = 0; }
export function clockEnd() { return END; }

const r2 = (n) => Math.round(n * 100) / 100;

export function anim(cls, d, inner, { t, style = '' } = {}) {
  const dur = t ?? DUR[cls.split(' ')[0]] ?? 0.7;
  END = Math.max(END, d + dur);
  return `<g class="a ${cls}" style="--d:${r2(d)}s;--t:${r2(dur)}s;${style}">${inner}</g>`;
}
const DUR = { fade: 0.7, up: 0.7, down: 0.7, left: 0.7, right: 0.7, pop: 0.6, stamp: 0.55, draw: 0.9, grow: 0.7, growY: 0.9, uncover: 0.8, dim: 0.6, gone: 0.5, shake: 0.5, drop: 1.1, blink: 0.9, zoom: 1.2, pulse: 1.2, slideL: 0.8, slideR: 0.8, spin: 2 };

export const CSS = `
.a{animation-duration:var(--t);animation-delay:var(--d);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
.fade{animation-name:k-fade}.up{animation-name:k-up}.down{animation-name:k-down}.left{animation-name:k-left}.right{animation-name:k-right}
.pop{animation-name:k-pop;transform-box:fill-box;transform-origin:center}
.stamp{animation-name:k-stamp;transform-box:fill-box;transform-origin:center;animation-timing-function:cubic-bezier(.3,1.4,.5,1)}
.draw{animation-name:k-draw;stroke-dasharray:1;stroke-dashoffset:1;animation-timing-function:cubic-bezier(.6,0,.3,1)}
.draw path,.draw line,.draw polyline,.draw rect,.draw circle{stroke-dasharray:1 1}
.grow{animation-name:k-grow;transform-box:fill-box;transform-origin:left center}
.growY{animation-name:k-growY;transform-box:fill-box;transform-origin:center bottom}
.uncover{animation-name:k-uncover;transform-box:fill-box;transform-origin:right center;animation-timing-function:cubic-bezier(.7,0,.2,1)}
.dim{animation-name:k-dim}.gone{animation-name:k-gone}
.shake{animation-name:k-shake;animation-timing-function:linear}
.drop{animation-name:k-drop;transform-box:fill-box;transform-origin:center;animation-timing-function:cubic-bezier(.5,0,.9,.5)}
.zoom{animation-name:k-zoom;transform-box:view-box;animation-timing-function:cubic-bezier(.6,0,.2,1)}
.pulse{animation-name:k-pulse;transform-box:fill-box;transform-origin:center;animation-iteration-count:2}
.slideL{animation-name:k-slideL}.slideR{animation-name:k-slideR}.spin{animation-name:k-spin;transform-box:view-box;animation-timing-function:linear}
@keyframes k-fade{from{opacity:0}to{opacity:1}}
@keyframes k-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes k-down{from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}}
@keyframes k-left{from{opacity:0;transform:translateX(-48px)}to{opacity:1;transform:none}}
@keyframes k-right{from{opacity:0;transform:translateX(48px)}to{opacity:1;transform:none}}
@keyframes k-pop{0%{opacity:0;transform:scale(.82)}65%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
@keyframes k-stamp{0%{opacity:0;transform:scale(1.9) rotate(-9deg)}100%{opacity:1;transform:scale(1) rotate(-4deg)}}
@keyframes k-draw{to{stroke-dashoffset:0}}
@keyframes k-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes k-growY{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes k-uncover{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes k-dim{from{opacity:1}to{opacity:.16}}
@keyframes k-gone{from{opacity:1}to{opacity:0}}
@keyframes k-shake{0%,100%{transform:none}20%{transform:translateX(-14px)}40%{transform:translateX(12px)}60%{transform:translateX(-8px)}80%{transform:translateX(5px)}}
@keyframes k-drop{0%{opacity:1;transform:none}100%{opacity:0;transform:translateY(260px) rotate(14deg)}}
@keyframes k-zoom{from{transform:none}to{transform:var(--z)}}
@keyframes k-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes k-slideL{from{transform:translateX(0)}to{transform:translateX(var(--dx))}}@keyframes k-spin{from{transform:rotate(0)}to{transform:rotate(var(--r))}}
@keyframes k-slideR{from{transform:translateX(0)}to{transform:translateX(var(--dx))}}
`.replace(/\n/g, '');

// ------------------------------------------------------------------ texto
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fkey(font, weight) {
  if (font === 'display') return 'display';
  if (font === 'mono') return weight >= 600 ? 'mono700' : 'mono400';
  return weight >= 650 ? 'sans700' : weight >= 500 ? 'sans500' : 'sans400';
}

export function measure(str, { font = 'sans', size = 40, weight = 400, ls = 0 } = {}) {
  const m = metrics[fkey(font, weight)];
  let w = 0;
  let n = 0;
  for (const ch of str) { w += m.w[ch] ?? m.avg; n++; }
  return w * size + ls * size * Math.max(0, n - 1);
}

// Marcação: {a|âmbar} {r|vermelho} {g|verde} {b|azul} {d|apagado} {w|negrito} {h|marca-texto} {s|riscado} {k|tinta}
// Combinações valem: {aw|âmbar negrito}.
function parseRich(str) {
  const out = [];
  let i = 0;
  let buf = '';
  let style = '';
  while (i < str.length) {
    const c = str[i];
    if (c === '{' && /^\{[a-z]{1,4}\|/.test(str.slice(i))) {
      if (buf) out.push({ text: buf, style });
      buf = '';
      const bar = str.indexOf('|', i);
      style = str.slice(i + 1, bar);
      i = bar + 1;
      continue;
    }
    if (c === '}' && style) {
      out.push({ text: buf, style });
      buf = '';
      style = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf) out.push({ text: buf, style });
  return out;
}

// Quebra em palavras preservando o estilo; devolve linhas com segmentos já posicionados.
export function layout(str, { size = 40, font = 'sans', weight = 400, w = 1000, lh = 1.28, ls = 0, upper = false } = {}) {
  const paras = String(str).split('\n');
  const lines = [];
  for (const para of paras) {
    const segs = parseRich(upper ? para.toUpperCase().replace(/\{([A-Z]{1,4})\|/g, (m, s) => `{${s.toLowerCase()}|`) : para);
    const words = [];
    for (const seg of segs) {
      const parts = seg.text.split(/( )/);
      for (const p of parts) {
        if (p === '') continue;
        if (p === ' ') { words.push({ space: true, style: seg.style }); continue; }
        words.push({ text: p, style: seg.style });
      }
    }
    // agrupa tokens colados (sem espaço entre eles) para não quebrar “palavra}.” no meio
    const groups = [];
    let cur = null;
    for (const wd of words) {
      if (wd.space) { cur = null; groups.push({ space: true, style: wd.style }); continue; }
      const wt = wd.style.includes('w') ? Math.max(weight, 700) : weight;
      const part = { text: wd.text, style: wd.style, w: measure(wd.text, { font, size, weight: wt, ls }), weight: wt };
      if (cur) { cur.parts.push(part); cur.w += part.w; } else { cur = { parts: [part], w: part.w }; groups.push(cur); }
    }
    let line = [];
    let lw = 0;
    const spaceW = measure(' ', { font, size, weight, ls });
    const flush = () => {
      while (line.length && line[line.length - 1].space) line.pop();
      lines.push(line);
      line = [];
      lw = 0;
    };
    for (const g of groups) {
      if (g.space) {
        if (line.length) { line.push({ space: true, style: g.style, w: spaceW }); lw += spaceW; }
        continue;
      }
      if (lw + g.w > w && line.some((x) => !x.space)) flush();
      for (const p of g.parts) line.push(p);
      lw += g.w;
    }
    flush();
  }
  // mescla palavras vizinhas de mesmo estilo em segmentos
  const out = lines.map((ln) => {
    const segs = [];
    let x = 0;
    for (const it of ln) {
      const last = segs[segs.length - 1];
      const txt = it.space ? ' ' : it.text;
      if (last && last.style === it.style && last.weight === (it.weight ?? last.weight)) {
        last.text += txt;
        last.w += it.w;
      } else {
        segs.push({ text: txt, style: it.style, w: it.w, x, weight: it.weight ?? weight });
      }
      x += it.w;
    }
    return { segs, w: x };
  });
  return { lines: out, lh: size * lh, h: out.length * size * lh, w: Math.max(0, ...out.map((l) => l.w)) };
}

const TONE = { a: C.amber, r: C.red, g: C.green, b: C.blue, d: C.ink3, k: C.pInk };

// Texto rico posicionado. y é a linha de base da primeira linha.
// Devolve { svg, h, w, marks } — marks são as caixas de {h|} e {s|} para animar à parte.
export function rich(str, o = {}) {
  const { x = 0, y = 0, size = 40, font = 'sans', weight = 400, fill = C.ink, anchor = 'start', w = 1000, lh = 1.28, ls = 0,
    upper = false, hlColor = C.amber, hlOpacity = 0.32, hlD = 0, hlStep = 0.35, paper = false } = o;
  const L = layout(str, { size, font, weight, w, lh, ls, upper });
  let svg = '';
  const marks = [];
  L.lines.forEach((ln, i) => {
    const by = y + i * L.lh;
    const dx = anchor === 'middle' ? -ln.w / 2 : anchor === 'end' ? -ln.w : 0;
    let tsp = '';
    for (const sg of ln.segs) {
      let col = fill;
      for (const ch of sg.style) if (TONE[ch]) col = ch === 'd' && paper ? C.pInk2 : TONE[ch];
      if (sg.style.includes('h') || sg.style.includes('s')) {
        marks.push({ kind: sg.style.includes('s') ? 's' : 'h', x: x + dx + sg.x, y: by, w: sg.w, size });
      }
      const fw = sg.weight !== weight ? ` font-weight="${sg.weight}"` : '';
      const fc = col !== fill ? ` fill="${col}"` : '';
      tsp += `<tspan${fc}${fw}>${esc(sg.text)}</tspan>`;
    }
    svg += `<text x="${r2(x + dx)}" y="${r2(by)}" font-family="${FONT[font]}" font-size="${size}" font-weight="${weight}" fill="${fill}"${ls ? ` letter-spacing="${r2(ls * size)}"` : ''} xml:space="preserve">${tsp}</text>`;
  });
  let under = '';
  let over = '';
  let k = 0;
  for (const m of marks) {
    if (m.kind === 'h') {
      under += anim('grow', hlD + k * hlStep, `<rect x="${r2(m.x - 6)}" y="${r2(m.y - m.size * 0.86)}" width="${r2(m.w + 12)}" height="${r2(m.size * 1.12)}" fill="${hlColor}" opacity="${hlOpacity}"/>`);
    } else {
      over += anim('draw', hlD + k * hlStep, `<line x1="${r2(m.x - 4)}" y1="${r2(m.y - m.size * 0.32)}" x2="${r2(m.x + m.w + 4)}" y2="${r2(m.y - m.size * 0.32)}" stroke="${C.red}" stroke-width="${Math.max(4, m.size * 0.09)}" stroke-linecap="round" pathLength="1"/>`, { t: 0.5 });
    }
    k++;
  }
  return { svg: under + svg + over, h: L.h, w: L.w, lines: L.lines.length, lh: L.lh };
}

// Ajusta o tamanho até caber em w × h.
export function fit(str, o) {
  let size = o.size ?? 40;
  const min = o.min ?? 22;
  while (size > min) {
    const L = layout(str, { ...o, size });
    if (L.h <= (o.h ?? Infinity) && L.w <= o.w + 0.5) break;
    size -= 2;
  }
  return size;
}

// ------------------------------------------------------------------ ícones (48 × 48, traço)
const IC = {
  check: '<path d="M8 25 L19 36 L40 12" />',
  cross: '<path d="M11 11 L37 37 M37 11 L11 37" />',
  doc: '<path d="M12 5 H30 L38 13 V43 H12 Z M30 5 V13 H38 M18 22 H32 M18 29 H32 M18 36 H27" />',
  lock: '<rect x="10" y="21" width="28" height="21" rx="2"/><path d="M16 21 V14 A8 8 0 0 1 32 14 V21 M24 29 V34" />',
  eye: '<path d="M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24 Z"/><circle cx="24" cy="24" r="6"/>',
  person: '<circle cx="24" cy="15" r="8"/><path d="M8 43 C8 31 40 31 40 43" />',
  phone: '<rect x="14" y="4" width="20" height="40" rx="3"/><path d="M21 38 H27" />',
  mail: '<rect x="5" y="11" width="38" height="26" rx="2"/><path d="M5 13 L24 27 L43 13" />',
  clock: '<circle cx="24" cy="24" r="18"/><path d="M24 13 V24 L31 29" />',
  cal: '<rect x="6" y="9" width="36" height="33" rx="2"/><path d="M6 18 H42 M15 5 V13 M33 5 V13" />',
  search: '<circle cx="20" cy="20" r="12"/><path d="M29 29 L42 42" />',
  warn: '<path d="M24 5 L44 41 H4 Z M24 18 V29 M24 34 V35" />',
  shield: '<path d="M24 4 L40 10 V23 C40 33 33 40 24 44 C15 40 8 33 8 23 V10 Z" />',
  scale: '<path d="M24 6 V42 M12 42 H36 M8 12 H40 M8 12 L2 26 H14 Z M40 12 L34 26 H46 Z" />',
  chat: '<path d="M6 8 H42 V32 H20 L10 40 V32 H6 Z" />',
  mic: '<rect x="17" y="4" width="14" height="24" rx="7"/><path d="M10 22 C10 38 38 38 38 22 M24 34 V43" />',
  building: '<path d="M6 42 H42 M10 42 V18 H38 V42 M6 18 L24 6 L42 18 M16 24 V36 M24 24 V36 M32 24 V36" />',
  gavel: '<path d="M20 8 L34 22 M14 14 L28 28 M17 11 L31 25 M24 25 L40 41 M6 42 H26" />',
  link: '<path d="M20 28 L28 20 M17 23 L12 28 A6 6 0 0 0 20 36 L25 31 M31 25 L36 20 A6 6 0 0 0 28 12 L23 17" />',
  plane: '<path d="M4 26 L44 16 L40 22 L24 26 L14 40 L10 38 L15 27 L6 29 Z" />',
  house: '<path d="M6 22 L24 7 L42 22 M11 18 V42 H37 V18 M20 42 V30 H28 V42" />',
  printer: '<rect x="12" y="6" width="24" height="12"/><rect x="6" y="18" width="36" height="16"/><rect x="12" y="28" width="24" height="14"/>',
  key: '<circle cx="15" cy="24" r="8"/><path d="M23 24 H42 M36 24 V31 M42 24 V30" />',
  money: '<rect x="4" y="12" width="40" height="24" rx="2"/><circle cx="24" cy="24" r="6"/><path d="M10 18 V30 M38 18 V30" />',
  bolt: '<path d="M27 4 L10 27 H23 L20 44 L38 20 H25 Z" />',
  pin: '<path d="M24 44 C24 44 8 28 8 18 A16 16 0 0 1 40 18 C40 28 24 44 24 44 Z"/><circle cx="24" cy="18" r="5"/>',
  camera: '<rect x="4" y="13" width="40" height="27" rx="2"/><circle cx="24" cy="26" r="8"/><path d="M16 13 L19 7 H29 L32 13" />',
  stop: '<path d="M16 4 H32 L44 16 V32 L32 44 H16 L4 32 V16 Z" />',
  globe: '<circle cx="24" cy="24" r="19"/><path d="M5 24 H43 M24 5 C14 16 14 32 24 43 M24 5 C34 16 34 32 24 43" />',
  video: '<rect x="4" y="11" width="30" height="26" rx="2"/><path d="M34 20 L44 14 V34 L34 28" />',
  flag: '<path d="M10 44 V5 M10 7 H38 L32 16 L38 25 H10" />',
  pen: '<path d="M8 40 L12 28 L32 8 L40 16 L20 36 Z M28 12 L36 20" />',
  hash: '<path d="M18 6 L14 42 M34 6 L30 42 M8 17 H42 M6 31 H40" />',
  users: '<circle cx="17" cy="16" r="7"/><circle cx="33" cy="18" r="6"/><path d="M4 40 C4 29 30 29 30 40 M30 31 C36 29 44 31 44 40" />',
  arrow: '<path d="M6 24 H40 M28 12 L40 24 L28 36" />',
  play: '<path d="M14 8 L40 24 L14 40 Z" />',
  seal: '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="10"/><path d="M24 2 V7 M24 41 V46 M2 24 H7 M41 24 H46" />',
  x: '<path d="M8 8 L40 40 M40 8 L8 40" />'
};

export function icon(name, { x = 0, y = 0, s = 48, color = C.ink, sw = 3.5, fill = 'none' } = {}) {
  const k = s / 48;
  return `<g transform="translate(${r2(x)},${r2(y)}) scale(${r2(k)})" fill="${fill}" stroke="${color}" stroke-width="${r2(sw / k)}" stroke-linecap="round" stroke-linejoin="round">${IC[name] ?? ''}</g>`;
}

// Marca de ✓ ou ✗ num quadrado
export function badge(kind, { x, y, s = 44, d = 0 } = {}) {
  const col = kind === 'ok' ? C.green : kind === 'no' ? C.red : kind === 'q' ? C.amber : C.ink2;
  const ic = kind === 'ok' ? 'check' : kind === 'no' ? 'cross' : 'warn';
  const inner = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${col}"/>` + icon(ic, { x: x + s * 0.14, y: y + s * 0.14, s: s * 0.72, color: C.bg, sw: 5 });
  return anim('pop', d, inner);
}

// ------------------------------------------------------------------ blocos básicos
export function box({ x, y, w, h, fill = C.s1, stroke = C.line, sw = 2, shadow = null, sh = 10 }) {
  const sd = shadow ? `<rect x="${r2(x + sh)}" y="${r2(y + sh)}" width="${r2(w)}" height="${r2(h)}" fill="${shadow}"/>` : '';
  return `${sd}<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

export function arrowH(x1, y, x2, { color = C.ink2, sw = 4, d = 0, head = 16 } = {}) {
  const inner = `<path d="M${r2(x1)} ${r2(y)} H${r2(x2 - 2)}" stroke="${color}" stroke-width="${sw}" fill="none" pathLength="1"/>`;
  const hd = `<path d="M${r2(x2 - head)} ${r2(y - head * 0.7)} L${r2(x2)} ${r2(y)} L${r2(x2 - head)} ${r2(y + head * 0.7)}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return anim('draw', d, inner, { t: 0.5 }) + anim('fade', d + 0.35, hd, { t: 0.3 });
}

export function arrowV(x, y1, y2, { color = C.ink2, sw = 4, d = 0, head = 16 } = {}) {
  const inner = `<path d="M${r2(x)} ${r2(y1)} V${r2(y2 - 2)}" stroke="${color}" stroke-width="${sw}" fill="none" pathLength="1"/>`;
  const hd = `<path d="M${r2(x - head * 0.7)} ${r2(y2 - head)} L${r2(x)} ${r2(y2)} L${r2(x + head * 0.7)} ${r2(y2 - head)}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return anim('draw', d, inner, { t: 0.5 }) + anim('fade', d + 0.35, hd, { t: 0.3 });
}

export function arrowPath(dpath, { color = C.ink2, sw = 4, d = 0, end, t = 0.7 } = {}) {
  let hd = '';
  if (end) {
    const [ex, ey, ang] = end;
    const a = (ang * Math.PI) / 180;
    const h = 16;
    const p1 = [ex - h * Math.cos(a) + h * 0.7 * Math.sin(a), ey - h * Math.sin(a) - h * 0.7 * Math.cos(a)];
    const p2 = [ex - h * Math.cos(a) - h * 0.7 * Math.sin(a), ey - h * Math.sin(a) + h * 0.7 * Math.cos(a)];
    hd = anim('fade', d + t - 0.15, `<path d="M${r2(p1[0])} ${r2(p1[1])} L${r2(ex)} ${r2(ey)} L${r2(p2[0])} ${r2(p2[1])}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, { t: 0.3 });
  }
  return anim('draw', d, `<path d="${dpath}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" pathLength="1"/>`, { t }) + hd;
}

// Faixa que cobre o conteúdo e sai para a direita (revelação por cortina)
export function reveal(inner, { x, y, w, h, d = 0, color = C.bg, t = 0.8 }) {
  return inner + anim('uncover', d, `<rect x="${r2(x - 4)}" y="${r2(y - 4)}" width="${r2(w + 8)}" height="${r2(h + 8)}" fill="${color}"/>`, { t });
}

export function label(str, { x, y, size = 22, color = C.amber, ls = 0.14, anchor = 'start', weight = 700 } = {}) {
  return rich(str, { x, y, size, font: 'mono', weight, fill: color, ls, upper: true, anchor, w: 5000 }).svg;
}

// ------------------------------------------------------------------ moldura
export function frame({ kicker, source, body, dur, transparent = false, id = '' }) {
  const bg = transparent ? '' : `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  const kick = kicker
    ? anim('fade', 0, `<rect x="${X0}" y="84" width="14" height="14" fill="${C.amber}"/>` + label(kicker, { x: X0 + 30, y: 98, size: 22, color: C.amber }), { t: 0.5 })
    : '';
  const src = source
    ? anim('fade', 0.4, rich(source, { x: X0, y: 1010, size: 21, font: 'mono', fill: C.ink3, w: BW }).svg, { t: 0.6 })
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-dur="${r2(dur)}" data-id="${esc(id)}"><style>@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&amp;family=Space+Grotesk:wght@400;500;700&amp;family=JetBrains+Mono:wght@400;700&amp;display=block');${CSS}</style>${bg}${kick}${body}${src}</svg>`;
}

// ------------------------------------------------------------------ componentes de alto nível

// Título da tela (Archivo Black), com subtítulo opcional. Devolve { svg, bottom }.
export function heading(title, { y = 205, size = 70, sub, d = 0.15, w = BW, subSize = 34, x = X0 } = {}) {
  const s = fit(title, { size, font: 'display', w, h: size * 1.1 * 2 + 4, min: 44 });
  const t = rich(title, { x, y, size: s, font: 'display', w, lh: 1.08 });
  let svg = anim('up', d, t.svg);
  const last = y + (t.lines - 1) * t.lh;
  let bottom = last + s * 0.3;
  if (sub) {
    const st = rich(sub, { x, y: last + subSize * 1.9, size: subSize, fill: C.ink2, w, lh: 1.3 });
    svg += anim('up', d + 0.25, st.svg);
    bottom = last + subSize * 1.9 + (st.lines - 1) * st.lh + subSize * 0.3;
  }
  return { svg, bottom };
}

// Frase grande centrada (lettering, citação, abertura)
export function statement(str, { y, size = 92, font = 'display', w = 1560, d = 0.2, step = 0.18, lh = 1.1, anchor = 'middle', x, fill = C.ink, cls = 'up', h = 620 } = {}) {
  const s = fit(str, { size, font, w, h, lh, min: 40 });
  const L = layout(str, { size: s, font, w, lh });
  const top = y ?? (H / 2 - L.h / 2 + s * 0.8);
  const xx = x ?? (anchor === 'middle' ? W / 2 : X0);
  let svg = '';
  const lines = String(str).split('\n');
  // anima linha a linha: refaz o layout por linha para cada grupo
  let yy = top;
  for (let i = 0; i < lines.length; i++) {
    const r = rich(lines[i], { x: xx, y: yy, size: s, font, w, lh, anchor, fill, hlD: d + i * step + 0.5 });
    svg += anim(cls, d + i * step, r.svg);
    yy += r.h;
  }
  return { svg, bottom: yy, size: s };
}

// Lista numerada/itens em sequência
export function list(items, { x = X0, y = 300, w = BW, size = 40, subSize = 28, gap = 30, d0 = 0.5, step = 0.9, numbered = true, marker = 'num', maxH = 680, tone = C.amber, cls = 'up', numW } = {}) {
  // reduz até caber
  let s = size;
  let ss = subSize;
  const nwOf = (sz) => numW ?? (numbered ? Math.max(86, sz * 1.75) : marker === 'none' ? 0 : marker === 'dot' ? sz * 0.34 + 26 : sz * 1.05 + 26);
  const measureAll = (s1, s2) => items.reduce((acc, it) => {
    const it2 = typeof it === 'string' ? { t: it } : it;
    const a = layout(it2.t, { size: s1, w: w - nwOf(s1), weight: 700 }).h;
    const b = it2.sub ? layout(it2.sub, { size: s2, w: w - nwOf(s1) }).h + 8 : 0;
    return acc + a + b + gap;
  }, -gap);
  while (measureAll(s, ss) > maxH && s > 24) { s -= 2; ss = Math.max(20, ss - 1.4); }
  const nw = nwOf(s);
  let svg = '';
  let yy = y;
  items.forEach((it0, i) => {
    const it = typeof it0 === 'string' ? { t: it0 } : it0;
    const dd = it.d ?? d0 + i * step;
    const tt = rich(it.t, { x: x + nw, y: yy + s * 0.8, size: s, w: w - nw, weight: 700, fill: it.fill ?? C.ink, hlD: dd + 0.4 });
    let inner = tt.svg;
    let hh = tt.h;
    if (it.sub) {
      const sb = rich(it.sub, { x: x + nw, y: yy + tt.h + ss * 0.85 + 4, size: ss, w: w - nw, fill: C.ink2, lh: 1.3, hlD: dd + 0.6 });
      inner += sb.svg;
      hh += sb.h + 8;
    }
    let mk = '';
    const mcol = it.tone ?? tone;
    if (numbered) {
      const n = it.n ?? String(i + 1).padStart(2, '0');
      mk = `<rect x="${x}" y="${yy + s * 0.08}" width="${nw - 22}" height="${s * 1.02}" fill="${mcol}"/>` + rich(n, { x: x + (nw - 22) / 2, y: yy + s * 0.84, size: s * 0.62, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 400 }).svg;
    } else if (marker === 'dot') {
      mk = `<rect x="${x + 4}" y="${yy + s * 0.34}" width="${s * 0.34}" height="${s * 0.34}" fill="${mcol}"/>`;
    } else if (marker === 'ok' || marker === 'no' || marker === 'q' || it.mark) {
      const kind = it.mark ?? marker;
      const col = kind === 'ok' ? C.green : kind === 'no' ? C.red : C.amber;
      const ic = kind === 'ok' ? 'check' : kind === 'no' ? 'cross' : 'warn';
      mk = `<rect x="${x}" y="${yy + s * 0.02}" width="${s * 1.05}" height="${s * 1.05}" fill="${col}"/>` + icon(ic, { x: x + s * 0.14, y: yy + s * 0.16, s: s * 0.78, color: C.bg, sw: 5 });
    }
    svg += anim(cls, dd, mk + inner);
    yy += hh + gap;
  });
  return { svg, bottom: yy - gap, size: s };
}

// Cartões em colunas
export function columns(cols, { x = X0, y = 300, w = BW, h = 600, minH = 300, gap = 36, d0 = 0.4, step = 0.5, headSize = 34, size = 28, headFill = C.amber, itemStep = 0.25, cls = 'up', bodyGap = 14 } = {}) {
  const n = cols.length;
  const cw = (w - gap * (n - 1)) / n;
  let svg = '';
  let maxItems = 0;
  cols.forEach((c) => { maxItems = Math.max(maxItems, (c.items ?? []).length); });
  // tamanho comum para todos os cartões
  let s = size;
  let hs = headSize;
  const need = (sz, hsz) => Math.max(...cols.map((c) => {
    const head = layout(c.head, { size: hsz, font: 'display', w: cw - 56, lh: 1.08 }).h + 44;
    const top = c.icon ? 76 : 0;
    const body = (c.items ?? []).reduce((a, it) => a + layout(typeof it === 'string' ? it : it.t, { size: sz, w: cw - 76, lh: 1.26 }).h + bodyGap, 0)
      + (c.body ? layout(c.body, { size: sz, w: cw - 56, lh: 1.3 }).h : 0);
    const foot = c.foot ? layout(c.foot, { size: sz * 0.9, w: cw - 56 }).h + 40 : 0;
    return head + top + body + foot + 60;
  }));
  while (need(s, hs) > h && s > 20) { s -= 1; hs = Math.max(24, hs - 1); }
  h = Math.max(minH, Math.min(h, need(s, hs) + 20));
  cols.forEach((c, i) => {
    const cx = x + i * (cw + gap);
    const dd = c.d ?? d0 + i * step;
    const col = c.color ?? headFill;
    let inner = box({ x: cx, y, w: cw, h, fill: C.s1, stroke: col, sw: 3, shadow: c.shadow ?? null });
    inner += `<rect x="${cx}" y="${y}" width="${cw}" height="10" fill="${col}"/>`;
    let yy = y + 30;
    if (c.icon) { inner += icon(c.icon, { x: cx + 28, y: yy + 6, s: 54, color: col, sw: 3.5 }); yy += 76; }
    const numSz = c.num ? Math.min(44, (cw - 56) * 0.32 / Math.max(1, layout(c.num, { size: 1, font: 'mono', weight: 700 }).w)) : 0;
    if (c.num) { inner += rich(c.num, { x: cx + cw - 28, y: y + 70, size: numSz, font: 'mono', weight: 700, fill: col, anchor: 'end', w: 600 }).svg; }
    const numW = c.num ? layout(c.num, { size: numSz, font: 'mono', weight: 700 }).w + 24 : 0;
    const hd = rich(c.head, { x: cx + 28, y: yy + hs * 0.9, size: hs, font: 'display', w: cw - 56 - (c.icon ? 0 : numW), lh: 1.08, fill: C.ink });
    inner += hd.svg;
    yy += hd.h + 24;
    let body = '';
    if (c.body) {
      const b = rich(c.body, { x: cx + 28, y: yy + s * 0.9, size: s, w: cw - 56, fill: C.ink2, lh: 1.3, hlD: dd + 0.6 });
      body += b.svg;
      yy += b.h + 12;
    }
    let items = '';
    (c.items ?? []).forEach((it0, j) => {
      const it = typeof it0 === 'string' ? { t: it0 } : it0;
      const t = rich(it.t, { x: cx + 48, y: yy + s * 0.9, size: s, w: cw - 76, fill: it.fill ?? C.ink, lh: 1.26 });
      const mk = `<rect x="${cx + 28}" y="${yy + s * 0.36}" width="${s * 0.34}" height="${s * 0.34}" fill="${it.tone ?? col}"/>`;
      items += anim('up', dd + 0.35 + j * itemStep, mk + t.svg);
      yy += t.h + bodyGap;
    });
    let foot = '';
    if (c.foot) {
      const fl = layout(c.foot, { size: s * 0.9, w: cw - 56, weight: 700 });
      const f = rich(c.foot, { x: cx + 28, y: y + h - 34 - (fl.lines.length - 1) * fl.lh, size: s * 0.9, w: cw - 56, fill: col, weight: 700 });
      foot = anim('fade', dd + 0.5 + (c.items ?? []).length * itemStep, f.svg);
    }
    svg += anim(cls, dd, inner + body) + items + foot;
  });
  return { svg, cw, h, bottom: y + h };
}

// Dois lados: errado × certo (ou antes × depois)
export function compare(left, right, { y = 300, h = 560, d0 = 0.4, gap = 60, size = 34, minH = 300 } = {}) {
  const cw = (BW - gap) / 2;
  const needH = Math.max(...[left, right].map((c) => layout(c.body ?? '', { size, w: cw - 72, lh: 1.3 }).h + 170 + (c.foot ? 50 : 0)));
  h = Math.max(minH, Math.min(h, needH));
  const side = (c, x, d, kind) => {
    const col = kind === 'no' ? C.red : kind === 'ok' ? C.green : c.color ?? C.amber;
    let s = size;
    const body = c.body ?? '';
    while (layout(body, { size: s, w: cw - 72, lh: 1.3 }).h > h - 170 && s > 20) s -= 2;
    let inner = box({ x, y, w: cw, h, fill: C.s1, stroke: col, sw: 3 });
    inner += `<rect x="${x}" y="${y}" width="${cw}" height="74" fill="${col}"/>`;
    inner += rich(c.head, { x: x + 32, y: y + 50, size: 30, font: 'mono', weight: 700, fill: C.bg, w: cw - 140, upper: true, ls: 0.06 }).svg;
    const b = rich(body, { x: x + 36, y: y + 130 + s * 0.3, size: s, w: cw - 72, lh: 1.3, fill: C.ink, hlD: d + 0.8 });
    let out = anim('up', d, inner) + anim('fade', d + 0.3, b.svg);
    if (kind) out += badge(kind, { x: x + cw - 92, y: y + 15, s: 44, d: d + 0.5 });
    if (c.foot) out += anim('fade', d + 0.8, rich(c.foot, { x: x + 36, y: y + h - 34, size: 24, font: 'mono', fill: col, w: cw - 72 }).svg);
    return out;
  };
  return side(left, X0, d0, left.kind ?? 'no') + side(right, X0 + cw + gap, d0 + (right.delay ?? 1.4), right.kind ?? 'ok');
}

// Fluxo horizontal de etapas
export function flow(steps, { y = 480, h = 220, d0 = 0.5, step = 0.8, gap = 70, size = 34, subSize = 24, x = X0, w = BW, colors } = {}) {
  const n = steps.length;
  const bw = (w - gap * (n - 1)) / n;
  let svg = '';
  let s = size;
  while (steps.some((st) => layout(st.t, { size: s, font: 'display', w: bw - 40, lh: 1.05 }).h > h * 0.55) && s > 20) s -= 2;
  steps.forEach((st, i) => {
    const bx = x + i * (bw + gap);
    const dd = st.d ?? d0 + i * step;
    const col = st.color ?? colors?.[i] ?? C.amber;
    let inner = box({ x: bx, y, w: bw, h, fill: C.s1, stroke: col, sw: 3 });
    if (st.n !== false) inner += rich(st.n ?? String(i + 1).padStart(2, '0'), { x: bx + 20, y: y + 40, size: 22, font: 'mono', weight: 700, fill: col, w: 200 }).svg;
    const t = rich(st.t, { x: bx + bw / 2, y: y + h * 0.48, size: s, font: 'display', anchor: 'middle', w: bw - 40, lh: 1.05 });
    inner += t.svg;
    if (st.sub) inner += rich(st.sub, { x: bx + bw / 2, y: y + h * 0.48 + t.h + 6, size: subSize, anchor: 'middle', w: bw - 36, fill: C.ink2, lh: 1.25 }).svg;
    svg += anim('pop', dd, inner);
    if (i < n - 1) svg += arrowH(bx + bw + 8, y + h / 2, bx + bw + gap - 8, { d: dd + 0.45, color: C.ink2 });
  });
  return { svg, bw };
}

// Linha do tempo horizontal
export function timeline(pts, { y = 560, x = X0 + 40, w = BW - 80, d0 = 0.6, step = 0.9, size = 30, subSize = 24, dateSize = 26, alt = true, side = 'up', lineColor = C.lineUi, labelW } = {}) {
  const n = pts.length;
  const pos = (i) => pts[i].at != null ? x + pts[i].at * w : (n === 1 ? x + w / 2 : x + (i * w) / (n - 1));
  let svg = anim('draw', d0 - 0.4, `<path d="M${x - 30} ${y} H${x + w + 30}" stroke="${lineColor}" stroke-width="4" fill="none" pathLength="1"/>`, { t: 0.9 });
  const lw = labelW ?? Math.min(420, (w / Math.max(1, n - 1)) * (alt ? 1.8 : 0.95));
  pts.forEach((p, i) => {
    const px = pos(i);
    const dd = p.d ?? d0 + i * step;
    const col = p.color ?? C.amber;
    const up = alt ? i % 2 === 0 : side !== 'down';
    const anchor = p.anchor ?? 'middle';
    let inner = `<rect x="${px - 14}" y="${y - 14}" width="28" height="28" fill="${col}" transform="rotate(45 ${px} ${y})"/>`;
    inner += `<path d="M${px} ${up ? y - 26 : y + 26} V${up ? y - 64 : y + 64}" stroke="${col}" stroke-width="3"/>`;
    const date = rich(p.date, { x: px, y: up ? y - 84 : y + 104, size: dateSize, font: 'mono', weight: 700, fill: col, anchor, w: lw }).svg;
    let lab = '';
    let sub = '';
    if (up) {
      const t = layout(p.t, { size, w: lw, weight: 700 });
      const sbh = p.sub ? layout(p.sub, { size: subSize, w: lw }).h + 6 : 0;
      const top = y - 84 - dateSize - 14 - sbh - t.h + size * 0.8;
      lab = rich(p.t, { x: px, y: top, size, w: lw, weight: 700, anchor, hlD: dd + 0.5 }).svg;
      if (p.sub) sub = rich(p.sub, { x: px, y: top + t.h + 6, size: subSize, w: lw, fill: C.ink2, anchor, lh: 1.25 }).svg;
    } else {
      const ty = y + 104 + dateSize * 0.5 + size;
      const t = rich(p.t, { x: px, y: ty, size, w: lw, weight: 700, anchor, hlD: dd + 0.5 });
      lab = t.svg;
      if (p.sub) sub = rich(p.sub, { x: px, y: ty + t.h + 4, size: subSize, w: lw, fill: C.ink2, anchor, lh: 1.25 }).svg;
    }
    svg += anim('pop', dd, inner) + anim(up ? 'down' : 'up', dd + 0.15, date + lab + sub);
  });
  return { svg, pos };
}

// Cartão de papel com texto (lei, documento, nota)
export function paperCard({ x = X0 + 140, y = 280, w = BW - 280, ref, text, size = 40, d = 0.4, hlD, pad = 56, font = 'sans', foot, h, lh = 1.4, tag } = {}) {
  const s = fit(text, { size, font, w: w - pad * 2, h: (h ?? 640) - (ref ? 150 : 90) - (foot ? 60 : 0), lh, min: 24 });
  const L = layout(text, { size: s, font, w: w - pad * 2, lh });
  const hh = h ?? L.h + (ref ? 150 : 100) + (foot ? 60 : 0);
  let inner = box({ x, y, w, h: hh, fill: C.paper, stroke: C.paper, sw: 0, shadow: C.amber, sh: 14 });
  let yy = y + 60;
  if (ref) {
    inner += rich(ref, { x: x + pad, y: yy, size: 24, font: 'mono', weight: 700, fill: C.pAccent, w: w - pad * 2, upper: true, ls: 0.08 }).svg;
    inner += `<rect x="${x + pad}" y="${yy + 22}" width="${w - pad * 2}" height="2" fill="${C.pLine}"/>`;
    yy += 70;
  }
  const t = rich(text, { x: x + pad, y: yy + s * 0.8, size: s, font, w: w - pad * 2, fill: C.pInk, lh, paper: true, hlColor: C.amber, hlOpacity: 0.55, hlD: hlD ?? d + 1.0, hlStep: 0.5 });
  inner += '';
  let out = anim('up', d, inner + t.svg);
  if (foot) out += anim('fade', d + 0.6, rich(foot, { x: x + pad, y: y + hh - 30, size: 22, font: 'mono', fill: C.pInk2, w: w - pad * 2 }).svg);
  if (tag) out += anim('stamp', (hlD ?? d + 1) + 0.8, tagSvg(tag, x + w - 40, y - 20));
  return { svg: out, h: hh, bottom: y + hh };
}

function tagSvg(t, x, y) {
  const L = layout(t, { size: 26, font: 'mono', weight: 700 });
  const w = L.w + 40;
  return `<g><rect x="${x - w}" y="${y}" width="${w}" height="52" fill="${C.bg}" stroke="${C.amber}" stroke-width="3"/>` + rich(t, { x: x - w / 2, y: y + 35, size: 26, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 2000 }).svg + '</g>';
}

// Carimbo
export function stamp(str, { x, y, color = C.red, size = 40, d = 1, rot = -4, anchor = 'middle' } = {}) {
  const L = layout(str, { size, font: 'display' });
  const w = L.w + size * 1.2;
  const h = size * 1.6;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  const inner = `<g><rect x="${x0}" y="${y - h / 2}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${size * 0.12}"/>` + rich(str, { x: x0 + w / 2, y: y + size * 0.36, size, font: 'display', fill: color, anchor: 'middle', w: 4000 }).svg + '</g>';
  return anim('stamp', d, inner);
}

// Barras verticais
export function bars(items, { x = X0 + 80, y = 880, w = BW - 160, h = 480, d0 = 0.5, step = 0.35, gap = 60, max, valueSize = 56, labelSize = 28, fmt = (v) => v } = {}) {
  const n = items.length;
  const bw = (w - gap * (n - 1)) / n;
  const m = max ?? Math.max(...items.map((i) => i.v));
  let svg = anim('fade', d0 - 0.3, `<path d="M${x - 20} ${y} H${x + w + 20}" stroke="${C.lineUi}" stroke-width="3"/>`);
  items.forEach((it, i) => {
    const bx = x + i * (bw + gap);
    const bh = Math.max(4, (it.v / m) * h);
    const dd = it.d ?? d0 + i * step;
    const col = it.color ?? C.amber;
    svg += anim('growY', dd, `<rect x="${bx}" y="${y - bh}" width="${bw}" height="${bh}" fill="${col}"/>`);
    svg += anim('up', dd + 0.6, rich(it.label ?? fmt(it.v), { x: bx + bw / 2, y: y - bh - 22, size: valueSize, font: 'display', anchor: 'middle', fill: C.ink, w: bw + 200 }).svg);
    svg += anim('fade', dd + 0.2, rich(it.name, { x: bx + bw / 2, y: y + 48, size: labelSize, font: 'mono', weight: 700, anchor: 'middle', fill: C.ink2, w: bw + gap - 10 }).svg);
  });
  return { svg };
}

// Barras horizontais
export function hbars(items, { x = X0 + 420, y = 320, w = 1000, rowH = 110, d0 = 0.5, step = 0.4, max, labelW = 400, labelSize = 32, valueSize = 40 } = {}) {
  const m = max ?? Math.max(...items.map((i) => i.v));
  let svg = '';
  items.forEach((it, i) => {
    const yy = y + i * rowH;
    const bw = Math.max(6, (it.v / m) * w);
    const dd = it.d ?? d0 + i * step;
    const col = it.color ?? C.amber;
    svg += anim('fade', dd, rich(it.name, { x: x - 30, y: yy + rowH * 0.42, size: labelSize, weight: 700, anchor: 'end', fill: C.ink, w: labelW }).svg);
    svg += anim('grow', dd + 0.1, `<rect x="${x}" y="${yy + 8}" width="${bw}" height="${rowH * 0.5}" fill="${col}"/>`);
    svg += anim('fade', dd + 0.6, rich(it.label ?? String(it.v), { x: x + bw + 20, y: yy + rowH * 0.42, size: valueSize, font: 'display', fill: C.ink, w: 800 }).svg);
  });
  return { svg };
}

// Tabela / planilha
export function table({ x = X0, y = 300, cols, rows, rowH = 70, headH = 64, size = 26, d0 = 0.4, step = 0.45, head = C.amber, zebra = true, paper = false, cellPad = 18, rowAnim = 'up', lineColor } = {}) {
  const totalW = cols.reduce((a, c) => a + c.w, 0);
  const bgA = paper ? C.paper : C.s1;
  const bgB = paper ? '#EDE7DA' : C.s2;
  const ink = paper ? C.pInk : C.ink;
  const lc = lineColor ?? (paper ? C.pLine : C.line);
  let svg = '';
  let hx = x;
  let hdr = `<rect x="${x}" y="${y}" width="${totalW}" height="${headH}" fill="${head}"/>`;
  cols.forEach((c) => {
    hdr += rich(c.h, { x: hx + cellPad, y: y + headH * 0.62, size: size * 0.82, font: 'mono', weight: 700, fill: C.bg, w: c.w - cellPad * 2, upper: true, ls: 0.04 }).svg;
    hx += c.w;
  });
  svg += anim('fade', d0 - 0.3, hdr);
  rows.forEach((r, i) => {
    const ry = y + headH + i * rowH;
    const dd = (!Array.isArray(r) && r.d) || d0 + i * step;
    let inner = `<rect x="${x}" y="${ry}" width="${totalW}" height="${rowH}" fill="${zebra && i % 2 ? bgB : bgA}" stroke="${lc}" stroke-width="1"/>`;
    let cx = x;
    const cells = r.cells ?? r;
    cols.forEach((c, j) => {
      const v = cells[j] ?? '';
      const fnt = c.mono ? 'mono' : 'sans';
      const s2 = fit(String(v), { size: c.size ?? size, font: fnt, w: c.w - cellPad * 2, h: rowH - 12, lh: 1.15, min: 16 });
      const L = layout(String(v), { size: s2, font: fnt, w: c.w - cellPad * 2, lh: 1.15 });
      inner += rich(String(v), { x: c.align === 'end' ? cx + c.w - cellPad : cx + cellPad, y: ry + rowH / 2 - L.h / 2 + s2 * 0.82, size: s2, font: fnt, w: c.w - cellPad * 2, lh: 1.15, fill: (!Array.isArray(r) && r.color) || ink, anchor: c.align ?? 'start', paper, weight: c.bold ? 700 : 400, hlD: dd + 0.5 }).svg;
      cx += c.w;
    });
    if (!Array.isArray(r) && r.mark) inner += `<rect x="${x - 14}" y="${ry}" width="8" height="${rowH}" fill="${r.mark}"/>`;
    svg += anim(rowAnim, dd, inner);
  });
  return { svg, w: totalW, h: headH + rows.length * rowH, bottom: y + headH + rows.length * rowH };
}

// Lista de verificação com caixas marcadas
export function checklist(items, { x = X0, y = 300, w = BW, size = 36, gap = 26, d0 = 0.5, step = 0.7, maxH = 640, kind = 'ok', cols = 1, colGap = 60 } = {}) {
  const perCol = Math.ceil(items.length / cols);
  const cw = (w - colGap * (cols - 1)) / cols;
  let s = size;
  const hOf = (sz) => Math.max(...Array.from({ length: cols }, (_, c) => items.slice(c * perCol, (c + 1) * perCol)
    .reduce((a, it) => a + Math.max(sz * 1.2, layout(typeof it === 'string' ? it : it.t, { size: sz, w: cw - sz * 1.9 }).h) + gap, -gap)));
  while (hOf(s) > maxH && s > 20) s -= 2;
  let svg = '';
  for (let c = 0; c < cols; c++) {
    let yy = y;
    items.slice(c * perCol, (c + 1) * perCol).forEach((it0, j) => {
      const it = typeof it0 === 'string' ? { t: it0 } : it0;
      const i = c * perCol + j;
      const dd = it.d ?? d0 + i * step;
      const k = it.kind ?? kind;
      const bx = x + c * (cw + colGap);
      const bs = s * 1.1;
      const boxSvg = `<rect x="${bx}" y="${yy}" width="${bs}" height="${bs}" fill="none" stroke="${C.lineUi}" stroke-width="3"/>`;
      const col = k === 'ok' ? C.green : k === 'no' ? C.red : C.amber;
      const tick = k === 'ok'
        ? `<path d="M${bx + bs * 0.18} ${yy + bs * 0.52} L${bx + bs * 0.42} ${yy + bs * 0.76} L${bx + bs * 0.86} ${yy + bs * 0.22}" stroke="${col}" stroke-width="${s * 0.16}" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>`
        : `<path d="M${bx + bs * 0.2} ${yy + bs * 0.2} L${bx + bs * 0.8} ${yy + bs * 0.8} M${bx + bs * 0.8} ${yy + bs * 0.2} L${bx + bs * 0.2} ${yy + bs * 0.8}" stroke="${col}" stroke-width="${s * 0.14}" fill="none" stroke-linecap="round" pathLength="1"/>`;
      const t = rich(it.t, { x: bx + bs + s * 0.6, y: yy + s * 0.88, size: s, w: cw - bs - s * 0.6, weight: 500, hlD: dd + 0.6 });
      let sub = '';
      let hh = Math.max(bs, t.h);
      if (it.sub) {
        const sb = rich(it.sub, { x: bx + bs + s * 0.6, y: yy + t.h + s * 0.62, size: s * 0.72, w: cw - bs - s * 0.6, fill: C.ink2 });
        sub = sb.svg;
        hh = Math.max(bs, t.h + sb.h + 4);
      }
      svg += anim('up', dd, boxSvg + t.svg + sub) + anim('draw', dd + 0.35, tick, { t: 0.45 });
      yy += hh + gap;
    });
  }
  return { svg };
}

// Folha de documento estilizada (linhas de texto falsas + trechos legíveis)
export function docSheet({ x, y, w = 560, h = 720, title, lines = [], d = 0.3, tilt = 0, footer, footSize = 18, stampText, stampColor = C.red, head = true } = {}) {
  let inner = box({ x, y, w, h, fill: C.paper, stroke: C.paper, sw: 0 });
  let yy = y + 50;
  if (head) {
    inner += `<rect x="${x + 40}" y="${yy - 26}" width="46" height="46" fill="none" stroke="${C.pInk2}" stroke-width="3"/>`;
    inner += `<rect x="${x + 100}" y="${yy - 20}" width="${w * 0.42}" height="12" fill="${C.pLine}"/><rect x="${x + 100}" y="${yy}" width="${w * 0.3}" height="10" fill="${C.pLine}"/>`;
    yy += 60;
  }
  if (title) {
    const t = rich(title, { x: x + 40, y: yy + 10, size: 28, font: 'mono', weight: 700, fill: C.pInk, w: w - 80, upper: true });
    inner += t.svg;
    yy += t.h + 30;
  }
  for (const ln of lines) {
    if (typeof ln === 'number') {
      inner += `<rect x="${x + 40}" y="${yy - 14}" width="${(w - 80) * ln}" height="12" fill="${C.pLine}"/>`;
      yy += 30;
    } else {
      const t = rich(ln.t ?? ln, { x: x + 40, y: yy + 6, size: ln.size ?? 26, font: ln.font ?? 'sans', weight: ln.weight ?? 400, fill: C.pInk, w: w - 80, paper: true, hlColor: C.amber, hlOpacity: 0.55, hlD: ln.hlD ?? d + 1 });
      inner += t.svg;
      yy += t.h + 14;
    }
  }
  if (footer) {
    const fl = layout(footer, { size: footSize, font: 'mono', w: w - 80 });
    inner += `<rect x="${x + 40}" y="${y + h - 40 - fl.h - 16}" width="${w - 80}" height="2" fill="${C.pLine}"/>`;
    inner += rich(footer, { x: x + 40, y: y + h - 40 - fl.h + footSize, size: footSize, font: 'mono', fill: C.pInk2, w: w - 80, paper: true, hlColor: C.amber, hlOpacity: 0.55, hlD: d + 1.4 }).svg;
  }
  const tr = tilt ? ` transform="rotate(${tilt} ${x + w / 2} ${y + h / 2})"` : '';
  let out = anim('up', d, `<g${tr}>${inner}</g>`);
  if (stampText) out += stamp(stampText, { x: x + w / 2, y: y + h * 0.62, color: stampColor, size: 38, d: d + 1.6 });
  return out;
}

// Bolhas de conversa (print de chat)
export function chatBubble({ x, y, w = 620, text, me = false, d = 0, size = 30, time } = {}) {
  const L = layout(text, { size, w: w - 60 });
  const h = L.h + 50;
  const fill = me ? '#264D3B' : C.s3;
  const bx = me ? x + (w - Math.min(w, L.w + 60)) : x;
  const bw = Math.min(w, L.w + 60);
  let inner = `<rect x="${bx}" y="${y}" width="${bw}" height="${h}" rx="18" fill="${fill}"/>`;
  inner += rich(text, { x: bx + 30, y: y + 25 + size * 0.85, size, w: w - 60, fill: C.ink }).svg;
  if (time) inner += rich(time, { x: bx + bw - 18, y: y + h - 10, size: 16, font: 'mono', fill: C.ink3, anchor: 'end', w: 200 }).svg;
  return { svg: anim('up', d, inner), h };
}

// Nós e ligações rotuladas
export function node({ x, y, t, sub, w = 300, h = 110, color = C.amber, d = 0, size = 30, fill = C.s1 }) {
  let inner = box({ x: x - w / 2, y: y - h / 2, w, h, fill, stroke: color, sw: 3 });
  const L = layout(t, { size, w: w - 30, weight: 700 });
  const top = y - (L.h + (sub ? 30 : 0)) / 2 + size * 0.82;
  inner += rich(t, { x, y: top, size, w: w - 30, anchor: 'middle', weight: 700 }).svg;
  if (sub) inner += rich(sub, { x, y: top + L.h + 2, size: 22, w: w - 30, anchor: 'middle', fill: C.ink2, font: 'mono' }).svg;
  return anim('pop', d, inner);
}

export function edge(x1, y1, x2, y2, { lab, color = C.ink2, d = 0, dash = false, sw = 4, labSize = 22, labColor } = {}) {
  let out = anim('draw', d, `<path d="M${r2(x1)} ${r2(y1)} L${r2(x2)} ${r2(y2)}" stroke="${color}" stroke-width="${sw}" ${dash ? 'stroke-dasharray="10 10"' : ''} fill="none" pathLength="1"/>`, { t: 0.6 });
  if (dash) out = anim('fade', d, `<path d="M${r2(x1)} ${r2(y1)} L${r2(x2)} ${r2(y2)}" stroke="${color}" stroke-width="${sw}" stroke-dasharray="10 10" fill="none"/>`);
  if (lab) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const L = layout(lab, { size: labSize, font: 'mono', weight: 700 });
    const lw = L.w + 26;
    out += anim('pop', d + 0.5, `<rect x="${r2(mx - lw / 2)}" y="${r2(my - 20)}" width="${r2(lw)}" height="40" fill="${C.bg}" stroke="${labColor ?? color}" stroke-width="2"/>` + rich(lab, { x: mx, y: my + 8, size: labSize, font: 'mono', weight: 700, anchor: 'middle', fill: labColor ?? color, w: 2000 }).svg);
  }
  return out;
}

// Calendário mensal compacto
export function calendar({ x, y, cell = 64, month, year, startDow = 0, days = 30, marks = {}, d = 0.3, markStep = 0.5, title, weekendShade = true } = {}) {
  let inner = '';
  if (title) inner += rich(title, { x, y: y - 20, size: 30, font: 'display', fill: C.ink, w: cell * 7 }).svg;
  const dows = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  dows.forEach((dw, i) => { inner += rich(dw, { x: x + i * cell + cell / 2, y: y + 30, size: 20, font: 'mono', weight: 700, fill: C.ink3, anchor: 'middle', w: 100 }).svg; });
  let mk = '';
  let k = 0;
  for (let dn = 1; dn <= days; dn++) {
    const idx = startDow + dn - 1;
    const cx = x + (idx % 7) * cell;
    const cy = y + 46 + Math.floor(idx / 7) * cell;
    const we = weekendShade && (idx % 7 === 0 || idx % 7 === 6);
    inner += `<rect x="${cx + 2}" y="${cy + 2}" width="${cell - 4}" height="${cell - 4}" fill="${we ? C.s2 : C.s1}" stroke="${C.line}" stroke-width="1"/>`;
    inner += rich(String(dn), { x: cx + cell - 10, y: cy + 26, size: 18, font: 'mono', fill: C.ink2, anchor: 'end', w: 80 }).svg;
    if (marks[dn]) {
      const m = marks[dn];
      mk += anim('pop', m.d ?? d + 0.6 + k * markStep, `<rect x="${cx + 4}" y="${cy + 4}" width="${cell - 8}" height="${cell - 8}" fill="${m.color ?? C.amber}"/>` + rich(String(dn), { x: cx + cell / 2, y: cy + cell * 0.66, size: 24, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 80 }).svg);
      k++;
    }
  }
  return anim('fade', d, inner) + mk;
}

// Tarja (retângulo preto que cobre um trecho)
export function redact({ x, y, w, h = 30, d = 0, color = '#000' }) {
  return anim('grow', d, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`, { t: 0.45 });
}

// Pílula/etiqueta
export function pill(str, { x, y, color = C.amber, size = 24, d = 0, fill = 'none', ink, anchor = 'start' } = {}) {
  const L = layout(str, { size, font: 'mono', weight: 700 });
  const w = L.w + size * 1.2;
  const h = size * 1.7;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const inner = `<rect x="${r2(x0)}" y="${r2(y - h / 2)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}" stroke="${color}" stroke-width="2.5"/>` + rich(str, { x: x0 + w / 2, y: y + size * 0.36, size, font: 'mono', weight: 700, fill: ink ?? (fill === 'none' || fill === C.bg || fill === C.s1 ? color : C.bg), anchor: 'middle', w: 3000 }).svg;
  return { svg: anim('pop', d, inner), w };
}

export { r2 };
