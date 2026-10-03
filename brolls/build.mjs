#!/usr/bin/env node
/* Gera os SVGs animados e renderiza cada um em MP4 (e MOV com alfa para sobreposições).
 *
 *   node brolls/build.mjs                 # gera SVGs e renderiza tudo
 *   node brolls/build.mjs --only E1-01,E2-05
 *   node brolls/build.mjs --svg-only      # só os SVGs
 *   node brolls/build.mjs --stills DIR    # PNGs de conferência (início, meio, fim) em vez de vídeo
 *   node brolls/build.mjs --jobs 3 --skip-existing
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const ONLY = opt('--only') ? new Set(opt('--only').split(',')) : null;
const JOBS = +opt('--jobs', 3);
const STILLS = opt('--stills');
const FPS = 30;

const { default: CLIPS } = await import(pathToFileURL(path.join(ROOT, 'src/clips.mjs')).href);
const runtime = fs.readFileSync(path.join(ROOT, 'src/runtime.js'), 'utf8');
const templates = fs.readFileSync(path.join(ROOT, 'src/templates.js'), 'utf8');
const extras = fs.existsSync(path.join(ROOT, 'src/templates-ilustra.js')) ? fs.readFileSync(path.join(ROOT, 'src/templates-ilustra.js'), 'utf8') : '';

const FONTS = [
  ['Barlow Condensed', 'normal', 600, 'BarlowCondensed-normal-600.woff2'],
  ['Barlow Condensed', 'normal', 700, 'BarlowCondensed-normal-700.woff2'],
  ['IBM Plex Mono', 'normal', 400, 'IBMPlexMono-normal-400.woff2'],
  ['IBM Plex Mono', 'normal', 500, 'IBMPlexMono-normal-500.woff2'],
  ['Newsreader', 'italic', 400, 'Newsreader-Italic.woff2'],
  ['Newsreader', 'normal', 400, 'Newsreader-Regular.woff2']
];
const fontCSS = FONTS.map(([fam, style, w, file]) => {
  const b64 = fs.readFileSync(path.join(ROOT, 'src/fonts', file)).toString('base64');
  return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}).join('\n');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const baseName = c => `${c.id}_${c.tipo}_${c.slug}`;
const partDir = c => `parte-${c.ep}`;

function svgFor(c) {
  const overlay = c.tipo === 'SOBRE';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
<title>${esc(c.id)} · ${esc(c.slug)}</title>
<desc>${esc(c.cue || '')}</desc>
<style>
${fontCSS}
svg{background:${overlay ? 'transparent' : '#0E0D0B'}}
text{font-kerning:normal;text-rendering:geometricPrecision}
</style>
<g id="root"></g>
<script><![CDATA[
${runtime}
${templates}
${extras}
window.CLIP = ${JSON.stringify(c)};
if (location.hash !== '#capture' && window.CLIP.tipo === 'SOBRE') document.documentElement.style.background = '#4b4b4b';
boot();
]]></script>
</svg>
`;
}

function ensure(d) { fs.mkdirSync(d, { recursive: true }); }

function ffmpegFor(c) {
  const overlay = c.tipo === 'SOBRE';
  const mp4 = path.join(ROOT, 'mp4', partDir(c), baseName(c) + (overlay ? '_verde' : '') + '.mp4');
  ensure(path.dirname(mp4));
  const common = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS)];
  const x264 = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(FPS)];
  let a;
  const outs = [mp4];
  if (!overlay) {
    a = [...common, '-c:v', 'mjpeg', '-i', '-', ...x264, mp4];
  } else {
    const mov = path.join(ROOT, 'mov-alfa', partDir(c), baseName(c) + '_alfa.mov');
    ensure(path.dirname(mov));
    outs.push(mov);
    a = [...common, '-c:v', 'png', '-i', '-',
      '-filter_complex', `[0:v]split=2[a][b];color=c=0x00FF00:s=1920x1080:r=${FPS}[g];[g][a]overlay=shortest=1:format=auto,format=yuv420p[v]`,
      '-map', '[v]', ...x264, mp4,
      '-map', '[b]', '-c:v', 'png', '-pix_fmt', 'rgba', mov];
  }
  const p = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', code => code === 0 ? res(outs) : rej(new Error(`ffmpeg ${code} em ${c.id}`))));
  return { p, done, outs };
}

async function renderClip(browser, c) {
  const overlay = c.tipo === 'SOBRE';
  const svgPath = path.join(ROOT, 'svg', partDir(c), baseName(c) + '.svg');
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const cdp = await page.context().newCDPSession(page);
  if (overlay) await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(pathToFileURL(svgPath).href + '#capture');
  await page.waitForFunction(() => window.__ready === true || window.__failed, null, { timeout: 15000 }).catch(() => {});
  if (errors.length) throw new Error(`${c.id}: ${errors.join(' | ')}`);
  const shot = async () => {
    const r = await cdp.send('Page.captureScreenshot', overlay
      ? { format: 'png', optimizeForSpeed: true }
      : { format: 'jpeg', quality: 93, optimizeForSpeed: true });
    return Buffer.from(r.data, 'base64');
  };
  if (STILLS) {
    ensure(STILLS);
    const times = [0.5, c.d * 0.45, c.d * 0.97];
    for (let i = 0; i < times.length; i++) {
      await page.evaluate(t => window.renderFrame(t), times[i]);
      const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(STILLS, `${c.id}_${i}.png`), Buffer.from(r.data, 'base64'));
    }
    await page.close();
    return;
  }
  const ff = ffmpegFor(c);
  const N = Math.round(c.d * FPS);
  for (let f = 0; f < N; f++) {
    await page.evaluate(t => window.renderFrame(t), f / FPS);
    const buf = await shot();
    if (!ff.p.stdin.write(buf)) await new Promise(r => ff.p.stdin.once('drain', r));
  }
  ff.p.stdin.end();
  await ff.done;
  await page.close();
  if (errors.length) throw new Error(`${c.id}: ${errors.join(' | ')}`);
}

/* ---------------- principal ---------------- */
const ids = new Set();
for (const c of CLIPS) {
  if (ids.has(c.id)) throw new Error('id repetido: ' + c.id);
  ids.add(c.id);
}
const todo = CLIPS.filter(c => !ONLY || ONLY.has(c.id));
for (const c of todo) {
  const f = path.join(ROOT, 'svg', partDir(c), baseName(c) + '.svg');
  ensure(path.dirname(f));
  fs.writeFileSync(f, svgFor(c));
}
console.log(`SVGs gerados: ${todo.length}`);
if (flag('--svg-only')) process.exit(0);

const queue = todo.filter(c => {
  if (!flag('--skip-existing') || STILLS) return true;
  const mp4 = path.join(ROOT, 'mp4', partDir(c), baseName(c) + (c.tipo === 'SOBRE' ? '_verde' : '') + '.mp4');
  return !fs.existsSync(mp4);
});
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
let done = 0, failed = [];
const t0 = Date.now();
async function worker() {
  while (queue.length) {
    const c = queue.shift();
    const ts = Date.now();
    try {
      await renderClip(browser, c);
      done++;
      console.log(`[${done}/${todo.length}] ${c.id} ${c.slug} (${c.d}s) ${((Date.now() - ts) / 1000).toFixed(1)}s`);
    } catch (e) {
      failed.push(c.id);
      console.error(`FALHOU ${c.id}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
await browser.close();
console.log(`Concluído em ${((Date.now() - t0) / 1000).toFixed(0)}s. Falhas: ${failed.length ? failed.join(', ') : 'nenhuma'}`);
if (failed.length) process.exit(1);
