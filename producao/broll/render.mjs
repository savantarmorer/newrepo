// Renderiza os SVGs animados em vídeo ou em pôster (PNG do quadro final).
// Uso:
//   node producao/broll/render.mjs poster [filtro]   → out/poster/*.png e out/contato-*.png
//   node producao/broll/render.mjs mp4 [filtro]      → out/mp4/*.mp4 (letterings sobre verde de recorte, #00B140)
//   node producao/broll/render.mjs webm [filtro]     → out/webm/*.webm, só letterings, com transparência (VP9)
//   node producao/broll/render.mjs mov [filtro]      → out/mov/*.mov, só letterings, com transparência (ProRes 4444)
// Variáveis: CHROMIUM_PATH (Chromium a usar), FONTES_LOCAIS=1 (usa as fontes instaladas em vez do Google Fonts),
// FPS (padrão 30), SHARD=k/n (renderiza só a k-ésima de n partes, para rodar n processos em paralelo),
// REFAZER=1 (refaz vídeos que já existem e estão mais novos que o SVG).
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] ?? 'poster';
const filter = process.argv[3];
const FPS = Number(process.env.FPS ?? 30);
const CHROMA = '#00B140';
const EXT = { mp4: '.mp4', webm: '.webm', mov: '.mov', poster: '.png' };
if (!EXT[mode]) throw new Error(`modo desconhecido: ${mode} (use poster, mp4, webm ou mov)`);

let manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8')).filter((c) => !filter || c.id.startsWith(filter));
if (mode === 'webm' || mode === 'mov') manifest = manifest.filter((c) => c.overlay);
if (process.env.SHARD) {
  const [k, n] = process.env.SHARD.split('/').map(Number);
  manifest = manifest.filter((_, i) => i % n === k - 1);
}
const out = join(here, 'out', mode);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
if (process.env.FONTES_LOCAIS) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

async function load(c, background) {
  await page.goto(pathToFileURL(join(here, 'svg', c.file)).href);
  await page.evaluate(() => document.fonts.ready);
  if (background) {
    await page.evaluate((fill) => {
      const s = document.documentElement;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('width', '1920'); r.setAttribute('height', '1080'); r.setAttribute('fill', fill);
      s.insertBefore(r, s.querySelector('style')?.nextSibling ?? s.firstChild);
    }, background);
  }
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
  const target = join(out, c.file.replace('.svg', EXT[mode]));
  if (mode !== 'poster' && !process.env.REFAZER && existsSync(target) && statSync(target).mtimeMs > statSync(join(here, 'svg', c.file)).mtimeMs) continue;
  const alpha = mode === 'webm' || mode === 'mov';
  await load(c, mode === 'mp4' && c.overlay ? CHROMA : null);
  if (mode === 'poster') {
    await seek(c.dur * 1000);
    await page.screenshot({ path: target, omitBackground: c.overlay });
    continue;
  }
  const frames = Math.round(c.dur * FPS);
  // quadros opacos vão em JPEG (mais rápido de capturar); com transparência, em PNG
  const input = ['-f', 'image2pipe', '-framerate', String(FPS), ...(alpha ? [] : ['-c:v', 'mjpeg']), '-i', '-'];
  const codec = {
    mp4: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
    webm: ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '24', '-auto-alt-ref', '0', '-row-mt', '1'],
    mov: ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le']
  }[mode];
  const enc = ffmpeg([...input, ...codec, target]);
  for (let i = 0; i < frames; i++) {
    await seek((i * 1000) / FPS);
    const buf = await page.screenshot(alpha ? { type: 'png', omitBackground: true } : { type: 'jpeg', quality: 95 });
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
