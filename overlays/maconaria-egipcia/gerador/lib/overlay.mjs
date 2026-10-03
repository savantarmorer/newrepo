// Monta um overlay completo (1920×1080): moldura, cantos, faixas laterais,
// brasão no topo e placa com número + nome do grau na base.
import { shape, glyphCentered } from './fonts.mjs';
import { A, Doc, P, T0, amb, circle, diamond, g, h, n, path, poly } from './svg.mjs';
import { EMBLEMS } from './emblems.mjs';
import { BAND_PATTERNS, SIDE_BANDS } from './patterns.mjs';

export const W = 1920;
export const H = 1080;

// Geometria da moldura
const O = 26; // linha externa
const I = 66; // linha interna
const C = (O + I) / 2; // eixo da faixa
const CREST_Y = 66;

export function textGroup(doc, shaped, { x, y, fill, stagger = 0, t = 0, d = 0.5, anim = 'rise', attrs = {} }) {
  if (!stagger) {
    const dd = shaped.glyphs.map((gl) => gl.d).join('');
    const pa = anim ? A[anim](t, d) : {};
    return g({ transform: `translate(${n(x)} ${n(y)})` }, g(pa, path(dd, { fill, ...attrs })));
  }
  let k = 0;
  const kids = shaped.glyphs.map((gl) => {
    if (!gl.d) return '';
    const delay = t + k * stagger;
    k += 1;
    return g(A[anim](delay, d), path(gl.d, { fill, ...attrs }));
  });
  return g({ transform: `translate(${n(x)} ${n(y)})` }, kids);
}

// ---------------------------------------------------------------------------
// Moldura: linha externa + interna desenhadas a partir do centro do topo.
function frameLayer(doc, th) {
  const halfL = (inset) => `M${W / 2} ${inset}H${inset}V${H - inset}H${W / 2}`;
  const halfR = (inset) => `M${W / 2} ${inset}H${W - inset}V${H - inset}H${W / 2}`;
  const pair = (inset, sw, t) => [
    path(halfL(inset), { fill: 'none', stroke: th.ink, 'stroke-width': sw + 4.5, ...A.draw(t, 0.95) }),
    path(halfR(inset), { fill: 'none', stroke: th.ink, 'stroke-width': sw + 4.5, ...A.draw(t, 0.95) }),
    path(halfL(inset), { fill: 'none', stroke: th.line, 'stroke-width': sw, ...A.draw(t, 0.95) }),
    path(halfR(inset), { fill: 'none', stroke: th.line, 'stroke-width': sw, ...A.draw(t, 0.95) }),
  ];
  // Pulso de luz que percorre a moldura (nasce no brasão e some atrás da placa).
  const runner = doc.ambient('runner', 'from{stroke-dashoffset:0}to{stroke-dashoffset:-1}');
  const pulse = (d) =>
    path(d, { fill: 'none', stroke: th.hi, 'stroke-width': 3.2, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0.045 0.955', ...runner });
  return g({ id: 'moldura' }, pair(O, 3, 0), pair(I, 1.6, 0.12), g(A.fade(2.3, 0.4), pulse(halfL(O)), pulse(halfR(O))));
}

// ---------------------------------------------------------------------------
// Cantos: medalhão com glifo + braços temáticos ao longo da faixa.
function cornerLayer(doc, deg, th) {
  const spots = [
    [C, C, 1, 1],
    [W - C, C, -1, 1],
    [C, H - C, 1, -1],
    [W - C, H - C, -1, -1],
  ];
  const armLen = th.armLength ?? 150;
  const pattern = BAND_PATTERNS[th.arms ?? 'line'];
  return g(
    { id: 'cantos' },
    spots.map(([x, y, sx, sy], k) => {
      const t = 0.3 + k * 0.08;
      const arms = pattern
        ? g(
            { transform: `translate(${x} ${y}) scale(${sx} ${sy})` },
            pattern(doc, th, { x0: 30, x1: 30 + armLen, t: t + 0.15, axis: 'x' }),
            pattern(doc, th, { x0: 30, x1: 30 + armLen, t: t + 0.15, axis: 'y' }),
          )
        : '';
      // Arcana: os quatro cantos são as quatro fases; só a do grau fica acesa.
      const lit = th.cornerPhase ? k === th.phase : true;
      const medalFill = th.cornerPhase && lit ? th.phaseColor : th.plate;
      let inner = '';
      if (th.cornerDraw) inner = th.cornerDraw(doc, th, k);
      else {
        const ch = th.cornerGlyphs[k % th.cornerGlyphs.length];
        if (ch) {
          const gc = glyphCentered(ch, th.cornerGlyphSize ?? 26);
          let fillAttrs;
          if (!th.cornerPhase) fillAttrs = { fill: th.glyph, ...doc.ambient('corner-glow', `0%,10%,100%{fill:${th.glyph}}4%{fill:${th.hi}}`, { offset: 1 + k * 2 }) };
          else fillAttrs = { fill: lit ? th.phaseInk : th.lineDim };
          inner = path(gc.d, { transform: `translate(${n(gc.dx)} ${n(gc.dy)})`, ...fillAttrs });
        }
      }
      const ring = th.cornerPhase && lit ? doc.ambient('phase-ring', `0%,100%{stroke:${th.line}}50%{stroke:${th.hi}}`, { dur: 2, ease: 'ease-in-out' }) : {};
      const medal = g(
        { transform: `translate(${x} ${y})` },
        g(
          A.pop(t, 0.55),
          circle(0, 0, lit && th.cornerPhase ? 33 : 29, { fill: medalFill, stroke: th.ink, 'stroke-width': 7 }),
          circle(0, 0, lit && th.cornerPhase ? 33 : 29, { fill: medalFill, stroke: lit ? th.line : th.lineDim, 'stroke-width': 2.4, ...ring }),
          circle(0, 0, 23.5, { fill: 'none', stroke: th.lineDim, 'stroke-width': 1 }),
          inner,
        ),
      );
      return g({}, arms, medal);
    }),
  );
}

// ---------------------------------------------------------------------------
// Faixas: colunas laterais + padrão no topo/base.
function bandLayer(doc, deg, th, crestHalf, plaqueHalf) {
  const parts = [];
  const side = SIDE_BANDS[th.sideBand ?? 'glyphs'];
  if (!side) throw new Error(`Faixa lateral "${th.sideBand}" não existe (grau ${deg.n})`);
  const top = th.sideTop ?? 200;
  const bottom = H - (th.sideTop ?? 200);
  parts.push(side(doc, th, { x: C, top, bottom, side: 0, deg }), side(doc, th, { x: W - C, top, bottom, side: 1, deg }));

  const armEnd = C + 30 + (th.armLength ?? 150) + 18;
  const segs = [
    [armEnd, W / 2 - crestHalf - 14, C, 1, th.topBand],
    [W - armEnd, W / 2 + crestHalf + 14, C, -1, th.topBand],
    [armEnd, W / 2 - plaqueHalf - 14, H - C, 1, th.bottomBand ?? th.topBand],
    [W - armEnd, W / 2 + plaqueHalf + 14, H - C, -1, th.bottomBand ?? th.topBand],
  ];
  segs.forEach(([xa, xb, y, dir, kind], k) => {
    const pattern = BAND_PATTERNS[kind ?? 'none'];
    const len = Math.abs(xb - xa);
    if (!pattern || len < 60) return;
    parts.push(g({ transform: `translate(${n(xa)} ${n(y)}) scale(${dir} 1)` }, pattern(doc, th, { x0: 0, x1: len, t: 0.55 + (k % 2) * 0.05, axis: 'x', band: true })));
  });
  return g({ id: 'faixas' }, parts);
}

// ---------------------------------------------------------------------------
// Brasão no topo: fundo + emblema do grau.
function crestLayer(doc, deg, th) {
  const cx = W / 2;
  const cy = CREST_Y;
  const emblem = EMBLEMS[deg.emblem];
  if (!emblem) throw new Error(`Emblema "${deg.emblem}" não existe (grau ${deg.n})`);
  const spec = emblem.spec ?? {};
  const back = spec.backdrop ?? 'circle';
  const r = spec.r ?? 58;
  let backdrop = '';
  if (back === 'circle') {
    backdrop = g(
      A.pop(0.45, 0.6),
      circle(cx, cy, r, { fill: th.plate, stroke: th.ink, 'stroke-width': 8 }),
      circle(cx, cy, r, { fill: th.plate, stroke: th.line, 'stroke-width': 2.6 }),
      circle(cx, cy, r - 6.5, { fill: 'none', stroke: th.lineDim, 'stroke-width': 1.1 }),
    );
  } else if (back === 'wide') {
    const w = spec.w ?? 220;
    const hh = spec.h ?? 104;
    const d = poly([
      [cx - w / 2, cy],
      [cx - w / 2 + 26, cy - hh / 2],
      [cx + w / 2 - 26, cy - hh / 2],
      [cx + w / 2, cy],
      [cx + w / 2 - 26, cy + hh / 2],
      [cx - w / 2 + 26, cy + hh / 2],
    ]);
    const inner = poly([
      [cx - w / 2 + 9, cy],
      [cx - w / 2 + 31, cy - hh / 2 + 6],
      [cx + w / 2 - 31, cy - hh / 2 + 6],
      [cx + w / 2 - 9, cy],
      [cx + w / 2 - 31, cy + hh / 2 - 6],
      [cx - w / 2 + 31, cy + hh / 2 - 6],
    ]);
    backdrop = g(
      A.wipeX(0.4, 0.6),
      path(d, { fill: th.plate, stroke: th.ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }),
      path(d, { fill: th.plate, stroke: th.line, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }),
      path(inner, { fill: 'none', stroke: th.lineDim, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }),
    );
  }
  const half = back === 'wide' ? (spec.w ?? 220) / 2 : back === 'circle' ? r : spec.half ?? 120;
  return {
    half,
    markup: g({ id: 'brasao' }, backdrop, g({ transform: `translate(${cx} ${cy})` }, emblem(doc, th, deg))),
  };
}

// ---------------------------------------------------------------------------
// Placa: [número] | [rótulo / nome / nome alternativo]
function fitName(name, maxW) {
  for (const size of [52, 49, 46, 43]) {
    const s = shape(name, { stack: 'title', size, tracking: size * 0.015 });
    if (s.width <= maxW) return { size, lines: [s] };
  }
  const words = name.split(' ');
  let best = null;
  for (const size of [46, 42, 39]) {
    for (let i = 1; i < words.length; i++) {
      const a = shape(words.slice(0, i).join(' '), { stack: 'title', size, tracking: size * 0.015 });
      const b = shape(words.slice(i).join(' '), { stack: 'title', size, tracking: size * 0.015 });
      const w = Math.max(a.width, b.width);
      if (w <= maxW && (!best || w < best.w)) best = { w, size, lines: [a, b] };
    }
    if (best) return best;
  }
  throw new Error(`Nome longo demais: ${name}`);
}

export function plaqueNotch(x0, y0, x1, y1, inset = 0) {
  const c = inset ? 10 : 15;
  return poly([
    [x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c],
  ]);
}

export function plaqueCartouche(x0, y0, x1, y1) {
  const r = (y1 - y0) / 2;
  return `M${n(x0 + r)} ${n(y0)}H${n(x1 - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x1 - r)} ${n(y1)}H${n(x0 + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x0 + r)} ${n(y0)}Z`;
}

function plaqueLayer(doc, deg, th) {
  const cx = W / 2;
  const cart = th.plaque === 'cartouche';
  const maxPlaque = 1440;
  const num = shape(`${deg.n}°`, { stack: 'number', size: deg.n >= 100 ? 76 : 86, tracking: 1 });
  const gap = 30;
  const kickerSize = 20;
  const kicker = deg.kicker ? shape(deg.kicker.toUpperCase(), { stack: 'label', size: kickerSize, tracking: kickerSize * 0.22 }) : null;
  const alt = deg.alt ? shape(deg.alt, { stack: 'italic', size: 31, tracking: 0.3 }) : null;

  const padBase = 46;
  // primeira tentativa de altura para saber o raio das pontas do cartucho
  const guessH = 112 + (alt ? 42 : 0);
  const padX = padBase + (cart ? guessH * 0.32 : 0);
  const maxText = maxPlaque - 2 * padX - num.width - 2 * gap - 2;
  const name = fitName(deg.name, maxText);
  const textW = Math.max(kicker?.width ?? 0, ...name.lines.map((l) => l.width), alt?.width ?? 0);
  const Wp = Math.max(700, padX * 2 + num.width + gap * 2 + 2 + textW);

  const capK = kickerSize * 0.7;
  const capN = name.size * 0.7;
  let y = 24;
  const rows = [];
  if (kicker) {
    y += capK;
    rows.push(['k', y]);
    y += 15;
  }
  name.lines.forEach((l, i) => {
    y += capN + (i ? 13 : 0);
    rows.push(['n' + i, y]);
  });
  if (alt) {
    y += 14 + 31 * 0.62;
    rows.push(['a', y]);
    y += 6;
  }
  const Hp = Math.round(y + 24);
  const bottom = th.plaqueBottom ?? H - 22;
  const top = bottom - Hp;
  const x0 = cx - Wp / 2;
  const x1 = cx + Wp / 2;

  const outline = cart ? plaqueCartouche(x0, top, x1, bottom) : plaqueNotch(x0, top, x1, bottom);
  const inner = cart ? plaqueCartouche(x0 + 7, top + 7, x1 - 7, bottom - 7) : plaqueNotch(x0 + 7, top + 7, x1 - 7, bottom - 7, 1);

  const numX = x0 + padX;
  const numY = top + Hp / 2 + (num.box.y2 - num.box.y1) / 2 - num.box.y2;
  const divX = numX + num.width + gap;
  const textX = divX + gap + 2;
  const rowY = Object.fromEntries(rows.map(([k, v]) => [k, top + v]));

  const nameStops = th.nameFill ?? th.gold;
  const numStops = th.numberFill ?? th.gold;
  const nameFill = doc.vgrad([[0, nameStops[0]], [0.5, nameStops[1]], [1, nameStops[2]]], top + 10, bottom - 10);
  const numFill = doc.vgrad([[0, numStops[0]], [0.55, numStops[1]], [1, numStops[2]]], numY + num.box.y1, numY + num.box.y2);
  const plaqueFill = th.plaqueFill ?? th.plate;

  // brilho que atravessa número e nome a cada ciclo
  const clipId = doc.id('clip');
  doc.def(
    h('clipPath', { id: clipId },
      path(num.glyphs.map((gl) => gl.d).join(''), { transform: `translate(${n(numX)} ${n(numY)})` }),
      name.lines.map((l, i) => path(l.glyphs.map((gl) => gl.d).join(''), { transform: `translate(${n(textX)} ${n(rowY['n' + i])})` }))),
  );
  const shineId = doc.id('sh');
  doc.def(
    h('linearGradient', { id: shineId, x1: 0, y1: 0, x2: 1, y2: 0 },
      h('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }),
      h('stop', { offset: 0.5, 'stop-color': '#fffbe9', 'stop-opacity': th.plaqueFill ? 0.5 : 0.78 }),
      h('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 })),
  );
  const travel = Wp + 300;
  const sweep = doc.ambient('sweep', `0%{transform:translateX(0)}22%,100%{transform:translateX(${n(travel)}px)}`, { ease: 'cubic-bezier(.45,0,.25,1)', offset: 0.2 });
  const glint = g({ 'clip-path': `url(#${clipId})` }, g(sweep, path(poly([[x0 - 260, top], [x0 - 150, top], [x0 - 190, bottom], [x0 - 300, bottom]]), { fill: `url(#${shineId})` })));

  const ornament = cart
    ? g({}, tieBar(th, x1, top, bottom))
    : g({}, [x0, x1].map((x) => path(diamond(x, (top + bottom) / 2, 9, 15), { fill: th.line, stroke: th.ink, 'stroke-width': 3, 'paint-order': 'stroke' })));

  const content = g(
    {},
    textGroup(doc, num, { x: numX, y: numY, fill: numFill, anim: 'pop', t: 0.75, d: 0.6 }),
    path(`M${n(divX)} ${n(top + 18)}V${n(bottom - 18)}`, { stroke: th.plaqueFill ? th.line : th.lineDim, 'stroke-width': 1.6, ...A.draw(0.85, 0.5) }),
    g({ transform: `translate(${n(divX)} ${n((top + bottom) / 2)})` }, g(A.pop(1.0, 0.4), path(diamond(0, 0, 6, 10), { fill: th.line, stroke: th.plaqueFill ? th.plaqueInk : 'none', 'stroke-width': 1.5 }))),
    kicker ? textGroup(doc, kicker, { x: textX, y: rowY.k, fill: th.kickerColor ?? th.accent, anim: 'fade', t: 1.05, d: 0.5 }) : '',
    name.lines.map((l, i) => textGroup(doc, l, { x: textX, y: rowY['n' + i], fill: nameFill, stagger: 0.022, t: 1.0 + i * 0.25, d: 0.5 })),
    alt ? textGroup(doc, alt, { x: textX, y: rowY.a, fill: th.altColor ?? '#F4E7C8', anim: 'rise', t: 1.55, d: 0.55 }) : '',
    glint,
  );

  return {
    half: Wp / 2 + (cart ? 22 : 0),
    markup: g(
      { id: 'placa' },
      g(
        A.wipeX(0.35, 0.6),
        path(outline, { fill: plaqueFill, stroke: th.ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }),
        path(outline, { fill: plaqueFill, stroke: th.line, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }),
        path(inner, { fill: 'none', stroke: th.plaqueFill ? th.line : th.lineDim, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }),
        ornament,
      ),
      content,
    ),
  };
}

/** Barra de amarração do cartucho egípcio (na ponta direita). */
function tieBar(th, x1, top, bottom) {
  const x = x1 + 12;
  return [
    path(`M${n(x)} ${n(top + 10)}V${n(bottom - 10)}`, { stroke: th.ink, 'stroke-width': 11, 'stroke-linecap': 'round' }),
    path(`M${n(x)} ${n(top + 10)}V${n(bottom - 10)}`, { stroke: th.line, 'stroke-width': 5, 'stroke-linecap': 'round' }),
  ];
}

// ---------------------------------------------------------------------------
export function buildOverlay(deg, th) {
  const doc = new Doc();
  const crest = crestLayer(doc, deg, th);
  const plaque = plaqueLayer(doc, deg, th);
  const body = [frameLayer(doc, th), bandLayer(doc, deg, th, crest.half, plaque.half), cornerLayer(doc, deg, th), crest.markup, plaque.markup];
  const title = `${deg.n}° ${deg.name}${deg.alt ? ' — ' + deg.alt : ''}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    h('title', {}, title.replace(/&/g, '&amp;').replace(/</g, '&lt;')),
    `<style>${doc.css_()}</style>`,
    h('defs', {}, doc.defs),
    ...body,
    '</svg>',
  ].join('\n');
}

export { T0, P, amb };
