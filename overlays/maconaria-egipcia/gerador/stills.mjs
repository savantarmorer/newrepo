// Prévias estáticas: captura quadros de overlays sobre um fundo de teste.
// Uso: node stills.mjs <saida> <grau,grau,...> <t,t,...> [escuro|claro|verde]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { GRAUS } from './graus.mjs';
import { buildOverlay } from './lib/overlay.mjs';
import { themeFor } from './lib/themes.mjs';
import { mockBackground } from './lib/mock.mjs';
import { launch, openPage, freeze, seek, capture } from './lib/browser.mjs';

const [out = 'prev', list = '34', times = '4', bg = 'escuro'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const wanted = list === 'all' ? GRAUS.map((d) => d.n) : list.split(',').map(Number);
const browser = await launch();
const { page, cdp } = await openPage(browser);
for (const num of wanted) {
  const deg = GRAUS.find((d) => d.n === num);
  const svg = buildOverlay(deg, themeFor(deg));
  const back = bg === 'verde' ? '#00FF00' : `url('data:image/svg+xml;base64,${Buffer.from(mockBackground(bg)).toString('base64')}')`;
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${back};width:1920px;height:1080px;overflow:hidden">${svg}</body></html>`);
  await freeze(page, cdp);
  for (const t of times.split(',').map(Number)) {
    await seek(page, t);
    writeFileSync(join(out, `${num}-t${t}.png`), await capture(cdp));
  }
}
await browser.close();
