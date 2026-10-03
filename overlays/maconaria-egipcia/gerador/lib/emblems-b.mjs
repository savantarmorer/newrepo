// Emblemas dos graus 51°–67°.
import { glyphCentered } from './fonts.mjs';
import { A, circle, g, n, path, poly, polar } from './svg.mjs';
import * as D from './draw.mjs';
import { tri } from './emblems-a.mjs';

const P = (r, deg) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];

/**
 * Labirinto clássico (cretense) de 7 circuitos como um único caminho.
 * Sequência de circuitos 3-2-1-4-7-6-5-centro, voltas concentradas na base.
 */
export function labyrinthPath(R1 = 46, s = 5.6, c = 2.6) {
  const r = (k) => R1 - (k - 1) * s;
  const pts = [];
  const deg = (rad) => (rad * 180) / Math.PI;
  const dL1 = deg((1.5 * s + c) / r(2.5));
  const dR1 = deg((0.5 * s + c) / r(1.5));
  const dR2 = deg((1.5 * s + c) / r(5.5));
  const dL2 = deg((1.5 * s + c) / r(6.5));
  const L1 = 90 + dL1 - 360;
  const R1a = 90 - dR1;
  const R2 = 90 - dR2;
  const L2 = 90 + dL2 - 360;
  const arc = (k, a0, a1) => {
    const steps = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3));
    for (let i = 0; i <= steps; i++) pts.push(P(r(k), a0 + ((a1 - a0) * i) / steps));
  };
  // volta em U entre os circuitos ka → kb no ângulo a; bulge = ±1 (sentido tangencial)
  const turn = (ka, kb, a, bulge) => {
    const ra = r(ka);
    const rb = r(kb);
    const rc = (ra + rb) / 2;
    const rho = Math.abs(ra - rb) / 2;
    const ar = (a * Math.PI) / 180;
    const radial = [Math.cos(ar), Math.sin(ar)];
    const tang = [-Math.sin(ar) * bulge, Math.cos(ar) * bulge];
    const sgn = ra > rb ? 1 : -1;
    const Q = [rc * radial[0], rc * radial[1]];
    for (let i = 1; i < 16; i++) {
      const f = (i / 16) * Math.PI;
      pts.push([Q[0] + rho * (Math.cos(f) * sgn * radial[0] + Math.sin(f) * tang[0]), Q[1] + rho * (Math.cos(f) * sgn * radial[1] + Math.sin(f) * tang[1])]);
    }
  };
  pts.push(P(r(1) + s * 1.2, 90));
  arc(3, 90, L1);
  turn(3, 2, L1, -1);
  arc(2, L1, R1a);
  turn(2, 1, R1a, 1);
  arc(1, R1a, L1);
  turn(1, 4, L1, -1);
  arc(4, L1, R2);
  turn(4, 7, R2, 1);
  arc(7, R2, L2);
  turn(7, 6, L2, -1);
  arc(6, L2, R2);
  turn(6, 5, R2, 1);
  arc(5, R2, L2);
  turn(5, 8, L2, -1);
  pts.push(P(r(8), L2), [0, 0]);
  return poly(pts, false);
}

function torch(doc, th, x, y, rot, { t = 0.8, offset = 0, len = 58 } = {}) {
  const handle = poly([[-3, 0], [3, 0], [5, -len], [-5, -len]]);
  const cup = poly([[-9, -len], [9, -len], [6, -len - 8], [-6, -len - 8]]);
  return g(
    { transform: `translate(${n(x)} ${n(y)}) rotate(${rot})` },
    D.fill(th, handle, { color: '#8A5A2B', t, anim: 'fade' }),
    D.fill(th, cup, { color: D.goldFill(doc, th), t: t + 0.1 }),
    D.flame(doc, th, 0, -len - 8, 16, 26, { t: t + 0.2, offset }),
  );
}

function wingedBase(doc, th, extra = []) {
  return g({}, D.wingedEgg(doc, th, 0, 2, { rx: 21, ry: 28, span: 104, t: 0.6 }), extra);
}

export const EMBLEMS_B = {
  // 51° — Prometeu: a tocha do fogo roubado e as correntes rompidas
  prometeu(doc, th) {
    const chainL = g({ transform: 'translate(-40 -10) rotate(70)' }, D.chainLinks(th, 0, 46, { size: 9, t: 0.9 }));
    const chainR = g({ transform: 'translate(40 -10) rotate(110)' }, D.chainLinks(th, 0, 46, { size: 9, t: 1.0 }));
    return g({}, chainL, chainR, torch(doc, th, 0, 44, 0, { t: 0.6, len: 50 }));
  },

  // 52° — O Labirinto (Hermes Trismegisto como guia)
  labirinto(doc, th) {
    const d = labyrinthPath(46, 5.6, 2.6);
    return g(
      {},
      path(d, { fill: 'none', stroke: th.ink, 'stroke-width': 6.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...A.draw(0.6, 1.6) }),
      path(d, { fill: 'none', stroke: th.line, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...A.draw(0.6, 1.6) }),
      g(A.fade(2.2, 0.3), D.runner(doc, th, d, { dash: 0.06, w: 3.4 })),
      circle(0, 0, 4, { fill: th.hi, stroke: th.ink, 'stroke-width': 2, ...A.pop(2.1, 0.4) }),
    );
  },

  // 53° — A Fênix renascendo das chamas
  fenix(doc, th) {
    const fire = D.grad(doc, [[0, '#FFE08A'], [0.5, '#F28C28'], [1, '#B7321F']]);
    const body = 'M0 -24C8 -24 10 -10 9 2C8 14 4 22 0 28C-4 22 -8 14 -9 2C-10 -10 -8 -24 0 -24Z';
    const head = 'M-6 -30C-6 -38 6 -38 7 -31L14 -28L7 -25C5 -21 -6 -22 -6 -30Z';
    return g(
      {},
      D.flame(doc, th, -18, 44, 16, 26, { t: 0.6, offset: 0.3 }),
      D.flame(doc, th, 18, 44, 16, 26, { t: 0.65, offset: 0.6 }),
      D.wing(doc, th, -6, -8, { dir: -1, span: 56, a0: -84, a1: -8, count: 7, width: 9, t: 0.8, colors: [fire, '#FFD36B'] }),
      D.wing(doc, th, 6, -8, { dir: 1, span: 56, a0: -84, a1: -8, count: 7, width: 9, t: 0.8, colors: [fire, '#FFD36B'] }),
      D.fill(th, body, { color: fire, t: 0.9 }),
      D.fill(th, head, { color: '#F7A23B', t: 1.0 }),
      [-24, -8, 8].map((a, i) => g({ transform: `translate(0 -36) rotate(${a})` }, g(A.pop(1.15 + i * 0.05, 0.3), path(D.petalPath(10, 3), { fill: '#FFD36B', stroke: th.ink, 'stroke-width': 2, 'paint-order': 'stroke' })))),
      circle(1.5, -31, 1.6, { fill: th.ink, ...A.fade(1.1) }),
      D.flame(doc, th, 0, 46, 24, 34, { t: 0.7 }),
    );
  },

  // 54° — O Escaldo: a lira dos poetas nórdicos
  escaldo(doc, th) {
    const frame = 'M-14 30C-30 20 -32 -2 -24 -16C-20 -24 -22 -30 -26 -36M14 30C30 20 32 -2 24 -16C20 -24 22 -30 26 -36M-30 -34H30';
    const box = 'M-20 24H20Q22 38 0 40Q-22 38 -20 24Z';
    const strings = [-10, -5, 0, 5, 10].map((x, i) => {
      const pluck = doc.ambient(`pluck-${i}`, `0%,100%{stroke:${th.lineDim}}6%{stroke:${th.hi}}20%{stroke:${th.lineDim}}`, { offset: i * 0.45 });
      return path(`M${x} -32V25`, { stroke: th.lineDim, 'stroke-width': 1.6, ...A.draw(1.0 + i * 0.06, 0.5), ...pluck });
    });
    return g(
      {},
      D.fill(th, box, { color: D.goldFill(doc, th), t: 0.65 }),
      strings,
      D.stroke(th, frame, { w: 4, t: 0.7, dur: 0.9 }),
      [-30, 30].map((x, i) => circle(x, -34, 3.5, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 2, ...A.pop(1.1 + i * 0.05, 0.3) })),
      D.glyph(th, 'ᛋ', 0, 33, 10, { color: th.ink, outline: 0, t: 1.2 }),
    );
  },

  // 55° — O ovo órfico envolvido pela serpente
  orfico(doc, th) {
    const egg = D.eggPath(0, 2, 21, 30);
    const coils = ['M-22 24C-8 32 10 28 23 14', 'M-23 2C-8 10 10 6 23 -8', 'M-19 -18C-6 -12 6 -16 14 -28'];
    return g(
      {},
      D.fill(th, egg, { color: D.grad(doc, [[0, '#FFFDF4'], [0.6, '#EFE0BE'], [1, '#C4A26A']]), t: 0.6, dur: 0.6, outline: 4 }),
      coils.map((d, i) => D.stroke(th, d, { w: 6.5, t: 0.85 + i * 0.15, dur: 0.6, color: th.accent, inkW: 10 })),
      coils.map((d, i) => g(A.fade(1.6, 0.3), D.runner(doc, th, d, { dash: 0.3, w: 2, offset: i * 0.5 }))),
      g({ transform: 'translate(16 -31) rotate(-35)' }, D.fill(th, 'M-6 0C-6 -5 6 -6 8 0C6 5 -6 5 -6 0Z', { color: th.accent, t: 1.3 })),
      path('M23 -37l5 -3M23 -37l6 1', { stroke: '#E0442E', 'stroke-width': 1.4, 'stroke-linecap': 'round', ...A.fade(1.45) }),
    );
  },

  // 56° — Cádmia: 7 tons, 7 cores, 7 vogais (e o ZnO do forno)
  cadmia(doc, th) {
    const v = [0, 1, 2, 3, 4, 5, 6].map((k) => polar(0, 0, 44, -90 + (k * 360) / 7));
    const order = [0, 3, 6, 2, 5, 1, 4];
    const d = poly(order.map((k) => v[k]));
    const colors = ['#E23B3B', '#F28C28', '#F5D33B', '#19B3B0', '#2F6FE0', '#4B3CC9', '#9B4FE0'];
    const zn = glyphCentered('ZnO', 17, 'serif');
    return g(
      {},
      D.stroke(th, d, { w: 2.4, t: 0.6, dur: 1.2 }),
      v.map(([x, y], k) =>
        g({ transform: `translate(${n(x)} ${n(y)})` }, g(A.pop(1.0 + k * 0.06, 0.4), circle(0, 0, 5.5, { fill: colors[k], stroke: th.ink, 'stroke-width': 2.5, 'paint-order': 'stroke', ...doc.ambient(`c7-${k}`, `0%,10%,100%{fill:${colors[k]}}4%{fill:#FFFFFF}`, { offset: (k * 8) / 7 }) }))),
      ),
      circle(0, 0, 15, { fill: th.plate, stroke: th.line, 'stroke-width': 2, ...A.pop(1.2, 0.4) }),
      g(A.fade(1.4), path(zn.d, { transform: `translate(${n(zn.dx)} ${n(zn.dy)})`, fill: th.accent })),
    );
  },

  // 57° — O Mago: tudo deriva de um único Espírito
  mago(doc, th) {
    let rays = '';
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = polar(0, 0, 16, 45 + i * 90);
      const [x1, y1] = polar(0, 0, 42, 45 + i * 90);
      rays += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
    }
    const els = [['🜂', -90], ['🜁', 0], ['🜃', 90], ['🜄', 180]];
    return g(
      {},
      D.stroke(th, rays, { w: 2, t: 0.7, color: th.lineDim }),
      els.map(([ch, a], i) => {
        const [x, y] = polar(0, 0, 33, a);
        return D.glyph(th, ch, x, y, 22, { t: 0.9 + i * 0.1, extra: D.blinkAttrs(doc, th, { offset: i * 2, base: th.line }) });
      }),
      D.stroke(th, 'M11 0A11 11 0 1 1 -11 0A11 11 0 1 1 11 0', { w: 2.6, t: 0.6 }),
      g(D.pulseAttrs(doc, 0, 0, { amount: 1.4 }), circle(0, 0, 3.6, { fill: th.hi, ...A.pop(1.0, 0.4) })),
    );
  },

  // 58° — Brâmane: o OM sobre o lótus
  brahmane(doc, th) {
    return g({}, D.lotus(doc, th, 0, 44, 0.78, { t: 0.6 }), D.glyph(th, 'ॐ', 0, -12, 44, { color: D.goldFill(doc, th), t: 0.9 }));
  },

  // 59° — Ogígia: o barco de Odisseu
  ogigia(doc, th) {
    const hull = 'M-42 8C-30 26 30 26 42 8Z';
    const prow = 'M42 8C48 2 50 -6 46 -10';
    const stern = 'M-42 8C-47 3 -49 -4 -45 -8';
    const sail = 'M-24 -36Q0 -30 24 -36L22 -2Q0 2 -22 -2Z';
    const stripes = [-26, -17, -8].map((y) => `M-23 ${y}Q0 ${y + 4} 23 ${y}`).join('');
    const oars = [-22, -11, 0, 11, 22].map((x) => `M${x} 16L${x - 7} 31`).join('');
    const rock = doc.ambient('rock', '0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}', { dur: 4, origin: [0, 20], ease: 'ease-in-out' });
    return g(
      {},
      g(
        rock,
        D.stroke(th, oars, { w: 2, t: 0.9, color: '#C9A06A' }),
        D.stroke(th, 'M0 10V-42', { w: 3, t: 0.6 }),
        D.fill(th, sail, { color: '#F4EAD6', t: 0.8 }),
        g(A.fade(1.0), path(stripes, { fill: 'none', stroke: '#C63A2D', 'stroke-width': 3.2 })),
        D.fill(th, hull, { color: D.goldFill(doc, th), t: 0.7, anim: 'rise' }),
        D.stroke(th, prow + stern, { w: 3.4, t: 0.9 }),
        circle(-30, 13, 1.8, { fill: th.ink, ...A.fade(1.1) }),
      ),
      D.waves(doc, th, -50, 50, 34, { amp: 3, wave: 18, rows: 2, gap: 7, t: 1.0 }),
    );
  },

  // 60° — Os Três Fogos: corpo, alma e espírito
  tresFogos(doc, th) {
    const bowl = 'M-36 12H36L26 26H-26Z';
    const legs = 'M-20 26L-28 44M20 26L28 44M0 26V44';
    return g(
      {},
      D.stroke(th, legs, { w: 3, t: 0.6 }),
      D.fill(th, bowl, { color: D.goldFill(doc, th), t: 0.65 }),
      D.flame(doc, th, -21, 12, 16, 30, { t: 0.9, offset: 0.25 }),
      D.flame(doc, th, 21, 12, 16, 30, { t: 1.0, offset: 0.6 }),
      D.flame(doc, th, 0, 12, 22, 48, { t: 0.8 }),
    );
  },

  // 61° — O Filósofo Desconhecido (Saint-Martin): o pantáculo
  desconhecido(doc, th) {
    const ring = 'M44 0A44 44 0 1 1 -44 0A44 44 0 1 1 44 0';
    return g(
      {},
      D.stroke(th, ring, { w: 2.4, t: 0.6 }),
      D.stroke(th, tri(0, 0, 40) + tri(0, 0, 40, 90), { w: 2.6, t: 0.8, dur: 1 }),
      D.stroke(th, 'M13 0A13 13 0 1 1 -13 0A13 13 0 1 1 13 0', { w: 2, t: 1.0 }),
      D.stroke(th, 'M0 -9V9M-7 -2H7', { w: 2.6, t: 1.2, color: th.accent }),
      D.runner(doc, th, ring, { dash: 0.15, w: 2.4 }),
    );
  },

  // 62° — Elêusis: o feixe de trigo entre as tochas de Deméter
  eleusis(doc, th) {
    return g(
      {},
      torch(doc, th, -16, 46, -24, { t: 0.6, len: 46 }),
      torch(doc, th, 16, 46, 24, { t: 0.65, len: 46, offset: 0.5 }),
      D.wheatEar(doc, th, -2, 40, 1, { t: 0.8, rot: -16 }),
      D.wheatEar(doc, th, 2, 40, 1, { t: 0.85, rot: 16 }),
      D.wheatEar(doc, th, 0, 42, 1.12, { t: 0.9 }),
    );
  },

  // 63° — Kawi, o poeta: amor (coração) e a pena
  kawi(doc, th) {
    const heart = 'M0 22C-34 2 -30 -24 -14 -26C-5 -27 -1 -20 0 -14C1 -20 5 -27 14 -26C30 -24 34 2 0 22Z';
    const vane = 'M-34 38C-30 20 -4 -10 34 -38C14 -6 -10 22 -34 38Z';
    return g(
      {},
      D.fill(th, vane, { color: '#F4EAD6', t: 0.6 }),
      D.stroke(th, 'M-40 44L32 -36', { w: 1.6, t: 0.7, color: th.gold[2], inkW: 3 }),
      g(D.pulseAttrs(doc, 0, 0, { amount: 1.09 }), D.fill(th, heart, { color: D.grad(doc, [[0, '#FF8FA3'], [0.5, '#E0445E'], [1, '#9E1D38']]), t: 0.85, dur: 0.6 })),
    );
  },

  // 64° — Mitra: o barrete frígio diante do Sol invicto
  mitra(doc, th) {
    const cap = 'M-26 30C-28 6 -18 -20 4 -30C18 -36 30 -28 27 -15C23 -23 14 -22 12 -15C20 -4 26 14 26 30Z';
    return g(
      {},
      g(A.pop(0.6, 0.6), g(D.spinAttrs(doc, 0, 0, 22.5), path(D.raysPath(0, 0, 30, 52, 16, { half: 4, alt: 0.7 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.6, 'paint-order': 'stroke' }))),
      circle(0, 0, 33, { fill: th.plate, stroke: th.line, 'stroke-width': 2, ...A.pop(0.7, 0.5) }),
      D.fill(th, cap, { color: D.grad(doc, [[0, '#F06A4F'], [1, '#9E1D1D']]), t: 0.85 }),
      D.fill(th, 'M-27 24H27V31H-27Z', { color: th.gold[1], t: 1.0 }),
      [[-8, -4], [6, -16], [10, 8]].map(([x, y], i) => D.twinkleStar(doc, th, x, y, 4, { points: 5, t: 1.1 + i * 0.08, offset: i * 0.6, inner: 0.45 })),
    );
  },

  // 65° — Ovo alado; Fé, Esperança e Caridade
  ovoAlado(doc, th) {
    return wingedBase(doc, th, [
      D.glyph(th, '✝', -46, 34, 15, { t: 1.3, color: th.accent }),
      D.glyph(th, '⚓', 0, 42, 15, { t: 1.4, color: th.accent }),
      D.glyph(th, '♥', 46, 34, 15, { t: 1.5, color: '#E0445E' }),
    ]);
  },

  // 66° — Ovo alado com círculo e três estrelas
  ovoCirculo(doc, th) {
    return g(
      {},
      D.stroke(th, 'M0 -36A36 36 0 1 1 -0.01 -36', { w: 2, t: 0.55, dur: 1, color: th.accent }),
      wingedBase(doc, th),
      [-16, 0, 16].map((x, i) => D.twinkleStar(doc, th, x, -42 + (i === 1 ? -4 : 0), 6, { points: 5, t: 1.2 + i * 0.08, offset: i * 0.66, inner: 0.45 })),
    );
  },

  // 67° — Ovo alado com o triângulo radiante e a letra G
  ovoDelta(doc, th) {
    const G = glyphCentered('G', 13, 'label');
    return wingedBase(doc, th, [
      g({ transform: 'translate(0 6)' }, g(A.pop(1.2, 0.5), g(D.spinAttrs(doc, 0, 0, 30), path(D.raysPath(0, 0, 15, 22, 12, { half: 2 }), { fill: th.gold[1] })), path(tri(0, 0, 15), { fill: th.plate, stroke: th.line, 'stroke-width': 2 }), path(G.d, { transform: `translate(${n(G.dx)} ${n(G.dy + 2)})`, fill: th.hi }))),
    ]);
  },
};

for (const k of ['ovoAlado', 'ovoCirculo', 'ovoDelta']) EMBLEMS_B[k].spec = { backdrop: 'wide', w: 290, h: 104 };
EMBLEMS_B.fenix.spec = { backdrop: 'circle', r: 60 };
