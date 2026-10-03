// Utilitários mínimos para montar SVG como texto + o sistema de animação.
//
// Linha do tempo de todo overlay:
//   0 s → T0 (3 s)  introdução (tudo que entra em cena termina antes de T0)
//   T0 → T0 + P     trecho ambiente; toda animação infinita tem período que
//                   divide P (8 s), então esse trecho repete sem emenda.
export const T0 = 3;
export const P = 8;

export const n = (v) => Math.round(v * 100) / 100;

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function attrs(a = {}) {
  let out = '';
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === false) continue;
    out += ` ${k}="${esc(typeof v === 'number' ? n(v) : v)}"`;
  }
  return out;
}

export function h(tag, a = {}, ...kids) {
  const inner = kids.flat(Infinity).filter((k) => k !== undefined && k !== null && k !== false && k !== '').join('');
  return inner ? `<${tag}${attrs(a)}>${inner}</${tag}>` : `<${tag}${attrs(a)}/>`;
}

export const g = (a, ...kids) => h('g', a, ...kids);
export const path = (d, a = {}) => h('path', { d, ...a });
export const circle = (cx, cy, r, a = {}) => h('circle', { cx, cy, r, ...a });
export const line = (x1, y1, x2, y2, a = {}) => h('line', { x1, y1, x2, y2, ...a });
export const rect = (x, y, w, hh, a = {}) => h('rect', { x, y, width: w, height: hh, ...a });

export const rad = (deg) => (deg * Math.PI) / 180;
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

export function poly(points, close = true) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('') + (close ? 'Z' : '');
}

/** Estrela de `pts` pontas (polígono). */
export function star(cx, cy, pts, r1, r2, rot = -90) {
  const out = [];
  for (let i = 0; i < pts * 2; i++) out.push(polar(cx, cy, i % 2 ? r2 : r1, rot + (i * 180) / pts));
  return poly(out);
}

export function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${n(x0)} ${n(y0)}A${n(r)} ${n(r)} 0 ${large} ${sweep} ${n(x1)} ${n(y1)}`;
}

export const ringPath = (cx, cy, r) =>
  `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;

export const diamond = (cx, cy, rx, ry = rx) => poly([[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]]);

// ---------------------------------------------------------------------------
// Animações de entrada (classes definidas em BASE_CSS). `t` = atraso, `d` = duração.
const timing = (t, d) => `--t:${n(t)}s;--d:${n(d)}s`;
const style = (...parts) => parts.filter(Boolean).join(';');

export const A = {
  /** Traço sendo desenhado (requer stroke). */
  draw: (t, d = 0.8, extra) => ({ class: 'dr', pathLength: 1, style: style(timing(t, d), extra) }),
  pop: (t, d = 0.55, extra) => ({ class: 'pp', style: style(timing(t, d), extra) }),
  rise: (t, d = 0.55, extra) => ({ class: 'ri', style: style(timing(t, d), extra) }),
  fade: (t, d = 0.45, extra) => ({ class: 'fi', style: style(timing(t, d), extra) }),
  wipeX: (t, d = 0.6, extra) => ({ class: 'wx', style: style(timing(t, d), extra) }),
  wipeY: (t, d = 0.6, extra) => ({ class: 'wy', style: style(timing(t, d), extra) }),
  /** Gira a partir do centro (origem explícita em coordenadas do viewBox). */
  spinIn: (t, cx, cy, d = 0.8) => ({ class: 'si', style: style(timing(t, d), `transform-origin:${n(cx)}px ${n(cy)}px`) }),
  /** Abre na horizontal a partir de um ponto (asas). */
  unfold: (t, ox, oy, d = 0.7) => ({ class: 'uf', style: style(timing(t, d), `transform-origin:${n(ox)}px ${n(oy)}px`) }),
  /** Cresce de baixo para cima a partir de um ponto (chamas, árvores). */
  grow: (t, ox, oy, d = 0.6) => ({ class: 'gr', style: style(timing(t, d), `transform-origin:${n(ox)}px ${n(oy)}px`) }),
};

/** Atraso de uma animação ambiente: já está rodando em T0 com a fase pedida. */
export const amb = (offset = 0) => n(T0 - P + (((offset % P) + P) % P));

const BASE_CSS = `
.dr{stroke-dasharray:1 1.05;stroke-dashoffset:1.03;animation:dr var(--d) cubic-bezier(.65,0,.35,1) var(--t) both}
@keyframes dr{to{stroke-dashoffset:0}}
.pp{transform-box:fill-box;transform-origin:50% 50%;animation:pp var(--d) cubic-bezier(.34,1.5,.64,1) var(--t) both}
@keyframes pp{from{transform:scale(0)}to{transform:scale(1)}}
.ri{animation:ri var(--d) cubic-bezier(.2,.8,.2,1) var(--t) both}
@keyframes ri{from{transform:translateY(26px);opacity:0}to{transform:none;opacity:1}}
.fi{animation:fi var(--d) linear var(--t) both}
@keyframes fi{from{opacity:0}to{opacity:1}}
.wx{transform-box:fill-box;transform-origin:50% 50%;animation:wx var(--d) cubic-bezier(.65,0,.35,1) var(--t) both}
@keyframes wx{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.wy{transform-box:fill-box;transform-origin:50% 100%;animation:wy var(--d) cubic-bezier(.65,0,.35,1) var(--t) both}
@keyframes wy{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.si{animation:si var(--d) cubic-bezier(.2,.8,.2,1) var(--t) both}
@keyframes si{from{transform:rotate(-120deg) scale(0)}to{transform:none}}
.uf{animation:uf var(--d) cubic-bezier(.2,.8,.2,1) var(--t) both}
@keyframes uf{from{transform:scaleX(0)}to{transform:none}}
.gr{animation:gr var(--d) cubic-bezier(.2,.8,.2,1) var(--t) both}
@keyframes gr{from{transform:scale(.2,0)}to{transform:none}}
`;

/** Acumula defs e regras CSS de um único SVG. */
export class Doc {
  constructor() {
    this.defs = [];
    this.css = new Map();
    this.uid = 0;
  }
  id(prefix = 'i') {
    this.uid += 1;
    return `${prefix}${this.uid}`;
  }
  def(markup) {
    this.defs.push(markup);
  }
  rule(key, css) {
    if (!this.css.has(key)) this.css.set(key, css);
    return key;
  }
  /**
   * Animação ambiente genérica: devolve atributos {class, style}.
   * `frames` é o corpo do @keyframes; `dur` precisa dividir P.
   */
  ambient(name, frames, { dur = P, offset = 0, ease = 'linear', origin, box } = {}) {
    if (P % dur !== 0) throw new Error(`Período ${dur}s não divide ${P}s (${name})`);
    const cls = `a-${name}`;
    this.rule(cls, `.${cls}{animation:${cls} ${dur}s ${ease} var(--t) infinite${box ? ';transform-box:fill-box;transform-origin:50% 50%' : ''}}@keyframes ${cls}{${frames}}`);
    const st = [`--t:${amb(offset)}s`];
    if (origin) st.push(`transform-origin:${n(origin[0])}px ${n(origin[1])}px`);
    return { class: cls, style: st.join(';') };
  }
  /** Gradiente linear vertical em coordenadas absolutas. */
  vgrad(stops, y1, y2) {
    const id = this.id('g');
    this.def(
      h('linearGradient', { id, x1: 0, y1, x2: 0, y2, gradientUnits: 'userSpaceOnUse' },
        stops.map(([o, c]) => h('stop', { offset: o, 'stop-color': c }))),
    );
    return `url(#${id})`;
  }
  css_() {
    return BASE_CSS + [...this.css.values()].join('\n');
  }
}
