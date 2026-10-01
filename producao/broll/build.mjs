// Gera os SVGs animados, o manifesto e a galeria.
// Uso: node producao/broll/build.mjs [filtro]   ex.: node producao/broll/build.mjs 2.3
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frame, resetClock, clockEnd } from './kit.mjs';
import { AULAS } from './aulas.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'svg');
const filter = process.argv[2];

export { AULAS };

const modules = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'lettering'];
const clips = [];
for (const m of modules) {
  try {
    const mod = await import(`./clips/${m}.mjs`);
    clips.push(...mod.default);
  } catch (err) {
    if (err.code !== 'ERR_MODULE_NOT_FOUND') throw err;
  }
}

const ids = new Set();
for (const c of clips) {
  if (ids.has(c.id)) throw new Error(`id repetido: ${c.id}`);
  ids.add(c.id);
}

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const fileOf = (c) => `${c.id.replace('.', '-')}_${slug(c.title)}.svg`;

mkdirSync(outDir, { recursive: true });
if (!filter) for (const f of readdirSync(outDir)) if (f.endsWith('.svg')) rmSync(join(outDir, f));

const manifest = [];
for (const c of clips) {
  resetClock();
  const r = c.render();
  const dur = Math.ceil((clockEnd() + (c.hold ?? 2.4)) * 10) / 10;
  const kicker = c.overlay ? null : `Aula ${c.aula} · ${AULAS[c.aula] ?? ''}`;
  const svg = frame({ kicker: r.kicker === undefined ? kicker : r.kicker, source: r.source, body: r.body, dur, transparent: !!c.overlay, id: c.id });
  for (const bad of ['[object Object]', 'undefined', 'NaN']) if (svg.includes(bad)) throw new Error(`${c.id}: “${bad}” no SVG`);
  const file = fileOf(c);
  if (!filter || c.id.startsWith(filter)) writeFileSync(join(outDir, file), svg);
  manifest.push({ id: c.id, aula: c.aula, title: c.title, cue: c.cue, file, dur, overlay: !!c.overlay, warn: c.warn ?? null });
}

writeFileSync(join(here, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`${manifest.length} clipes${filter ? ` (gravados só os de ${filter})` : ''}.`);
