// Renderiza ../mp4/<grau>.mp4 a partir de ../svg/<grau>.svg.
//
// O SVG é aberto no Chromium, as animações são pausadas e a linha do tempo é
// posicionada quadro a quadro (30 fps). Só a introdução (T0) e um ciclo do
// trecho ambiente (P) são capturados; como esse ciclo fecha sem emenda, o
// restante do vídeo repete os mesmos quadros até a duração estimada da fala.
// Saída: H.264 (yuv420p, BT.709) sobre verde #00FF00, pronto para chroma key.
//
// Uso: node renderizar-mp4.mjs [34,35,...]   (FUNDO=000000 troca a cor de fundo)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GRAUS, duracao, slug } from './graus.mjs';
import { P, T0 } from './lib/svg.mjs';
import { capture, freeze, launch, openPage, seek } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_DIR = join(ROOT, 'svg');
const MP4_DIR = join(ROOT, 'mp4');
const FPS = 30;
const BG = (process.env.FUNDO ?? '00FF00').replace('#', '');
const WORKERS = Number(process.env.WORKERS ?? 2);
const WORK = process.env.TMP_FRAMES ?? join(tmpdir(), 'overlays-frames');

mkdirSync(MP4_DIR, { recursive: true });
const only = process.argv[2]?.split(',').map(Number);
const queue = GRAUS.filter((d) => !only || only.includes(d.n));

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} saiu com ${code}: ${err}`))));
  });
}

async function captureDegree(page, cdp, deg, dir) {
  const file = join(SVG_DIR, `${slug(deg)}.svg`);
  if (!existsSync(file)) throw new Error(`Falta ${file} — rode antes: node gerar-svg.mjs`);
  await page.goto(pathToFileURL(file).href);
  await freeze(page, cdp);
  const frames = (T0 + P) * FPS;
  for (let i = 0; i < frames; i++) {
    await seek(page, i / FPS);
    writeFileSync(join(dir, `f${String(i).padStart(5, '0')}.png`), await capture(cdp));
  }
  return frames;
}

async function encode(deg, dir) {
  const total = duracao(deg) * FPS;
  const intro = T0 * FPS;
  const loop = P * FPS;
  const seq = join(dir, 'seq');
  mkdirSync(seq, { recursive: true });
  for (let i = 0; i < total; i++) {
    const src = i < intro ? i : intro + ((i - intro) % loop);
    symlinkSync(join(dir, `f${String(src).padStart(5, '0')}.png`), join(seq, `${String(i).padStart(6, '0')}.png`));
  }
  const out = join(MP4_DIR, `${slug(deg)}.mp4`);
  await run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', join(seq, '%06d.png'),
    '-f', 'lavfi', '-i', `color=c=0x${BG}:s=1920x1080:r=${FPS}`,
    '-filter_complex', '[1:v]format=rgb24[bg];[0:v]format=rgba[fg];[bg][fg]overlay=format=rgb:shortest=1,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]',
    '-map', '[v]', '-frames:v', String(total),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-tune', 'animation', '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-r', String(FPS),
    out,
  ]);
  return out;
}

const browser = await launch();
const encodes = [];
let next = 0;
const started = Date.now();

async function worker() {
  const { page, cdp } = await openPage(browser);
  while (next < queue.length) {
    const deg = queue[next++];
    const dir = join(WORK, slug(deg));
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const t = Date.now();
    const n = await captureDegree(page, cdp, deg, dir);
    const job = encode(deg, dir)
      .then((out) => {
        rmSync(dir, { recursive: true, force: true });
        console.log(`${deg.n}° ok — ${n} quadros em ${((Date.now() - t) / 1000).toFixed(0)} s → ${out.replace(ROOT + '/', '')} (${duracao(deg)} s)`);
      });
    encodes.push(job);
    // não deixa acumular codificações demais na fila
    if (encodes.length % WORKERS === 0) await job;
  }
  await page.close();
}

await Promise.all(Array.from({ length: WORKERS }, worker));
await Promise.all(encodes);
await browser.close();
console.log(`Pronto: ${queue.length} MP4 em ${((Date.now() - started) / 60000).toFixed(1)} min`);
