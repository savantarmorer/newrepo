import { test, expect } from '@playwright/test';

test('teia ponte page loads graph and canonical', async ({ page }) => {
  await page.goto('/teia-ponte.html', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Ponte Compliance/i);

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', 'https://iuripiragibe.net/ponte');

  await expect(page.locator('#svg')).toBeVisible();
  await expect(page.locator('#g-nodes')).toBeAttached();
});
