import { test, expect } from '@playwright/test';

test('no horizontal scroll on mobile viewport', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for layout to settle a bit (fonts/iframes can shift).
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const docEl = document.documentElement;
    return {
      docClientWidth: docEl.clientWidth,
      docScrollWidth: docEl.scrollWidth
    };
  });

  // Allow 1px tolerance for sub-pixel rounding.
  // documentElement reflete o scroll horizontal visível da página.
  // body.scrollWidth pode exceder por iframes (ex.: embeds) mesmo sem barra de rolagem útil.
  expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth + 1);
});

