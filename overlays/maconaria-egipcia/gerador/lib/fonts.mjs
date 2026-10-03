// Converte texto em contornos vetoriais (paths) para que cada SVG seja
// autossuficiente: não depende de fontes instaladas na máquina de quem abre.
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTSOURCE = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '@fontsource');
const loaded = new Map();

function load(pkg, subset, weight, style) {
  const file = join(FONTSOURCE, pkg, 'files', `${pkg}-${subset}-${weight}-${style}.woff`);
  if (!loaded.has(file)) {
    const buf = readFileSync(file);
    loaded.set(file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return loaded.get(file);
}

const face = (pkg, subsets, weight = 400, style = 'normal') =>
  subsets.map((subset) => () => load(pkg, subset, weight, style));

const LATIN = ['latin', 'latin-ext'];

export const STACKS = {
  title: [...face('cinzel', LATIN, 700), ...face('noto-serif-display', ['greek'], 700)],
  number: [...face('cinzel-decorative', LATIN, 900)],
  label: [...face('cinzel', LATIN, 700), ...face('noto-sans-symbols', ['symbols'], 500), ...face('noto-sans-symbols-2', ['symbols', 'math'])],
  italic: [...face('cormorant-garamond', LATIN, 600, 'italic')],
  serif: [...face('cormorant-garamond', LATIN, 700), ...face('noto-serif-display', ['greek'], 600)],
  glyph: [
    ...face('noto-sans-runic', ['runic']),
    ...face('noto-sans-egyptian-hieroglyphs', ['egyptian-hieroglyphs']),
    ...face('noto-sans-symbols', ['symbols'], 500),
    ...face('noto-sans-symbols-2', ['symbols', 'math']),
    ...face('noto-sans-devanagari', ['devanagari'], 600),
    ...face('noto-serif-hebrew', ['hebrew'], 700),
    ...face('noto-serif-display', ['greek'], 700),
    ...face('cinzel', LATIN, 700),
  ],
};

// Glifos desenhados à mão para o que nenhuma fonte instalada cobre (unidades em "em").
const CUSTOM = {
  // ∞ como dois anéis encostados (anti-horário por fora, horário por dentro → furo)
  '∞': (size) => {
    const R = size * 0.27;
    const r = size * 0.17;
    const y = -size * 0.32;
    const ring = (cx) =>
      `M${cx - R} ${y}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z` +
      `M${cx - r} ${y}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`;
    const d = ring(R) + ring(3 * R - (R - r) * 0.9);
    const w = 4 * R - (R - r) * 0.9;
    return { d, advance: w + size * 0.08, box: { x1: 0, y1: y - R, x2: w, y2: y + R } };
  },
};

function pick(stack, ch) {
  for (const get of stack) {
    const font = get();
    if (font.charToGlyph(ch).index > 0) return font;
  }
  if (CUSTOM[ch]) return null;
  throw new Error(`Nenhuma fonte tem o caractere "${ch}" (U+${ch.codePointAt(0).toString(16)})`);
}

const r2 = (v) => Math.round(v * 100) / 100;

/**
 * Diagrama o texto na linha de base y=0 a partir de x=0.
 * Devolve cada glifo com seu path e a largura total.
 */
export function shape(text, { stack = 'title', size = 40, tracking = 0 } = {}) {
  const fonts = STACKS[stack];
  const glyphs = [];
  let x = 0;
  let prev = null;
  for (const ch of Array.from(text)) {
    const font = pick(fonts, ch);
    if (!font) {
      const c = CUSTOM[ch](size);
      const shift = (d) => d.replace(/M(-?[\d.]+) /g, (m, v) => `M${r2(+v + x)} `);
      glyphs.push({ ch, d: shift(c.d), x, advance: c.advance, box: { x1: r2(c.box.x1 + x), y1: r2(c.box.y1), x2: r2(c.box.x2 + x), y2: r2(c.box.y2) } });
      x += c.advance + tracking;
      prev = null;
      continue;
    }
    const glyph = font.charToGlyph(ch);
    const scale = size / font.unitsPerEm;
    if (prev && prev.font === font) x += font.getKerningValue(prev.glyph, glyph) * scale;
    const p = glyph.getPath(x, 0, size);
    const box = p.getBoundingBox();
    glyphs.push({
      ch,
      d: p.toPathData(2),
      x,
      advance: glyph.advanceWidth * scale,
      box: { x1: r2(box.x1), y1: r2(box.y1), x2: r2(box.x2), y2: r2(box.y2) },
    });
    x += glyph.advanceWidth * scale + tracking;
    prev = { font, glyph };
  }
  const width = glyphs.length ? x - tracking : 0;
  const ink = glyphs.filter((g) => g.d);
  const box = ink.length
    ? {
        x1: Math.min(...ink.map((g) => g.box.x1)),
        y1: Math.min(...ink.map((g) => g.box.y1)),
        x2: Math.max(...ink.map((g) => g.box.x2)),
        y2: Math.max(...ink.map((g) => g.box.y2)),
      }
    : { x1: 0, y1: 0, x2: 0, y2: 0 };
  return { glyphs, width, box };
}

/** Glifo (ou sequência curta, ex.: "XII") centralizado em (0,0) pela caixa de tinta. */
export function glyphCentered(text, size, stack = 'glyph') {
  const { glyphs, box } = shape(text, { stack, size, tracking: text.length > 1 ? size * 0.04 : 0 });
  const cx = (box.x1 + box.x2) / 2;
  const cy = (box.y1 + box.y2) / 2;
  return { d: glyphs.map((g) => g.d).join(''), dx: -cx, dy: -cy, w: box.x2 - box.x1, h: box.y2 - box.y1 };
}
