// Renderiza os B-rolls de brolls.html quadro a quadro com fundo transparente.
//
//   node scripts/video-brolls/render.mjs <pasta-saida> [b01 b02 ...]
//   node scripts/video-brolls/render.mjs <pasta-saida> --stills
//
// Para cada clipe gera:
//   mov-alpha/NN_nome.mov   QuickTime Animation (sem perda) com canal alpha
//   mp4-chroma/NN_nome.mp4  H.264 sobre verde #00FF00 (use chroma key; MP4 não guarda transparência)
// --stills gera só um PNG do quadro "montado" de cada clipe, para conferência.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// require (e não import) para achar o playwright também via NODE_PATH
const { chromium } = createRequire(import.meta.url)('playwright');

const FPS = 30;
const CONCURRENCY = 4;
const here = dirname(fileURLToPath(import.meta.url));
const pageUrl = pathToFileURL(join(here, 'brolls.html')).href;

const [outArg, ...rest] = process.argv.slice(2);
if (!outArg) {
  console.error('uso: node render.mjs <pasta-saida> [--stills] [ids...]');
  process.exit(1);
}
const outDir = resolve(outArg);
const stills = rest.includes('--stills');
const only = rest.filter((a) => !a.startsWith('--'));

function ffmpeg(args, input) {
  return new Promise((ok, fail) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
      stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'],
    });
    p.on('error', fail);
    p.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg saiu com ${code}`))));
    if (input) input(p.stdin);
  });
}

async function openClip(browser, id) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`${pageUrl}?clip=${id}`);
  await page.evaluate(() => document.fonts.ready);
  const info = await page.evaluate(() => window.clipInfo);
  return { page, info };
}

async function renderStill(browser, id) {
  const { page, info } = await openClip(browser, id);
  // instante logo antes da saída: tudo já entrou
  const exitAt = await page.evaluate(() => {
    const d = getComputedStyle(document.querySelector('.clip.on .exit')).animationDelay;
    return parseFloat(d) * (d.endsWith('ms') ? 1 : 1000);
  });
  await page.evaluate((t) => window.renderAt(t), exitAt - 30);
  await page.screenshot({ path: join(outDir, `${info.name}.png`), omitBackground: true });
  await page.close();
  console.log(`still ${info.name}`);
}

async function renderClip(browser, id) {
  const { page, info } = await openClip(browser, id);
  const frames = Math.round((info.dur / 1000) * FPS);
  const mov = join(outDir, 'mov-alpha', `${info.name}.mov`);
  const mp4 = join(outDir, 'mp4-chroma', `${info.name}.mp4`);

  await ffmpeg(
    ['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'qtrle', '-pix_fmt', 'argb', '-r', String(FPS), mov],
    async (stdin) => {
      for (let f = 0; f < frames; f++) {
        await page.evaluate((t) => window.renderAt(t), (f * 1000) / FPS);
        const png = await page.screenshot({ omitBackground: true });
        if (!stdin.write(png)) await new Promise((r) => stdin.once('drain', r));
      }
      stdin.end();
    },
  );
  await page.close();

  await ffmpeg([
    '-f', 'lavfi', '-i', `color=c=0x00FF00:s=1080x1920:r=${FPS}`, '-i', mov,
    '-filter_complex', '[0:v][1:v]overlay=shortest=1,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-movflags', '+faststart', mp4,
  ]);
  console.log(`ok ${info.name} (${frames} quadros)`);
}

const browser = await chromium.launch();
const probe = await browser.newPage();
await probe.goto(pageUrl);
const allIds = await probe.evaluate(() => window.clipIds);
await probe.close();
const ids = only.length ? only : allIds;

await mkdir(outDir, { recursive: true });
if (!stills) {
  await mkdir(join(outDir, 'mov-alpha'), { recursive: true });
  await mkdir(join(outDir, 'mp4-chroma'), { recursive: true });
}

const queue = [...ids];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const id = queue.shift();
    await (stills ? renderStill(browser, id) : renderClip(browser, id));
  }
}));
await browser.close();
