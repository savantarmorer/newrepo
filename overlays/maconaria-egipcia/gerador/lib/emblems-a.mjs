// Emblemas dos graus 34°–50°. Cada um desenha em torno de (0,0) — o centro
// do brasão — e o chamador posiciona com translate(cx, cy).
import { A, circle, g, n, path, poly, polar, star, arc } from './svg.mjs';
import * as D from './draw.mjs';

export const tri = (cx, cy, R, rot = -90) => poly([0, 120, 240].map((a) => polar(cx, cy, R, rot + a)));

/** Chave apontando para +x, centrada na origem. */
export function keyShape(th, L = 70, { color } = {}) {
  const c = color ?? th.line;
  const bow = `M${-L / 2 + 9} -9a9 9 0 1 0 0.01 0Z`;
  const shaft = `M${-L / 2 + 17} 0H${L / 2}`;
  const bit = `M${L / 2 - 2} 0V9H${L / 2 - 7}V5H${L / 2 - 11}V9H${L / 2 - 15}V0`;
  return g(
    {},
    path(bow + shaft + bit, { fill: 'none', stroke: th.ink, 'stroke-width': 8.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
    path(bow, { fill: 'none', stroke: c, 'stroke-width': 4 }),
    path(shaft + bit, { fill: 'none', stroke: c, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
  );
}

function axe(th) {
  const haft = 'M-2.4 -50L2.4 -50L3 48L-3 48Z';
  const head = 'M2 -46C9 -48 15 -53 20 -60C25 -48 27 -31 22 -19C18 -26 11 -31 2 -33Z';
  return g(
    {},
    path(haft, { fill: th.wood ?? '#8A5A2B', stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke' }),
    path(head, { fill: th.steel ?? '#C9D3DC', stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }),
    path('M20 -58C24 -47 25.5 -33 21.5 -22', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
  );
}

export const EMBLEMS_A = {
  // 34° — Valknut de Odin sobre dois machados cruzados
  valknut(doc, th) {
    const tris = [90, 210, 330].map((a) => {
      const [x, y] = polar(0, 5, 10, a);
      return tri(x, y, 28);
    });
    return g(
      {},
      [-38, 38].map((rot, i) => g({ transform: `translate(0 6) rotate(${rot}) scale(0.84)` }, g(A.spinIn(0.55 + i * 0.08, 0, 0, 0.7), axe(th)))),
      tris.map((d, i) => D.stroke(th, d, { w: 4, t: 0.85 + i * 0.12, dur: 0.8 })),
      tris.map((d, i) => D.runner(doc, th, d, { offset: i * (8 / 3), dash: 0.16, w: 2.2 })),
    );
  },

  // 35° — Templo como imagem do Universo: fachada entre o Sol e a Lua
  templo(doc, th) {
    const gold = D.goldFill(doc, th);
    const steps = [0, 1, 2].map((i) => D.fill(th, `M${-58 + i * 7} ${40 - i * 6}h${116 - i * 14}v6h${-(116 - i * 14)}Z`, { color: gold, t: 0.6 + i * 0.06, anim: 'fade' }));
    const cols = [-42, -14, 14, 42].map((x, i) => D.column(th, x, -10, 28, 9, { t: 0.75 + i * 0.07, doc }));
    const ent = `M-56 -18h112v8h-112Z`;
    const ped = poly([[-62, -18], [0, -44], [62, -18]]);
    const sun = g({ transform: 'translate(-90 -6)' }, g(A.pop(1.2, 0.5), g(D.spinAttrs(doc, 0, 0, 30), path(D.raysPath(0, 0, 11, 19, 12, { half: 3 }), { fill: th.line, stroke: th.ink, 'stroke-width': 2.5, 'paint-order': 'stroke' })), circle(0, 0, 10, { fill: gold, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' })));
    const moon = D.fill(th, D.crescentPath(90, -6, 15, { rot: 180, offset: 0.45 }), { color: '#E9EEF6', t: 1.25 });
    return g(
      {},
      steps,
      cols,
      D.fill(th, ent, { color: gold, t: 1.0, anim: 'fade' }),
      D.stroke(th, ped + 'M-50 -22L0 -40L50 -22', { w: 2.6, t: 1.0, dur: 0.6 }),
      D.twinkleStar(doc, th, 0, -27, 7, { points: 5, t: 1.3, inner: 0.45 }),
      sun,
      moon,
    );
  },

  // 36° — Geometria e astronomia caldaica: estrela de 8 pontas e círculo graduado
  negociante(doc, th) {
    let ticks = '';
    for (let i = 0; i < 48; i++) {
      const [x0, y0] = polar(0, 0, 44, i * 7.5);
      const [x1, y1] = polar(0, 0, i % 4 === 0 ? 37 : 40.5, i * 7.5);
      ticks += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
    }
    const big = star(0, 0, 8, 34, 13, -90);
    const small = star(0, 0, 8, 25, 11, -67.5);
    return g(
      {},
      D.stroke(th, `M44 0A44 44 0 1 1 -44 0A44 44 0 1 1 44 0`, { w: 2, t: 0.6, dur: 0.9 }),
      g(D.spinAttrs(doc, 0, 0, 30), g(A.fade(0.9, 0.5), path(ticks, { stroke: th.lineDim, 'stroke-width': 1.6 }))),
      D.fill(th, small, { color: th.gold[2], t: 0.95 }),
      D.fill(th, big, { color: D.goldFill(doc, th), t: 0.85 }),
      circle(0, 0, 7, { fill: th.plate, stroke: th.line, 'stroke-width': 2, ...A.pop(1.1, 0.4) }),
      D.runner(doc, th, `M44 0A44 44 0 1 1 -44 0A44 44 0 1 1 44 0`, { dash: 0.1, w: 2.4 }),
    );
  },

  // 37° — Tradições iniciáticas: a lâmpada da sabedoria e as chaves
  shota(doc, th) {
    const gold = D.goldFill(doc, th);
    const body = 'M-30 18C-30 6 -14 2 2 2C20 2 32 6 44 8C44 12 36 16 24 20C14 30 -22 32 -30 18Z';
    const handle = 'M-28 14C-44 10 -46 -4 -34 -6C-28 -7 -26 -1 -30 4';
    return g(
      {},
      g({ transform: 'translate(0 -16) rotate(-28)' }, g(A.pop(0.6, 0.5), keyShape(th, 74))),
      g({ transform: 'translate(0 -16) rotate(28) scale(-1 1)' }, g(A.pop(0.7, 0.5), keyShape(th, 74))),
      D.stroke(th, handle, { w: 3.2, t: 0.85 }),
      D.fill(th, body, { color: gold, t: 0.8 }),
      path('M-14 12h20', { stroke: th.gold[2], 'stroke-width': 2.4, 'stroke-linecap': 'round', ...A.fade(1.1) }),
      D.flame(doc, th, 42, 6, 11, 26, { t: 1.1 }),
    );
  },

  // 38° — A Águia Vermelha: luz contra trevas
  aguia(doc, th) {
    const red = D.grad(doc, [[0, '#F06A4F'], [0.6, '#C7302A'], [1, '#7E1717']]);
    const body = 'M0 -24C9 -24 12 -10 11 4C10 18 6 28 0 34C-6 28 -10 18 -11 4C-12 -10 -9 -24 0 -24Z';
    const tail = poly([[-10, 26], [0, 46], [10, 26]]);
    const head = 'M-10 -30C-10 -43 7 -45 11 -35L22 -30L11 -25C7 -20 -10 -20 -10 -30Z';
    const sun = g({ transform: 'translate(-92 -12)' }, g(A.pop(1.3, 0.5), g(D.spinAttrs(doc, 0, 0, 30), path(D.raysPath(0, 0, 10, 18, 12, { half: 3 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.5, 'paint-order': 'stroke' })), circle(0, 0, 9, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' })));
    const moon = D.fill(th, D.crescentPath(92, -12, 14, { rot: 180 }), { color: '#8E86A8', t: 1.35 });
    return g(
      {},
      D.wing(doc, th, -8, -8, { dir: -1, span: 58, a0: -58, a1: 26, count: 7, width: 9, t: 0.7, colors: [red, '#E6553F'], shrink: 0.35 }),
      D.wing(doc, th, 8, -8, { dir: 1, span: 58, a0: -58, a1: 26, count: 7, width: 9, t: 0.7, colors: [red, '#E6553F'], shrink: 0.35 }),
      D.fill(th, tail, { color: '#A92424', t: 0.9 }),
      D.fill(th, body, { color: red, t: 0.85 }),
      D.fill(th, head, { color: '#E9573F', t: 0.95 }),
      path('M11 -35L22 -30L11 -27Z', { fill: th.gold[1], ...A.fade(1.05) }),
      circle(2, -33, 2.2, { fill: th.ink, ...A.fade(1.05) }),
      sun,
      moon,
    );
  },

  // 39° — Os Eões gnósticos: 30 emanações em órbitas ao redor do Pai
  eoes(doc, th) {
    const ring = (r, count, dir, t) => {
      const dots = [];
      for (let i = 0; i < count; i++) {
        const [x, y] = polar(0, 0, r, (i * 360) / count);
        dots.push(circle(x, y, 3.2, { fill: i % 2 ? th.accent : th.hi, stroke: th.ink, 'stroke-width': 2 }));
      }
      return g(
        {},
        circle(0, 0, r, { fill: 'none', stroke: th.lineDim, 'stroke-width': 1.2, ...A.draw(t, 0.8) }),
        g(D.spinAttrs(doc, 0, 0, (dir * 360) / count), g(A.pop(t + 0.3, 0.6), dots)),
      );
    };
    return g(
      {},
      ring(42, 12, 1, 0.6),
      ring(30, 10, -1, 0.75),
      ring(18, 8, 1, 0.9),
      g(D.pulseAttrs(doc, 0, 0, { amount: 1.25 }), circle(0, 0, 7, { fill: th.hi, stroke: th.ink, 'stroke-width': 2.5, ...A.pop(1.2, 0.5) })),
    );
  },

  // 40° — Deus como Alfa e Ômega
  alfaomega(doc, th) {
    const gold = D.goldFill(doc, th);
    return g(
      {},
      D.glyph(th, 'Α', -21, 12, 46, { color: gold, t: 0.75 }),
      D.glyph(th, 'Ω', 21, 12, 46, { color: gold, t: 0.9 }),
      D.stroke(th, 'M10 -30A10 10 0 1 1 -10 -30A10 10 0 1 1 10 -30', { w: 2.6, t: 1.0 }),
      circle(0, -30, 3, { fill: th.hi, ...A.pop(1.3, 0.4) }),
      D.runner(doc, th, 'M10 -30A10 10 0 1 1 -10 -30A10 10 0 1 1 10 -30', { dash: 0.3, w: 2 }),
    );
  },

  // 41° — O Arco de Sete Cores (transição estelar → solar)
  arco(doc, th) {
    const colors = ['#E23B3B', '#F28C28', '#F5D33B', '#19B3B0', '#2F6FE0', '#4B3CC9', '#9B4FE0'];
    const bands = colors.map((c, i) => {
      const r = 66 - i * 6.2;
      return path(arc(0, 30, r, 180, 360), { fill: 'none', stroke: c, 'stroke-width': 6.4, ...A.draw(0.6 + i * 0.07, 0.8) });
    });
    return g(
      {},
      path(arc(0, 30, 69.5, 180, 360) + arc(0, 30, 26.5, 180, 360), { fill: 'none', stroke: th.ink, 'stroke-width': 3.5, ...A.draw(0.55, 0.9) }),
      bands,
      g({ transform: 'translate(0 30)' }, g(A.pop(1.2, 0.5), g(D.spinAttrs(doc, 0, 0, 30), path(D.raysPath(0, 0, 12, 21, 12, { half: 3 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' })), circle(0, 0, 11, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }))),
    );
  },

  // 42° — Príncipe da Luz: sol radiante e a balança da justiça
  principeLuz(doc, th) {
    return g(
      {},
      g(A.pop(0.6, 0.6), g(D.spinAttrs(doc, 0, 0, 22.5), path(D.raysPath(0, 0, 22, 50, 16, { half: 5, alt: 0.62 }), { fill: D.goldFill(doc, th), stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }))),
      circle(0, 0, 23, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 3.5, 'paint-order': 'stroke', ...A.pop(0.75, 0.5) }),
      D.glyph(th, '⚖', 0, 1, 30, { color: th.ink, outline: 0, t: 1.0 }),
    );
  },

  // 43° — Filósofo Hermético: Boaz e Jachin e as 12 casas do Sol
  hermetico(doc, th) {
    const gold = D.goldFill(doc, th);
    const houses = [];
    for (let i = 0; i < 12; i++) {
      const a0 = -90 + i * 30 + 2;
      const a1 = a0 + 26;
      const [x0, y0] = polar(0, 0, 31, a0);
      const [x1, y1] = polar(0, 0, 31, a1);
      const [x2, y2] = polar(0, 0, 21, a1);
      const [x3, y3] = polar(0, 0, 21, a0);
      const d = `M${n(x0)} ${n(y0)}A31 31 0 0 1 ${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}A21 21 0 0 0 ${n(x3)} ${n(y3)}Z`;
      houses.push(path(d, { fill: th.lineDim, stroke: th.ink, 'stroke-width': 1.5, ...D.blinkAttrs(doc, th, { offset: (i * 8) / 12, base: th.lineDim, hi: th.hi }) }));
    }
    return g(
      {},
      D.column(th, -78, -30, 38, 11, { t: 0.6, globe: true, doc }),
      D.column(th, 78, -30, 38, 11, { t: 0.7, globe: true, doc }),
      D.glyph(th, 'B', -78, 8, 13, { color: th.ink, outline: 0, t: 1.2 }),
      D.glyph(th, 'J', 78, 8, 13, { color: th.ink, outline: 0, t: 1.25 }),
      g(A.pop(0.85, 0.6), houses),
      circle(0, 0, 15, { fill: gold, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', ...A.pop(1.0, 0.5) }),
      circle(0, 0, 3.5, { fill: th.ink, ...A.pop(1.15, 0.4) }),
    );
  },

  // 44° — Príncipe do Zodíaco: roda zodiacal e a clava de Hércules
  zodiaco(doc, th) {
    const signs = [...'♈♉♊♋♌♍♎♏♐♑♒♓'];
    let div = '';
    for (let i = 0; i < 12; i++) {
      const [x0, y0] = polar(0, 0, 33, -105 + i * 30);
      const [x1, y1] = polar(0, 0, 51, -105 + i * 30);
      div += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
    }
    const club = 'M-4 34L4 34L9 -22C11 -30 6 -38 0 -38C-6 -38 -11 -30 -9 -22Z';
    const knobs = [[-9, -24], [9, -14], [-8, -6], [8, 4]].map(([x, y]) => circle(x, y, 2.8, { fill: '#7B4F27', stroke: th.ink, 'stroke-width': 2 }));
    return g(
      {},
      D.stroke(th, 'M51 0A51 51 0 1 1 -51 0A51 51 0 1 1 51 0M33 0A33 33 0 1 1 -33 0A33 33 0 1 1 33 0', { w: 2, t: 0.6 }),
      g(A.fade(0.8), path(div, { stroke: th.lineDim, 'stroke-width': 1.4 })),
      signs.map((s, i) => {
        const [x, y] = polar(0, 0, 42, -90 + i * 30);
        return D.glyph(th, s, x, y, 13, { color: th.glyph, outline: 2.5, t: 0.9 + i * 0.04, extra: D.blinkAttrs(doc, th, { offset: (i * 8) / 12 }) });
      }),
      g({ transform: 'rotate(35)' }, D.fill(th, club, { color: '#A8743E', t: 1.2 }), g(A.fade(1.3), knobs)),
    );
  },

  // 45° — Das trevas à luz; o número três
  misterios(doc, th) {
    return g(
      {},
      D.fill(th, tri(0, 8, 46), { color: '#2E2440', t: 0.6 }),
      D.fill(th, tri(0, 8, 31), { color: th.gold[2], t: 0.8 }),
      g(D.pulseAttrs(doc, 0, 8, { amount: 1.12 }), D.fill(th, tri(0, 8, 16), { color: th.hi, t: 1.0 })),
      D.stroke(th, tri(0, 8, 46), { w: 2.4, t: 0.7 }),
      [[-50, 44], [50, 44], [0, -50]].map(([x, y], i) => D.twinkleStar(doc, th, x * 0.92, y * 0.92, 5, { t: 1.2 + i * 0.1, offset: i * 0.66 })),
    );
  },

  // 46° — O Leão Verde (vitríolo) devorando o Sol
  leao(doc, th) {
    const mane = star(0, -2, 18, 47, 35, -90);
    const verd = D.grad(doc, [[0, '#5FD3D9'], [0.6, '#2AA2B6'], [1, '#17697E']]);
    const face = D.goldFill(doc, th);
    const eye = (s) => `M${s * 4} -9C${s * 8} -13 ${s * 15} -13 ${s * 18} -9C${s * 15} -6 ${s * 8} -6 ${s * 4} -9Z`;
    return g(
      {},
      g(D.spinAttrs(doc, 0, -2, 20), D.fill(th, mane, { color: verd, t: 0.6, dur: 0.6 })),
      D.fill(th, 'M-24 -16C-30 -36 -14 -40 -10 -28M24 -16C30 -36 14 -40 10 -28', { color: verd, t: 0.7 }),
      D.fill(th, 'M0 -30C18 -30 27 -16 26 0C25 16 14 26 0 26C-14 26 -25 16 -26 0C-27 -16 -18 -30 0 -30Z', { color: face, t: 0.75 }),
      g(A.fade(1.0), path(eye(1) + eye(-1), { fill: th.ink }), path('M-6 2H6L0 9Z', { fill: '#5A3418', stroke: th.ink, 'stroke-width': 1.5 })),
      g({ transform: 'translate(0 20)' }, g(A.pop(1.2, 0.5), g(D.spinAttrs(doc, 0, 0, 45), path(D.raysPath(0, 0, 7, 13, 8, { half: 2.5 }), { fill: '#FFB338', stroke: th.ink, 'stroke-width': 2, 'paint-order': 'stroke' })), circle(0, 0, 7, { fill: '#F2602A', stroke: th.ink, 'stroke-width': 2.5, 'paint-order': 'stroke' }))),
    );
  },

  // 47° — Sete Estrelas: Ursa Maior, Saptarshi e Plêiades
  seteEstrelas(doc, th) {
    const pts = [[-46, -10], [-42, 16], [-14, 22], [-10, -2], [10, -10], [27, -16], [47, -6]];
    const lines = poly([pts[3], pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6]], false);
    const pleiades = [[18, 22], [24, 19], [27, 25], [21, 28], [30, 21], [25, 31], [16, 29]];
    return g(
      {},
      D.stroke(th, lines, { w: 1.6, t: 0.7, dur: 1.1, color: th.lineDim, inkW: 4 }),
      pts.map(([x, y], i) => D.twinkleStar(doc, th, x, y, i === 0 || i === 6 ? 8 : 6.5, { t: 0.8 + i * 0.08, offset: (i * 2) / 7 })),
      pleiades.map(([x, y], i) => circle(x, y + 2, 1.9, { fill: th.accent, ...A.pop(1.3 + i * 0.03, 0.3) })),
    );
  },

  // 48° — O Monte Sagrado e o altar do sacrifício
  monte(doc, th) {
    const back = poly([[-50, 40], [-22, -4], [6, 40]]);
    const main = poly([[-34, 40], [8, -20], [50, 40]]);
    const snow = poly([[-3, -5], [8, -20], [19, -5], [12, -9], [8, -4], [3, -9]]);
    return g(
      {},
      D.fill(th, back, { color: '#6E5A45', t: 0.6, anim: 'rise' }),
      D.fill(th, main, { color: D.goldFill(doc, th), t: 0.7, anim: 'rise' }),
      D.fill(th, snow, { color: '#FFF7E3', t: 0.9, outline: 0 }),
      D.fill(th, 'M-3 -22h22v-8h-22Z', { color: th.gold[0], t: 1.0 }),
      D.flame(doc, th, 8, -30, 15, 30, { t: 1.15 }),
    );
  },

  // 49° — As Pirâmides: 21 degraus vermelhos até o pórtico de mármore
  piramide(doc, th) {
    const face = poly([[-52, 40], [0, -40], [52, 40]]);
    const shade = poly([[0, -40], [52, 40], [10, 40]]);
    const steps = [];
    for (let i = 0; i < 21; i++) {
      const y = 38 - i * 2.4;
      const w = 18 - i * 0.45;
      steps.push(path(`M${n(-w / 2)} ${n(y)}h${n(w)}`, { stroke: '#D23A2A', 'stroke-width': 1.5, ...A.fade(0.95 + i * 0.03, 0.15) }));
    }
    const portico = g(
      A.pop(1.65, 0.4),
      path('M-9 -12h18v3h-18Z', { fill: '#F4F1EA', stroke: th.ink, 'stroke-width': 1.5 }),
      path('M-7 -9v10M7 -9v10', { stroke: '#F4F1EA', 'stroke-width': 2.4 }),
    );
    return g(
      {},
      g({ transform: 'translate(0 -40)' }, g(A.pop(0.55, 0.5), g(D.spinAttrs(doc, 0, 0, 22.5), path(D.raysPath(0, 0, 10, 24, 16, { half: 2.5, alt: 0.55 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2, 'paint-order': 'stroke' })))),
      D.fill(th, face, { color: D.goldFill(doc, th), t: 0.65, anim: 'rise' }),
      D.fill(th, shade, { color: th.gold[2], t: 0.7, anim: 'fade', outline: 0 }),
      steps,
      portico,
    );
  },

  // 50° — Samotrácia: os Cabiros, protetores dos navegantes
  samotracia(doc, th) {
    const anchor =
      'M0 -26V34' +
      'M-16 -14H16' +
      'M-30 12C-28 28 -14 34 0 34C14 34 28 28 30 12';
    return g(
      {},
      D.stroke(th, 'M6 -32A6 6 0 1 1 -6 -32A6 6 0 1 1 6 -32', { w: 3.4, t: 0.6 }),
      D.stroke(th, anchor, { w: 4.2, t: 0.7, dur: 1.0 }),
      D.fill(th, poly([[-36, 8], [-26, 10], [-31, 20]]), { t: 1.3 }),
      D.fill(th, poly([[36, 8], [26, 10], [31, 20]]), { t: 1.35 }),
      D.twinkleStar(doc, th, -32, -30, 9, { points: 8, inner: 0.45, t: 1.1 }),
      D.twinkleStar(doc, th, 32, -30, 9, { points: 8, inner: 0.45, t: 1.2, offset: 1 }),
    );
  },
};

for (const k of ['templo', 'aguia', 'hermetico', 'arco']) EMBLEMS_A[k].spec = { backdrop: 'wide', w: k === 'arco' ? 250 : 236, h: 108 };
EMBLEMS_A.zodiaco.spec = { backdrop: 'circle', r: 62 };
