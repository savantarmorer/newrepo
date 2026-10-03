// Chromium headless controlado quadro a quadro: pausa todas as animações CSS
// e posiciona a linha do tempo exatamente no instante de cada quadro.
import { chromium } from 'playwright';

export async function launch() {
  // Quadros determinísticos: o compositor conclui raster/desenho antes de cada
  // captura e as animações não rodam numa thread à parte.
  return chromium.launch({
    args: [
      '--force-color-profile=srgb',
      '--hide-scrollbars',
      '--disable-lcd-text',
      '--run-all-compositor-stages-before-draw',
      '--disable-threaded-animation',
      '--disable-threaded-scrolling',
      '--disable-checker-imaging',
      '--disable-new-content-rendering-timeout',
      '--disable-partial-raster',
    ],
  });
}

export async function openPage(browser, { width = 1920, height = 1080 } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  return { page, cdp };
}

/** Pausa tudo e espera a página pintar por completo (evita 1º quadro incompleto). */
export async function freeze(page, cdp) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) if (!img.complete) await new Promise((r) => (img.onload = img.onerror = r));
    for (const a of document.getAnimations()) a.pause();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  if (cdp) await capture(cdp);
}

export async function seek(page, seconds) {
  await page.evaluate((ms) => {
    for (const a of document.getAnimations()) a.currentTime = ms;
  }, seconds * 1000);
}

/** PNG com canal alfa (fundo transparente). */
export async function capture(cdp) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
  return Buffer.from(r.data, 'base64');
}
