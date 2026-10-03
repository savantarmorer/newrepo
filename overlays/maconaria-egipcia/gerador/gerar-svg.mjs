// Gera ../svg/<grau>.svg — SVG animado e autossuficiente (texto já em curvas).
// Uso: node gerar-svg.mjs [34,35,...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRAUS, slug } from './graus.mjs';
import { buildOverlay } from './lib/overlay.mjs';
import { themeFor } from './lib/themes.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'svg');
mkdirSync(OUT, { recursive: true });

const only = process.argv[2]?.split(',').map(Number);
let total = 0;
for (const deg of GRAUS) {
  if (only && !only.includes(deg.n)) continue;
  const svg = buildOverlay(deg, themeFor(deg));
  const file = join(OUT, `${slug(deg)}.svg`);
  writeFileSync(file, svg);
  total += 1;
  console.log(`${deg.n}° → svg/${slug(deg)}.svg (${Math.round(svg.length / 1024)} KB)`);
}
console.log(`${total} SVG gerados em ${OUT}`);
