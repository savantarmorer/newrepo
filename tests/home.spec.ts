import { test, expect } from '@playwright/test';

test('home tem um CTA principal para o curso e investigações clicáveis', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText(/Documentos antes de teorias/i);
  await expect(page.locator('.h-hero .btn-primary')).toHaveCount(1);
  await expect(page.locator('.h-hero .btn-primary')).toHaveAttribute('href', '/jornalismo/');
  await expect(page.locator('#investigacoes a.h-inv-card')).toHaveCount(6);
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('newsletter mostra erro quando o envio falha', async ({ page }) => {
  await page.route('**/.netlify/functions/subscribe', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#newsletterEmail').fill('leitor@example.com');
  await page.getByRole('button', { name: /Assinar/i }).click();
  await expect(page.locator('#newsletterStatus')).toHaveAttribute('data-state', 'error');
});

test('newsletter confirma quando o envio funciona', async ({ page }) => {
  await page.route('**/.netlify/functions/subscribe', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"success"}' }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#newsletterEmail').fill('leitor@example.com');
  await page.getByRole('button', { name: /Assinar/i }).click();
  await expect(page.locator('#newsletterStatus')).toHaveAttribute('data-state', 'ok');
});

test('media kit tem página própria', async ({ page }) => {
  await page.goto('/mediakit.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText(/Media Kit/i);
  await expect(page.locator('#mediakit')).toBeVisible();
  await expect(page.locator('#contato')).toBeVisible();
});
