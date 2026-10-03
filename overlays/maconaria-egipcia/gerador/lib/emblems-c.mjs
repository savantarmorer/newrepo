// Emblemas dos graus 68°–86° (Sublime Conselho).
import { glyphCentered } from './fonts.mjs';
import { A, circle, g, n, path, poly, polar, star } from './svg.mjs';
import * as D from './draw.mjs';
import { tri } from './emblems-a.mjs';

const ringD = (r, cx = 0, cy = 0) => `M${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}`;

/** Elo de corrente posicionado e girado (frente = oval, perfil = barra). */
function link(th, x, y, ang, front, size = 9) {
  const d = front
    ? `M${-size * 0.7} ${-size * 0.42}H${size * 0.7}A${size * 0.42} ${size * 0.42} 0 0 1 ${size * 0.7} ${size * 0.42}H${-size * 0.7}A${size * 0.42} ${size * 0.42} 0 0 1 ${-size * 0.7} ${-size * 0.42}Z`
    : `M${-size * 0.75} 0H${size * 0.75}`;
  return g(
    { transform: `translate(${n(x)} ${n(y)}) rotate(${n(ang)})` },
    path(d, { fill: 'none', stroke: th.ink, 'stroke-width': front ? 6.5 : 7.5, 'stroke-linecap': 'round' }),
    path(d, { fill: 'none', stroke: th.line, 'stroke-width': front ? 2.8 : 3.6, 'stroke-linecap': 'round' }),
  );
}

export const EMBLEMS_C = {
  // 68° — Quadrado sobre o ovo alado com quatro raios; delta com estrela central
  ovoQuadrado(doc, th) {
    const rays = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `M${sx * 30} ${2 + sy * 30}L${sx * 41} ${2 + sy * 41}`).join('');
    return g(
      {},
      D.wingedEgg(doc, th, 0, 2, { rx: 21, ry: 28, span: 104, t: 0.6 }),
      D.stroke(th, 'M-30 -28H30V32H-30Z', { w: 2.4, t: 1.0, dur: 0.8, cap: 'square' }),
      D.stroke(th, rays, { w: 2.4, t: 1.4, dur: 0.4, color: th.accent }),
      g({ transform: 'translate(0 5)' }, g(A.pop(1.3, 0.5), path(tri(0, 0, 13), { fill: th.plate, stroke: th.line, 'stroke-width': 2, 'stroke-linejoin': 'round' }), path(star(0, 2, 5, 5, 2.2), { fill: th.hi }))),
    );
  },

  // 69° — O Ramo de Ouro e o Y pitagórico (estreito ao Elísio, largo ao Tártaro)
  ramoOuro(doc, th) {
    const rocky = poly([[0, 6], [-6, 1], [-4, -5], [-12, -10], [-10, -17], [-18, -22], [-16, -29], [-25, -34], [-23, -40], [-31, -45]], false);
    return g(
      {},
      D.branch(doc, th, -46, 40, -8, 30, { bend: -0.6, leaves: 6, size: 13, t: 1.2 }),
      D.stroke(th, 'M0 46V6', { w: 6, t: 0.6, dur: 0.4 }),
      D.stroke(th, 'M0 8L32 -42', { w: 10, t: 0.95, dur: 0.5 }),
      D.stroke(th, rocky, { w: 3, t: 0.9, dur: 0.7, color: th.hi }),
      D.twinkleStar(doc, th, -32, -46, 6, { t: 1.5, points: 5, inner: 0.45 }),
      g({ transform: 'translate(36 -44)' }, g(A.pop(1.5, 0.4), circle(0, 0, 3.5, { fill: '#8E1B1B', stroke: th.ink, 'stroke-width': 2 }))),
    );
  },

  // 70° — Os Planisférios e o Oriente divino
  planisferio(doc, th) {
    let grid = ringD(30, 0, -6) + ringD(15, 0, -6);
    for (let i = 0; i < 6; i++) {
      const [x0, y0] = polar(0, -6, 40, i * 30);
      const [x1, y1] = polar(0, -6, 40, i * 30 + 180);
      grid += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
    }
    const starsAt = [[-22, -24], [14, -30], [26, -8], [-30, 2], [8, 10], [-10, -12], [20, 16], [-18, 18], [2, -36]];
    return g(
      {},
      D.stroke(th, ringD(40, 0, -6), { w: 2.4, t: 0.6 }),
      g(D.spinAttrs(doc, 0, -6, 30), g(A.fade(0.8, 0.5), path(grid, { fill: 'none', stroke: th.lineDim, 'stroke-width': 1 }))),
      g(A.fade(1.0), path('M-36 -6a36 15 0 1 0 72 0a36 15 0 1 0 -72 0', { fill: 'none', stroke: th.accent, 'stroke-width': 1.6, transform: 'rotate(-23 0 -6)' })),
      starsAt.map(([x, y], i) => D.twinkleStar(doc, th, x, y, i % 3 ? 3 : 4.5, { t: 1.0 + i * 0.05, offset: (i * 0.29) % 2 })),
      g({ transform: 'translate(0 40)' }, g(A.rise(1.2, 0.6), g(D.spinAttrs(doc, 0, 0, 30), path(D.raysPath(0, 0, 12, 22, 12, { half: 3 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' })), path('M-12 0A12 12 0 0 1 12 0Z', { fill: th.gold[0], stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }))),
      D.stroke(th, 'M-46 40H46', { w: 2.2, t: 1.1, dur: 0.5 }),
    );
  },

  // 71° — Os Vedas: a roda do carro de Arjuna (dharma)
  vedas(doc, th) {
    let thick = '';
    let thin = '';
    const knobs = [];
    for (let i = 0; i < 8; i++) {
      const [x0, y0] = polar(0, 0, 9, i * 45);
      const [x1, y1] = polar(0, 0, 37, i * 45);
      thick += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
      const [a0, b0] = polar(0, 0, 9, i * 45 + 22.5);
      const [a1, b1] = polar(0, 0, 37, i * 45 + 22.5);
      thin += `M${n(a0)} ${n(b0)}L${n(a1)} ${n(b1)}`;
    }
    for (let i = 0; i < 16; i++) {
      const [x, y] = polar(0, 0, 44.5, i * 22.5 + 11.25);
      knobs.push(circle(x, y, 2.6, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 1.6 }));
    }
    return g(
      {},
      g(
        D.spinAttrs(doc, 0, 0, 45),
        D.stroke(th, ringD(44) + ringD(37), { w: 3, t: 0.6 }),
        D.stroke(th, thick, { w: 3.6, t: 0.8 }),
        g(A.fade(1.0), path(thin, { stroke: th.lineDim, 'stroke-width': 1.6 })),
        g(A.pop(1.1, 0.5), knobs),
      ),
      circle(0, 0, 9, { fill: D.goldFill(doc, th), stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', ...A.pop(0.9, 0.4) }),
      circle(0, 0, 3.5, { fill: th.accent, ...A.pop(1.0, 0.3) }),
    );
  },

  // 72° — Mestre da Sabedoria: a coruja sobre o livro
  sabedoria(doc, th) {
    const body = D.eggPath(0, 6, 22, 30);
    const book = 'M-32 38Q-16 32 0 38Q16 32 32 38V48Q16 42 0 48Q-16 42 -32 48Z';
    const tuft = (s) => poly([[s * 10, -24], [s * 26, -40], [s * 22, -18]]);
    const wingD = (s) => `M${s * 18} -2C${s * 30} 10 ${s * 28} 26 ${s * 12} 34C${s * 18} 20 ${s * 18} 8 ${s * 18} -2Z`;
    const eye = (x) => g(
      {},
      circle(x, -8, 11.5, { fill: '#F6EEDB', stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }),
      circle(x, -8, 5.5, { fill: th.ink }),
      circle(x + 1.8, -10, 1.6, { fill: '#FFFFFF' }),
      // pálpebra que pisca a cada 4 s
      circle(x, -8, 11.6, { fill: th.gold[2], ...doc.ambient('blink-eye', '0%,6%,100%{transform:scaleY(0)}3%{transform:scaleY(1)}', { dur: 4, offset: 1.5, origin: [x, -8] }) }),
    );
    return g(
      {},
      D.fill(th, book, { color: '#F4EAD6', t: 0.6, anim: 'rise' }),
      path('M0 38V48', { stroke: th.gold[2], 'stroke-width': 1.6, ...A.fade(0.8) }),
      D.fill(th, tuft(-1) + tuft(1), { color: th.gold[2], t: 0.75 }),
      D.fill(th, body, { color: D.goldFill(doc, th), t: 0.7 }),
      D.fill(th, wingD(-1) + wingD(1), { color: th.gold[2], t: 0.85 }),
      g(A.pop(0.95, 0.5), eye(-11), eye(11)),
      D.fill(th, 'M-4 0H4L0 8Z', { color: '#F28C28', t: 1.05, outline: 2 }),
      path('M-6 36v5M-2 36v5M2 36v5M6 36v5', { stroke: '#F28C28', 'stroke-width': 2, ...A.fade(1.1) }),
    );
  },

  // 73° — O Fogo Sagrado: chifres, disco solar e o uraeus
  fogoSagrado(doc, th) {
    const horn = (s) => `M${s * 3} 34C${s * 22} 34 ${s * 46} 22 ${s * 46} -2C${s * 46} -22 ${s * 38} -36 ${s * 26} -44C${s * 34} -32 ${s * 38} -18 ${s * 36} -4C${s * 34} 16 ${s * 18} 26 ${s * 3} 26Z`;
    const sun = D.grad(doc, [[0, '#FFB067'], [0.5, '#E2412B'], [1, '#8E1B1B']]);
    const hood = 'M0 10C9 10 11 20 8 30L5 40H-5L-8 30C-11 20 -9 10 0 10Z';
    const head = 'M0 2C5 2 7 6 5 10H-5C-7 6 -5 2 0 2Z';
    return g(
      {},
      D.fill(th, horn(-1) + horn(1), { color: D.goldFill(doc, th), t: 0.6, dur: 0.6 }),
      g(D.pulseAttrs(doc, 0, -6, { amount: 1.05 }), D.fill(th, ringD(22, 0, -6), { color: sun, t: 0.8, dur: 0.6 })),
      D.fill(th, hood, { color: D.goldFill(doc, th), t: 1.1, anim: 'rise' }),
      D.fill(th, head, { color: th.gold[0], t: 1.2 }),
      path('M-3 16h6M-5 22h10M-5 28h10', { stroke: '#2E5AAC', 'stroke-width': 1.8, ...A.fade(1.3) }),
    );
  },

  // 74° — O Stoka (śloka): dois versos de 16 sílabas
  stoka(doc, th) {
    const kids = [];
    [-12, 14].forEach((y, row) => {
      for (let k = 0; k < 16; k++) {
        const x = -112 + k * 14.9 + (k >= 8 ? 6 : 0);
        const blink = D.blinkAttrs(doc, th, { offset: (row * 16 + k) * 0.25, base: th.glyph });
        kids.push(g({ transform: `translate(${n(x)} ${y})` }, g(A.pop(0.7 + (row * 16 + k) * 0.025, 0.35), circle(0, 0, k % 2 ? 3.4 : 4.4, { fill: th.glyph, stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke', ...blink }))));
      }
    });
    return g(
      {},
      kids,
      D.glyph(th, '।', 3, -12, 22, { t: 1.4, color: th.accent }),
      D.glyph(th, '।', 3, 14, 22, { t: 1.45, color: th.accent }),
      D.glyph(th, '॥', 130, 14, 22, { t: 1.5, color: th.accent }),
      D.glyph(th, 'ॐ', 0, -38, 20, { t: 1.2, color: th.gold[0] }),
    );
  },

  // 75° — A Cadeia Líbia: colar de ouro com medalhão (favor real)
  cadeia(doc, th) {
    const pts = [];
    const N = 13;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x = -44 + 88 * u;
      const y = -36 + 58 * (1 - (2 * u - 1) ** 2);
      const dx = 88;
      const dy = 58 * -2 * (2 * u - 1) * 2;
      pts.push([x, y, (Math.atan2(dy, dx) * 180) / Math.PI]);
    }
    return g(
      {},
      g(A.fade(0.6, 0.6), pts.map(([x, y, a], i) => link(th, x, y, a, i % 2 === 0))),
      D.stroke(th, 'M0 22V30', { w: 2.6, t: 1.0 }),
      g({ transform: 'translate(0 40)' }, g(A.pop(1.1, 0.5), circle(0, 0, 13, { fill: D.goldFill(doc, th), stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke' }), path(star(0, 0, 8, 9, 4), { fill: '#C63A2D', stroke: th.ink, 'stroke-width': 1.2 }))),
      D.twinkleStar(doc, th, 9, 34, 4, { t: 1.4 }),
    );
  },

  // 76° — Intérprete dos Hieróglifos: o nome de Ísis num cartucho
  hieroglifos(doc, th) {
    const cart = 'M-24 -24A24 24 0 0 1 24 -24V24A24 24 0 0 1 -24 24Z';
    const glyphs = [['𓊨', -29, 25], ['𓏏', -9, 18], ['𓆇', 7, 17], ['𓁐', 27, 25]];
    return g(
      {},
      D.fill(th, cart, { color: '#F4EAD6', t: 0.6, dur: 0.5 }),
      D.stroke(th, cart, { w: 2.6, t: 0.65 }),
      D.stroke(th, 'M-26 54H26', { w: 4, t: 0.9 }),
      glyphs.map(([ch, y, s], i) => D.glyph(th, ch, 0, y, s, { color: '#1C2E5E', outline: 0, bold: 1.2, t: 1.0 + i * 0.12, extra: D.blinkAttrs(doc, th, { offset: i * 2, base: '#1C2E5E', hi: '#C63A2D' }) })),
    );
  },

  // 77° — A Árvore da Vida (10 sefirot, 22 caminhos)
  arvoreVida(doc, th) {
    const S = { K: [0, -46], Ch: [18, -35], B: [-18, -35], Che: [18, -10], G: [-18, -10], T: [0, 1], N: [18, 15], H: [-18, 15], Y: [0, 26], M: [0, 44] };
    const edges = ['K-Ch', 'K-B', 'K-T', 'Ch-B', 'Ch-T', 'B-T', 'Ch-Che', 'B-G', 'Che-G', 'Che-T', 'G-T', 'Che-N', 'G-H', 'T-N', 'T-H', 'T-Y', 'N-H', 'N-Y', 'H-Y', 'N-M', 'H-M', 'Y-M'];
    const d = edges.map((e) => { const [a, b] = e.split('-'); return `M${S[a][0]} ${S[a][1]}L${S[b][0]} ${S[b][1]}`; }).join('');
    const order = ['K', 'Ch', 'B', 'Che', 'G', 'T', 'N', 'H', 'Y', 'M'];
    return g(
      {},
      D.stroke(th, d, { w: 1.6, t: 0.6, dur: 1.1, color: th.lineDim, inkW: 4 }),
      order.map((k, i) => g({ transform: `translate(${S[k][0]} ${S[k][1]})` }, g(A.pop(0.9 + i * 0.07, 0.4), circle(0, 0, 6, { fill: th.glyph, stroke: th.ink, 'stroke-width': 2.6, 'paint-order': 'stroke', ...D.blinkAttrs(doc, th, { offset: i * 0.8, base: th.glyph }) })))),
    );
  },

  // 78° — Tebas: o cajado e o mangual de Osíris sob as estrelas
  tebas(doc, th) {
    const crook = 'M20 42L-6 -22C-9 -32 -16 -38 -24 -34C-30 -31 -30 -24 -25 -21';
    const flail = 'M-20 42L8 -20';
    const strands = [-6, 0, 6].map((o) => `M8 -20C${18 + o} -18 ${22 + o} -6 ${20 + o} 8`).join('');
    const lapis = { stroke: '#2E5AAC', 'stroke-width': 4.4, 'stroke-dasharray': '4 4', fill: 'none', 'stroke-linecap': 'butt' };
    return g(
      {},
      D.stroke(th, flail, { w: 5, t: 0.6, dur: 0.6 }),
      g(A.fade(1.0), path(flail, lapis)),
      D.stroke(th, strands, { w: 2.6, t: 1.0, dur: 0.6 }),
      D.stroke(th, crook, { w: 5, t: 0.7, dur: 0.8 }),
      g(A.fade(1.1), path('M20 42L-6 -22', lapis)),
      [[34, -30], [24, -44], [42, -12]].map(([x, y], i) => D.twinkleStar(doc, th, x, y, i ? 4 : 6, { t: 1.2 + i * 0.1, offset: i * 0.6, points: 5, inner: 0.45 })),
    );
  },

  // 79° — Sada ("sempre"): o ouroboros
  sada(doc, th) {
    const body = 'M-8 -38.2A39 39 0 1 0 8 -38.2';
    const sada = glyphCentered('सदा', 28, 'glyph');
    return g(
      {},
      D.stroke(th, body, { w: 8, t: 0.6, dur: 1.2, color: th.line, inkW: 12 }),
      g(A.fade(1.6), path(body, { fill: 'none', stroke: th.gold[2], 'stroke-width': 3, 'stroke-dasharray': '2 5' })),
      g({ transform: 'translate(-2 -39) rotate(10)' }, D.fill(th, 'M-2 -7C10 -8 18 -3 18 0C18 3 10 8 -2 7C-6 4 -6 -4 -2 -7Z', { color: th.line, t: 1.5 })),
      circle(8, -41, 1.6, { fill: th.ink, ...A.fade(1.7) }),
      g(A.fade(1.8, 0.3), D.runner(doc, th, body, { dash: 0.12, w: 3 })),
      g(A.pop(1.2, 0.5), path(sada.d, { transform: `translate(${n(sada.dx)} ${n(sada.dy + 2)})`, fill: D.goldFill(doc, th), stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' })),
    );
  },

  // 80° — Rá nasce do lótus no oceano primordial
  lotusRa(doc, th) {
    return g(
      {},
      D.waves(doc, th, -48, 48, 38, { amp: 3, wave: 16, rows: 2, gap: 7, t: 0.6 }),
      D.lotus(doc, th, 0, 36, 0.66, { t: 0.75 }),
      g({ transform: 'translate(0 -22)' }, g(A.rise(1.0, 0.7), g(D.spinAttrs(doc, 0, 0, 22.5), path(D.raysPath(0, 0, 17, 30, 16, { half: 3, alt: 0.6 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' })), circle(0, 0, 16, { fill: D.grad(doc, [[0, '#FFB067'], [0.5, '#E2412B'], [1, '#8E1B1B']]), stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }))),
    );
  },

  // 81° — Mênfis: o pilar djed de Ptah entre os olhos de Hórus e de Rá
  ptah(doc, th) {
    const gold = D.goldFill(doc, th);
    const bars = [-36, -28, -20, -12].map((y) => `M-18 ${y}h36v4.5h-36Z`).join('');
    const pillar = 'M-8 -10H8V36L14 44H-14L-8 36Z';
    return g(
      {},
      D.fill(th, pillar, { color: gold, t: 0.6, anim: 'rise' }),
      D.fill(th, bars, { color: th.gold[0], t: 0.8 }),
      D.fill(th, 'M-7 -40C-7 -48 7 -48 7 -40Z', { color: gold, t: 0.9 }),
      D.glyph(th, '𓂀', -36, 6, 40, { t: 1.0, color: th.accent, bold: 1.3 }),
      D.glyph(th, '𓂀', 36, 6, 40, { t: 1.1, color: th.accent, bold: 1.3, flip: true }),
    );
  },

  // 82° — Midgard: Yggdrasil cercada pela serpente do mundo
  midgard(doc, th) {
    const ring = ringD(45);
    const trunk = 'M0 30V-6';
    const branches = 'M0 -2C-6 -14 -20 -16 -30 -24M0 -2C6 -14 20 -16 30 -24M0 -8C-4 -20 -10 -28 -12 -38M0 -8C4 -20 10 -28 12 -38M0 -6V-40';
    const roots = 'M0 30C-8 34 -18 34 -28 40M0 30C8 34 18 34 28 40M0 30V42';
    const leaves = [[-30, -24], [30, -24], [-12, -38], [12, -38], [0, -41], [-22, -20], [22, -20], [-7, -24], [7, -24], [-18, -32], [18, -32]];
    return g(
      {},
      D.stroke(th, ring, { w: 5, t: 0.55, dur: 1, color: th.accent, inkW: 9 }),
      g(A.fade(1.6, 0.3), D.runner(doc, th, ring, { dash: 0.1, w: 3 })),
      D.stroke(th, trunk, { w: 6, t: 0.7, dur: 0.4 }),
      D.stroke(th, branches, { w: 3, t: 0.9, dur: 0.7 }),
      D.stroke(th, roots, { w: 3, t: 0.9, dur: 0.6 }),
      leaves.map(([x, y], i) => g({ transform: `translate(${x} ${y})` }, g(A.pop(1.3 + i * 0.04, 0.4), circle(0, 0, 3.6, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke' })))),
      g({ transform: 'translate(0 45) rotate(180)' }, D.fill(th, 'M-2 -6C9 -7 15 -3 15 0C15 3 9 7 -2 6Z', { color: th.accent, t: 1.4 })),
    );
  },

  // 83° — Vale de Oddy: a Enéada; coração (Hórus) e língua (Thoth) de Ptah
  oddy(doc, th) {
    return g(
      {},
      Array.from({ length: 9 }, (_, k) => {
        const [x, y] = polar(0, 10, 46, -160 + k * 17.5);
        return D.twinkleStar(doc, th, x, y, 4.2, { t: 0.6 + k * 0.06, offset: (k * 0.22) % 2, points: 5, inner: 0.45 });
      }),
      g({ transform: 'translate(0 8)' }, g(A.pop(0.8, 0.5), g(D.spinAttrs(doc, 0, 0, 30), path(D.raysPath(0, 0, 13, 22, 12, { half: 3 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke' })), circle(0, 0, 12, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }))),
      D.glyph(th, '𓄣', -33, 14, 40, { t: 1.0, color: '#F05A74', bold: 1.4 }),
      D.glyph(th, '𓄓', 32, 14, 36, { t: 1.1, color: th.accent, bold: 1.4 }),
    );
  },

  // 84° — Os Izeds: o Faravahar zoroastriano
  izeds(doc, th) {
    const fig = 'M-7 -18H7L9 -6H-9Z';
    return g(
      {},
      D.wing(doc, th, -12, 2, { dir: -1, span: 108, a0: -12, a1: 22, count: 7, width: 9, t: 0.7, shrink: 0.45 }),
      D.wing(doc, th, 12, 2, { dir: 1, span: 108, a0: -12, a1: 22, count: 7, width: 9, t: 0.7, shrink: 0.45 }),
      D.wing(doc, th, 0, 14, { dir: 1, span: 30, a0: 62, a1: 118, count: 5, width: 8, t: 0.9, covert: false, flap: false }),
      D.stroke(th, 'M-10 12C-22 20 -28 30 -20 38M10 12C22 20 28 30 20 38', { w: 2.4, t: 1.0 }),
      D.stroke(th, ringD(11, 0, 4), { w: 3.4, t: 0.85 }),
      D.fill(th, fig, { color: D.goldFill(doc, th), t: 1.0 }),
      circle(0, -24, 5.5, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 2.6, 'paint-order': 'stroke', ...A.pop(1.1, 0.4) }),
      D.stroke(th, 'M7 -14L15 -22', { w: 2.2, t: 1.2 }),
    );
  },

  // 85° — Kneph: o ovo alado envolto pela serpente
  kneph(doc, th) {
    const ring = ringD(36, 0, 2);
    return g(
      {},
      D.stroke(th, ring, { w: 4.4, t: 0.55, dur: 1, color: th.accent, inkW: 8 }),
      D.wingedEgg(doc, th, 0, 2, { rx: 20, ry: 27, span: 100, t: 0.7 }),
      g({ transform: 'translate(0 -34)' }, D.fill(th, 'M-9 -4C-9 -10 9 -10 9 -4C9 2 4 6 0 6C-4 6 -9 2 -9 -4Z', { color: th.accent, t: 1.4 })),
      g(A.fade(1.8, 0.3), D.runner(doc, th, ring, { dash: 0.12, w: 2.6 })),
    );
  },

  // 86° — A Rosa do Vale de Kab sobre a cruz
  rosaKab(doc, th) {
    const cross = 'M-6 -40H6V-6H40V6H6V40H-6V6H-40V-6H-6Z';
    const ends = [[0, -44], [44, 0], [0, 44], [-44, 0]].map(([x, y]) => circle(x, y, 6, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 2.6, 'paint-order': 'stroke' }));
    return g(
      {},
      D.fill(th, cross, { color: D.goldFill(doc, th), t: 0.6 }),
      g(A.pop(0.8, 0.4), ends),
      g(D.pulseAttrs(doc, 0, 0, { amount: 1.06 }), D.rose(doc, th, 0, 0, 22, { t: 0.95 })),
    );
  },
};

EMBLEMS_C.ovoQuadrado.spec = { backdrop: 'wide', w: 290, h: 104 };
EMBLEMS_C.kneph.spec = { backdrop: 'wide', w: 290, h: 104 };
EMBLEMS_C.izeds.spec = { backdrop: 'wide', w: 300, h: 104 };
EMBLEMS_C.stoka.spec = { backdrop: 'wide', w: 300, h: 104 };
