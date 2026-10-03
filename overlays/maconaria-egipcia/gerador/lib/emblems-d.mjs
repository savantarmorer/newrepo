// Emblemas dos graus 87°–100° (Arcana Arcanorum e graus administrativos).
import { glyphCentered } from './fonts.mjs';
import { A, circle, g, n, path, poly, polar, star } from './svg.mjs';
import * as D from './draw.mjs';
import { keyShape } from './emblems-a.mjs';

const ringD = (r, cx = 0, cy = 0) => `M${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}`;

/** Estrelas em arco (contagem de membros/oficiais dos graus administrativos). */
function starArc(doc, th, count, { cx = 0, cy = 8, r = 46, from = -150, to = -30, size = 4.6, t = 1.2 } = {}) {
  return Array.from({ length: count }, (_, k) => {
    const a = count === 1 ? (from + to) / 2 : from + ((to - from) * k) / (count - 1);
    const [x, y] = polar(cx, cy, r, a);
    return D.twinkleStar(doc, th, x, y, size, { t: t + k * 0.05, offset: (k * 0.29) % 2, points: 5, inner: 0.45, color: th.gold[0] });
  });
}

function crown(doc, th, cx, cy, s = 1, { t = 0.8, arches = false } = {}) {
  const k = (v) => n(v * s);
  const band = `M${k(-30)} ${k(8)}H${k(30)}V${k(22)}H${k(-30)}Z`;
  const spikes = poly([[-30, 8], [-30, -12], [-15, 0], [0, -20], [15, 0], [30, -12], [30, 8]].map(([x, y]) => [x * s, y * s]));
  const balls = [[-30, -14], [0, -23], [30, -14]].map(([x, y]) => circle(x * s, y * s, 3.6 * s, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 2, 'paint-order': 'stroke' }));
  const jewels = [-18, 0, 18].map((x, i) => circle(x * s, 15 * s, 3.2 * s, { fill: ['#C63A2D', '#2F6FE0', '#C63A2D'][i] }));
  const arch = arches ? D.stroke(th, `M${k(-28)} ${k(4)}C${k(-26)} ${k(-34)} ${k(26)} ${k(-34)} ${k(28)} ${k(4)}M0 ${k(4)}V${k(-30)}`, { w: 2.6 * s, t: t + 0.2 }) : '';
  return g(
    { transform: `translate(${n(cx)} ${n(cy)})` },
    arch,
    D.fill(th, spikes, { color: D.goldFill(doc, th), t }),
    D.fill(th, band, { color: D.goldFill(doc, th), t: t + 0.05 }),
    g(A.pop(t + 0.2, 0.4), balls, jewels),
  );
}

function globe(doc, th, cx, cy, r, { t = 0.7 } = {}) {
  const merid = `M${n(cx)} ${n(cy - r)}A${n(r * 0.45)} ${n(r)} 0 1 0 ${n(cx)} ${n(cy + r)}A${n(r * 0.45)} ${n(r)} 0 1 0 ${n(cx)} ${n(cy - r)}M${n(cx)} ${n(cy - r)}V${n(cy + r)}M${n(cx - r)} ${n(cy)}H${n(cx + r)}`;
  const lat = `M${n(cx - r * 0.87)} ${n(cy - r * 0.5)}H${n(cx + r * 0.87)}M${n(cx - r * 0.87)} ${n(cy + r * 0.5)}H${n(cx + r * 0.87)}`;
  return g(
    {},
    D.fill(th, ringD(r, cx, cy), { color: D.grad(doc, [[0, '#4D7FD6'], [1, '#1B3470']]), t }),
    D.stroke(th, merid + lat, { w: 1.6, t: t + 0.2, color: th.gold[0], inkW: 3 }),
  );
}

export const EMBLEMS_D = {
  // 87° — Nigredo: o Sol negro
  nigredo(doc, th) {
    const sat = glyphCentered('♄', 24);
    return g(
      {},
      g(A.pop(0.6, 0.6), g(D.spinAttrs(doc, 0, 0, 15), path(D.raysPath(0, 0, 25, 50, 24, { half: 3.2, alt: 0.55 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' }))),
      circle(0, 0, 26, { fill: '#000000', stroke: th.line, 'stroke-width': 2.6, ...A.pop(0.75, 0.5) }),
      circle(0, 0, 20, { fill: 'none', stroke: th.lineDim, 'stroke-width': 1, ...A.draw(0.9, 0.6) }),
      g(A.fade(1.1), path(sat.d, { transform: `translate(${n(sat.dx)} ${n(sat.dy)})`, fill: th.glyph })),
    );
  },

  // 88° — Albedo: a Lua branca e o pentagrama do Microcosmo; raios (a terra treme)
  albedo(doc, th) {
    const pent = poly([0, 2, 4, 1, 3].map((k) => polar(0, 0, 25, -90 + k * 72)));
    const bolt = 'M2 -10L-4 1H1L-2 10L5 -2H0Z';
    return g(
      {},
      D.stroke(th, ringD(40), { w: 1.6, t: 0.6, color: th.lineDim, inkW: 3.5 }),
      [45, 135, 225, 315].map((a, i) => {
        const [x, y] = polar(0, 0, 46, a);
        return g({ transform: `translate(${n(x)} ${n(y)}) rotate(${a + 90})` }, g(A.pop(1.2 + i * 0.06, 0.4), path(bolt, { fill: '#FFE08A', stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke', ...doc.ambient('zap', '0%,100%{fill:#FFE08A}10%{fill:#FFFFFF}20%{fill:#FFE08A}', { dur: 2, offset: i * 0.5 }) })));
      }),
      D.fill(th, ringD(31), { color: D.grad(doc, [[0, '#FFFFFF'], [1, '#D9DCE2']]), t: 0.7, dur: 0.6 }),
      D.stroke(th, pent, { w: 2.4, t: 0.95, dur: 0.9, color: '#B8901F', inkW: 4.5 }),
      g(A.fade(1.9, 0.3), D.runner(doc, th, pent, { dash: 0.1, w: 2.4, color: '#FFFFFF' })),
    );
  },

  // 89° — Rubedo: a Cidade Mística sob o Sol vermelho
  rubedo(doc, th) {
    const red = D.grad(doc, [[0, '#F06A4F'], [0.6, '#B8231F'], [1, '#6E1010']]);
    const towers = [[-34, 18], [-17, 26], [0, 36], [17, 26], [34, 18]];
    const wall = 'M-46 22H46V44H-46Z';
    const gate = 'M-7 44V34A7 7 0 0 1 7 34V44Z';
    return g(
      {},
      g({ transform: 'translate(0 -10)' }, g(A.pop(0.6, 0.6), g(D.spinAttrs(doc, 0, 0, 22.5), path(D.raysPath(0, 0, 26, 46, 16, { half: 4, alt: 0.6 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.4, 'paint-order': 'stroke' })), circle(0, 0, 26, { fill: red, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }))),
      towers.map(([x, hgt], i) => {
        const w = i === 2 ? 14 : 11;
        const body = `M${x - w / 2} 22V${22 - hgt}H${x + w / 2}V22Z`;
        const roof = i === 2 ? `M${x - w / 2 - 2} ${22 - hgt}A${w / 2 + 2} ${w / 2 + 2} 0 0 1 ${x + w / 2 + 2} ${22 - hgt}Z` : poly([[x - w / 2 - 2, 22 - hgt], [x, 22 - hgt - 12], [x + w / 2 + 2, 22 - hgt]]);
        return g(A.rise(0.8 + i * 0.07, 0.5), path(body, { fill: '#2A0B0B', stroke: th.line, 'stroke-width': 2 }), path(roof, { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2, 'paint-order': 'stroke' }), path(`M${x - 1.5} ${22 - hgt + 8}h3v6h-3Z`, { fill: '#FFD36B' }));
      }),
      D.fill(th, wall, { color: red, t: 0.75, anim: 'rise' }),
      path('M-46 22h6v-5h6v5h6v-5h6v5h6v-5h6v5h6v-5h6v5h6v-5h6v5h6v-5h6v5h6v-5h4', { fill: 'none', stroke: th.line, 'stroke-width': 1.8, ...A.draw(1.0, 0.6) }),
      D.fill(th, gate, { color: '#1A0505', t: 1.0, outline: 0 }),
      path('M0 -40V-50M-4 -46H4', { stroke: th.gold[0], 'stroke-width': 2, ...A.fade(1.3) }),
    );
  },

  // 90° — Auredo: a Pedra Filosofal (círculo, quadrado, triângulo, círculo)
  auredo(doc, th) {
    const q = 31.1;
    const incR = 19.22;
    const incY = q - incR;
    return g(
      {},
      g(A.pop(0.6, 0.6), g(D.spinAttrs(doc, 0, 0, 15), path(D.raysPath(0, 0, 46, 58, 24, { half: 3, alt: 0.6 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke' }))),
      D.stroke(th, ringD(44), { w: 2.6, t: 0.7 }),
      D.stroke(th, `M${-q} ${-q}H${q}V${q}H${-q}Z`, { w: 2.4, t: 0.9, cap: 'square' }),
      D.stroke(th, `M${-q} ${q}L0 ${-q}L${q} ${q}`, { w: 2.4, t: 1.1 }),
      g(D.pulseAttrs(doc, 0, incY, { amount: 1.1 }), D.fill(th, ringD(incR, 0, incY), { color: D.grad(doc, [[0, '#FFFDF0'], [0.6, '#F7CF58'], [1, '#C08A1F']]), t: 1.3, dur: 0.6 })),
      circle(0, incY, 3, { fill: '#8E1B1B', ...A.pop(1.5, 0.3) }),
      g(A.fade(1.9, 0.3), D.runner(doc, th, ringD(44), { dash: 0.12, w: 3 })),
    );
  },

  // 91° — Grande Defensor: escudo com 9 estrelas (Tribunal de 9)
  defensor(doc, th) {
    const shield = 'M-30 -36H30V-2C30 20 14 34 0 44C-14 34 -30 20 -30 -2Z';
    const stars = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) stars.push([(c - 1) * 15, -22 + r * 15]);
    return g(
      {},
      D.fill(th, shield, { color: D.grad(doc, [[0, '#B3203D'], [1, '#5E0F21']]), t: 0.6 }),
      D.stroke(th, shield, { w: 2.6, t: 0.65 }),
      stars.map(([x, y], i) => D.twinkleStar(doc, th, x, y, 5, { t: 0.9 + i * 0.05, points: 5, inner: 0.45, offset: (i * 0.23) % 2, color: th.gold[0] })),
    );
  },

  // 92° — Grande Catequista: o livro litúrgico e 7 estrelas
  catequista(doc, th) {
    const book = 'M-40 4Q-20 -6 0 4Q20 -6 40 4V36Q20 26 0 36Q-20 26 -40 36Z';
    const lines = [10, 16, 22, 28].map((y) => `M-32 ${y - 2}Q-18 ${y - 9} -6 ${y - 2}M6 ${y - 2}Q18 ${y - 9} 32 ${y - 2}`).join('');
    return g(
      {},
      D.fill(th, book, { color: '#F4EAD6', t: 0.6, anim: 'rise' }),
      D.stroke(th, 'M0 4V36', { w: 1.6, t: 0.8, color: th.gold[2], inkW: 3 }),
      g(A.fade(0.9), path(lines, { fill: 'none', stroke: '#8E7A55', 'stroke-width': 1.3 })),
      starArc(doc, th, 7, { cy: 14, r: 44, from: -160, to: -20 }),
    );
  },

  // 93° — Regulador Geral: a balança e 9 estrelas
  regulador(doc, th) {
    const tilt = doc.ambient('tilt', '0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}', { dur: 4, origin: [0, -16], ease: 'ease-in-out' });
    const pan = (x) => `M${x - 13} 8A13 9 0 0 0 ${x + 13} 8Z`;
    return g(
      {},
      D.stroke(th, 'M0 -18V34M-16 36H16', { w: 3.4, t: 0.6 }),
      g(
        tilt,
        D.stroke(th, 'M-34 -16H34', { w: 3.2, t: 0.75 }),
        D.stroke(th, 'M-34 -16L-44 8M-34 -16L-24 8M34 -16L24 8M34 -16L44 8', { w: 1.4, t: 0.9, inkW: 3 }),
        D.fill(th, pan(-34) + pan(34), { color: D.goldFill(doc, th), t: 1.0 }),
      ),
      circle(0, -18, 4, { fill: th.gold[0], stroke: th.ink, 'stroke-width': 2, ...A.pop(0.9, 0.3) }),
      starArc(doc, th, 9, { cy: 6, r: 50, from: -150, to: -30, size: 4 }),
    );
  },

  // 94° — Príncipe de Mênfis: as chaves cruzadas diante da pirâmide; 7 estrelas
  menfis(doc, th) {
    return g(
      {},
      D.fill(th, poly([[-36, 34], [0, -22], [36, 34]]), { color: th.gold[2], t: 0.6, anim: 'rise' }),
      g({ transform: 'translate(0 10) rotate(-35)' }, g(A.pop(0.8, 0.5), keyShape(th, 70))),
      g({ transform: 'translate(0 10) rotate(35) scale(-1 1)' }, g(A.pop(0.9, 0.5), keyShape(th, 70))),
      starArc(doc, th, 7, { cy: 10, r: 46, from: -155, to: -25, size: 4.2 }),
    );
  },

  // 95° — Patriarca Grande Conservador: a pena e o selo ("canetada ilimitada")
  conservador(doc, th) {
    const vane = 'M-36 34C-30 14 -6 -14 30 -40C12 -6 -12 20 -36 34Z';
    const seal = [];
    for (let i = 0; i < 16; i++) {
      const [x, y] = polar(10, 14, i % 2 ? 19 : 21.5, i * 22.5);
      seal.push([x, y]);
    }
    return g(
      {},
      D.fill(th, vane, { color: '#F4EAD6', t: 0.6 }),
      D.stroke(th, 'M-42 42L28 -38', { w: 1.6, t: 0.7, color: th.gold[2], inkW: 3 }),
      D.fill(th, 'M2 30L-4 46L4 42L8 48L12 32Z', { color: '#8E1B1B', t: 1.0 }),
      D.fill(th, poly(seal), { color: D.grad(doc, [[0, '#E0445E'], [1, '#7A1022']]), t: 0.9, dur: 0.6 }),
      circle(10, 14, 14, { fill: 'none', stroke: '#F2A3B0', 'stroke-width': 1.2, ...A.fade(1.1) }),
      g({ transform: 'translate(10 14)' }, g(A.pop(1.2, 0.5), path(star(0, 0, 7, 10, 4.2), { fill: th.gold[0], stroke: th.ink, 'stroke-width': 1.5 }))),
    );
  },

  // 96° — Grande e Poderoso Soberano da Ordem: a coroa e os louros
  soberano(doc, th) {
    return g(
      {},
      D.branch(doc, th, -6, 44, -44, 4, { bend: -0.3, leaves: 6, size: 13, t: 0.6 }),
      D.branch(doc, th, 6, 44, 44, 4, { bend: 0.3, leaves: 6, size: 13, t: 0.65 }),
      crown(doc, th, 0, -4, 1, { t: 0.85 }),
    );
  },

  // 97° — Vice-Grão-Mestre Internacional: o globo e a coroa menor
  viceGrao(doc, th) {
    return g({}, globe(doc, th, 0, 12, 30, { t: 0.6 }), crown(doc, th, 0, -32, 0.55, { t: 1.0 }));
  },

  // 98° — Grão-Mestre Internacional: o orbe com a cruz
  graoMestre(doc, th) {
    return g(
      {},
      g(A.pop(0.6, 0.6), g(D.spinAttrs(doc, 0, 8, 22.5), path(D.raysPath(0, 8, 32, 50, 16, { half: 4, alt: 0.6 }), { fill: th.gold[2], stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke' }))),
      D.fill(th, ringD(30, 0, 8), { color: D.goldFill(doc, th), t: 0.7 }),
      D.stroke(th, 'M-30 8H30M0 -22V38', { w: 3.6, t: 0.9, color: th.gold[2] }),
      [-15, 15].map((x, i) => circle(x, 0, 3, { fill: ['#C63A2D', '#2F6FE0'][i], ...A.pop(1.1, 0.3) })),
      D.stroke(th, 'M0 -22V-46M-8 -38H8', { w: 4, t: 1.0 }),
    );
  },

  // 99° — Grande Hierofante: a tiara tríplice (o "boss final")
  hierofante(doc, th) {
    const tiara = 'M-24 34C-26 8 -16 -26 0 -34C16 -26 26 8 24 34Z';
    const bands = [26, 8, -10].map((y, i) => {
      const w = 24 - i * 4.5;
      let d = `M${-w} ${y}`;
      for (let k = 0; k <= 8; k++) d += `L${n(-w + (k * w) / 4)} ${n(y - (k % 2 ? 5 : 0))}`;
      return d;
    }).join('');
    return g(
      {},
      g(A.pop(0.55, 0.6), g(D.spinAttrs(doc, 0, 0, 15), path(D.raysPath(0, 0, 30, 54, 24, { half: 3, alt: 0.6 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke' }))),
      D.fill(th, tiara, { color: D.grad(doc, [[0, '#FFFFFF'], [1, '#D9D2C2']]), t: 0.7 }),
      D.stroke(th, bands, { w: 2.8, t: 0.95, dur: 0.8 }),
      D.stroke(th, 'M0 -34V-50M-6 -44H6', { w: 3, t: 1.2 }),
      [[-10, 20], [10, 20], [0, 1], [-8, -16], [8, -16]].map(([x, y], i) => circle(x, y, 2.4, { fill: ['#C63A2D', '#2F6FE0'][i % 2], ...A.pop(1.3 + i * 0.04, 0.3) })),
    );
  },

  // 100° (bônus) — Imperador Soberano Grande Hierofante Geral: a coroa imperial
  imperador(doc, th) {
    return g(
      {},
      g(A.pop(0.55, 0.6), g(D.spinAttrs(doc, 0, 0, 15), path(D.raysPath(0, 0, 30, 54, 24, { half: 3, alt: 0.6 }), { fill: th.gold[1], stroke: th.ink, 'stroke-width': 2.2, 'paint-order': 'stroke' }))),
      crown(doc, th, 0, 12, 1.05, { t: 0.75, arches: true }),
      D.stroke(th, 'M0 -26V-44M-7 -37H7', { w: 3.4, t: 1.2 }),
      circle(0, -24, 4.5, { fill: D.goldFill(doc, th), stroke: th.ink, 'stroke-width': 2, ...A.pop(1.15, 0.3) }),
    );
  },
};
