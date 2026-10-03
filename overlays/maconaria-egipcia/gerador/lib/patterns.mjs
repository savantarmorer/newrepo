// Padrões da moldura.
//  - BAND_PATTERNS: correm na horizontal (braços dos cantos, topo e base). São
//    desenhados ao longo de x (y=0 é o eixo da faixa); para o eixo vertical o
//    chamador recebe o mesmo desenho girado 90°.
//  - SIDE_BANDS: preenchem as colunas laterais entre os cantos.
import { shape, glyphCentered } from './fonts.mjs';
import { A, circle, diamond, g, n, path, poly, star } from './svg.mjs';
import * as D from './draw.mjs';

const vertical = (axis, kids) => (axis === 'y' ? g({ transform: 'rotate(90)' }, kids) : g({}, kids));

const endDiamond = (th, x, t, r = 6) =>
  g({ transform: `translate(${n(x)} 0)` }, g(A.pop(t, 0.4), path(diamond(0, 0, r, r * 1.5), { fill: th.line, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' })));

function wavePath(x0, x1, { amp, wave, phase = 0, y = 0 }) {
  const pts = [];
  for (let x = x0; x <= x1 + 0.1; x += 2) pts.push([x, y + amp * Math.sin(((x - x0) / wave) * Math.PI * 2 + phase)]);
  return poly(pts, false);
}

export const BAND_PATTERNS = {
  none: null,

  line(doc, th, { x0, x1, t, axis }) {
    return vertical(axis, [D.stroke(th, `M${n(x0)} 0H${n(x1)}`, { w: 2.2, t, dur: 0.8 }), endDiamond(th, x1 + 8, t + 0.5)]);
  },

  /** Trança nórdica: duas fitas senoidais que se cruzam. */
  braid(doc, th, { x0, x1, t, axis, band }) {
    const a = wavePath(x0, x1, { amp: 8, wave: 34 });
    const b = wavePath(x0, x1, { amp: 8, wave: 34, phase: Math.PI });
    return vertical(axis, [D.stroke(th, a, { w: 2.2, t, dur: 1 }), D.stroke(th, b, { w: 2.2, t: t + 0.1, dur: 1 }), band ? '' : endDiamond(th, x1 + 10, t + 0.6)]);
  },

  /** Contas/pontos espaçados (lembra um japamala). */
  beads(doc, th, { x0, x1, t, axis }) {
    const kids = [];
    let k = 0;
    for (let x = x0 + 6; x <= x1; x += 26, k++) {
      const dot = k % 3 === 1 ? path(diamond(0, 0, 4, 6), { fill: th.line, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }) : circle(0, 0, 2.6, { fill: th.line, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' });
      kids.push(g({ transform: `translate(${n(x)} 0)` }, g(A.pop(t + k * 0.02, 0.35), dot)));
    }
    return vertical(axis, kids);
  },

  /** Grega (meandro) entre dois filetes. */
  meander(doc, th, { x0, x1, t, axis }) {
    const u = 19;
    const hh = 7.5;
    let d = '';
    for (let x = x0; x + u <= x1 + 0.1; x += u) {
      d += `M${n(x)} ${n(hh)}V${n(-hh)}H${n(x + u * 0.74)}V${n(hh * 0.42)}H${n(x + u * 0.3)}V${n(-hh * 0.12)}H${n(x + u * 0.5)}`;
    }
    const border = `M${n(x0)} ${n(-hh - 3.5)}H${n(x1)}M${n(x0)} ${n(hh)}H${n(x1)}`;
    return vertical(axis, [D.stroke(th, border, { w: 1.6, t, dur: 0.8, inkW: 4.5 }), D.stroke(th, d, { w: 1.8, t: t + 0.1, dur: 1.1, inkW: 5, cap: 'square' })]);
  },

  /** Corrente de elos. */
  chain(doc, th, { x0, x1, t, axis }) {
    return vertical(axis, D.chainLinks(th, x0, x1, { size: 13, t }));
  },

  /** Estrelas miúdas (abóbada celeste). */
  stars(doc, th, { x0, x1, t, axis }) {
    const kids = [];
    let k = 0;
    for (let x = x0 + 10; x <= x1 - 4; x += 34, k++) {
      const y = k % 2 ? -5 : 5;
      if (k % 3 === 2) kids.push(g({ transform: `translate(${n(x)} ${y})` }, g(A.pop(t + k * 0.03, 0.4), circle(0, 0, 2.2, { fill: th.hi, stroke: th.ink, 'stroke-width': 2.5, 'paint-order': 'stroke' }))));
      else kids.push(D.twinkleStar(doc, th, x, y, k % 3 === 0 ? 6.5 : 4.5, { t: t + k * 0.03, offset: (k * 0.37) % 2 }));
    }
    return vertical(axis, kids);
  },

  /** Guilhoché de diploma: três senoides entrelaçadas. */
  guilloche(doc, th, { x0, x1, t, axis }) {
    const waves = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((phase) => wavePath(x0, x1, { amp: 7, wave: 40, phase }));
    const inner = [0, Math.PI].map((phase) => wavePath(x0, x1, { amp: 3.5, wave: 20, phase }));
    return vertical(axis, [
      ...waves.map((d, i) => D.stroke(th, d, { w: 1.5, t: t + i * 0.08, dur: 1, inkW: 3.8 })),
      ...inner.map((d, i) => D.stroke(th, d, { w: 1.1, t: t + 0.25 + i * 0.08, dur: 1, inkW: 3, color: th.lineDim })),
    ]);
  },

  /** Pavimento mosaico (xadrez preto e branco) — base do Templo. */
  checker(doc, th, { x0, x1, t, axis }) {
    const s = 11;
    const kids = [];
    let k = 0;
    for (let x = x0; x + s <= x1 + 0.1; x += s, k++) {
      for (const row of [0, 1]) {
        const white = (k + row) % 2 === 0;
        kids.push(path(`M${n(x)} ${n(-s + row * s)}h${s}v${s}h${-s}Z`, { fill: white ? '#F4EFE4' : '#141414' }));
      }
    }
    return vertical(axis, [
      g(A.wipeX(t, 0.8), path(`M${n(x0)} ${-s}H${n(x1)}V${s}H${n(x0)}Z`, { fill: th.ink, stroke: th.ink, 'stroke-width': 6 }), kids),
      D.stroke(th, `M${n(x0)} ${-s - 1}H${n(x1)}M${n(x0)} ${s + 1}H${n(x1)}`, { w: 1.6, t, inkW: 3.5 }),
    ]);
  },

  waves(doc, th, { x0, x1, t, axis }) {
    return vertical(axis, [D.waves(doc, th, x0, x1, -4, { amp: 3.5, wave: 26, rows: 2, gap: 8, t })]);
  },
};

// ---------------------------------------------------------------------------
// Faixas laterais. Recebem o eixo x da coluna, o intervalo [top, bottom] e o lado (0 = esquerda).
const glyphCol = (doc, th, chars, x, top, bottom, side, { size, glowStep = 0.16 } = {}) => {
  const step = (bottom - top) / Math.max(1, chars.length - 1);
  return chars.map((ch, k) => {
    const y = top + k * step;
    const gc = glyphCentered(ch, size ?? th.sideGlyphSize ?? 25);
    const glow = doc.ambient('side-glow', `0%,9%,100%{fill:${th.glyph}}3%{fill:${th.hi}}`, { offset: 0.4 + k * glowStep });
    return g(
      { transform: `translate(${n(x)} ${n(y)})` },
      g(A.pop(0.8 + k * 0.07 + side * 0.03, 0.45), path(gc.d, { transform: `translate(${n(gc.dx)} ${n(gc.dy)})`, fill: th.glyph, stroke: th.ink, 'stroke-width': 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...glow })),
    );
  });
};

function spread(count, top, bottom) {
  const step = (bottom - top) / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, k) => top + k * step);
}

// pseudoaleatório determinístico
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

export const SIDE_BANDS = {
  glyphs(doc, th, { x, top, bottom, side, deg }) {
    const all = th.sideGlyphs ?? [];
    if (!all.length) return '';
    let chars;
    if (th.sideSplit === false || all.length <= 2) {
      const count = th.sideCount ?? 12;
      chars = Array.from({ length: count }, (_, k) => all[(k + side) % all.length]);
    } else {
      const per = Math.ceil(all.length / 2);
      chars = side === 0 ? all.slice(0, per) : all.slice(per).length ? all.slice(per) : all.slice(0, per);
    }
    return g({}, glyphCol(doc, th, chars, x, top, bottom, side));
  },

  pillars(doc, th, { x, top, bottom, side }) {
    return g({}, D.column(th, x, top - 10, bottom + 30, 19, { t: 0.55 + side * 0.1, globe: true, doc }), D.glyph(th, side ? 'J' : 'B', x, (top + bottom) / 2, 18, { color: th.ink, outline: 0, t: 1.3 }));
  },

  constellation(doc, th, { x, top, bottom, side }) {
    const r = rng(side ? 977 : 4517);
    const ys = spread(10, top, bottom);
    const pts = ys.map((y) => [x + (r() - 0.5) * 18, y + (r() - 0.5) * 30]);
    return g(
      {},
      D.stroke(th, poly(pts, false), { w: 1.2, t: 0.7, dur: 1.4, color: th.lineDim, inkW: 3.5 }),
      pts.map(([px, py], k) => D.twinkleStar(doc, th, px, py, k % 3 === 0 ? 8 : 5.5, { t: 0.8 + k * 0.07, offset: (k * 0.31 + side * 0.5) % 2 })),
    );
  },

  colors7(doc, th, { x, top, bottom, side }) {
    const colors = ['#E23B3B', '#F28C28', '#F5D33B', '#19B3B0', '#2F6FE0', '#4B3CC9', '#9B4FE0'];
    const ys = spread(14, top, bottom);
    return g(
      {},
      ys.map((y, k) => {
        const c = colors[k % 7];
        const blink = doc.ambient(`c7-${k % 7}`, `0%,10%,100%{fill:${c}}4%{fill:#FFFFFF}`, { offset: k * (8 / 14) });
        return g({ transform: `translate(${n(x)} ${n(y)})` }, g(A.pop(0.8 + k * 0.06, 0.4), path(diamond(0, 0, 7, 12), { fill: c, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', ...blink })));
      }),
    );
  },

  aeons(doc, th, { x, top, bottom, side }) {
    const ys = spread(15, top, bottom);
    const kids = [];
    ys.forEach((y, k) => {
      if (k % 2 === 0 && k + 1 < ys.length) kids.push(D.stroke(th, `M${x} ${n(y)}V${n(ys[k + 1])}`, { w: 1.4, t: 0.9 + k * 0.05, color: th.lineDim, inkW: 3.5 }));
      const filled = k % 2 === 0;
      const blink = filled ? D.blinkAttrs(doc, th, { offset: k * 0.25 + side * 0.12, base: th.accent }) : {};
      kids.push(g({ transform: `translate(${n(x)} ${n(y)})` }, g(A.pop(0.85 + k * 0.06, 0.4), circle(0, 0, 6, { fill: filled ? th.accent : th.plate, stroke: th.ink, 'stroke-width': 6, 'paint-order': 'stroke', ...blink }), filled ? '' : circle(0, 0, 6, { fill: 'none', stroke: th.accent, 'stroke-width': 2 }))));
    });
    return g({}, kids);
  },

  flames(doc, th, { x, top, bottom, side }) {
    return g({}, spread(7, top + 20, bottom).map((y, k) => D.flame(doc, th, x, y, 15, 30, { t: 0.8 + k * 0.08, offset: (k * 0.3 + side * 0.15) % 1 })));
  },

  chain(doc, th, { x, top, bottom }) {
    return g({ transform: `translate(${n(x)} 0) rotate(90)` }, D.chainLinks(th, top - 60, bottom + 60, { size: 14, t: 0.7 }));
  },

  meander(doc, th, { x, top, bottom }) {
    return g({ transform: `translate(${n(x)} 0)` }, BAND_PATTERNS.meander(doc, th, { x0: top - 50, x1: bottom + 50, t: 0.7, axis: 'y' }));
  },

  laurel(doc, th, { x, top, bottom, side }) {
    const mid = (top + bottom) / 2;
    return g(
      {},
      D.branch(doc, th, x, mid + 10, x, top - 30, { bend: side ? -0.25 : 0.25, leaves: 9, size: 15, t: 0.8 }),
      D.branch(doc, th, x, mid - 10, x, bottom + 30, { bend: side ? 0.25 : -0.25, leaves: 9, size: 15, t: 0.85 }),
      g({ transform: `translate(${n(x)} ${n(mid)})` }, g(A.pop(1.1, 0.4), circle(0, 0, 5, { fill: th.accent, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }))),
    );
  },

  lotus(doc, th, { x, top, bottom, side }) {
    return g({}, spread(6, top + 10, bottom).map((y, k) => g({}, D.lotus(doc, th, x, y + 10, 0.38, { t: 0.8 + k * 0.08 }), g({ transform: `translate(${n(x)} ${n(y + 22)})` }, g(A.pop(0.9 + k * 0.08, 0.3), circle(0, 0, 2.5, { fill: th.accent }))))));
  },

  wheat(doc, th, { x, top, bottom, side }) {
    return g({}, spread(6, top + 30, bottom + 20).map((y, k) => D.wheatEar(doc, th, x, y, 0.8, { t: 0.8 + k * 0.08, rot: (k % 2 ? 8 : -8) * (side ? -1 : 1) })));
  },

  waves(doc, th, { x, top, bottom, side }) {
    return g({ transform: `translate(${n(x)} 0) rotate(90)` }, D.waves(doc, th, top - 50, bottom + 50, -4, { amp: 4, wave: 30, rows: 2, gap: 9, t: 0.7 }));
  },

  roses(doc, th, { x, top, bottom, side }) {
    return g(
      {},
      D.stroke(th, `M${x} ${top - 40}V${bottom + 40}`, { w: 1.6, t: 0.6, dur: 1, color: th.lineDim, inkW: 4 }),
      spread(6, top, bottom).map((y, k) => D.rose(doc, th, x, y, 11, { t: 0.8 + k * 0.08 })),
    );
  },

  syllables(doc, th, { x, top, bottom, side }) {
    const ys = spread(16, top - 20, bottom + 20);
    return g(
      {},
      ys.map((y, k) => {
        const blink = D.blinkAttrs(doc, th, { offset: (side * 16 + k) * 0.25, base: th.glyph });
        return g({ transform: `translate(${n(x)} ${n(y)})` }, g(A.pop(0.8 + k * 0.04, 0.35), circle(0, 0, k % 4 === 3 ? 5.5 : 4, { fill: th.glyph, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke', ...blink })));
      }),
    );
  },

  text(doc, th, { x, top, bottom, side }) {
    const txt = (th.sideText ?? [])[side] ?? '';
    const s = shape(txt, { stack: 'label', size: 17, tracking: 3 });
    const mid = (top + bottom) / 2;
    const rot = side ? 90 : -90;
    const d = s.glyphs.map((gl) => gl.d).join('');
    return g(
      { transform: `translate(${n(x)} ${n(mid)}) rotate(${rot}) translate(${n(-s.width / 2)} 6)` },
      g(A.fade(0.9, 0.6), path(d, { fill: th.accent, stroke: th.ink, 'stroke-width': 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round' })),
    );
  },

  serpent(doc, th, { x, top, bottom, side }) {
    const pts = [];
    const y0 = bottom + 50;
    const y1 = top - 10;
    for (let y = y0; y >= y1 - 0.1; y -= 3) pts.push([x + 9 * Math.sin(((y0 - y) / 70) * Math.PI * 2 + side * Math.PI), y]);
    const body = poly(pts, false);
    return g(
      {},
      D.stroke(th, body, { w: 6, t: 0.6, dur: 1.4, color: '#B8321F', inkW: 10 }),
      path(body, { fill: 'none', stroke: '#FFB338', 'stroke-width': 2, 'stroke-dasharray': '6 10', ...A.fade(1.6, 0.4) }),
      g(A.fade(1.8, 0.3), D.runner(doc, th, body, { w: 4.5, dash: 0.22, color: '#FFE08A', reverse: false })),
      D.flame(doc, th, pts.at(-1)[0], y1 + 4, 16, 34, { t: 1.7, offset: side * 0.5 }),
    );
  },

  guilloche(doc, th, { x, top, bottom }) {
    return g({ transform: `translate(${n(x)} 0)` }, BAND_PATTERNS.guilloche(doc, th, { x0: top - 40, x1: bottom + 40, t: 0.7, axis: 'y' }));
  },

  medals(doc, th, { x, top, bottom, side }) {
    const ribbons = [['#B3203D', '#F2E7CC'], ['#2F5FB5', '#F5D33B'], ['#7A2BB5', '#FFFFFF'], ['#C9302C', '#1D2C5E']];
    return g(
      {},
      spread(6, top, bottom).map((y, k) => {
        const [c1, c2] = ribbons[(k + side) % ribbons.length];
        const swing = doc.ambient('swing', '0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}', { dur: 2, offset: k * 0.33, origin: [x, y - 16], ease: 'ease-in-out' });
        return g(
          A.pop(0.8 + k * 0.08, 0.45),
          g(
            swing,
            path(`M${x - 8} ${y - 18}h16l-4 14h-8Z`, { fill: c1, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }),
            path(`M${x - 2} ${y - 18}h4v13h-4Z`, { fill: c2 }),
            circle(x, y + 3, 9, { fill: D.goldFill(doc, th), stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' }),
            path(star(x, y + 3, 5, 5.5, 2.4), { fill: th.gold[2] }),
          ),
        );
      }),
    );
  },
};
