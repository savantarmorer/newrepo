// Prancha com todos os graus (preview/todos-os-graus.jpg) sobre um fundo de
// "talking head" de teste, capturada no trecho ambiente (t = 4 s).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRAUS } from './graus.mjs';
import { buildOverlay } from './lib/overlay.mjs';
import { themeFor } from './lib/themes.mjs';
import { mockBackground } from './lib/mock.mjs';
import { capture, freeze, launch, openPage, seek } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'preview');
const TMP = join(process.env.TMP_FRAMES ?? tmpdir(), 'overlays-preview');
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const back = `url('data:image/svg+xml;base64,${Buffer.from(mockBackground('escuro')).toString('base64')}')`;
const browser = await launch();
const { page, cdp } = await openPage(browser);
let k = 0;
for (const deg of GRAUS) {
  const svg = buildOverlay(deg, themeFor(deg));
  await page.setContent(`<!doctype html><body style="margin:0;background:${back};width:1920px;height:1080px;overflow:hidden">${svg}</body>`);
  await freeze(page, cdp);
  await seek(page, 4);
  writeFileSync(join(TMP, `${String(k++).padStart(3, '0')}.png`), await capture(cdp));
}
await browser.close();

const cols = 6;
const rows = Math.ceil(k / cols);
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-framerate', '1', '-i', join(TMP, '%03d.png'),
  '-vf', `scale=480:270:flags=lanczos,pad=488:278:4:4:color=0x202020,tile=${cols}x${rows}:color=0x202020`,
  '-frames:v', '1', '-q:v', '3', join(OUT, 'todos-os-graus.jpg'),
]);
rmSync(TMP, { recursive: true, force: true });
console.log(`preview/todos-os-graus.jpg (${k} graus)`);
