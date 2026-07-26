import { test, expect } from '@playwright/test';

test('basic SEO tags exist and match iuripiragibe.net', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Iuri Piragibe/i);

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', 'https://iuripiragibe.net');

  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute('content', /index/i);

  const ogUrl = page.locator('meta[property="og:url"]');
  await expect(ogUrl).toHaveAttribute('content', 'https://iuripiragibe.net');
});

