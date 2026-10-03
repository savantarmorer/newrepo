// Primitivas de desenho reaproveitadas pelos emblemas e pelas faixas.
// Tudo tem contorno escuro (`th.ink`) para continuar legível sobre o vídeo.
import { glyphCentered } from './fonts.mjs';
import { A, circle, g, h, n, path, poly, polar, star } from './svg.mjs';

const ROUND = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

/** Gradiente vertical (caixa do objeto) reaproveitado dentro de um mesmo SVG. */
export function grad(doc, stops, key = stops.map((s) => s.join(':')).join('|')) {
  doc._grads ??= new Map();
  if (!doc._grads.has(key)) {
    const id = doc.id('gf');
    doc.def(h('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(([o, c]) => h('stop', { offset: o, 'stop-color': c }))));
    doc._grads.set(key, `url(#${id})`);
  }
  return doc._grads.get(key);
}

/** Gradiente horizontal (sombreado cilíndrico de colunas). */
export function hgrad(doc, stops) {
  doc._grads ??= new Map();
  const key = 'h|' + stops.map((s) => s.join(':')).join('|');
  if (!doc._grads.has(key)) {
    const id = doc.id('gh');
    doc.def(h('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0 }, stops.map(([o, c]) => h('stop', { offset: o, 'stop-color': c }))));
    doc._grads.set(key, `url(#${id})`);
  }
  return doc._grads.get(key);
}

export const goldFill = (doc, th) => grad(doc, [[0, th.gold[0]], [0.55, th.gold[1]], [1, th.gold[2]]]);

/** Traço desenhado (com sublinhado escuro). */
export function stroke(th, d, { w = 3, t = 0.6, dur = 0.9, color, cap = 'round', extra = {}, inkW } = {}) {
  return g(
    {},
    path(d, { fill: 'none', stroke: th.ink, 'stroke-width': inkW ?? w + 4, ...ROUND, 'stroke-linecap': cap, ...A.draw(t, dur) }),
    path(d, { fill: 'none', stroke: color ?? th.line, 'stroke-width': w, ...ROUND, 'stroke-linecap': cap, ...A.draw(t, dur), ...extra }),
  );
}

/** Forma preenchida com contorno escuro, entrando com pop/fade/rise. */
export function fill(th, d, { color, t = 0.9, anim = 'pop', dur = 0.5, outline = 3.5, extra = {}, wrap = {} } = {}) {
  const a = anim ? A[anim](t, dur) : {};
  return g({ ...a, ...wrap }, path(d, { fill: color ?? th.line, stroke: th.ink, 'stroke-width': outline, 'paint-order': 'stroke', ...ROUND, ...extra }));
}

/** Glifo de fonte (runa, hieróglifo, símbolo alquímico...) centrado em (x,y). `bold` engrossa o traço. */
export function glyph(th, ch, x, y, size, { color, t = 1, anim = 'pop', outline = 3.5, extra = {}, rotate = 0, bold = 0, flip = false } = {}) {
  const gc = glyphCentered(ch, size);
  const a = anim ? A[anim](t, 0.5) : {};
  const tr = `translate(${n(gc.dx)} ${n(gc.dy)})`;
  const fillC = color ?? th.line;
  return g(
    { transform: `translate(${n(x)} ${n(y)})${rotate ? ` rotate(${rotate})` : ''}${flip ? ' scale(-1 1)' : ''}` },
    g(
      a,
      path(gc.d, { transform: tr, fill: fillC, stroke: th.ink, 'stroke-width': outline, 'paint-order': 'stroke', ...ROUND, ...extra }),
      bold ? path(gc.d, { transform: tr, fill: 'none', stroke: fillC, 'stroke-width': bold, ...ROUND }) : '',
    ),
  );
}

/** Contorno de luz que percorre um caminho (ambiente, período 8 s). */
export function runner(doc, th, d, { w = 2.4, offset = 0, dash = 0.12, color, reverse = false } = {}) {
  const a = doc.ambient(reverse ? 'trace-r' : 'trace', reverse ? 'from{stroke-dashoffset:0}to{stroke-dashoffset:1}' : 'from{stroke-dashoffset:0}to{stroke-dashoffset:-1}', { offset });
  return path(d, { fill: 'none', stroke: color ?? th.hi, 'stroke-width': w, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': `${dash} ${n(1 - dash)}`, ...a });
}

/** Brilho que pisca (troca de cor) — para estrelas, glifos, pontos. */
export function blinkAttrs(doc, th, { offset = 0, dur = 8, base, hi } = {}) {
  const b = base ?? th.glyph;
  const c = hi ?? th.hi;
  return doc.ambient(`blink-${dur}-${b}-${c}`.replace(/#/g, ''), `0%,12%,100%{fill:${b}}5%{fill:${c}}`, { dur, offset });
}

export function twinkleAttrs(doc, { offset = 0, dur = 2 } = {}) {
  return doc.ambient(`twinkle${dur}`, '0%,100%{transform:scale(1)}50%{transform:scale(.55)}', { dur, offset, box: true });
}

/** Pulsar suave (escala) em torno de um ponto. */
export function pulseAttrs(doc, x, y, { dur = 4, amount = 1.06, offset = 0 } = {}) {
  return doc.ambient(`pulse${dur}-${String(amount).replace('.', '')}`, `0%,100%{transform:scale(1)}50%{transform:scale(${amount})}`, { dur, offset, origin: [x, y], ease: 'ease-in-out' });
}

/** Rotação contínua sem emenda: gira `step` graus a cada `dur` segundos. */
export function spinAttrs(doc, x, y, step, { dur = 8 } = {}) {
  return doc.ambient(`spin-${String(step).replace('.', '_')}-${dur}`, `to{transform:rotate(${step}deg)}`, { dur, origin: [x, y] });
}

// ---------------------------------------------------------------------------
// Formas geométricas
export function eggPath(cx, cy, rx, ry) {
  const k = (v) => n(v);
  return (
    `M${k(cx)} ${k(cy - ry)}` +
    `C${k(cx + rx * 0.58)} ${k(cy - ry)} ${k(cx + rx)} ${k(cy - ry * 0.4)} ${k(cx + rx)} ${k(cy + ry * 0.14)}` +
    `C${k(cx + rx)} ${k(cy + ry * 0.66)} ${k(cx + rx * 0.56)} ${k(cy + ry)} ${k(cx)} ${k(cy + ry)}` +
    `C${k(cx - rx * 0.56)} ${k(cy + ry)} ${k(cx - rx)} ${k(cy + ry * 0.66)} ${k(cx - rx)} ${k(cy + ry * 0.14)}` +
    `C${k(cx - rx)} ${k(cy - ry * 0.4)} ${k(cx - rx * 0.58)} ${k(cy - ry)} ${k(cx)} ${k(cy - ry)}Z`
  );
}

export function flamePath(x, y, w, hh) {
  return (
    `M${n(x - w / 2)} ${n(y)}` +
    `C${n(x - w / 2)} ${n(y - hh * 0.42)} ${n(x - w * 0.08)} ${n(y - hh * 0.55)} ${n(x)} ${n(y - hh)}` +
    `C${n(x + w * 0.1)} ${n(y - hh * 0.6)} ${n(x + w * 0.62)} ${n(y - hh * 0.5)} ${n(x + w / 2)} ${n(y - hh * 0.1)}` +
    `C${n(x + w * 0.45)} ${n(y + w * 0.36)} ${n(x - w * 0.45)} ${n(y + w * 0.36)} ${n(x - w / 2)} ${n(y)}Z`
  );
}

/** Chama com tremulação contínua (período 1 s). Base em (x,y). */
export function flame(doc, th, x, y, w, hh, { t = 0.9, offset = 0, colors } = {}) {
  const [outer, mid, core] = colors ?? ['#F2602A', '#FFB338', '#FFF3C2'];
  const fl = doc.ambient('flicker', '0%,100%{transform:scale(1,1) skewX(0deg)}25%{transform:scale(.93,1.08) skewX(-4deg)}50%{transform:scale(1.05,.94) skewX(2deg)}75%{transform:scale(.96,1.05) skewX(4deg)}', { dur: 1, offset, origin: [x, y], ease: 'ease-in-out' });
  return g(
    A.grow(t, x, y, 0.6),
    g(
      fl,
      path(flamePath(x, y, w, hh), { fill: outer, stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke', ...ROUND }),
      path(flamePath(x, y - hh * 0.04, w * 0.62, hh * 0.68), { fill: mid }),
      path(flamePath(x, y - hh * 0.06, w * 0.3, hh * 0.38), { fill: core }),
    ),
  );
}

/** Raios de sol (triângulos) entre r1 e r2. `alt` alterna raios curtos. */
export function raysPath(cx, cy, r1, r2, count, { half = 4, alt = 0, rot = -90 } = {}) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = rot + (i * 360) / count;
    const R = alt && i % 2 ? r1 + (r2 - r1) * alt : r2;
    const da = (half * 180) / (Math.PI * r1);
    d += poly([polar(cx, cy, r1, a - da), polar(cx, cy, R, a), polar(cx, cy, r1, a + da)]);
  }
  return d;
}

/** Lua crescente: círculo menos outro deslocado; rot=0 abre para a direita. */
export function crescentPath(cx, cy, r, { inner = 0.8, offset = 0.42, rot = 0 } = {}) {
  const r2 = r * inner;
  const d = r * offset;
  const xi = (d * d + r * r - r2 * r2) / (2 * d);
  const yi = Math.sqrt(Math.max(0, r * r - xi * xi));
  const a = (rot * Math.PI) / 180;
  const at = (x, y) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
  const [p1x, p1y] = at(xi, -yi);
  const [p2x, p2y] = at(xi, yi);
  return `M${n(p1x)} ${n(p1y)}A${n(r)} ${n(r)} 0 ${xi > 0 ? 1 : 0} 0 ${n(p2x)} ${n(p2y)}A${n(r2)} ${n(r2)} 0 ${xi > d ? 1 : 0} 1 ${n(p1x)} ${n(p1y)}Z`;
}

/** Pena em forma de cápsula apontando para +x a partir da origem. */
function featherPath(L, w) {
  const r = w / 2;
  return `M0 ${n(-r)}L${n(L - r)} ${n(-r)}A${n(r)} ${n(r)} 0 0 1 ${n(L - r)} ${n(r)}L0 ${n(r)}Z`;
}

/**
 * Asa estilizada (leque de penas) saindo de (x,y). dir = 1 → direita, -1 → esquerda.
 * a0/a1: ângulo (graus) da pena de cima e da de baixo; negativo aponta para cima.
 */
export function wing(doc, th, x, y, { dir = 1, span = 120, a0 = -16, a1 = 22, count = 7, width = 11, t = 0.7, colors, flap = true, covert = true, shrink = 0.5 } = {}) {
  const [c1, c2] = colors ?? [goldFill(doc, th), th.gold[0]];
  const feathers = [];
  for (let i = count - 1; i >= 0; i--) {
    const f = count === 1 ? 0 : i / (count - 1);
    const ang = a0 + (a1 - a0) * f;
    const L = span * (1 - shrink * f);
    const deg = dir === 1 ? ang : 180 - ang;
    feathers.push(
      g(
        { transform: `translate(${n(x)} ${n(y)}) rotate(${n(deg)})` },
        path(featherPath(L, width), { fill: c1, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }),
        path(`M${n(width * 0.6)} 0H${n(L - width)}`, { stroke: th.gold[2], 'stroke-width': 1.2 }),
      ),
    );
  }
  if (covert) {
    const k = Math.max(3, count - 3);
    for (let i = k - 1; i >= 0; i--) {
      const f = k === 1 ? 0 : i / (k - 1);
      const ang = a0 - 4 + (a1 - a0) * 0.8 * f;
      const L = span * 0.46 * (1 - 0.35 * f);
      const deg = dir === 1 ? ang : 180 - ang;
      feathers.push(
        g({ transform: `translate(${n(x)} ${n(y)}) rotate(${n(deg)})` }, path(featherPath(L, width * 1.05), { fill: c2, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' })),
      );
    }
  }
  const fl = flap
    ? doc.ambient(dir === 1 ? 'flapR' : 'flapL', `0%,100%{transform:rotate(0)}50%{transform:rotate(${dir === 1 ? -5 : 5}deg)}`, { dur: 4, origin: [x, y], ease: 'ease-in-out' })
    : {};
  return g(A.unfold(t, x, y, 0.75), g(fl, feathers));
}

/** Ovo alado (o "mascote" dos graus hieráticos). */
export function wingedEgg(doc, th, cx, cy, { rx = 22, ry = 29, span = 112, t = 0.6, eggFill } = {}) {
  const eggD = eggPath(cx, cy, rx, ry);
  return g(
    {},
    wing(doc, th, cx - rx * 0.55, cy + 2, { dir: -1, span, t: t + 0.15, a0: -20, a1: 26, count: 7, width: 10 }),
    wing(doc, th, cx + rx * 0.55, cy + 2, { dir: 1, span, t: t + 0.15, a0: -20, a1: 26, count: 7, width: 10 }),
    fill(th, eggD, { color: eggFill ?? grad(doc, [[0, '#FFFDF4'], [0.6, '#F1E3C0'], [1, '#C9A96A']]), t, dur: 0.6, outline: 4 }),
    path(eggD, { fill: 'none', stroke: th.line, 'stroke-width': 2.2, ...A.draw(t + 0.1, 0.8) }),
  );
}

/** Coluna clássica (fuste com caneluras, capitel e base) de (x, top) a (x, bottom). */
export function column(th, x, top, bottom, w, { t = 0.6, color, globe = false, doc } = {}) {
  const c = color ?? th.line;
  const shade = doc ? hgrad(doc, [[0, '#4A3618'], [0.35, th.gold[1]], [0.55, th.gold[0]], [1, '#4A3618']]) : th.plate;
  const capH = w * 0.55;
  const baseH = w * 0.45;
  const shaft = `M${n(x - w / 2)} ${n(top + capH)}H${n(x + w / 2)}V${n(bottom - baseH)}H${n(x - w / 2)}Z`;
  const cap = poly([[x - w * 0.85, top], [x + w * 0.85, top], [x + w * 0.6, top + capH], [x - w * 0.6, top + capH]]);
  const base = poly([[x - w * 0.6, bottom - baseH], [x + w * 0.6, bottom - baseH], [x + w * 0.8, bottom], [x - w * 0.8, bottom]]);
  const flutes = [-0.22, 0, 0.22].map((f) => `M${n(x + f * w)} ${n(top + capH + 4)}V${n(bottom - baseH - 4)}`).join('');
  return g(
    A.grow(t, x, bottom, 0.7),
    path(shaft, { fill: shade, stroke: th.ink, 'stroke-width': 6, 'paint-order': 'stroke' }),
    path(shaft, { fill: 'none', stroke: c, 'stroke-width': 2.2 }),
    path(flutes, { stroke: doc ? '#5A4220' : th.lineDim, 'stroke-width': 1.2 }),
    path(cap, { fill: c, stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }),
    path(base, { fill: c, stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }),
    globe ? circle(x, top - w * 0.55, w * 0.55, { fill: c, stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke' }) : '',
  );
}

/** Pétala pontuda (para lótus e rosas estilizadas) apontando para cima a partir de (0,0). */
export function petalPath(len, wid) {
  return `M0 0C${n(-wid)} ${n(-len * 0.35)} ${n(-wid * 0.7)} ${n(-len * 0.8)} 0 ${n(-len)}C${n(wid * 0.7)} ${n(-len * 0.8)} ${n(wid)} ${n(-len * 0.35)} 0 0Z`;
}

/** Lótus de perfil (pétalas em leque) com base em (x,y). */
export function lotus(doc, th, x, y, s = 1, { t = 0.8, colors } = {}) {
  const [c1, c2, c3] = colors ?? [goldFill(doc, th), th.gold[0], th.hi];
  const pet = (ang, len, wid, color) =>
    g({ transform: `translate(${n(x)} ${n(y)}) rotate(${ang})` }, path(petalPath(len * s, wid * s), { fill: color, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }));
  return g(
    A.grow(t, x, y, 0.7),
    pet(-62, 26, 9, c1),
    pet(62, 26, 9, c1),
    pet(-38, 34, 11, c2),
    pet(38, 34, 11, c2),
    pet(-16, 40, 12, c1),
    pet(16, 40, 12, c1),
    pet(0, 46, 13, c3),
  );
}

/** Rosa vista de cima. */
export function rose(doc, th, cx, cy, r, { t = 0.9, colors } = {}) {
  const [c1, c2, c3] = colors ?? ['#B3203D', '#D93A5B', '#F07A93'];
  const layer = (rr, pr, rot, color) =>
    [0, 1, 2, 3, 4].map((i) => {
      const [px, py] = polar(cx, cy, rr, rot + i * 72);
      return circle(px, py, pr, { fill: color, stroke: th.ink, 'stroke-width': 2.4 });
    });
  return g(
    A.pop(t, 0.6),
    layer(r * 0.52, r * 0.5, -90, c1),
    layer(r * 0.3, r * 0.36, -54, c2),
    layer(r * 0.12, r * 0.22, -90, c3),
    circle(cx, cy, r * 0.13, { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2 }),
  );
}

/** Ramo com folhas alternadas ao longo de uma curva quadrática. */
export function branch(doc, th, x0, y0, x1, y1, { bend = 0, leaves = 7, size = 14, t = 0.8, color } = {}) {
  const mx = (x0 + x1) / 2 + bend * (y1 - y0) * 0.25;
  const my = (y0 + y1) / 2 - bend * (x1 - x0) * 0.25;
  const at = (u) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1];
  const tan = (u) => [2 * (1 - u) * (mx - x0) + 2 * u * (x1 - mx), 2 * (1 - u) * (my - y0) + 2 * u * (y1 - my)];
  const kids = [stroke(th, `M${n(x0)} ${n(y0)}Q${n(mx)} ${n(my)} ${n(x1)} ${n(y1)}`, { w: 2.4, t, dur: 0.7, color })];
  for (let i = 0; i < leaves; i++) {
    const u = 0.12 + (0.85 * i) / Math.max(1, leaves - 1);
    const [px, py] = at(u);
    const [tx, ty] = tan(u);
    const ang = (Math.atan2(ty, tx) * 180) / Math.PI + (i % 2 ? 50 : -50) + 90;
    kids.push(g({ transform: `translate(${n(px)} ${n(py)}) rotate(${n(ang)})` }, g(A.pop(t + 0.15 + i * 0.05, 0.4), path(petalPath(size, size * 0.42), { fill: color ?? goldFill(doc, th), stroke: th.ink, 'stroke-width': 2.6, 'paint-order': 'stroke' }))));
  }
  return g({}, kids);
}

/** Estrela que cintila (escala) — período 2 s. */
export function twinkleStar(doc, th, x, y, r, { points = 4, t = 1, offset = 0, color, inner = 0.38 } = {}) {
  return g(
    { transform: `translate(${n(x)} ${n(y)})` },
    g(A.pop(t, 0.45), g(twinkleAttrs(doc, { offset, dur: 2 }), path(star(0, 0, points, r, r * inner), { fill: color ?? th.hi, stroke: th.ink, 'stroke-width': 2.6, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }))),
  );
}

/** Ondas (linha senoidal) que balançam. */
export function waves(doc, th, x0, x1, y, { amp = 4, wave = 22, rows = 2, gap = 9, t = 0.9, color } = {}) {
  const kids = [];
  for (let r = 0; r < rows; r++) {
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += 2) pts.push([x, y + r * gap + amp * Math.sin(((x - x0) / wave) * Math.PI * 2 + r * 1.3)]);
    const bob = doc.ambient('bob', '0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}', { dur: 2, offset: r * 0.5, ease: 'ease-in-out' });
    kids.push(g(bob, stroke(th, poly(pts, false), { w: 2.4, t: t + r * 0.1, dur: 0.8, color: color ?? th.accent })));
  }
  return g({}, kids);
}

/** Elos de corrente ao longo de um segmento horizontal (local), alternando frente/perfil. */
export function chainLinks(th, x0, x1, { size = 14, t = 0.6, color } = {}) {
  const kids = [];
  const step = size * 1.35;
  let k = 0;
  for (let x = x0 + size * 0.7; x <= x1 - size * 0.4; x += step, k++) {
    const d =
      k % 2 === 0
        ? `M${n(x - size * 0.7)} ${n(-size * 0.42)}H${n(x + size * 0.7)}A${n(size * 0.42)} ${n(size * 0.42)} 0 0 1 ${n(x + size * 0.7)} ${n(size * 0.42)}H${n(x - size * 0.7)}A${n(size * 0.42)} ${n(size * 0.42)} 0 0 1 ${n(x - size * 0.7)} ${n(-size * 0.42)}Z`
        : `M${n(x - size * 0.75)} 0H${n(x + size * 0.75)}`;
    kids.push(
      g(A.pop(t + k * 0.02, 0.35), path(d, { fill: 'none', stroke: th.ink, 'stroke-width': k % 2 === 0 ? 7.5 : 8.5, 'stroke-linecap': 'round' }), path(d, { fill: 'none', stroke: color ?? th.line, 'stroke-width': k % 2 === 0 ? 3.2 : 4, 'stroke-linecap': 'round' })),
    );
  }
  return kids;
}

/** Espiga de trigo com base em (x,y), apontando para cima. */
export function wheatEar(doc, th, x, y, s = 1, { t = 0.8, rot = 0, color } = {}) {
  const c = color ?? goldFill(doc, th);
  const L = 44 * s;
  const kids = [path(`M0 0V${n(-L)}`, { stroke: th.ink, 'stroke-width': 5 * s + 2, 'stroke-linecap': 'round' }), path(`M0 0V${n(-L)}`, { stroke: th.line, 'stroke-width': 2 * s, 'stroke-linecap': 'round' })];
  for (let i = 0; i < 5; i++) {
    const yy = -L * 0.38 - i * L * 0.12;
    for (const side of [-1, 1]) kids.push(g({ transform: `translate(0 ${n(yy)}) rotate(${side * 28})` }, path(petalPath(13 * s, 4.6 * s), { fill: c, stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' })));
  }
  kids.push(g({ transform: `translate(0 ${n(-L * 0.9)})` }, path(petalPath(12 * s, 4.4 * s), { fill: c, stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' })));
  return g({ transform: `translate(${n(x)} ${n(y)}) rotate(${rot})` }, g(A.grow(t, 0, 0, 0.6), kids));
}
