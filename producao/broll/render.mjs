// Renderiza os SVGs animados em vídeo (MP4 1080p) ou em pôster (PNG do quadro final).
// Uso:
//   node producao/broll/render.mjs poster [filtro]   → out/poster/*.png e out/contato-*.png
//   node producao/broll/render.mjs mp4 [filtro]      → out/mp4/*.mp4 (letterings: out/mp4/*.mov com transparência)
// Requer Chromium do Playwright e ffmpeg. Fontes: carrega do Google Fonts; com FONTES_LOCAIS=1 usa as instaladas.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] ?? 'poster';
const filter = process.argv[3];
const FPS = Number(process.env.FPS ?? 30);
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8')).filter((c) => !filter || c.id.startsWith(filter));
const out = join(here, 'out', mode);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
if (process.env.FONTES_LOCAIS) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

async function load(c) {
  await page.goto(pathToFileURL(join(here, 'svg', c.file)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
}

async function seek(ms) {
  await page.evaluate((t) => { for (const a of document.getAnimations()) a.currentTime = t; }, ms);
}

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg ${code}`)))));
  return { stdin: p.stdin, done };
}

for (const c of manifest) {
  await load(c);
  if (mode === 'poster') {
    await seek(c.dur * 1000);
    await page.screenshot({ path: join(out, c.file.replace('.svg', '.png')), omitBackground: c.overlay });
    continue;
  }
  const frames = Math.round(c.dur * FPS);
  const target = join(out, c.file.replace('.svg', c.overlay ? '.mov' : '.mp4'));
  const enc = c.overlay
    ? ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', target])
    : ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target]);
  for (let i = 0; i < frames; i++) {
    await seek((i * 1000) / FPS);
    const buf = await page.screenshot({ type: 'png', omitBackground: c.overlay });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
  }
  enc.stdin.end();
  await enc.done;
  console.log(`${c.id}  ${frames} quadros  → ${target.split('/').slice(-1)[0]}`);
}

await browser.close();

if (mode === 'poster' && existsSync(join(out))) {
  // folhas de contato, 4 × 3 por página
  const files = manifest.map((c) => join(out, c.file.replace('.svg', '.png')));
  for (let p = 0; p * 12 < files.length; p++) {
    const chunk = files.slice(p * 12, p * 12 + 12);
    const inputs = chunk.flatMap((f) => ['-i', f]);
    const n = chunk.length;
    const layout = Array.from({ length: n }, (_, i) => `${(i % 4) * 480}_${Math.floor(i / 4) * 270}`).join('|');
    const scale = chunk.map((_, i) => `[${i}:v]scale=480:270[v${i}]`).join(';');
    const ins = chunk.map((_, i) => `[v${i}]`).join('');
    const graph = n === 1 ? '[0:v]scale=480:270' : `${scale};${ins}xstack=inputs=${n}:layout=${layout}:fill=black`;
    const { done } = ffmpeg([...inputs, '-filter_complex', graph, join(here, 'out', `contato-${String(p + 1).padStart(2, '0')}.png`)]);
    if (n > 1) await done; else await done.catch(() => {});
  }
}
