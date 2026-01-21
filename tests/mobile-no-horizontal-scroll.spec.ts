import { test, expect } from '@playwright/test';

test('no horizontal scroll on mobile viewport', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for layout to settle a bit (fonts/iframes can shift).
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;

    return {
      docClientWidth: docEl.clientWidth,
      docScrollWidth: docEl.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth
    };
  });

  // Allow 1px tolerance for sub-pixel rounding.
  expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
});

